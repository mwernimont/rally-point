<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSquadStore } from '@/stores/squadStore.js'
import { useMissionStore } from '@/stores/missionStore.js'
import { PhHeart, PhCrosshair, PhFootprints, PhLightning, PhArrowCounterClockwise } from '@phosphor-icons/vue'

const router = useRouter()
const squad = useSquadStore()
const mission = useMissionStore()
const soldiers = squad.selected

const SEED_RATE = 0.05
const SPREAD_CHANCE = 0.55
const DEPLOY_DEPTH = 3
const ENEMY_DEPLOY_DEPTH = 4

const size = Math.floor(Math.random() * 11) + 15
mission.start(size, soldiers)

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

const OPPOSITE_EDGE = { north: 'south', south: 'north', east: 'west', west: 'east' }

const edges = ['north', 'south', 'east', 'west'].sort(() => Math.random() - 0.5)
let deployZone = null
let playerEdge = null
for (const edge of edges) {
  deployZone = findDeployZone(edge)
  if (deployZone) { playerEdge = edge; break }
}

// cellIndex → soldier
const soldierPositions = reactive({})

if (deployZone) {
  deployZone.forEach(([r, c], i) => {
    grid[r][c] = 'deploy'
    if (soldiers[i]) {
      soldierPositions[r * size + c] = soldiers[i]
    }
  })
}

const cells = grid.flat()

// Enemy spawn — opposite edge from player, divided into lanes for spread
const enemyEdge = playerEdge ? OPPOSITE_EDGE[playerEdge] : 'south'
const enemyCount = Math.floor(Math.random() * 5) + 4
const spawnedEnemies = []
const occupiedEnemyCells = new Set()
const laneCount = size / enemyCount

for (let i = 0; i < enemyCount; i++) {
  const laneStart = Math.floor(i * laneCount)
  const laneEnd = Math.floor((i + 1) * laneCount)
  const candidates = []

  for (let depth = 0; depth < ENEMY_DEPLOY_DEPTH; depth++) {
    for (let lane = laneStart; lane < laneEnd; lane++) {
      let r, c
      if (enemyEdge === 'north')  { r = depth;              c = lane }
      else if (enemyEdge === 'south') { r = size - 1 - depth;   c = lane }
      else if (enemyEdge === 'west')  { r = lane;               c = depth }
      else                            { r = lane;               c = size - 1 - depth }
      const idx = r * size + c
      if (cells[idx] === 'empty' && !occupiedEnemyCells.has(idx)) candidates.push(idx)
    }
  }

  if (!candidates.length) continue
  const cellIndex = candidates[Math.floor(Math.random() * candidates.length)]
  occupiedEnemyCells.add(cellIndex)
  spawnedEnemies.push({ id: `enemy-${i}`, cellIndex })
}
mission.spawnEnemies(spawnedEnemies)

const enemyPositions = computed(() => {
  const map = {}
  for (const e of mission.enemies) map[e.cellIndex] = e
  return map
})

// Shooting
const shootMode = ref(false)
const deadEnemyCells = ref(new Set())

function hasLineOfSight(fromIndex, toIndex) {
  let x0 = fromIndex % size, y0 = Math.floor(fromIndex / size)
  const x1 = toIndex % size,  y1 = Math.floor(toIndex / size)
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
  let err = dx - dy
  while (!(x0 === x1 && y0 === y1)) {
    const e2 = 2 * err
    if (e2 > -dy) { err -= dy; x0 += sx }
    if (e2 < dx)  { err += dx; y0 += sy }
    if (x0 === x1 && y0 === y1) break
    if (cells[y0 * size + x0] === 'hard') return false
  }
  return true
}

const shootableTargets = computed(() => {
  if (!shootMode.value || selectedIndex.value == null) return new Set()
  const targets = new Set()
  for (const e of mission.enemies) {
    if (hasLineOfSight(selectedIndex.value, e.cellIndex)) targets.add(e.cellIndex)
  }
  return targets
})

