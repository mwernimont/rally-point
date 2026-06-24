import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEnemyStore = defineStore('enemies', () => {
    const enemies = ref([
        {id: "1", name: "Ranger", color: "#E10808", faction: "enemy", class: "Ranger", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, items: [], injuries: "none"},
        {id: "2", name: "Scout", color: "#E10808", faction: "enemy", class: "Scout", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 3, maxAmmo: 3, currentAp: 2, maxAp: 2, items: [], injuries: "none"},
        {id: "3", name: "Heavy", color: "#E10808", faction: "enemy", class: "Heavy", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 2, maxArmor: 2, currentAmmo: 6, maxAmmo: 6, currentAp: 2, maxAp: 2, items: [], injuries: "none"},
        {id: "4", name: "Radio", color: "#E10808", faction: "enemy", class: "Radio", currentHealth:3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, items: [], injuries: "none"},
        {id: "5", name: "Medic", color: "#E10808", faction: "enemy", class: "Medic", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, items: [], injuries: "none"}
    ]);
    function pickEnemies(count){
        const shuffled = [...enemies.value].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map(e => ({ ...e }));
    }
    return {enemies, pickEnemies}
})