# Rally Point

A turn-based tactical strategy game built with Vue 3 + Pinia.

## Current State

### Completed
- **Main Menu** → **Squad Select** → **Game Board** routing via Vue Router
- **Squad Select**: players pick up to 4 soldiers from a roster, deploy button disabled until at least one is selected. Available soldiers dim when squad is full. Selection cleared on deploy.
- **Game Board**: procedurally generated square grid (30–35 random size), cover generation (~12% of cells, 70% half / 30% hard), deployment zone on a random edge, soldiers placed in deployment zone.
- **Soldier selection**: clicking a soldier cell on the map sets `activeSoldier` in `missionStore`. Active soldier is highlighted on the map (`active-soldier` class). Soldier UI strip at the top shows the active soldier's stats.
- **Soldier UI strip**: displays name, avatar (color), and all stats (current/max) for the active soldier. Hidden via `v-if` when no active soldier.
- **Soldier movement**: clicking a valid move cell moves the active soldier, deducts path cost from `currentMovement`, and costs 1 AP. Valid cells highlighted on the map. No highlight when soldier is out of AP.
- **Action buttons**: Shoot and Reload buttons disabled (greyed out) when active soldier has no AP. End Turn button fills solid when all soldiers are out of AP (`allSoldierSpent`).
- **End Turn**: flips phase to `'enemy'`, runs enemy turn, flips back to `'player'`, resets `currentMovement` and `currentAp` for all soldiers, increments `currentTurn`, auto-selects first living soldier, logs turn start.
- **Game Log**: sidebar log with color-coded entries by type (`turn`, `move`). Newest entries at top. `logEvent(message, type)` is the single function all actions call. Clears on new mission.
- **Enemies on board**: Enemies randomly selected from `enemyStore` pool via `pickEnemies(count)`, placed on the opposite edge from players. Clicking an enemy cell is ignored (faction check in `onCellClick`).
- **Enemy movement**: on End Turn, each enemy finds the nearest living player soldier (Manhattan distance), calls `computeReachable` for its movement budget, and moves to the reachable cell closest to that target.
- **Unit class icons**: Phosphor Icons rendered on unit cells via dynamic `<component :is="classIcons[cell.unit.class]">` lookup. `classIcons` map lives in `GameBoard.vue` as a display concern.
- **`pathfinding.js`**: BFS extracted to `src/utils/pathFinding.js` as `computeReachable(cells, gridSize, startRow, startCol, budget)` → `Map<cellId, stepCost>`. Used by `missionStore.reachableMap` and `runEnemyTurn`.

### Architecture
- `soldierStore` — source of truth for the full player soldier roster
- `enemyStore` — source of truth for enemy roster. Exposes `pickEnemies(count)` which shuffles the pool and returns `count` deep-copied enemies.
- `selectionStore` — tracks which soldiers the player has selected, max squad size (4)
- `missionStore` — single source of truth for all mission state: grid, units, turn/phase, game log. Owns all mutation functions (`applyAttack`, `logEvent`, etc.). Sequences the combat chain (resolve → mutate → log) using plain module helpers.
- `src/utils/pathFinding.js` — plain JS module. Exports `computeReachable(cells, gridSize, startRow, startCol, budget)` → `Map<cellId, stepCost>`. No store, no reactivity.
- `combat.js` *(planned)* — plain JS module. Exports `resolveAttack({ attacker, target, cells, gridSize })` → `{ hit, damage, logMessage }`. Computes distance, LoS, hit chance, damage roll. Returns a result object — never mutates state.
- `GameBoard.vue` — pure rendering view, reads from `missionStore`. Fires actions to `missionStore` directly. Owns display concerns: `sidebarWidth`, `gapSize`, `cellSize` computed, `windowWidth` reactive ref

### Data Model
Each cell has: `id`, `row`, `col`, `zone` (null | 'deploy' | 'enemy-deploy'), `cover` (null | 'half' | 'hard'), `unit` (null | unit object)
Each soldier has: `id`, `name`, `color`, `class`, `faction` ('player'), `currentHealth`, `maxHealth`, `currentArmor`, `maxArmor`, `currentAmmo`, `maxAmmo`, `currentAp`, `maxAp`, `currentMovement`, `maxMovement`, `accuracyByRange: { close, medium, long }`, `items`, `injuries`, `row`, `col`
Each enemy has: same shape as soldier but `faction: 'enemy'`

### Map Generation Pipeline
Order matters — each step depends on the previous:
1. `pickSpawnEdge` — picks a random edge ('top' | 'bottom' | 'left' | 'right')
2. `pickOppositeEdge(edge)` — returns the opposing edge
3. `generateGrid(min, max, playerEdge, enemyEdge)` — builds cells, marks both deploy zones (2 deep, unit-count-width, centered on edge), cover skipped for zone cells. Uses `isOnEdge(row, col, edge, zoneStart, zoneEnd)` helper to avoid duplicate positional logic.
4. `placeSoldiers` — filters `zone === 'deploy'` cells, assigns soldiers in index order
5. `placeEnemies` — filters `zone === 'enemy-deploy'` cells, assigns enemies in index order

