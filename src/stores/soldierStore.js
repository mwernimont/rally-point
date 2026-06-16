import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSoldierStore = defineStore('roster', () => {
    const soldiers = ref([
        {id: "alpha", name: "Alpha", color: "#25A09E"},
         {id: "bravo", name: "Bravo", color: "#3F9964"},
         {id: "charlie", name: "Charlie", color: "#622491"},
         {id: "delta", name: "Delta", color: "#FE783B"}
    ]);
    const selectedSoldiers = ref([]);
    const toggleSelectedSoldier = (id) => {
        const index = selectedSoldiers.value.findIndex(i => i === id);
        if(index !== -1){
            return selectedSoldiers.value.splice(index, 1)
        }else{
            return selectedSoldiers.value.push(id)
        }
    }
    function addSoldier(soldier){}
    function removeSoldier(id){
        soldiers.value = soldiers.value.filter(s => s.id !== id)
    }
    return {soldiers, removeSoldier, selectedSoldiers, toggleSelectedSoldier}
})