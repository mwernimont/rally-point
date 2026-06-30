# Rally Point

A turn-based tactical strategy game built with Vue 3 + Pinia.

## AI Behavior Constraints
- Do not qualify advice based on assumptions about this project's scale, production status, or importance. Give the same quality of reasoning you would for any serious software. Avoid phrases like "in a real production app," "for a project like this," or similar hedging that implies the codebase doesn't warrant good decisions.
- Do not recommend skipping DRY principles or good structure based on assumptions about current project complexity. If duplication would normally be worth addressing, say so — don't suppress the advice because you think the project doesn't need it yet.

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
- **Game Log**: sidebar log with color-coded entries by type (`turn`, `move`, `death`, etc.). Newest entries at top. `logEvent(message, type)` is the single function all actions call. Clears on new mission.
- **Enemies on board**: Enemies randomly selected from `enemyStore` pool via `pickEnemies(count)`, placed on the opposite edge from players. Clicking an enemy cell is ignored (faction check in `onCellClick`).
- **Enemy movement**: on End Turn, each enemy finds the nearest living player soldier (Manhattan distance), calls `computeReachable` for its movement budget, and moves to the reachable cell closest to that target.
- **Unit class icons**: Phosphor Icons rendered on unit cells via dynamic `<component :is="classIcons[cell.unit.class]">` lookup. `classIcons` map lives in `GameBoard.vue` as a display concern.
- **`pathfinding.js`**: BFS extracted to `src/utils/pathFinding.js` as `computeReachable(cells, gridSize, startRow, startCol, budget)` → `Map<cellId, stepCost>`. Used by `missionStore.reachableMap` and `runEnemyTurn`.
- **`combat.js`**: plain JS module at `src/utils/combat.js`. Exports `getRangeBracket(distance)`, `hasLoS(attacker, target, cells, gridSize)` → `{ blocked, halfCover }`, `resolveAttack({ attacker, target, cells, gridSize })` → `{ hit, damage, logMessage }`, `getTargetsInLoS(attacker, candidates, cells, gridSize)` → filtered array of living units with unblocked LoS. No store imports, no state mutations.
- **Player shooting**: Shoot button toggles `targetingMode` in `missionStore`. `validTargets` computed calls `getTargetsInLoS` against enemies. Clicking a valid target cell calls `applyAttack`. Targeting mode exits after shot or second Shoot press. Shoot button disabled when ammo is 0.
- **`applyAttack(attackerId, targetId)`**: in `missionStore`. Looks up attacker and target across both arrays, guards on `currentAmmo === 0`, calls `resolveAttack`, logs result, applies armor absorption then health damage if hit, deducts 1 AP and 1 ammo from attacker. Works for both player and enemy attackers.
- **Reload**: `reload(unit)` in `missionStore` resets `currentAmmo` to `maxAmmo`, costs 1 AP, logs the action. Reload button disabled when ammo is full or AP is 0.
- **Enemy shooting and reload**: after moving, each enemy calls `getTargetsInLoS` against living player soldiers, reduces to nearest with `nearestTo`, then shoots via `applyAttack` or reloads via `reload` if out of ammo. Enemy AP and movement reset in `endTurn` alongside players.
- **`nearestTo(units, origin)`**: helper in `missionStore`. Reduces an array of units to the one closest to `origin` by Manhattan distance.
- **Dead unit cleanup**: `applyAttack` clears `cell.unit` immediately when health drops to 0, removing the unit from the board for both factions. `runEnemyTurn` guards with `if (enemy.currentHealth <= 0) return` to skip dead enemies. `endTurn` auto-selects the first living soldier via `soldiers.value.find(s => s.currentHealth > 0)?.id`.
- **`validDestinations(reachableMap, unit)`**: helper in `missionStore`. Filters reachable cells to valid move destinations — excludes the unit's own cell, occupied cells, and cover cells. Used by both `validMoveCells` computed and `runEnemyTurn` to keep destination filtering DRY.
- **Targeting mode resets**: `setActiveSoldier` clears `targetingMode` on soldier switch. `endTurn` also clears it so a player can't carry targeting mode into the next turn.
- **Shoot button active state**: Shoot button gets a `targetingMode` CSS class when targeting mode is on for visual feedback.
- **Win/loss detection**: `applyAttack` checks after every health mutation — if all enemies are dead sets `missionOutcome` to `'win'`, if all soldiers are dead sets it to `'loss'`. `missionOutcome` ref is `null` during play, reset to `null` in `startMission`.
- **`MissionOutcome.vue`**: centered modal over a full-screen dimmer (`position: fixed`, `inset: 0`). Reads `missionStore.missionOutcome` directly. Shows "Mission Success!" or "Mission Failure!" with a win/loss CSS class. Mounted in `GameBoard.vue` via `v-if="missionStore.missionOutcome"`.
- **Enemy health bar**: `GameBoard.vue` renders a `.health-track` / `.health-fill` pair on enemy cells (`cell.unit?.faction === 'enemy'`) — constant 2 elements regardless of `maxHealth`. `.health-fill` width is bound inline to `currentHealth / maxHealth * 100%`; the segmented "pip" look comes from a `repeating-linear-gradient` background on the fill, not from individual DOM nodes. Purely a display read off the existing reactive `cell.unit` aliasing — no store changes needed since `applyAttack` already mutates the canonical unit object in place.
- **Death log message**: `applyAttack` logs `` `${target.name} died!` `` with log type `'death'` immediately after clearing `cell.unit`, before the win/loss check. `'death'` has its own color rule (`.log-death`) alongside the existing log types.

