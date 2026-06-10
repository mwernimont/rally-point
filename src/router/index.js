import { createRouter, createWebHistory } from 'vue-router'
import MainMenu from '@/views/MainMenu.vue'

const routes = [
  { path: '/', name: 'MainMenu', component: MainMenu },
  {
    path: '/squad-select',
    name: 'SquadSelect',
    component: () => import('@/views/SquadSelect.vue'),
  },
  {
    path: '/game',
    name: 'Game',
    component: () => import('@/views/GameBoard.vue'),
  },
  {
    path: '/after-mission',
    name: 'AfterMission',
    component: () => import('@/views/AfterMission.vue'),
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
