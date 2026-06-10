<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import SoldierCard from '@/components/SoldierCard.vue'
import { selectedSoldiers } from '@/store/squad.js'

const router = useRouter()

const ALL_SOLDIERS = [
  { id: 'alpha',   name: 'Alpha',   color: '#e74c3c' },
  { id: 'bravo',   name: 'Bravo',   color: '#3498db' },
  { id: 'charlie', name: 'Charlie', color: '#2ecc71' },
  { id: 'delta',   name: 'Delta',   color: '#f39c12' },
  { id: 'echo',    name: 'Echo',    color: '#9b59b6' },
  { id: 'foxtrot', name: 'Foxtrot', color: '#1abc9c' },
]

const selected = ref([])
const available = computed(() =>
  ALL_SOLDIERS.filter(s => !selected.value.find(sel => sel.id === s.id))
)

const SQUAD_LIMIT = 4

function select(soldier) {
  if (selected.value.length >= SQUAD_LIMIT) return
  selected.value = [...selected.value, soldier]
}

function deselect(soldier) {
  selected.value = selected.value.filter(s => s.id !== soldier.id)
}

function deploy() {
  selectedSoldiers.value = selected.value
  router.push({ name: 'Game' })
}
</script>

<template>
  <div class="squad-select">
    <h1>Squad Select</h1>

    <section class="row">
      <h2>Available Soldiers</h2>
      <div class="cards" :class="{ 'at-limit': selected.length >= SQUAD_LIMIT }">
        <SoldierCard
          v-for="soldier in available"
          :key="soldier.id"
          :soldier="soldier"
          size="sm"
          @click="select(soldier)"
        />
      </div>
    </section>

    <section class="row">
      <h2>Selected Soldiers <span class="limit-label">{{ selected.length }} / {{ SQUAD_LIMIT }}</span></h2>
      <div class="cards">
        <SoldierCard
          v-for="soldier in selected"
          :key="soldier.id"
          :soldier="soldier"
          size="lg"
          @click="deselect(soldier)"
        />
        <p v-if="selected.length === 0" class="empty">No soldiers selected</p>
      </div>
    </section>

    <button class="deploy-btn" :disabled="selected.length === 0" @click="deploy()">
      Deploy ({{ selected.length }})
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
