import {defineStore} from "pinia";
import {ref} from 'vue';

export const useSelectionStore = defineStore('selection', () => {
    const selectedSoldiers = ref ([]);
    const maxSquadSize = ref(4);

    function toggleSoldier(soldier){
        const exists = selectedSoldiers.value.find(s => s.id === soldier.id);
        if(exists){
            selectedSoldiers.value = selectedSoldiers.value.filter(s => s.id !== soldier.id)
        }else{
            if (selectedSoldiers.value.length < maxSquadSize.value) {
                selectedSoldiers.value.push(soldier)
            }
        }
    }

    function clearSelection(){
        selectedSoldiers.value = [];
    }

    return {selectedSoldiers, toggleSoldier, clearSelection, maxSquadSize}
})