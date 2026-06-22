import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useMissionStore = defineStore('mission', () => {
    const gridSize = ref()
    const cells = ref()
    const coverChance = ref(0.12);
    const soldiers = ref([]);
    const activeSoldierId = ref(null);

    function chebyshevDistance(from, to) {
        return Math.max(Math.abs(to.row - from.row), Math.abs(to.col - from.col))
    }

    const activeSoldier = computed(() => soldiers.value.find(s => s.id === activeSoldierId.value))

    const validMoveCells = computed(() => {
        const soldier = activeSoldier.value
        if (!soldier) return []

        return cells.value.filter(cell => {
            // condition 1: not the soldier's own cell
            const isOwnCell = cell.row === soldier.row && cell.col === soldier.col
            // condition 2: Chebyshev distance <= soldier.currentMovement
            const distance = chebyshevDistance(soldier, cell);
            const inRange = distance <= soldier.currentMovement
            // condition 3: no other soldier already there
            const isOccupied = !!cell.soldier
            // condition 4: cell is not cover
            const isCover = !!cell.cover
            return !isOwnCell && !isOccupied && !isCover && inRange
        })
    })

    function setActiveSoldier(id){
        activeSoldierId.value = id;
    }

    function moveSoldier(soldier, targetCell){
        //use soldiers row col to edit old cell
        const oldCell = cells.value.find(c => c.row === soldier.row && c.col === soldier.col);
        console.log(oldCell);
        oldCell.soldier = null;
        const cost = chebyshevDistance(soldier, targetCell)
        //update soldiers row col to new cell
        soldier.row = targetCell.row;
        soldier.col = targetCell.col;
        //update targetCells soldier value
        targetCell.soldier = soldier;
        //update soldiers currentMovement stat
        soldier.currentMovement -= cost;
    }

    function startMission(selectedSoldiers){
        soldiers.value = selectedSoldiers.map(s => ({...s}));
        const edge = pickSpawnEdge();
        generateGrid(10, 30, edge);
        placeSoldiers();
        setActiveSoldier(soldiers.value[0].id)
    }
    
    function generateGrid(min, max, edge){
        gridSize.value = Math.floor(Math.random() * (max - min + 1)) + min;
        const squadSize = soldiers.value.length;
        const zoneStart = Math.floor((gridSize.value - squadSize) / 2);
        const zoneEnd = zoneStart + squadSize - 1;
        cells.value = Array.from({length: gridSize.value * gridSize.value}, (_, i) => {
            const row = Math.floor(i / gridSize.value);
            const col =  i % gridSize.value;
            const zone = getZone(row, col, edge, zoneStart, zoneEnd);
            return{
                id: i,
                row,
                col,
                zone,
                cover: zone ? null : calculateCover(),
                soldier: null
            }
        })
    }

    function pickSpawnEdge(){
        const edges = ['top', 'bottom', 'left', 'right'];
        return edges[Math.floor(Math.random() * edges.length)];
    }
 
    function getZone(row, col, edge, zoneStart, zoneEnd){
        if(edge === "top") return (row === 0 || row === 1) && col >= zoneStart && col <= zoneEnd ? 'deploy' : null;
        if(edge === "bottom") return (row === gridSize.value - 1 || row === gridSize.value - 2) && col >= zoneStart && col <= zoneEnd ? "deploy" : null;
        if(edge === "left") return (col === 0 || col === 1) && row >= zoneStart && row <= zoneEnd ? "deploy" : null;
        if(edge === "right") return (col === gridSize.value - 1 || col === gridSize.value - 2) && row >= zoneStart && row <= zoneEnd ? "deploy" : null; 
    }

    function placeSoldiers(){
        const edgeCells = cells.value.filter(c => c.zone === 'deploy');
        soldiers.value.forEach((soldier, index) => {
            if (!edgeCells[index]) return;
            edgeCells[index].soldier = soldier;
            soldier.row = edgeCells[index].row;
            soldier.col = edgeCells[index].col;
        })
    }

    function calculateCover() {
        if (Math.random() >= coverChance.value) return null;
        return Math.random() < 0.7 ? "half" : "hard";
    }

    return {cells, gridSize, generateGrid, soldiers, startMission, activeSoldier, setActiveSoldier, moveSoldier, validMoveCells }
})