<script setup>
defineProps({
  soldier: { type: Object, required: true },
  size: { type: String, default: 'sm' },
})
defineEmits(['click'])
</script>

<template>
  <button class="soldier-card" :class="size" @click="$emit('click')">
    <div class="swatch" :style="{ backgroundColor: soldier.color }" />
    <span class="name">{{ soldier.name }}</span>
  </button>
</template>

<style lang="scss" scoped>
.soldier-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-xs;
  background: none;
  border: 2px solid transparent;
  border-radius: 6px;
  padding: $spacing-xs;
  color: $color-text;
  transition: border-color 0.15s, transform 0.15s;
  cursor: pointer;

  &:hover {
    border-color: $color-primary;
    transform: translateY(-2px);
  }

  &.sm .swatch {
    width: 56px;
    height: 56px;
    border-radius: 4px;
  }

  &.sm .name {
    font-size: 11px;
  }

  &.lg .swatch {
    width: 96px;
    height: 96px;
    border-radius: 6px;
  }

  &.lg .name {
    font-size: 14px;
  }
}
</style>
