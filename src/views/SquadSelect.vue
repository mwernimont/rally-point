<template>
    <div id="squad-select">
        <div id="squad-selection">
            <div id="avail">
                <div class="label">Available Soldiers</div>
                <SoldierCard v-for="soldier in availableSoldiers" :key="soldier.id" :soldier="soldier" @select="selectionStore.toggleSoldier($event)" />
            </div>
            <div id="selected">
                <div class="label">Selected Soldiers ({{ selectedSoldiers.length }}/{{ selectionStore.maxSquadSize }})</div>
                <SoldierCard v-for="soldier in selectedSoldiers" :key="soldier.id" :soldier="soldier" @select="selectionStore.toggleSoldier($event)" />
            </div>
        </div>
    </div>
</template>
<script setup>
import { computed} from "vue";
import { useSoldierStore } from '../stores/soldierStore';
import { useSelectionStore } from '../stores/selectionStore.js';
import SoldierCard from "../components/SoldierCard.vue"
const soldierStore = useSoldierStore();
const selectionStore = useSelectionStore();

const availableSoldiers = computed(() =>
    soldierStore.soldiers.filter(s => !selectionStore.selectedSoldiers.some(sel => sel.id === s.id))
);

const selectedSoldiers = computed(() =>
    soldierStore.soldiers.filter(s => selectionStore.selectedSoldiers.some(sel => sel.id === s.id))
);
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
        grid-template-rows: 1fr 1fr;
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
</style>