### Architecture
- `soldierStore` — source of truth for the full player soldier roster
- `enemyStore` — source of truth for enemy roster. Exposes `pickEnemies(count)` which shuffles the pool and returns `count` deep-copied enemies.
- `selectionStore` — tracks which soldiers the player has selected, max squad size (4)
- `missionStore` — single source of truth for all mission state: grid, units, turn/phase, game log. Owns all mutation functions (`applyAttack`, `logEvent`, etc.). Sequences the combat chain (resolve → mutate → log) using plain module helpers.
- `src/utils/pathFinding.js` — plain JS module. Exports `computeReachable(cells, gridSize, startRow, startCol, budget)` → `Map<cellId, stepCost>`. No store, no reactivity.
- `src/utils/combat.js` — plain JS module. Exports `getRangeBracket`, `hasLoS`, `resolveAttack`. No store imports, no reactivity.
- `GameBoard.vue` — pure rendering view, reads from `missionStore`. Fires actions to `missionStore` directly. Owns display concerns: `sidebarWidth`, `gapSize`, `cellSize` computed, `windowWidth` reactive ref

### Data Model
Each cell has: `id`, `row`, `col`, `zone` (null | 'deploy' | 'enemy-deploy'), `cover` (null | 'half' | 'hard'), `unit` (null | unit object)
Each soldier has: `id`, `name`, `color`, `class`, `faction` ('player'), `currentHealth`, `maxHealth`, `currentArmor`, `maxArmor`, `currentAmmo`, `maxAmmo`, `currentAp`, `maxAp`, `currentMovement`, `maxMovement`, `accuracyByRange: { close, medium, long }`, `damage`, `items`, `injuries`, `row`, `col`
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
- **Play again flow**: after a mission ends, starting a new mission should feel clean — squad selection cleared, store state fully reset.

## Combat Design (implemented)

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
- `rangeBracket` derived from Chebyshev distance between shooter and target (`Math.max(|dr|, |dc|)`)
- Brackets: close = 1–3, medium = 4–7, long = 8+
- `coverBonus` = 20 when half cover is in the LoS ray between attacker and target
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
- Current AI: each enemy moves toward the nearest living player soldier, then shoots the nearest player with LoS via `applyAttack`, or reloads if out of ammo. Uses `nearestTo` and `getTargetsInLoS` helpers.

## Dev Notes
- User writes the code — Claude is a thinking partner only, no writing code unless scaffolding comments
- Keep GameBoard as a pure view. It reads from `missionStore` and fires actions to `missionStore` directly — no other stores.
- If you're not sure where logic belongs: pure math → plain JS module (`combat.js`, `pathFinding.js`). State mutation → `missionStore`. Sequencing (resolve → mutate → log) → also `missionStore`, using the plain modules as tools.
- **Aliasing rule**: `cell.unit` and the `soldiers.value` / `enemies.value` array entries are the same object reference. `soldiers.value` / `enemies.value` are canonical — treat `cell.unit` as an index into them. Never spread or clone a unit mid-mission or they desync. All health mutations go through `missionStore.applyAttack()` which mutates the canonical array entry.
- CSS variables live on `#game` (root container) so they cascade to all children
- Cells are a `ref` (not `computed`) so soldier placement mutations persist
- Movement uses BFS (not Chebyshev distance) so hard cover blocks pathing. `reachableMap` returns a `Map<cellId, stepCost>`. Diagonal moves are blocked if either orthogonal neighbor is hard cover (prevents corner-cutting). Half cover can be pathed through but not stopped on.
- Cell lookup is O(1) via `cells.value[row * gridSize.value + col]` — cell id equals its flat array index