### Flow
1. Player selects soldiers in `SquadSelect`
2. Deploy button calls `missionStore.startMission(selectedSoldiers)` then routes to `/game`
3. `startMission` resets log/turn/phase, deep-copies selected soldiers, calls `enemyStore.pickEnemies(count)`, picks spawn edges, generates grid, places soldiers and enemies

## Next Up
- Build `combat.js`, wire `missionStore.applyAttack()` to call it
- Wire the Shoot button in `GameBoard.vue`

## Modules To Build

### `combat.js`
- Create `src/utils/combat.js`
- Export `resolveAttack({ attacker, target, cells, gridSize })` → `{ hit, damage, logMessage }`
- Functions inside:
  - `hasLoS(attacker, target, cells, gridSize)` — ray cast, hard cover blocks. Returns bool.
  - `getRangeBracket(distance)` — BFS step count → `'close' | 'medium' | 'long'`
  - `resolveAttack(...)` — runs LoS check, range bracket, attacker's `accuracyByRange`, cover bonus, dice roll. Builds the log line. Returns result object.
- Returns results only — no state mutations, no store imports

### `missionStore` additions
- `applyAttack(attackerId, targetId)` — looks up attacker in `soldiers.value`, target in `enemies.value` (or vice versa), calls `resolveAttack`, mutates `target.currentHealth`, pushes `logMessage` to `gameLog`. This is the only place health gets mutated.

## Combat Design (planned, not yet implemented)

### Action Economy
- Each unit has AP (`currentAp`) spent on actions each turn, reset on turn start
- Movement costs 1 AP and spends `currentMovement` up to the unit's budget
- Actions: Move (1 AP), Shoot (1 AP), Reload (1 AP, restores `currentAmmo` to `maxAmmo`)
- A unit can act until AP runs out — no single-action-per-turn restriction

### Line of Sight
- Hard cover blocks LoS entirely — cannot target through or behind it
- Half cover does not block LoS but grants the target a defense bonus

### Hit Chance Formula
```
hitChance = accuracyByRange[rangeBracket] - coverBonus
```
- `rangeBracket` derived from BFS step distance between shooter and target
- Brackets: close = 1–3, medium = 4–7, long = 8+
- `coverBonus` applied when target is in half cover (TBD value)
- Roll a random number, compare to hitChance → hit or miss

### Accuracy by Range
Each unit type has `accuracyByRange: { close, medium, long }` stored in `soldierStore`/`enemyStore`. No flat accuracy stat — all class differentiation lives in the data.
- **Ranger**: 85 / 70 / 40 — strong up close, falls off at range
- **Scout**: 40 / 65 / 85 — inverse curve, sniper profile
- **Heavy**: 60 / 60 / 60 — flat across all brackets, consistent but never great
- **Medic/Radio**: 50 / 50 / 35 — mediocre support units, slight long-range penalty

### Game Log
Hit resolution logs the full math and result:
`Ranger shot Heavy → 75% (medium) - 20% (half cover) = 55% → Hit! [32 rolled]`

### Enemy Turn
- Phase tracked by `currentPhase` ref (`'player' | 'enemy'`) in `missionStore`
- `endTurn` flips to `'enemy'`, calls `runEnemyTurn()`, flips back to `'player'`
- Current AI: each enemy finds nearest living player soldier by Manhattan distance, calls `computeReachable`, moves to the reachable cell closest to that target
- Future: enemies should shoot when in range before/after moving

## Dev Notes
- User writes the code — Claude is a thinking partner only, no writing code unless scaffolding comments
- Keep GameBoard as a pure view. It reads from `missionStore` and fires actions to `missionStore` directly — no other stores.
- If you're not sure where logic belongs: pure math → plain JS module (`combat.js`, `pathFinding.js`). State mutation → `missionStore`. Sequencing (resolve → mutate → log) → also `missionStore`, using the plain modules as tools.
- **Aliasing rule**: `cell.unit` and the `soldiers.value` / `enemies.value` array entries are the same object reference. `soldiers.value` / `enemies.value` are canonical — treat `cell.unit` as an index into them. Never spread or clone a unit mid-mission or they desync. All health mutations go through `missionStore.applyAttack()` which mutates the canonical array entry.
- CSS variables live on `#game` (root container) so they cascade to all children
- Cells are a `ref` (not `computed`) so soldier placement mutations persist
- Movement uses BFS (not Chebyshev distance) so hard cover blocks pathing. `reachableMap` returns a `Map<cellId, stepCost>`. Diagonal moves are blocked if either orthogonal neighbor is hard cover (prevents corner-cutting). Half cover can be pathed through but not stopped on.
- Cell lookup is O(1) via `cells.value[row * gridSize.value + col]` — cell id equals its flat array index
