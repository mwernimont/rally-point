import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSoldierStore = defineStore('soldiers', () => {
    const soldiers = ref([
        {
            id: "alpha",
            name: "Alpha",
            color: "#3AB75C",
            faction: "player",
            class: "Ranger",
            currentHealth: 5,
            maxHealth: 5,
            currentMovement: 5,
            maxMovement: 5,
            currentArmor: 0,
            maxArmor: 0,
            currentAmmo: 4,
            maxAmmo: 4,
            currentAp: 2,
            maxAp: 2,
            accuracyByRange: {close: 85, medium: 70, long: 40},
            items: [],
            injuries: "none"
        },
        {
            id: "bravo", 
            name: "Bravo", 
            color: "#4B75B6", 
            faction: "player", 
            class: "Scout", 
            currentHealth: 5, 
            maxHealth: 5, 
            currentMovement: 5, 
            maxMovement: 5, 
            currentArmor: 0, 
            maxArmor: 0, 
            currentAmmo: 3, 
            maxAmmo: 3, 
            currentAp: 2, 
            maxAp: 2, 
            accuracyByRange: {close: 40, medium: 65, long: 85}, 
            items: [], 
            injuries: "none"
        },
        {
            id: "charlie", 
            name: "Charlie", 
            color: "#8C6CB0", 
            faction: "player", 
            class: "Heavy", 
            currentHealth: 5, 
            maxHealth: 5, 
            currentMovement: 5, 
            maxMovement: 5, 
            currentArmor: 2, 
            maxArmor: 2, 
            currentAmmo: 6, 
            maxAmmo: 6, 
            currentAp: 2, 
            maxAp: 2, 
            accuracyByRange: {close: 60, medium: 60, long: 60}, 
            items: [], 
            injuries: "none"
        },
        {
            id: "delta", 
            name: "Delta", 
            color: "#F77E51", 
            faction: "player", 
            class: "Radio", 
            currentHealth: 5, 
            maxHealth: 5, 
            currentMovement: 5, 
            maxMovement: 5, 
            currentArmor: 0, 
            maxArmor: 0, 
            currentAmmo: 4, 
            maxAmmo: 4, 
            currentAp: 2, 
            maxAp: 2, 
            accuracyByRange: {close: 50, medium: 50, long: 35}, 
            items: [], 
            injuries: "none"
        },
        {
            id: "echo", 
            name: "Echo", 
            color: "#F5BA42", 
            faction: "player", 
            class: "Medic", 
            currentHealth: 5, 
            maxHealth: 5, 
            currentMovement: 5, 
            maxMovement: 5, 
            currentArmor: 0, 
            maxArmor: 0, 
            currentAmmo: 4, 
            maxAmmo: 4, 
            currentAp: 2, 
            maxAp: 2, 
            accuracyByRange: {close: 50, medium: 50, long: 35}, 
            items: [], 
            injuries: "none"
        }
    ]);
    function removeSoldier(id){
        soldiers.value = soldiers.value.filter(s => s.id !== id)
    }
    return {soldiers, removeSoldier}
})
