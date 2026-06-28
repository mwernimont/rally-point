import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEnemyStore = defineStore('enemies', () => {
    const enemies = ref([
        {id: "1", name: "Ranger", color: "#E10808", faction: "enemy", class: "Ranger", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, accuracyByRange: {close: 85, medium: 70, long: 40}, damage: 2, items: [], injuries: "none"},
        {id: "2", name: "Scout", color: "#E10808", faction: "enemy", class: "Scout", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 3, maxAmmo: 3, currentAp: 2, maxAp: 2, accuracyByRange: {close: 40, medium: 65, long: 85}, damage: 2, items: [], injuries: "none"},
        {id: "3", name: "Heavy", color: "#E10808", faction: "enemy", class: "Heavy", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 2, maxArmor: 2, currentAmmo: 6, maxAmmo: 6, currentAp: 2, maxAp: 2, accuracyByRange: {close: 60, medium: 60, long: 60}, damage: 3, items: [], injuries: "none"},
        {id: "4", name: "Radio", color: "#E10808", faction: "enemy", class: "Radio", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, accuracyByRange: {close: 50, medium: 50, long: 35}, damage: 1, items: [], injuries: "none"},
        {id: "5", name: "Medic", color: "#E10808", faction: "enemy", class: "Medic", currentHealth: 3, maxHealth: 3, currentMovement: 5, maxMovement: 5, currentArmor: 0, maxArmor: 0, currentAmmo: 4, maxAmmo: 4, currentAp: 2, maxAp: 2, accuracyByRange: {close: 50, medium: 50, long: 35}, damage: 1, items: [], injuries: "none"}
    ]);
    function pickEnemies(count){
        const shuffled = [...enemies.value].sort(() => Math.random() - 0.5);git 
        return shuffled.slice(0, count).map(e => ({ ...e }));
    }
    return {enemies, pickEnemies}
})