const hasValidTargets = computed(() => {
  if (selectedIndex.value == null) return false
  return mission.enemies.some(e => hasLineOfSight(selectedIndex.value, e.cellIndex))
})

function shoot(cellIndex) {
  const enemy = enemyPositions.value[cellIndex]
  const stats = mission.soldierStats[selectedSoldierId.value]
  mission.spendAmmo(selectedSoldierId.value)
  stats.actionsRemaining -= 1
  mission.applyEnemyDamage(enemy.id, 1)
  if (!mission.enemies.find(e => e.id === enemy.id)) deadEnemyCells.value = new Set([...deadEnemyCells.value, cellIndex])
  shootMode.value = false
}

// Movement
const selectedSoldierId = ref(null)

const highlightedCells = computed(() => {
  if (!selectedSoldierId.value || selectedIndex.value == null || shootMode.value) return new Map()
  const stats = mission.soldierStats[selectedSoldierId.value]
  if (!stats) return new Map()
  return getMovementRange(selectedIndex.value, stats, enemyPositions.value)
})

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

const selectedStats = computed(() =>
  selectedSoldierId.value ? mission.soldierStats[selectedSoldierId.value] ?? null : null
)

// BFS — cover blocks movement; blockedPositions (cellIndex map) are impassable (enemies for player, soldiers for enemies)
// Returns Map<cellIndex, { movesUsed, apCost }> where apCost 2 = sprint tile
function getMovementRange(fromIndex, stats, blockedPositions = {}) {
  if (stats.actionsRemaining === 0 || stats.moves === 0) return new Map()

  const canSprint = stats.actionsRemaining >= 2 && !stats.hasMoved
  const maxRange = canSprint ? mission.SPRINT_RANGE : stats.moves

  const fromRow = Math.floor(fromIndex / size)
  const fromCol = fromIndex % size
  const reachable = new Map()
  const visited = new Set([`${fromRow},${fromCol}`])
  const bfsQueue = [{ row: fromRow, col: fromCol, used: 0 }]

  while (bfsQueue.length) {
    const { row, col, used } = bfsQueue.shift()
    if (used >= maxRange) continue

    for (const [dr, dc] of dirs) {
      const nr = row + dr
      const nc = col + dc
      if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue
      const key = `${nr},${nc}`
      if (visited.has(key)) continue
      const ni = nr * size + nc
      if (cells[ni] === 'half' || cells[ni] === 'hard') continue
      if (blockedPositions[ni]) continue

      visited.add(key)
      const movesUsed = used + 1
      const apCost = canSprint && movesUsed > stats.movesPerTurn ? 2 : 1
      reachable.set(ni, { movesUsed, apCost })
      bfsQueue.push({ row: nr, col: nc, used: movesUsed })
    }
  }
  return reachable
}

const currentPhase = ref('player')
const missionWon = computed(() => mission.enemies.length === 0)

// Enemy AI helpers
const delay = ms => new Promise(r => setTimeout(r, ms))

function manhattanDistance(a, b) {
  return Math.abs(Math.floor(a / size) - Math.floor(b / size)) + Math.abs(a % size - b % size)
}

function nearestActiveSoldier(fromIndex) {
  let nearest = null, minDist = Infinity
  for (const [idx, soldier] of Object.entries(soldierPositions)) {
    const stats = mission.soldierStats[soldier.id]
    if (!stats || stats.status !== 'active') continue
    const dist = manhattanDistance(fromIndex, parseInt(idx))
    if (dist < minDist) { minDist = dist; nearest = { soldier, cellIndex: parseInt(idx) } }
  }
  return nearest
}

function nearestSoldierInLOS(fromIndex) {
  let nearest = null, minDist = Infinity
  for (const [idx, soldier] of Object.entries(soldierPositions)) {
    const stats = mission.soldierStats[soldier.id]
    if (!stats || stats.status !== 'active') continue
    const cellIndex = parseInt(idx)
    if (!hasLineOfSight(fromIndex, cellIndex)) continue
    const dist = manhattanDistance(fromIndex, cellIndex)
    if (dist < minDist) { minDist = dist; nearest = { soldier, cellIndex } }
  }
  return nearest
}

