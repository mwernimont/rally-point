# Rally Point

A turn-based tactical strategy game built with Vue 3 + Pinia.

## Current State

### Completed
- **Main Menu** → **Squad Select** → **Game Board** routing via Vue Router
- **Squad Select**: players pick up to 4 soldiers from a roster, deploy button disabled until at least one is selected. Available soldiers dim when squad is full. Selection cleared on deploy.
- **Game Board**: procedurally generated square grid (10–30 random size), cover generation (~12% of cells, 70% half / 30% hard), deployment zone on a random edge, soldiers placed in deployment zone.

### Architecture
- `soldierStore` — source of truth for the full soldier roster
- `selectionStore` — tracks which soldiers the player has selected, max squad size (4)
- `missionStore` — owns all mission state: grid cells, soldiers in mission, grid generation, cover generation, soldier placement
- `GameBoard.vue` — pure rendering view, reads from `missionStore`. Owns display concerns: `sidebarWidth`, `gapSize`, `cellSize` computed, `windowWidth` reactive ref

### Data Model
Each cell has: `id`, `row`, `col`, `zone` (null | 'deploy'), `cover` (null | 'half' | 'hard'), `soldier` (null | soldier object)
Each soldier has: `id`, `name`, `color`, `class`, `currentHealth`, `maxHealth`, `armor`, `ammo`, `ap`, `items`, `injuries`, `row`, `col` (row/col set on placement)

### Map Generation Pipeline
Order matters — each step depends on the previous:
1. `pickSpawnEdge` — picks a random edge ('top' | 'bottom' | 'left' | 'right')
2. `generateGrid(min, max, edge)` — builds cells, marks deploy zone (2 deep, squad-width, centered on edge), cover skipped for deploy cells
3. `placeSoldiers` — filters `zone === 'deploy'` cells, assigns soldiers in index order

### Flow
1. Player selects soldiers in `SquadSelect`
2. Deploy button calls `missionStore.startMission(selectedSoldiers)` then routes to `/game`
3. `startMission` deep-copies selected soldiers, picks spawn edge, generates grid, places soldiers

## Next Up
- Soldier selection on the game board (click a soldier cell to select them)
- Render selected soldier info in the Soldier UI strip at the top
- Soldier movement (highlight valid move cells, click to move)
- Enemy generation and placement on the opposite edge
- Turn-based combat loop

## Dev Notes
- User writes the code — Claude is a thinking partner only, no writing code unless scaffolding comments
- Keep GameBoard as a pure view, all game logic belongs in `missionStore`
- CSS variables live on `#game` (root container) so they cascade to all children
- Cells are a `ref` (not `computed`) so soldier placement mutations persist
