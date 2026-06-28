const chebyshevDistance = (target, attacker) => {
    return Math.max(Math.abs(target.row - attacker.row), Math.abs(target.col - attacker.col))
}

export const getRangeBracket = (distance) => {
    if(distance <= 3) return "close";
    if(distance <= 7) return "medium";
    return "long";
}

export const hasLoS = (attacker, target, cells, gridSize) => {
    const N = chebyshevDistance(target, attacker);
    let halfCover = false;

    for(let t = 1; t < N; t++){
        const r = Math.round(attacker.row + (target.row - attacker.row) * t / N);
        const c = Math.round(attacker.col + (target.col - attacker.col) * t / N);
        const cell = cells[r * gridSize + c];
        if(cell.cover === 'hard') return { blocked: true, halfCover: false }
        if(cell.cover === "half") halfCover = true 
    }
    return {blocked: false, halfCover}
}

export const getTargetsInLoS = (attacker, candidates, cells, gridSize) => {
    return candidates
        .filter(t => t.currentHealth > 0)
        .filter(t => !hasLoS(attacker, t, cells, gridSize).blocked)
}

export const resolveAttack = ({attacker, target, cells, gridSize}) => {
    const distance = chebyshevDistance(target, attacker);
    const los = hasLoS(attacker, target, cells, gridSize);
    if(los.blocked) return {hit: false, damage: 0, logMessage: `${attacker.name} has no line of sight`}
    const range = getRangeBracket(distance);
    const coverBonus = los.halfCover ? 20 : 0;
    const hitChance = attacker.accuracyByRange[range] - coverBonus;
    const roll = Math.floor(Math.random() * 100) + 1;
    const hit = roll <= hitChance;
    const damage = hit ? attacker.damage : 0;
    const coverPenalty = coverBonus ? ` - ${coverBonus}% (half cover)` : ""
    const result = hit ? "Hit!" : "Miss!"
    const logMessage = `${attacker.name} shot ${target.name} → ${attacker.accuracyByRange[range]}% (${range})${coverPenalty} = ${hitChance}% → ${result} [${roll} rolled]`
    return {hit: hit, damage: damage, logMessage: logMessage}
}