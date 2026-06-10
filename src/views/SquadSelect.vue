<script setup>
import { useRouter } from 'vue-router'
import { useSquadStore } from '@/stores/squadStore.js'
import SoldierCard from '@/components/SoldierCard.vue'

const router = useRouter()
const squad = useSquadStore()

function deploy() {
  router.push({ name: 'Game' })
}
</script>

<template>
  <div class="squad-select">
    <h1>Squad Select</h1>

    <section class="row">
      <h2>Available Soldiers</h2>
      <div class="cards" :class="{ 'at-limit': squad.isAtLimit }">
        <SoldierCard
          v-for="soldier in squad.available"
          :key="soldier.id"
          :soldier="soldier"
          size="sm"
          @click="squad.select(soldier)"
        />
      </div>
    </section>

    <section class="row">
      <h2>Selected Soldiers <span class="limit-label">{{ squad.selected.length }} / {{ squad.SQUAD_LIMIT }}</span></h2>
      <div class="cards">
        <SoldierCard
          v-for="soldier in squad.selected"
          :key="soldier.id"
          :soldier="soldier"
          size="lg"
          @click="squad.deselect(soldier)"
        />
        <p v-if="squad.selected.length === 0" class="empty">No soldiers selected</p>
      </div>
    </section>

    <button class="deploy-btn" :disabled="squad.selected.length === 0" @click="deploy()">
      Deploy ({{ squad.selected.length }})
    </button>
  </div>
</template>

<style lang="scss" scoped>
.squad-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: $spacing-xl $spacing-lg;
  gap: $spacing-xl;
  min-height: 100vh;

  h1 {
    font-size: 2rem;
    letter-spacing: 0.05em;
  }
}

.row {
  width: 100%;
  max-width: 720px;

  h2 {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: $color-text-muted;
    margin-bottom: $spacing-md;
  }
}

.cards {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-md;
  min-height: 80px;
  align-items: center;

  &.at-limit :deep(.soldier-card) {
    opacity: 0.35;
    pointer-events: none;
  }
}

.limit-label {
  font-size: 0.85rem;
  color: $color-text-muted;
  font-weight: normal;
}

.empty {
  color: $color-text-muted;
  font-size: 0.9rem;
}

.deploy-btn {
  margin-top: auto;
  padding: $spacing-sm $spacing-xl;
  background-color: $color-primary;
  color: $color-text;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  letter-spacing: 0.05em;
  transition: opacity 0.15s;

  &:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
}
</style>
