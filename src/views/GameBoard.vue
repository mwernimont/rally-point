<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSquadStore } from '@/stores/squadStore.js'
import { useMissionStore } from '@/stores/missionStore.js'

const router = useRouter()
const squad = useSquadStore()
const mission = useMissionStore()
const soldiers = squad.selected

const SEED_RATE = 0.05
const SPREAD_CHANCE = 0.55
const DEPLOY_DEPTH = 3
const MOVE_RANGE = 5

const size = Math.floor(Math.random() * 11) + 15
mission.start(size)

// Build grid
const grid = Array.from({ length: size }, () => Array(size).fill('empty'))

// Plant hard cover seeds
const seedCount = Math.floor(size * size * SEED_RATE)
for (let i = 0; i < seedCount; i++) {
  const r = Math.floor(Math.random() * size)
  const c = Math.floor(Math.random() * size)
  grid[r][c] = 'hard'
}

// Flood-fill — only seeds spread, half cover doesn't propagate
const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const queue = []
for (let r = 0; r < size; r++)
  for (let c = 0; c < size; c++)
    if (grid[r][c] === 'hard') queue.push([r, c])

while (queue.length) {
  const [r, c] = queue.shift()
  if (grid[r][c] !== 'hard') continue
  for (const [dr, dc] of dirs) {
    const nr = r + dr
    const nc = c + dc
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'empty') {
      if (Math.random() < SPREAD_CHANCE) grid[nr][nc] = 'half'
    }
  }
}

// Deploy zone
function findDeployZone(edge) {
  const candidates = []
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const inZone =
        (edge === 'north' && r < DEPLOY_DEPTH) ||
        (edge === 'south' && r >= size - DEPLOY_DEPTH - 1) ||
        (edge === 'west'  && c < DEPLOY_DEPTH) ||
        (edge === 'east'  && c >= size - DEPLOY_DEPTH - 1)
      if (!inZone) continue
      const block = [[r, c], [r, c + 1], [r + 1, c], [r + 1, c + 1]]
      if (block.every(([br, bc]) => grid[br][bc] === 'empty')) candidates.push(block)
    }
  }
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)] : null
}

const edges = ['north', 'south', 'east', 'west'].sort(() => Math.random() - 0.5)
let deployZone = null
for (const edge of edges) {
  deployZone = findDeployZone(edge)
  if (deployZone) break
}

// cellIndex → soldier
const soldierPositions = reactive({})
// soldier.id → moves remaining this turn
const movesRemaining = reactive({})

if (deployZone) {
  deployZone.forEach(([r, c], i) => {
    grid[r][c] = 'deploy'
    if (soldiers[i]) {
      const idx = r * size + c
      soldierPositions[idx] = soldiers[i]
      movesRemaining[soldiers[i].id] = MOVE_RANGE
    }
  })
}

const cells = grid.flat()

// Movement
const selectedSoldierId = ref(null)
const highlightedCells = ref(new Map()) // cellIndex → movesUsed to reach it

const selectedIndex = computed(() => {
  if (!selectedSoldierId.value) return null
  const key = Object.keys(soldierPositions).find(k => soldierPositions[k]?.id === selectedSoldierId.value)
  return key != null ? parseInt(key) : null
})

const selectedSoldier = computed(() =>
  selectedSoldierId.value
    ? Object.values(soldierPositions).find(s => s?.id === selectedSoldierId.value) ?? null
    : null
)

const selectedMovesLeft = computed(() =>
  selectedSoldierId.value ? movesRemaining[selectedSoldierId.value] : null
)

// BFS — cover blocks, soldiers pass through each other
function getMovementRange(fromIndex, moves) {
  const fromRow = Math.floor(fromIndex / size)
  const fromCol = fromIndex % size
  const reachable = new Map()
  const visited = new Set([`${fromRow},${fromCol}`])
  const bfsQueue = [{ row: fromRow, col: fromCol, used: 0 }]

  while (bfsQueue.length) {
    const { row, col, used } = bfsQueue.shift()
    if (used >= moves) continue

    for (const [dr, dc] of dirs) {
      const nr = row + dr
      const nc = col + dc
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
      const key = `${nr},${nc}`
      if (visited.has(key)) continue
      const ni = nr * size + nc
      if (cells[ni] === 'half' || cells[ni] === 'hard') continue

      visited.add(key)
      reachable.set(ni, used + 1)
      bfsQueue.push({ row: nr, col: nc, used: used + 1 })
    }
  }
  return reachable
}