function bestMoveToward(reachable, targetIndex) {
  let bestCell = null, minDist = Infinity
  for (const cellIdx of reachable.keys()) {
    const d = manhattanDistance(cellIdx, targetIndex)
    if (d < minDist) { minDist = d; bestCell = cellIdx }
  }
  return bestCell
}

async function runEnemyTurn() {
  mission.resetEnemyMoves()

  for (const enemy of [...mission.enemies]) {
    const stats = mission.enemyStats[enemy.id]
    if (!stats || stats.status !== 'active') continue

    // Build blocked map: all soldiers + all other enemies
    const blocked = { ...soldierPositions }
    for (const e of mission.enemies) {
      if (e.id !== enemy.id) blocked[e.cellIndex] = true
    }

    // Move toward nearest active soldier (1 AP)
    if (stats.actionsRemaining >= 1 && stats.moves > 0) {
      const target = nearestActiveSoldier(enemy.cellIndex)
      if (target) {
        const reachable = getMovementRange(enemy.cellIndex, { ...stats, hasMoved: true }, blocked)
        const best = bestMoveToward(reachable, target.cellIndex)
        if (best != null) {
          const { movesUsed } = reachable.get(best)
          enemy.cellIndex = best
          stats.moves -= movesUsed
          stats.actionsRemaining -= 1
          stats.hasMoved = true
          await delay(150)
        }
      }
    }

    // Shoot nearest soldier in LOS (1 AP)
    if (stats.actionsRemaining >= 1 && stats.ammo > 0) {
      const losTarget = nearestSoldierInLOS(enemy.cellIndex)
      if (losTarget) {
        stats.ammo -= 1
        stats.actionsRemaining -= 1
        mission.applyDamage(losTarget.soldier.id, 1)
        await delay(150)
      }
    }
  }
}

async function endTurn() {
  selectedSoldierId.value = null
  shootMode.value = false
  mission.tickBleedTimers()

  currentPhase.value = 'enemy'
  await runEnemyTurn()
  currentPhase.value = 'player'

  mission.resetMoves()
  mission.nextTurn()
}

function onCellClick(index) {
  // Shoot mode — fire at target or cancel
  if (shootMode.value) {
    if (shootableTargets.value.has(index)) shoot(index)
    else shootMode.value = false
    return
  }

  const soldierHere = soldierPositions[index]

  // Clicked a soldier — toggle selection
  if (soldierHere) {
    selectedSoldierId.value = selectedSoldierId.value === soldierHere.id ? null : soldierHere.id
    return
  }

  // Clicked a highlighted tile — move the selected soldier
  if (selectedSoldierId.value && highlightedCells.value.has(index)) {
    const fromIndex = selectedIndex.value
    const soldier = soldierPositions[fromIndex]
    const { movesUsed, apCost } = highlightedCells.value.get(index)
    const stats = mission.soldierStats[soldier.id]

    delete soldierPositions[fromIndex]
    soldierPositions[index] = soldier

    if (apCost === 2) {
      // Sprint — spends entire action budget
      stats.actionsRemaining = 0
      stats.hasMoved = true
      stats.moves = Math.max(0, stats.moves - movesUsed)
    } else {
      // Normal move — deduct AP once on first move, then movement is free
      if (!stats.hasMoved) {
        stats.actionsRemaining -= 1
        stats.hasMoved = true
      }
      stats.moves -= movesUsed
    }
    return
  }

  // Clicked empty non-highlighted tile — deselect
  selectedSoldierId.value = null
}
</script>

