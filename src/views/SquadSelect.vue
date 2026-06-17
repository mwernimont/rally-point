<template>
    <div id="squad-select">
        <div id="squad-selection">
            <div id="avail">
                <div class="label">Available Soldiers</div>
                <SoldierCard 
                    v-for="soldier in availableSoldiers" 
                    :key="soldier.id" 
                    :soldier="soldier" 
                    @select="selectionStore.toggleSoldier($event)"
                    :class="{'dimmed' : selectedSoldiers.length === selectionStore.maxSquadSize}"
                />
            </div>
            <div id="selected">
                <div class="label">Selected Soldiers ({{ selectedSoldiers.length }}/{{ selectionStore.maxSquadSize }})</div>
                <SoldierCard v-for="soldier in selectedSoldiers" :key="soldier.id" :soldier="soldier" @select="selectionStore.toggleSoldier($event)" />
            </div>
        </div>
        <!-- TODO: replace @click with a deploy() function that hands off soldiers to missionStore, then routes to /game -->
        <button id="deploy" @click="deploy" :disabled="selectedSoldiers.length === 0">Deploy</button>
    </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
import { computed} from "vue";
import { useSoldierStore } from '../stores/soldierStore';
import { useSelectionStore } from '../stores/selectionStore.js';
import { useMissionStore } from '../stores/missionStore.js';
import SoldierCard from "../components/SoldierCard.vue"

const router = useRouter()
const soldierStore = useSoldierStore();
const selectionStore = useSelectionStore();
const missionStore = useMissionStore();

const availableSoldiers = computed(() =>
    soldierStore.soldiers.filter(s => !selectionStore.selectedSoldiers.some(sel => sel.id === s.id))
);

const selectedSoldiers = computed(() =>
    soldierStore.soldiers.filter(s => selectionStore.selectedSoldiers.some(sel => sel.id === s.id))
);

function deploy(){
    missionStore.startMission(selectedSoldiers.value);
    router.push('/game');
}
</script>
<style lang="scss" scoped>
    #squad-select{
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        gap: $spacing-md;
    }
    #squad-selection{
        display: grid;
        grid-template-rows: auto auto;
        gap: $spacing-md;
        
        #avail, #selected{
            background: $color-surface;
            padding: $spacing-md;
            width: 60vw;
            display: flex;
            gap: $spacing-sm;
            flex-wrap:wrap;
            .label{
                width: 100%;
            }
        }

    }
    #deploy{
        padding: 5px 15px;
        font-size: 1.5rem;
        border-radius: $border-radius;
        &:hover{
            background: $color-primary;
            color: $color-text;
        }
    }
</style>