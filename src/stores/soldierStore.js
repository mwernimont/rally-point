import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSoldierStore = defineStore('soldiers', () => {
    const soldiers = ref([
        {id: "alpha", name: "Alpha", color: "#3AB75C", class: "Ranger", currentHealth: 5, maxHealth: 5, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, items: [], injuries: "none"},
        {id: "bravo", name: "Bravo", color: "#4B75B6", class: "Scout", currentHealth: 5, maxHealth: 5, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 3, maxAmmo: 3, currentAp: 2, maxAp: 2, items: [], injuries: "none"},
        {id: "charlie", name: "Charlie", color: "#8C6CB0", class: "Heavy", currentHealth: 5, maxHealth: 5, currentMovement: 5, maxMovement: 5, currentArmor: 2, maxArmor: 2, currentAmmo: 6, maxAmmo: 6, currentAp: 2, maxAp: 2, items: [], injuries: "none"},
        {id: "delta", name: "Delta", color: "#F77E51", class: "Radio", currentHealth: 5, maxHealth: 5, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, items: [], injuries: "none"},
        {id: "echo", name: "Echo", color: "#F5BA42", class: "Medic", currentHealth: 5, maxHealth: 5, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, items: [], injuries: "none"}
    ]);
    function removeSoldier(id){
        soldiers.value = soldiers.value.filter(s => s.id !== id)
    }
    return {soldiers, removeSoldier}
})