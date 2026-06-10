# Rally Point

A turn-based modern war tactics game for the browser. Single player vs AI.

## Stack

- Vue 3 + Vite
- Vue Router — screen navigation
- Pinia — game state management
- SCSS — scoped component styles with global design tokens
- Vitest + Vue Test Utils — unit tests

## Game Flow

**Main Menu → Squad Select → Game Board → After Mission → Main Menu**

- **Squad Select** — choose up to 4 soldiers from a roster of 6, each with a unique color
- **Game Board** — procedurally generated NxN map (15–25 tiles) with clustered cover, a randomised edge deploy zone, and BFS-based movement (5 moves per soldier)
- **After Mission** — summary screen (stats coming soon)

## Dev

```bash
npm run dev       # start dev server (port 5173)
npm test          # run tests in watch mode
npm test -- --run # run tests once
npm run build     # production build
```
