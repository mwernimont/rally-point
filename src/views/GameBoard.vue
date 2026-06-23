<template>
    <div id="game" :style="{'--grid-size': missionStore.gridSize, '--gap-size': gapSize + 'px', '--cell-size': cellSize + 'px','--sidebar-width': sidebarWidth + 'px'}">
        <div id="game-board">
            <div id="soldier-ui">
                <div v-if="missionStore.activeSoldier" class="soldier-info">
                    <div class="avatar" :style="{background: missionStore.activeSoldier.color}"></div>
                    <div class="soldier-name">{{ missionStore.activeSoldier.name }}</div>
                    <div class="health"><PhHeartbeat :size="15" weight="fill" color="currentColor"/> {{missionStore.activeSoldier.currentHealth}}/{{missionStore.activeSoldier.maxHealth}}</div>
                    <div class="armor"><PhShield :size="15" weight="fill" color="currentColor"/> {{missionStore.activeSoldier.currentArmor}}/{{missionStore.activeSoldier.maxArmor}}</div>
                    <div class="ammo"><PhCrosshair :size="15" weight="fill" color="currentColor"/> {{missionStore.activeSoldier.currentAmmo}}/{{missionStore.activeSoldier.maxAmmo}}</div>
                    <div class="movement"><PhSneakerMove :size="15" weight="fill" color="currentColor"/> {{missionStore.activeSoldier.currentMovement}}/{{missionStore.activeSoldier.maxMovement}}</div>
                    <div class="ap"><PhLightning :size="15" weight="fill" color="currentColor"/> {{missionStore.activeSoldier.currentAp}}/{{missionStore.activeSoldier.maxAp}}</div>
                </div>
                <button id="attack" class="actionButton">Shoot</button>
                <button id="reload" class="actionButton">Reload</button>
                <button id="endTurn" class="actionButton">End Turn</button>
            </div>
            <div id="map" class="grid">
                <div 
                    v-for="cell in missionStore.cells" 
                    :key="cell.id" 
                    class="cell" 
                    :class="[
                        cell.cover ? `cover-${cell.cover}` : null,
                        cell.zone === 'deploy' ? 'deploy-zone' : null,
                        cell.soldier ? 'soldier' : null,
                        cell.soldier?.id === missionStore.activeSoldier?.id ? 'active-soldier' : null,
                        missionStore.validMoveCells.includes(cell) ? 'valid-move' : null
                    ]"
                    :style="cell.soldier ? { background: cell.soldier.color } : {}"
                    @click="onCellClick(cell)"
                >
                </div>
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
import {ref, computed, onMounted, onUnmounted} from 'vue';
import { useMissionStore } from '../stores/missionStore';
import { PhCrosshair, PhHeartbeat, PhShield, PhSneakerMove, PhLightning } from "@phosphor-icons/vue";
const missionStore = useMissionStore();
const gapSize = ref(5)
const sidebarWidth = ref(300)
const windowWidth = ref(window.innerWidth);

const cellSize = computed(() => {
    if (!missionStore.gridSize) return 0;
    return ((windowWidth.value - sidebarWidth.value) * 0.6 - (missionStore.gridSize - 1) * gapSize.value)/ missionStore.gridSize
});

//##### HELPER FUNCTIONS #####
function onResize(){
    windowWidth.value = window.innerWidth
}

function onCellClick(cell){
    if (missionStore.validMoveCells.includes(cell)) return missionStore.moveSoldier(missionStore.activeSoldier, cell)
    if(cell.soldier) return missionStore.setActiveSoldier(cell.soldier.id);
}

onMounted( () => {
    window.addEventListener('resize', onResize);
})

onUnmounted(() => {
    window.removeEventListener('resize', onResize);
})

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

.deploy-zone{
    background: #73C3E9;
}

.valid-move{
    background:  #BCE4D2;
    &:hover{
        background: #89D5D5;
        cursor: pointer;
    }
}

.soldier{
    cursor: pointer;
}

.active-soldier{
    border: 2px solid $color-text;
}

.cover-half{
    background: #99A7AA;
}
.cover-hard{
    background: #3F4868;
}
// SOLDIER UI
#soldier-ui{
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}
.soldier-info{
    display: flex;
    gap: 10px;
    align-items: center;
}

.avatar{
    width: 40px;
    height: 40px;
    border: 1px solid $color-text;
    border-radius: $border-radius
}

.actionButton{
    --btn-color: gray;
    border: 1px solid var(--btn-color);
    color: var(--btn-color);
    background: none;
    cursor: pointer;
    border-radius:$border-radius;
    padding: 5px 10px;
    &:hover{
        background: var(--btn-color);
        color: $color-text;
    }
}

#attack{
    --btn-color: #{$color-secondary};
}

#reload{
    --btn-color: #4949F3;
}

#endTurn{
    --btn-color: #{$color-primary};
    opacity: 0.4;
    &:hover{
        opacity: 1;
    }
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