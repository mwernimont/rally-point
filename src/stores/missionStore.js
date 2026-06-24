import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useEnemyStore } from './enemyStore';

export const useMissionStore = defineStore('mission', () => {
    const gridSize = ref()
    const cells = ref()
    const coverChance = ref(0.12);
    const soldiers = ref([]);
    const activeSoldierId = ref(null);
    const enemies = ref([]);
    const currentTurn = ref(1);
    const gameLog = ref([]);
    //###### COMPUTED ######
    const reachableMap = computed(() => {
        const soldier = activeSoldier.value;
        if(!soldier) return new Map();

        const result = new Map()
        const queue = [{row: soldier.row, col: soldier.col, cost: 0}];
        const visited = new Set();

        while(queue.length){
            const { row, col, cost} = queue.shift();
            const key = `${row}, ${col}`;
            if(visited.has(key)) continue;
            visited.add(key);

            const cell = cells.value[row * gridSize.value + col];
            if(!cell) continue;
            result.set(cell.id, cost);

            if(cost >= soldier.currentMovement) continue;

            for(let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    if(dr === 0 && dc === 0) continue;
                    const sideA = cells.value[(row + dr) * gridSize.value + col]
                    const sideB = cells.value[row * gridSize.value + (col + dc)]
                    if(sideA?.cover === 'hard' || sideB?.cover === 'hard') continue;
                    const nRow = row + dr;
                    const nCol = col + dc;
                    if(nRow < 0 || nRow >= gridSize.value || nCol < 0 || nCol >= gridSize.value) continue;
                    if(visited.has(`${nRow}, ${nCol}`)) continue;
                    const neighbor = cells.value[nRow * gridSize.value + nCol];
                    if(neighbor.cover === 'hard') continue;
                    if(neighbor.unit && !(nRow === soldier.row && nCol === soldier.col)) continue;
                    queue.push({row: nRow, col: nCol, cost: cost + 1});
                }
            }
        }
        return result;
    })

    const activeSoldier = computed(() => soldiers.value.find(s => s.id === activeSoldierId.value))

    const validMoveCells = computed(() => {
        const soldier = activeSoldier.value
        if (!soldier) return []

        return cells.value.filter(cell => {
            if(!reachableMap.value.has(cell.id)) return false;
            const isOwnCell = cell.row === soldier.row && cell.col === soldier.col
            const isOccupied = !!cell.unit
            const isCover = !!cell.cover
            return !isOwnCell && !isOccupied && !isCover
        })
    })
    //###### FUNCTIONS ######
    function generateGrid(min, max, playerEdge, enemyEdge){
        gridSize.value = Math.floor(Math.random() * (max - min + 1)) + min;
        const squadSize = soldiers.value.length;
        const playerZoneStart = Math.floor((gridSize.value - squadSize) / 2);
        const playerZoneEnd = playerZoneStart + squadSize - 1;
        const enemyCount = enemies.value.length;
        const enemyZoneStart = Math.floor((gridSize.value - enemyCount) / 2);
        const enemyZoneEnd = enemyZoneStart + enemyCount - 1;
        cells.value = Array.from({length: gridSize.value * gridSize.value}, (_, i) => {
            const row = Math.floor(i / gridSize.value);
            const col =  i % gridSize.value;
            const zone = getZone(row, col, playerEdge, playerZoneStart, playerZoneEnd, enemyEdge, enemyZoneStart, enemyZoneEnd);
            return{
                id: i,
                row,
                col,
                zone,
                cover: zone ? null : calculateCover(),
                unit: null
            }
        })
    }

    function pickSpawnEdge(){
        const edges = ['top', 'bottom', 'left', 'right'];
        return edges[Math.floor(Math.random() * edges.length)];
    }

    function pickOppositeEdge(edge){
        if(edge === 'top') return 'bottom';
        if(edge === 'bottom') return 'top';
        if(edge === 'left') return 'right';
        if(edge === 'right') return 'left';
    }
 
    function getZone(row, col, playerEdge, playerZoneStart, playerZoneEnd, enemyEdge, enemyZoneStart, enemyZoneEnd){
        if(isOnEdge(row, col, playerEdge, playerZoneStart, playerZoneEnd)) return 'deploy';
        if(isOnEdge(row, col, enemyEdge, enemyZoneStart, enemyZoneEnd)) return 'enemy-deploy';
        return null;
    }

    function isOnEdge(row, col, edge, zoneStart, zoneEnd){
        if(edge === "top") return (row === 0 || row === 1) && col >= zoneStart && col <= zoneEnd;
        if(edge === "bottom") return (row === gridSize.value - 1 || row === gridSize.value - 2) && col >= zoneStart && col <= zoneEnd;
        if(edge === "left") return (col === 0 || col === 1) && row >= zoneStart && row <= zoneEnd;
        if(edge === "right") return (col === gridSize.value - 1 || col === gridSize.value - 2) && row >= zoneStart && row <= zoneEnd; 
    }

    function placeSoldiers(){
        const playerCells = cells.value.filter(c => c.zone === 'deploy');
        soldiers.value.forEach((soldier, index) => {
            if (!playerCells[index]) return;
            playerCells[index].unit = soldier;
            soldier.row = playerCells[index].row;
            soldier.col = playerCells[index].col;
        })
    }

    function placeEnemies(){
        const enemyCells = cells.value.filter(c => c.zone === 'enemy-deploy');
        enemies.value.forEach((enemy, index) => {
            if (!enemyCells[index]) return;
            enemyCells[index].unit = enemy;
            enemy.row = enemyCells[index].row;
            enemy.col = enemyCells[index].col;
        })
    }

    function calculateCover() {
        if (Math.random() >= coverChance.value) return null;
        return Math.random() < 0.7 ? "half" : "hard";
    }

    function startMission(selectedSoldiers){
        soldiers.value = selectedSoldiers.map(s => ({...s}));
        enemies.value = useEnemyStore().pickEnemies(4);
        const edge = pickSpawnEdge();
        const opositeEdge = pickOppositeEdge(edge);
        generateGrid(10, 30, edge, opositeEdge);
        placeSoldiers();
        placeEnemies();
        setActiveSoldier(soldiers.value[0].id)
        logEvent(`Turn ${currentTurn.value} started`, "turn")
    }

    function setActiveSoldier(id){
        activeSoldierId.value = id;
    }

    function moveSoldier(soldier, targetCell){
        //use soldiers row col to edit old cell
        const oldCell = cells.value.find(c => c.row === soldier.row && c.col === soldier.col);
        oldCell.unit = null;
        const cost = reachableMap.value.get(targetCell.id)
        //update soldiers row col to new cell
        soldier.row = targetCell.row;
        soldier.col = targetCell.col;
        //update targetCells soldier value
        targetCell.unit = soldier;
        //update soldiers currentMovement stat
        soldier.currentMovement -= cost;
        logEvent(`${soldier.name} moved to cell {${soldier.row}, ${soldier.col}}`, 'move')
    }

    function endTurn(){
        activeSoldierId.value = soldiers.value.find(s => s.currentHealth > 0)?.id;
        soldiers.value.forEach(s => {
            s.currentMovement = s.maxMovement;
            s.currentAp = s.maxAp;
        });
        currentTurn.value++;
        logEvent(`Turn ${currentTurn.value} started`, "turn")
    }

    function logEvent(message, type){
        gameLog.value.unshift({message: message, type: type})
    }
    
    return {
        cells, 
        gridSize, 
        generateGrid, 
        soldiers, 
        enemies,
        startMission, 
        activeSoldier, 
        setActiveSoldier, 
        moveSoldier, 
        validMoveCells, 
        reachableMap,
        endTurn,
        currentTurn,
        gameLog,
        logEvent
    }
})