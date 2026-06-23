# Rally Point

A turn-based tactical strategy game built with Vue 3 + Pinia.

## Current State

### Completed
- **Main Menu** → **Squad Select** → **Game Board** routing via Vue Router
- **Squad Select**: players pick up to 4 soldiers from a roster, deploy button disabled until at least one is selected. Available soldiers dim when squad is full. Selection cleared on deploy.
- **Game Board**: procedurally generated square grid (10–30 random size), cover generation (~12% of cells, 70% half / 30% hard), deployment zone on a random edge, soldiers placed in deployment zone.
- **Soldier selection**: clicking a soldier cell on the map sets `activeSoldier` in `missionStore`. Active soldier is highlighted on the map (`active-soldier` class). Soldier UI strip at the top shows the active soldier's stats.
- **Soldier UI strip**: displays name, avatar (color), and all stats (current/max) for the active soldier. Hidden via `v-if` when no active soldier.
- **Soldier movement**: clicking a valid move cell moves the active soldier and deducts the path cost from `currentMovement`. Valid cells highlighted on the map.

### Architecture
- `soldierStore` — source of truth for the full soldier roster
- `selectionStore` — tracks which soldiers the player has selected, max squad size (4)
- `missionStore` — owns all mission state: grid cells, soldiers in mission, grid generation, cover generation, soldier placement, `activeSoldierId` (ref), `activeSoldier` (computed), `setActiveSoldier(id)` action, `reachableMap` (computed BFS result), `validMoveCells` (computed), `moveSoldier(soldier, targetCell)` action
- `GameBoard.vue` — pure rendering view, reads from `missionStore`. Owns display concerns: `sidebarWidth`, `gapSize`, `cellSize` computed, `windowWidth` reactive ref

### Data Model
Each cell has: `id`, `row`, `col`, `zone` (null | 'deploy'), `cover` (null | 'half' | 'hard'), `soldier` (null | soldier object)
Each soldier has: `id`, `name`, `color`, `class`, `currentHealth`, `maxHealth`, `currentArmor`, `maxArmor`, `currentAmmo`, `maxAmmo`, `currentAp`, `maxAp`, `currentMovement`, `maxMovement`, `items`, `injuries`, `row`, `col` (row/col set on placement)

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
- Enemy generation and placement on the opposite edge
- Turn-based combat loop

## Dev Notes
- User writes the code — Claude is a thinking partner only, no writing code unless scaffolding comments
- Keep GameBoard as a pure view, all game logic belongs in `missionStore`
- CSS variables live on `#game` (root container) so they cascade to all children
- Cells are a `ref` (not `computed`) so soldier placement mutations persist
- Movement uses BFS (not Chebyshev distance) so hard cover blocks pathing. `reachableMap` returns a `Map<cellId, stepCost>`. Diagonal moves are blocked if either orthogonal neighbor is hard cover (prevents corner-cutting). Half cover can be pathed through but not stopped on.
- Cell lookup is O(1) via `cells.value[row * gridSize.value + col]` — cell id equals its flat array index
