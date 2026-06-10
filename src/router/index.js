import { createRouter, createWebHistory } from 'vue-router'
import MainMenu from '@/views/MainMenu.vue'

const routes = [
  { path: '/', name: 'MainMenu', component: MainMenu },
  {
    path: '/game',
    name: 'Game',
    component: () => import('@/views/GameBoard.vue'),
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
