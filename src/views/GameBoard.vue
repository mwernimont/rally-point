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
                <button id="attack" class="actionButton" :class="missionStore.targetingMode ? 'targetingMode' : null" @click="missionStore.toggleTargetingMode()" :disabled="!missionStore.activeSoldier || missionStore.activeSoldier.currentAp <= 0 || missionStore.activeSoldier.currentAmmo === 0">Shoot</button>
                <button id="reload" class="actionButton" @click="missionStore.reload(missionStore.activeSoldier)" :disabled="!missionStore.activeSoldier || missionStore.activeSoldier.currentAp <= 0 || missionStore.activeSoldier.currentAmmo === missionStore.activeSoldier.maxAmmo">Reload</button>
                <button id="endTurn" class="actionButton" :class="{urgent: missionStore.allSoldierSpent }" @click="missionStore.endTurn()">End Turn</button>
            </div>
            <div id="map" class="grid">
                <div 
                    v-for="cell in missionStore.cells" 
                    :key="cell.id" 
                    class="cell" 
                    :class="[
                        cell.cover ? `cover-${cell.cover}` : null,
                        cell.zone === 'deploy' ? 'deploy-zone' : null,
                        cell.zone === 'enemy-deploy' ? 'enemy-deploy-zone' : null,
                        cell.unit?.faction === 'player' ? 'soldier' : cell.unit?.faction === 'enemy' ? 'enemy' : null,
                        cell.unit?.id === missionStore.activeSoldier?.id ? 'active-soldier' : null,
                        missionStore.validMoveCells.includes(cell) ? 'valid-move' : null,
                        missionStore.validTargets.some(e => e.id === cell.unit?.id) ? 'valid-target' : null
                    ]"
                    :style="cell.unit ? { background: cell.unit.color } : {}"
                    @click="onCellClick(cell)"
                >
                    <!-- Enemy health bar -->
                    <div v-if="cell.unit?.faction === 'enemy'" class="health-pips">
                        <span v-for="n in cell.unit.maxHealth" :key="n" :class="{ filled: n <= cell.unit.currentHealth }"></span>
                    </div>
                    <!-- Class Icon -->
                    <div class="class-icon">
                        <component v-if="cell.unit" :is="classIcons[cell.unit.class]" :size="14" weight="fill" color="#000"/>
                    </div>
                </div>
            </div>
        </div>
         
        <div id="game-log-container">
            <div id="game-log-label">
                Game Log
            </div>
            <div id="game-log">
                <div v-for="(log, index) in missionStore.gameLog" :key="index" :class="`log-${log.type}`">{{ log.message }}</div>
            </div>
        </div>
        <MissionOutcome v-if="missionStore.missionOutcome"/>
    </div>
</template>
<script setup>
import {ref, computed, onMounted, onUnmounted} from 'vue';
import { useMissionStore } from '../stores/missionStore';
import { PhCrosshair, PhHeartbeat, PhShield, PhSneakerMove, PhLightning, PhBroadcast, PhFirstAid, PhCaretDoubleUp } from "@phosphor-icons/vue";
import MissionOutcome from '../components/MissionOutcome.vue';
const missionStore = useMissionStore();
const gapSize = ref(5)
const sidebarWidth = ref(300)
const windowWidth = ref(window.innerWidth);

const classIcons = {
    Radio: PhBroadcast,
    Medic: PhFirstAid,
    Heavy: PhShield,
    Scout: PhCrosshair,
    Ranger: PhCaretDoubleUp
};

const cellSize = computed(() => {
    if (!missionStore.gridSize) return 0;
    return ((windowWidth.value - sidebarWidth.value) * 0.6 - (missionStore.gridSize - 1) * gapSize.value)/ missionStore.gridSize
});

//##### HELPER FUNCTIONS #####
function onResize(){
    windowWidth.value = window.innerWidth
}

function onCellClick(cell){
    if(missionStore.targetingMode &&  cell.unit?.faction === "enemy" && missionStore.validTargets.some(e => e.id === cell.unit.id)){
        missionStore.applyAttack(missionStore.activeSoldier.id, cell.unit.id);
        missionStore.toggleTargetingMode();
        return;
    }
    if (missionStore.validMoveCells.includes(cell)) return missionStore.moveSoldier(missionStore.activeSoldier, cell)
    if(cell.unit && cell.unit.faction === 'player') return missionStore.setActiveSoldier(cell.unit.id);
    
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

.enemy-deploy-zone{
    background: mediumturquoise;
}

.valid-move{
    background:  #BCE4D2;
    &:hover{
        background: #89D5D5;
        cursor: pointer;
    }
}

.valid-target{
    border: 2px solid #fff;
}

.soldier{
    cursor: pointer;
}

.soldier, .enemy{
    display: flex;
    flex-direction: column;
    gap: 1px;
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

.actionButton:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    &:hover {
        background: none;
        color: var(--btn-color);
    }
}

#attack{
    --btn-color: #{$color-secondary};
}

#attack.targetingMode{
    background: var(--btn-color);
    color: $color-text;
}

#reload{
    --btn-color: #4949F3;
}

#endTurn{
    --btn-color: #{$color-primary};
}

#endTurn.urgent {
    background: var(--btn-color);
    color: $color-text;
}

.class-icon{
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}

//Enemy UI
.health-pips{
    display: flex;
    gap: 1px;
    height: 2px;
    width: 100%;
    span{
        &.filled{
            background: $color-text;
            flex: 1;
        }
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

.log-turn{
    color: $color-secondary;
}
.log-player-move{
    color: green;
}

.log-player-attack{
    color: hotpink;
}

.log-enemy-attack{
    color: red;
}

.log-reload{
    color: salmon;
}

.log-enemy-move{
    color: blue;
}

</style>