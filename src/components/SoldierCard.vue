<template>
    <div class="soldier-card" @click="emit('select', soldier)">
        <div class="color-block" :style="{background: soldier.color }"></div>
        <div class="soldier-info">
            <ul>
                <li>{{soldier.name}} / {{ soldier.class }}</li>
                <li><PhHeartbeat :size="15" weight="fill" color="currentColor"/> {{soldier.currentHealth}}/{{soldier.maxHealth}}</li>
                <li><PhCrosshair :size="15" weight="fill" color="currentColor"/> {{ soldier.maxAmmo }}</li>
                <li><PhShield :size="15" weight="fill" color="currentColor"/> {{ soldier.maxArmor }}</li>
            </ul>
            
        </div>
        
    </div>
    
</template>
<script setup>
import { PhCrosshair, PhHeartbeat, PhShield } from "@phosphor-icons/vue";
const props = defineProps({
  soldier: Object
})
const emit = defineEmits(['select'])
</script>
<style lang="scss" scoped>
.soldier-card{
    background: $color-text;
    padding: 10px;
    width: 130px;
    border-radius: $border-radius;
    cursor: pointer;
}
.dimmed{
    opacity: 0.4;
}
.color-block{
   width: 100%;
   aspect-ratio: 1/1;
   border-radius: $border-radius;
   margin-bottom: $spacing-xs
}
.soldier-info{
    color: $color-bg
}

.soldier-info li {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>