import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const INSTANT_DEATH_FLOOR = -2
const BLEED_ROUNDS = 2

export const useMissionStore = defineStore('mission', () => {
  // 'idle' | 'active' | 'complete' | 'failed'
  const status = ref('idle')
  const mapSize = ref(null)
  const turnCount = ref(0)
  const objectiveMet = ref(false)

  // Enemy state (stubbed — populated when enemy spawning is built)
  const enemies = ref([])

  // soldier.id → { hp, maxHp, ammo, maxAmmo, moves, movesPerTurn, status, bleedTimer }
  const soldierStats = ref({})

  const isActive = computed(() => status.value === 'active')
  const isOver = computed(() => status.value === 'complete' || status.value === 'failed')
  const enemyCount = computed(() => enemies.value.length)

  function start(size, soldiers = []) {
    status.value = 'active'
    mapSize.value = size
    turnCount.value = 0
    objectiveMet.value = false
    enemies.value = []
    soldierStats.value = {}
    for (const s of soldiers) {
      soldierStats.value[s.id] = {
        hp: s.maxHp,
        maxHp: s.maxHp,
        ammo: s.maxAmmo,
        maxAmmo: s.maxAmmo,
        moves: s.movesPerTurn,
        movesPerTurn: s.movesPerTurn,
        status: 'active',
        bleedTimer: null,
      }
    }
  }

  function applyDamage(soldierId, damage) {
    const stats = soldierStats.value[soldierId]
    if (!stats || stats.status === 'dead') return
    stats.hp -= damage
    if (stats.hp <= INSTANT_DEATH_FLOOR) {
      stats.status = 'dead'
      stats.bleedTimer = null
    } else if (stats.hp <= 0 && stats.status === 'active') {
      stats.status = 'down'
      stats.bleedTimer = BLEED_ROUNDS
    }
  }

  // Call at end of player turn — ticks bleed timers for downed soldiers
  function tickBleedTimers() {
    for (const stats of Object.values(soldierStats.value)) {
      if (stats.status !== 'down') continue
      stats.bleedTimer--
      if (stats.bleedTimer <= 0) {
        stats.status = 'dead'
        stats.bleedTimer = null
      }
    }
  }

  function spendAmmo(soldierId) {
    const stats = soldierStats.value[soldierId]
    if (!stats || stats.ammo <= 0) return
    stats.ammo--
  }

  // Call at start of each new turn to restore movement
  function resetMoves() {
    for (const stats of Object.values(soldierStats.value)) {
      if (stats.status === 'active') stats.moves = stats.movesPerTurn
    }
  }

  function complete() {
    status.value = 'complete'
  }

  function fail() {
    status.value = 'failed'
  }

  function nextTurn() {
    turnCount.value++
  }

  function reset() {
    status.value = 'idle'
    mapSize.value = null
    turnCount.value = 0
    objectiveMet.value = false
    enemies.value = []
    soldierStats.value = {}
  }

  return {
    status, mapSize, turnCount, objectiveMet, enemies, soldierStats,
    isActive, isOver, enemyCount,
    start, complete, fail, nextTurn, reset,
    applyDamage, tickBleedTimers, spendAmmo, resetMoves,
    INSTANT_DEATH_FLOOR, BLEED_ROUNDS,
  }
})
