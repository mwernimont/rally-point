import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useEnemyStore } from './enemyStore';
import { computeReachable } from '../utils/pathFinding';
import { resolveAttack, hasLoS } from '../utils/combat';

export const useMissionStore = defineStore('mission', () => {

    //###### STATE ######
    const gridSize = ref()
    const cells = ref()
    const coverChance = ref(0.12);
    const soldiers = ref([]);
    const activeSoldierId = ref(null);
    const enemies = ref([]);
    const currentTurn = ref(1);
    const currentPhase = ref("player");
    const gameLog = ref([]);
    const targetingMode = ref(false);

    //###### COMPUTED ######
    const activeSoldier = computed(() => soldiers.value.find(s => s.id === activeSoldierId.value))

    const allSoldierSpent = computed(() => soldiers.value.every(s => s.currentAp <= 0));

    const reachableMap = computed(() => {
        const soldier = activeSoldier.value;
        if(!soldier) return new Map();
        if (soldier.currentAp <= 0) return new Map();
        return computeReachable(cells.value, gridSize.value, soldier.row, soldier.col, soldier.currentMovement);
    })

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
    });

    const validTargets = computed(() => {
        if(targetingMode.value){
            return enemies.value.filter(e => !hasLoS(activeSoldier.value, e, cells.value, gridSize.value).blocked);
        }
        return [];
    })

    //###### MAP GENERATION ######
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

    function isOnEdge(row, col, edge, zoneStart, zoneEnd){
        if(edge === "top") return (row === 0 || row === 1) && col >= zoneStart && col <= zoneEnd;
        if(edge === "bottom") return (row === gridSize.value - 1 || row === gridSize.value - 2) && col >= zoneStart && col <= zoneEnd;
        if(edge === "left") return (col === 0 || col === 1) && row >= zoneStart && row <= zoneEnd;
        if(edge === "right") return (col === gridSize.value - 1 || col === gridSize.value - 2) && row >= zoneStart && row <= zoneEnd;
    }

    function getZone(row, col, playerEdge, playerZoneStart, playerZoneEnd, enemyEdge, enemyZoneStart, enemyZoneEnd){
        if(isOnEdge(row, col, playerEdge, playerZoneStart, playerZoneEnd)) return 'deploy';
        if(isOnEdge(row, col, enemyEdge, enemyZoneStart, enemyZoneEnd)) return 'enemy-deploy';
        return null;
    }

    function calculateCover() {
        if (Math.random() >= coverChance.value) return null;
        return Math.random() < 0.7 ? "half" : "hard";
    }

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

    //###### MISSION LIFECYCLE ######
    function startMission(selectedSoldiers){
        gameLog.value = [];
        currentTurn.value = 1;
        currentPhase.value = "player";
        soldiers.value = selectedSoldiers.map(s => ({...s}));
        enemies.value = useEnemyStore().pickEnemies(4);
        const edge = pickSpawnEdge();
        const oppositeEdge = pickOppositeEdge(edge);
        generateGrid(30, 35, edge, oppositeEdge);
        placeSoldiers();
        placeEnemies();
        setActiveSoldier(soldiers.value[0].id)
        logEvent(`Turn ${currentTurn.value} started`, "turn")
    }

    //###### SOLDIER ACTIONS ######
    function setActiveSoldier(id){
        activeSoldierId.value = id;
    }

    function moveSoldier(soldier, targetCell){
        //use soldiers row col to edit old cell
        const oldCell = cellAt(soldier.row, soldier.col);
        oldCell.unit = null;
        const cost = reachableMap.value.get(targetCell.id)
        //update soldiers row col to new cell
        soldier.row = targetCell.row;
        soldier.col = targetCell.col;
        //update targetCells soldier value
        targetCell.unit = soldier;
        //update soldiers currentMovement stat
        soldier.currentMovement -= cost;
        soldier.currentAp -= 1
        logEvent(`${soldier.name} moved to cell {${soldier.row}, ${soldier.col}}`, 'player-move')
    }

    function toggleTargetingMode(){
        targetingMode.value = !targetingMode.value;
    }

    function applyAttack(attackerId, targetId){
        const attacker = soldiers.value.find(s => s.id === attackerId) ?? enemies.value.find(e => e.id === attackerId);
        const target = soldiers.value.find(s => s.id === targetId) ?? enemies.value.find(e => e.id === targetId);
        const result = resolveAttack({attacker, target, cells: cells.value, gridSize: gridSize.value});
        logEvent(result.logMessage, `${attacker.faction}-attack`);
        if(result.hit){
            const armorAbsorb = Math.min(target.currentArmor, result.damage);
            target.currentArmor -= armorAbsorb
            target.currentHealth -= (result.damage - armorAbsorb);
        }
        attacker.currentAp -= 1;
    }

    //###### TURN ######
    function endTurn(){
        currentPhase.value = "enemy";
        runEnemyTurn();
        currentPhase.value = "player";
        currentTurn.value++;
        soldiers.value.forEach(s => {
            s.currentMovement = s.maxMovement;
            s.currentAp = s.maxAp;
        });
        activeSoldierId.value = soldiers.value.find(s => s.currentHealth > 0)?.id;
        logEvent(`Turn ${currentTurn.value} started`, "turn")
    }

    function runEnemyTurn(){
        enemies.value.forEach(enemy => {
            const target = soldiers.value
            .filter(s => s.currentHealth > 0)
            .reduce((closest, s) => {
                const distToS = Math.abs(s.row - enemy.row) + Math.abs(s.col - enemy.col);
                const distToClosest = Math.abs(closest.row - enemy.row) + Math.abs(closest.col - enemy.col);
                return distToS < distToClosest ? s : closest;
            });
            const reachable = computeReachable(cells.value, gridSize.value, enemy.row, enemy.col, enemy.currentMovement);

            let bestCell = null;
            let bestDist = Infinity;
            for(const [cellId] of reachable){
                const cell = cells.value[cellId];
                if(cell.unit) continue;
                const dist = Math.abs(cell.row - target.row) + Math.abs(cell.col - target.col);
                if(dist < bestDist){
                    bestDist = dist;
                    bestCell = cell;
                }
            }
            if(!bestCell) return;
            const oldCell = cellAt(enemy.row, enemy.col);
            oldCell.unit = null;
            bestCell.unit = enemy;
            enemy.row = bestCell.row;
            enemy.col = bestCell.col;
            logEvent(`${enemy.name} moved to {${enemy.row}, ${enemy.col}}`, 'enemy-move');
        })
    }

    //###### LOG ######
    function logEvent(message, type){
        gameLog.value.unshift({message: message, type: type})
    }

    //###### HELPER ######
    function cellAt(row, col){
        return cells.value[row * gridSize.value + col];
    }

    return {
        cells,
        gridSize,
        soldiers,
        enemies,
        currentTurn,
        currentPhase,
        gameLog,
        activeSoldier,
        allSoldierSpent,
        reachableMap,
        validMoveCells,
        validTargets,
        targetingMode,
        startMission,
        setActiveSoldier,
        moveSoldier,
        toggleTargetingMode,
        applyAttack,
        endTurn,
        logEvent
    }
})
