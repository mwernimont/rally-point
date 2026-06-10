# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # start dev server
npm run build     # production build
npm test          # run tests in watch mode
npm test -- --run # run tests once (CI)
```

To run a single test file:
```bash
npm test -- src/tests/MainMenu.test.js --run
```

## Architecture

This is a turn-based browser game (single player vs AI) built with Vue 3 + Vite. Vue Router handles navigation between screens; Pinia is not yet added but can be introduced when game state needs to be shared across many components.

**Routing** — `src/router/index.js` defines all routes. The root view (`/`) is eagerly loaded; game views use lazy imports. `src/App.vue` is a thin shell containing only `<RouterView />`.

**Views vs Components** — Screens (full-page route targets) live in `src/views/`. Reusable UI pieces should go in `src/components/` when that directory is created.

**SCSS** — Global styles and the CSS reset are in `src/styles/main.scss`, imported once in `src/main.js`. `src/styles/_variables.scss` holds design tokens (colors, spacing). These variables are auto-injected into every component's `<style lang="scss" scoped>` block via `vite.config.js` `additionalData`, so no `@use` import is needed inside components.

**Tests** — Vitest + `@vue/test-utils`. Test files live in `src/tests/`. Tests that involve routing must create their own `createMemoryHistory` router instance rather than importing the app router, to keep tests isolated.

**Path alias** — `@` resolves to `src/`, available in both JS imports and SCSS `@use` paths.
