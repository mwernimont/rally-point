<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="game-board">
    <h2>Game Board</h2>
    <button @click="router.push('/')">Back to Menu</button>
  </div>
</template>

<style lang="scss" scoped>
.game-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-lg;
  gap: $spacing-md;
}
</style>