<template>
  <div class="game-board">
    <header>
      <span class="map-size">{{ size }}×{{ size }}</span>
      <div class="header-actions">
        <button :class="['end-btn', { ready: mission.allActionsSpent }]" :disabled="currentPhase === 'enemy' || missionWon" @click="endTurn">End Turn</button>
        <button class="end-btn" @click="router.push('/game')">Restart</button>
      </div>
    </header>
    <div class="soldier-hud">
      <template v-if="selectedSoldier && selectedStats">
        <div class="identity">
          <div class="swatch" :style="{ backgroundColor: selectedSoldier.color }" />
          <span class="name">{{ selectedSoldier.name }}</span>
        </div>
        <div class="stats">
          <span class="stat">
            <PhHeart :size="13" weight="fill" class="icon heart" />
            {{ selectedStats.hp }} / {{ selectedStats.maxHp }}
          </span>
          <span class="stat">
            <PhCrosshair :size="13" weight="fill" class="icon ammo" />
            {{ selectedStats.ammo }} / {{ selectedStats.maxAmmo }}
          </span>
          <span class="stat">
            <PhFootprints :size="13" weight="fill" class="icon moves" />
            {{ selectedStats.moves }} / {{ selectedStats.movesPerTurn }}
          </span>
          <span class="stat">
            <PhLightning :size="13" weight="fill" class="icon ap" />
            {{ selectedStats.actionsRemaining }} / {{ mission.ACTIONS_PER_TURN }}
          </span>
        </div>
        <button
          class="shoot-btn"
          :class="{ active: shootMode }"
          :disabled="selectedStats.actionsRemaining <= 0 || selectedStats.ammo <= 0 || !hasValidTargets"
          @click="shootMode = !shootMode"
        >
          <PhCrosshair :size="13" weight="fill" /> Shoot
        </button>
        <button
          class="reload-btn"
          :disabled="selectedStats.actionsRemaining <= 0 || selectedStats.ammo >= selectedStats.maxAmmo"
          @click="mission.reload(selectedSoldierId)"
        >
          <PhArrowCounterClockwise :size="13" weight="fill" /> Reload
        </button>
      </template>
      <span v-else class="empty">No soldier selected</span>
    </div>

    <div class="turn-banner" :class="currentPhase">
      {{ currentPhase === 'player' ? "Player's Turn" : "Enemy's Turn" }}
    </div>

    <div class="grid-viewport">
      <div class="grid" :style="{ gridTemplateColumns: `repeat(${size}, 25px)` }">
        <div
          v-for="(cell, i) in cells"
          :key="i"
          class="cell"
          :class="[cell, {
            reachable: highlightedCells.get(i)?.apCost === 1,
            sprint: highlightedCells.get(i)?.apCost === 2,
            active: selectedIndex === i,
            enemy: !!enemyPositions[i],
            'enemy-dead': deadEnemyCells.has(i),
            targetable: shootableTargets.has(i),
            'soldier-down': soldierPositions[i] && mission.soldierStats[soldierPositions[i].id]?.status === 'down',
            'soldier-dead': soldierPositions[i] && mission.soldierStats[soldierPositions[i].id]?.status === 'dead',
          }]"
          :style="soldierPositions[i] ? { backgroundColor: soldierPositions[i].color } : {}"
          :data-tooltip="enemyPositions[i] ? `HP: ${mission.enemyStats[enemyPositions[i].id]?.hp}/${mission.enemyStats[enemyPositions[i].id]?.maxHp}` : undefined"
          @click="onCellClick(i)"
        />
      </div>
    </div>

    <Transition name="victory">
      <div v-if="missionWon" class="victory-overlay">
        <div class="victory-box">
          <h2>Mission Complete</h2>
          <div class="victory-actions">
            <button @click="router.push('/game')">Play Again</button>
            <button @click="router.push('/')">Main Menu</button>
          </div>
        </div>
      </div>
    </Transition>
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

.header-actions {
  display: flex;
  gap: $spacing-sm;
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

  &.ready {
    border-color: $color-primary;
    color: $color-primary;
    box-shadow: 0 0 6px rgba($color-primary, 0.4);
  }
}

