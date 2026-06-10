<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="after-mission">
    <h2>Mission Complete</h2>
    <button @click="router.push('/')">Return to Menu</button>
  </div>
</template>

<style lang="scss" scoped>
.after-mission {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: $spacing-md;
}
</style>
