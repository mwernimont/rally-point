import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMissionStore = defineStore('mission', () => {
    const gridSize = ref()
    const cells = ref()
    const coverChance = ref(0.12);
    const soldiers = ref([]);

    function startMission(selectedSoldiers){
        soldiers.value = selectedSoldiers.map(s => ({...s}));
        generateGrid(10, 30);
        placeSoldiers();
    }
    
    function generateGrid(min, max){
        gridSize.value = Math.floor(Math.random() * (max - min + 1)) + min;
        cells.value = Array.from({length: gridSize.value * gridSize.value}, (_, i) => ({
            id: i,
            row: Math.floor(i / gridSize.value),
            col: i % gridSize.value,
            cover: calculateCover(),
            soldier: null
        }))
    }

    function pickSpawnEdge(){
        
        return directions[Math.floor(Math.random() * directions.length)];
    }

    function getEdgeCells(edge){
        return cells.value.filter(cell => {
            if (edge === 'top') return cell.row === 0 && !cell.cover
            if (edge === 'bottom') return cell.row === gridSize.value - 1 && !cell.cover
            if (edge === 'left') return cell.col === 0 && !cell.cover
            if (edge === 'right') return cell.col === gridSize.value - 1 && !cell.cover
        })
    }

    function placeSoldiers(){
        const edges = ['top', 'bottom', 'left', 'right'];
        const edgeCells = edges.reduce((found, edge) => {
            if(found.length) return found;
            return getEdgeCells(edge);
        }, []);
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

    return {cells, gridSize, generateGrid, soldiers, startMission }
})