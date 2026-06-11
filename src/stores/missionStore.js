import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const INSTANT_DEATH_FLOOR = -2
const BLEED_ROUNDS = 2
const ACTIONS_PER_TURN = 2
const SPRINT_RANGE = 8

const ENEMY_MAX_HP = 3
const ENEMY_MAX_AMMO = 3
const ENEMY_ACTIONS_PER_TURN = 2
const ENEMY_MOVES_PER_TURN = 5

export const useMissionStore = defineStore('mission', () => {
  // 'idle' | 'active' | 'complete' | 'failed'
  const status = ref('idle')
  const mapSize = ref(null)
  const turnCount = ref(0)
  const objectiveMet = ref(false)

  const enemies = ref([])
  // enemy.id → { hp, maxHp, ammo, maxAmmo, moves, movesPerTurn, actionsRemaining, status }
  const enemyStats = ref({})

  // soldier.id → { hp, maxHp, ammo, maxAmmo, moves, movesPerTurn, status, bleedTimer }
  const soldierStats = ref({})

  const isActive = computed(() => status.value === 'active')
  const isOver = computed(() => status.value === 'complete' || status.value === 'failed')
  const enemyCount = computed(() => enemies.value.length)
  const allActionsSpent = computed(() => {
    const active = Object.values(soldierStats.value).filter(s => s.status === 'active')
    return active.length > 0 && active.every(s => s.actionsRemaining === 0)
  })

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
        actionsRemaining: ACTIONS_PER_TURN,
        hasMoved: false,
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

  function reload(soldierId) {
    const stats = soldierStats.value[soldierId]
    if (!stats || stats.actionsRemaining <= 0 || stats.ammo >= stats.maxAmmo) return
    stats.ammo = stats.maxAmmo
    stats.actionsRemaining -= 1
  }

  // Call at start of each new turn to restore movement and actions
  function resetMoves() {
    for (const stats of Object.values(soldierStats.value)) {
      if (stats.status !== 'active') continue
      stats.moves = stats.movesPerTurn
      stats.actionsRemaining = ACTIONS_PER_TURN
      stats.hasMoved = false
    }
  }

  function applyEnemyDamage(enemyId, damage) {
    const stats = enemyStats.value[enemyId]
    if (!stats || stats.status === 'dead') return
    stats.hp -= damage
    if (stats.hp <= 0) {
      stats.status = 'dead'
      enemies.value = enemies.value.filter(e => e.id !== enemyId)
    }
  }

  function spawnEnemies(enemyList) {
    enemies.value = enemyList
    enemyStats.value = {}
    for (const e of enemyList) {
      enemyStats.value[e.id] = {
        hp: ENEMY_MAX_HP,
        maxHp: ENEMY_MAX_HP,
        ammo: ENEMY_MAX_AMMO,
        maxAmmo: ENEMY_MAX_AMMO,
        moves: ENEMY_MOVES_PER_TURN,
        movesPerTurn: ENEMY_MOVES_PER_TURN,
        actionsRemaining: ENEMY_ACTIONS_PER_TURN,
        hasMoved: false,
        status: 'active',
      }
    }
  }

  function resetEnemyMoves() {
    for (const stats of Object.values(enemyStats.value)) {
      if (stats.status !== 'active') continue
      stats.moves = stats.movesPerTurn
      stats.actionsRemaining = ENEMY_ACTIONS_PER_TURN
      stats.hasMoved = false
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
    enemyStats.value = {}
    soldierStats.value = {}
  }

  return {
    status, mapSize, turnCount, objectiveMet, enemies, enemyStats, soldierStats,
    isActive, isOver, enemyCount, allActionsSpent,
    start, spawnEnemies, complete, fail, nextTurn, reset,
    applyDamage, applyEnemyDamage, tickBleedTimers, spendAmmo, reload, resetMoves, resetEnemyMoves,
    INSTANT_DEATH_FLOOR, BLEED_ROUNDS, ACTIONS_PER_TURN, SPRINT_RANGE,
    ENEMY_MAX_HP, ENEMY_MAX_AMMO, ENEMY_ACTIONS_PER_TURN, ENEMY_MOVES_PER_TURN,
  }
})
