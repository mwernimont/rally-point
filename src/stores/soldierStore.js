import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSoldierStore = defineStore('soldiers', () => {
    const soldiers = ref([
        {id: "alpha", name: "Alpha", color: "#2E7D7B", class: "Ranger", currentHealth: 5, maxHealth: 5, armor: 0, ammo: 4, ap: 2, items: [], injuries: "none"},
        {id: "bravo", name: "Bravo", color: "#3A7A52", class: "Scout", currentHealth: 5, maxHealth: 5, armor: 0, ammo: 3, ap: 2, items: [], injuries: "none"},
        {id: "charlie", name: "Charlie", color: "#4E2272", class: "Heavy", currentHealth: 5, maxHealth: 5, armor: 2, ammo: 6, ap: 2, items: [], injuries: "none"},
        {id: "delta", name: "Delta", color: "#C45E2A", class: "Radio", currentHealth: 5, maxHealth: 5, armor: 0, ammo: 4, ap: 2, items: [], injuries: "none"},
        {id: "echo", name: "Echo", color: "#C9A832", class: "Medic", currentHealth: 5, maxHealth: 5, armor: 0, ammo: 4, ap: 2, items: [], injuries: "none"}
    ]);
    function removeSoldier(id){
        soldiers.value = soldiers.value.filter(s => s.id !== id)
    }
    return {soldiers, removeSoldier}
})