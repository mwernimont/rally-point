<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="squad-select">
    <h2>Squad Select</h2>
    <button @click="router.push('/game')">Deploy</button>
  </div>
</template>

<style lang="scss" scoped>
.squad-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: $spacing-md;
}
</style>
