import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useMissionStore = defineStore('mission', () => {
  // 'idle' | 'active' | 'complete' | 'failed'
  const status = ref('idle')
  const mapSize = ref(null)
  const turnCount = ref(0)
  const objectiveMet = ref(false)

  // Enemy state (stubbed — populated when enemy spawning is built)
  const enemies = ref([])

  const isActive = computed(() => status.value === 'active')
  const isOver = computed(() => status.value === 'complete' || status.value === 'failed')
  const enemyCount = computed(() => enemies.value.length)

  function start(size) {
    status.value = 'active'
    mapSize.value = size
    turnCount.value = 0
    objectiveMet.value = false
    enemies.value = []
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
  }

  return {
    status, mapSize, turnCount, objectiveMet, enemies,
    isActive, isOver, enemyCount,
    start, complete, fail, nextTurn, reset,
  }
})
