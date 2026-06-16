<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="main-menu">
    <h1>Rally Point</h1>
    <button @click="router.push('/squad-select')">Start Game</button>
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
  h1{
    font-size: 4rem;
  }
  button{
    padding: 10px;
    font-size: 1.5rem;
    background-color: $color-text;
    color: $color-bg;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    &:hover {
      background-color: $color-primary;
      color: $color-text;
    }
  }
}
</style>
