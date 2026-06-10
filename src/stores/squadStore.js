import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const SQUAD_LIMIT = 4

const ROSTER = [
  { id: 'alpha',   name: 'Alpha',   color: '#e74c3c', maxHp: 5, maxAmmo: 3, movesPerTurn: 5 },
  { id: 'bravo',   name: 'Bravo',   color: '#3498db', maxHp: 5, maxAmmo: 3, movesPerTurn: 5 },
  { id: 'charlie', name: 'Charlie', color: '#2ecc71', maxHp: 5, maxAmmo: 3, movesPerTurn: 5 },
  { id: 'delta',   name: 'Delta',   color: '#f39c12', maxHp: 5, maxAmmo: 3, movesPerTurn: 5 },
  { id: 'echo',    name: 'Echo',    color: '#9b59b6', maxHp: 5, maxAmmo: 3, movesPerTurn: 5 },
  { id: 'foxtrot', name: 'Foxtrot', color: '#1abc9c', maxHp: 5, maxAmmo: 3, movesPerTurn: 5 },
]

export const useSquadStore = defineStore('squad', () => {
  const selected = ref([])

  const available = computed(() =>
    ROSTER.filter(s => !selected.value.find(sel => sel.id === s.id))
  )
  const isAtLimit = computed(() => selected.value.length >= SQUAD_LIMIT)

  function select(soldier) {
    if (isAtLimit.value) return
    selected.value = [...selected.value, soldier]
  }

  function deselect(soldier) {
    selected.value = selected.value.filter(s => s.id !== soldier.id)
  }

  function clear() {
    selected.value = []
  }

  return { SQUAD_LIMIT, ROSTER, selected, available, isAtLimit, select, deselect, clear }
})
