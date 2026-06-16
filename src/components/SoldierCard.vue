<template>
    <div class="soldier-card">
        <div class="color-block" :style="{background: soldier.color }"></div>
        <div class="soldier-info">
            {{soldier.name}}
        </div>
        
    </div>
    
</template>
<script setup>
const props = defineProps({
  soldier: Object
})
</script>
<style lang="scss" scoped>
.soldier-card{
    width: 100px;
    height: 100px;
    background: $color-text;
    padding: 10px;
    border-radius: 5px;
    text-align: center;
    margin-top: 10px;
    display: flex;
    flex-direction: column
}
.color-block{
   flex: 1;
    border-radius: 5px;
    margin-bottom: 10px;
}
.soldier-info{
    color: $color-bg
}
</style>