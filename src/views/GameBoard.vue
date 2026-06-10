<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const SEED_RATE = 0.05
const SPREAD_CHANCE = 0.55

const size = Math.floor(Math.random() * 11) + 15

// Build grid
const grid = Array.from({ length: size }, () => Array(size).fill('empty'))

// Plant hard cover seeds
const seedCount = Math.floor(size * size * SEED_RATE)
for (let i = 0; i < seedCount; i++) {
  const r = Math.floor(Math.random() * size)
  const c = Math.floor(Math.random() * size)
  grid[r][c] = 'hard'
}

// Flood-fill outward — each spread tile can keep spreading,
// probability compounds per hop so clusters stay organic
const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]]
const queue = []

for (let r = 0; r < size; r++)
  for (let c = 0; c < size; c++)
    if (grid[r][c] === 'hard') queue.push([r, c])

// Only seeds spread — half cover tiles don't propagate further
while (queue.length) {
  const [r, c] = queue.shift()
  if (grid[r][c] !== 'hard') continue
  for (const [dr, dc] of dirs) {
    const nr = r + dr
    const nc = c + dc
    if (nr >= 0 && nr < size && nc >= 0 && nc < size && grid[nr][nc] === 'empty') {
      if (Math.random() < SPREAD_CHANCE) {
        grid[nr][nc] = 'half'
      }
    }
  }
}

const cells = grid.flat()
</script>

<template>
  <div class="game-board">
    <header>
      <span class="map-size">{{ size }}×{{ size }}</span>
      <button class="end-btn" @click="router.push('/after-mission')">End Mission</button>
    </header>
    <div class="grid-viewport">
      <div class="grid" :style="{ gridTemplateColumns: `repeat(${size}, 25px)` }">
        <div v-for="(cell, i) in cells" :key="i" class="cell" :class="cell" />
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
  width: 25px;
  height: 25px;
  background-color: white;
  border-radius: 4px;

  &.half {
    background-color: #9a9a8e;
  }

  &.hard {
    background-color: #4a4a3e;
  }
}
</style>