.soldier-hud {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;

  .identity {
    display: flex;
    align-items: center;
    gap: $spacing-sm;
  }

  .swatch {
    width: 16px;
    height: 16px;
    border-radius: 3px;
    flex-shrink: 0;
  }

  .name {
    font-size: 0.95rem;
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  .stats {
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding-left: 24px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 0.8rem;
    color: $color-text-muted;

    .icon {
      flex-shrink: 0;
      &.heart  { color: #e74c3c; }
      &.ammo   { color: #f39c12; }
      &.moves  { color: #3498db; }
      &.ap     { color: #f1c40f; }
    }
  }

  .shoot-btn, .reload-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    margin-top: 4px;
    margin-left: 24px;
    padding: $spacing-xs $spacing-sm;
    background: none;
    border-radius: 4px;
    font-size: 0.8rem;
    cursor: pointer;
    width: fit-content;

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
  }

  .shoot-btn {
    border: 1px solid #e74c3c;
    color: #e74c3c;

    &:hover:not(:disabled) {
      background-color: rgba(#e74c3c, 0.15);
    }

    &.active {
      background-color: rgba(#e74c3c, 0.25);
      box-shadow: 0 0 6px rgba(#e74c3c, 0.5);
    }
  }

  .reload-btn {
    border: 1px solid #3498db;
    color: #3498db;

    &:hover:not(:disabled) {
      background-color: rgba(#3498db, 0.15);
    }
  }

  .empty {
    font-size: 0.85rem;
    color: $color-text-muted;
  }
}

.turn-banner {
  text-align: center;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  padding: $spacing-xs $spacing-md;
  border-radius: 4px;
  flex-shrink: 0;
  transition: background-color 0.2s, color 0.2s;

  &.player {
    background-color: rgba($color-primary, 0.15);
    color: $color-primary;
  }

  &.enemy {
    background-color: rgba(#e74c3c, 0.15);
    color: #e74c3c;
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

  &.sprint {
    background-color: #f0a830;

    &:hover {
      background-color: #ffc045;
      box-shadow: 0 0 0 2px white;
      z-index: 1;
    }
  }

  &.active {
    box-shadow: 0 0 0 2px white;
    z-index: 1;
  }

  &.enemy {
    background-color: #e74c3c;
    box-shadow: inset 0 0 0 2px #000;
    position: relative;

    &[data-tooltip]:hover::after {
      content: attr(data-tooltip);
      position: absolute;
      bottom: calc(100% + 4px);
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      font-size: 11px;
      white-space: nowrap;
      padding: 2px 6px;
      border-radius: 3px;
      pointer-events: none;
      z-index: 10;
    }
  }

  &.enemy-dead {
    background-color: #5a1a1a;
    opacity: 0.4;
  }

  &.soldier-down {
    opacity: 0.45;
    box-shadow: inset 0 0 0 2px #e67e22;
  }

  &.soldier-dead {
    opacity: 0.25;
  }

  &.targetable {
    background-color: #e74c3c;
    box-shadow: inset 0 0 0 2px #fff, 0 0 6px rgba(#e74c3c, 0.8);
    cursor: crosshair;

    &:hover {
      background-color: #ff6b5b;
    }
  }
}

.victory-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.victory-box {
  background: $color-bg;
  border: 2px solid $color-text;
  padding: $spacing-lg * 2;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: $spacing-lg;

  h2 {
    font-size: 1.8rem;
    letter-spacing: 0.1em;
    color: #2ecc71;
  }
}

.victory-actions {
  display: flex;
  gap: $spacing-md;
  justify-content: center;

  button {
    padding: $spacing-sm $spacing-lg;
    background: transparent;
    border: 1px solid $color-text;
    color: $color-text;
    cursor: pointer;
    font-size: 0.9rem;
    letter-spacing: 0.05em;

    &:hover {
      background: $color-text;
      color: $color-bg;
    }
  }
}

.victory-enter-active {
  transition: opacity 0.4s ease;
}
.victory-enter-from {
  opacity: 0;
}
</style>
