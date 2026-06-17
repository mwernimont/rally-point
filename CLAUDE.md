# Rally Point

A turn-based tactical strategy game built with Vue 3 + Pinia.

## Current State

### Completed
- **Main Menu** → **Squad Select** → **Game Board** routing via Vue Router
- **Squad Select**: players pick up to 4 soldiers from a roster, deploy button disabled until at least one is selected. Available soldiers dim when squad is full.
- **Game Board**: procedurally generated grid (10x30 random size), cover generation (~12% of cells, 70% half / 30% hard), soldiers placed on a random edge on non-cover cells.

### Architecture
- `soldierStore` — source of truth for the full soldier roster
- `selectionStore` — tracks which soldiers the player has selected, max squad size (4)
- `missionStore` — owns all mission state: grid cells, soldiers in mission, grid generation, cover generation, soldier placement
- `GameBoard.vue` — pure rendering view, reads from `missionStore`. Owns display concerns: `sidebarWidth`, `gapSize`, `cellSize` computed

### Data Model
Each cell has: `id`, `row`, `col`, `cover` (null | 'half' | 'hard'), `soldier` (null | soldier object)
Each soldier has: `id`, `name`, `color`, `class`, `currentHealth`, `maxHealth`, `armor`, `ammo`, `ap`, `items`, `injuries`, `row`, `col` (row/col set on placement)

### Flow
1. Player selects soldiers in `SquadSelect`
2. Deploy button calls `missionStore.startMission(selectedSoldiers)` then routes to `/game`
3. `startMission` sets soldiers, generates grid, places soldiers on a random edge

## Next Up
- Render soldier info in the Soldier UI strip at the top of the game board
- Enemy generation and placement on the opposite edge
- Turn-based combat loop

## Dev Notes
- User writes the code — Claude is a thinking partner only, no writing code unless scaffolding comments
- Keep GameBoard as a pure view, all game logic belongs in `missionStore`
- CSS variables live on `#game` (root container) so they cascade to all children
- Cells are a `ref` (not `computed`) so soldier placement mutations persist