function onCellClick(index) {
  const soldierHere = soldierPositions[index]

  // Clicked a soldier
  if (soldierHere) {
    if (selectedSoldierId.value === soldierHere.id) {
      // Deselect
      selectedSoldierId.value = null
      highlightedCells.value = new Map()
    } else {
      // Select
      selectedSoldierId.value = soldierHere.id
      highlightedCells.value = getMovementRange(index, movesRemaining[soldierHere.id])
    }
    return
  }

  // Clicked a highlighted tile — move the selected soldier
  if (selectedSoldierId.value && highlightedCells.value.has(index)) {
    const fromIndex = selectedIndex.value
    const soldier = soldierPositions[fromIndex]
    const movesUsed = highlightedCells.value.get(index)

    delete soldierPositions[fromIndex]
    soldierPositions[index] = soldier
    movesRemaining[soldier.id] -= movesUsed

    highlightedCells.value = getMovementRange(index, movesRemaining[soldier.id])
    return
  }

  // Clicked empty non-highlighted tile — deselect
  selectedSoldierId.value = null
  highlightedCells.value = new Map()
}
</script>

<template>
  <div class="game-board">
    <header>
      <span class="map-size">{{ size }}×{{ size }}</span>
      <button class="end-btn" @click="() => { mission.complete(); router.push('/after-mission') }">End Mission</button>
    </header>
    <div class="soldier-hud">
      <template v-if="selectedSoldier">
        <div class="swatch" :style="{ backgroundColor: selectedSoldier.color }" />
        <span class="name">{{ selectedSoldier.name }}</span>
        <span class="moves">{{ selectedMovesLeft }} / {{ MOVE_RANGE }}</span>
      </template>
      <span v-else class="empty">No soldier selected</span>
    </div>

    <div class="grid-viewport">
      <div class="grid" :style="{ gridTemplateColumns: `repeat(${size}, 25px)` }">
        <div
          v-for="(cell, i) in cells"
          :key="i"
          class="cell"
          :class="[cell, {
            reachable: highlightedCells.has(i),
            active: selectedIndex === i,
          }]"
          :style="soldierPositions[i] ? { backgroundColor: soldierPositions[i].color } : {}"
          @click="onCellClick(i)"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game-board {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: $spacing-lg;
  gap: $spacing-md;
  box-sizing: border-box;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.map-size {
  font-size: 0.85rem;
  color: $color-text-muted;
}

.end-btn {
  padding: $spacing-xs $spacing-md;
  background: none;
  border: 1px solid $color-text-muted;
  border-radius: 4px;
  color: $color-text-muted;
  font-size: 0.85rem;

  &:hover {
    border-color: $color-primary;
    color: $color-primary;
  }
}

.soldier-hud {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  height: 32px;
  flex-shrink: 0;

  .swatch {
    width: 18px;
    height: 18px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .name {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .moves {
    font-size: 0.85rem;
    color: $color-text-muted;
  }

  .empty {
    font-size: 0.85rem;
    color: $color-text-muted;
  }
}

.grid-viewport {
  overflow: auto;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grid {
  display: grid;
  gap: 5px;
  width: fit-content;
}

.cell {
  position: relative;
  width: 25px;
  height: 25px;
  background-color: white;
  border-radius: 4px;
  cursor: pointer;

  &.half { background-color: #9a9a8e; }
  &.hard { background-color: #4a4a3e; }
  &.deploy { background-color: #5b8fa8; }

  &.reachable {
    background-color: #d4e860;
    &.deploy { background-color: #d4e860; }

    &:hover {
      background-color: #eeff44;
      box-shadow: 0 0 0 2px white;
      z-index: 1;
    }
  }

  &.active {
    box-shadow: 0 0 0 2px white;
    z-index: 1;
  }
}
</style>
