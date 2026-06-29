<template>
    <div id="dimmer">
        <div id="outcome" :class="missionStore.missionOutcome === 'win' ? 'win-state' : 'loss-state'" >
            <h1 v-if="missionStore.missionOutcome === 'win'">Mission Success!</h1>
            <h1 v-else>Mission Failure!</h1>
            <button @click="router.push('/squad-select')">Leave Mission</button> 
        </div>
    </div>
</template>
<script setup>
import { useRouter } from 'vue-router'
import { useMissionStore } from '../stores/missionStore';
const router = useRouter()
const missionStore = useMissionStore();
</script>
<style lang="scss" scoped>
#dimmer{
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0,0,0,.4);
    display: flex;
    align-items: center;
    justify-content: center;
}

#outcome{
    background: $color-bg;
    padding: 10px;
    border-radius: $border-radius;
    text-align: center;
    button{
        padding: 5px 10px;
        margin: 10px 0;
        background: $color-text;
        border: none;
        border-radius: $border-radius;
        &:hover{
            background: $color-primary;
            color: $color-text;
        }
    }
}

.win-state{
    color: green;
}

.loss-state{
    color: red;
}
</style>