import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, it, expect } from 'vitest'
import MainMenu from '@/views/MainMenu.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/', component: MainMenu }],
})

describe('MainMenu', () => {
  it('renders the game title', async () => {
    const wrapper = mount(MainMenu, { global: { plugins: [router] } })
    expect(wrapper.text()).toContain('Rally Point')
  })

  it('has a start game button', () => {
    const wrapper = mount(MainMenu, { global: { plugins: [router] } })
    expect(wrapper.find('button').text()).toBe('Start Game')
  })
})
