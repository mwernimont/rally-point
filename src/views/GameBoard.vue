<template>
    <div id="game" :style="{'--grid-size': gridSize, '--gap-size': gapSize + 'px', '--cell-size': cellSize + 'px','--sidebar-width': sidebarWidth + 'px'}">
        <div id="game-board">
            <div id="soldier-ui">Soldier UI Area</div>
            <div id="map" class="grid">
                <div v-for="cell in cells" :key="cell.id" class="cell"></div>
            </div>
        </div>
        <div id="game-log-container">
            <div id="game-log-label">
                Game Log
            </div>
            <div id="game-log"></div>
        </div>
    </div>
</template>
<script setup>
import {ref, computed} from 'vue';
const gridSize = ref()
const gapSize = ref(5)
const sidebarWidth = ref(300)

function generateGrid(min, max){
    gridSize.value = Math.floor(Math.random() * (max - min + 1)) + min;
}

const cellSize = computed(() => ((window.innerWidth - sidebarWidth.value) * 0.6 - (gridSize.value - 1) * gapSize.value)/ gridSize.value)

const cells = computed(() => Array.from({length: gridSize.value * gridSize.value}, (_, i) => ({
    id: i
})))

generateGrid(10, 30);
</script>
<style lang="scss" scoped>
#game{
    display: flex;
    width: 100vw;
    height: 100vh;
}
#game-board{
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
    justify-content: center;
    flex: 1;
}

.grid{
    display: grid;
    grid-template-columns: repeat(var(--grid-size), var(--cell-size));
    grid-template-rows: repeat(var(--grid-size), var(--cell-size));
    gap: var(--gap-size);
    width: 60%;
}

.cell{
    width:  var(--cell-size);
    height: var(--cell-size);
    background: #fff;
    border-radius:$border-radius;
}
// SOLDIER UI
#soldier-ui{
    background: peru;
    width: 100%;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}
// GAME LOG
#game-log-container{
    height: 100%;
    width: var(--sidebar-width);
    border-left: 1px solid $color-text;
    display: flex;
    flex-direction: column;
}
#game-log-label{
    padding: 10px;
    border-bottom: 1px solid $color-text;
    font-weight: bold;
}

#game-log{
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

</style>