<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const size = Math.floor(Math.random() * 11) + 15
const cells = Array.from({ length: size * size }, (_, i) => i)
</script>

<template>
  <div class="game-board">
    <header>
      <span class="map-size">{{ size }}×{{ size }}</span>
      <button class="end-btn" @click="router.push('/after-mission')">End Mission</button>
    </header>
    <div class="grid-viewport">
      <div class="grid" :style="{ gridTemplateColumns: `repeat(${size}, 25px)` }">
        <div v-for="cell in cells" :key="cell" class="cell" />
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
}
</style>
