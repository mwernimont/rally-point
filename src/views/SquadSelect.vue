<template>
    <div id="squad-select">
        <div id="squad-selection">
            <div id="avail">
                <div class="label">Available Soldiers</div>
                <template v-for="soldier in soldierStore.soldiers" :key="soldier.id">
                    <soldierCard :soldier="soldier"/>
                </template>
            </div>
            <div id="selected">Selected Soldiers</div>
        </div>
    </div>
</template>
<script setup>
import { useSoldierStore } from '../stores/soldierStore';
import soldierCard from "../components/SoldierCard.vue"
const soldierStore = useSoldierStore();
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