<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="main-menu">
    <h1>Rally Point</h1>
    <button @click="router.push('/game')">Start Game</button>
  </div>
</template>

<style lang="scss" scoped>
.main-menu {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: $spacing-md;
}
</style>
