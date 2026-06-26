export const computeReachable = (cells, gridSize, startRow, startCol, budget) => {
    const result = new Map()
        const queue = [{row: startRow, col: startCol, cost: 0}];
        const visited = new Set();

        while(queue.length){
            const { row, col, cost} = queue.shift();
            const key = `${row}, ${col}`;
            if(visited.has(key)) continue;
            visited.add(key);

            const cell = cells[row * gridSize + col];
            if(!cell) continue;
            result.set(cell.id, cost);

            if(cost >= budget) continue;

            for(let dr = -1; dr <= 1; dr++){
                for(let dc = -1; dc <= 1; dc++){
                    if(dr === 0 && dc === 0) continue;
                    const sideA = cells[(row + dr) * gridSize + col]
                    const sideB = cells[row * gridSize + (col + dc)]
                    if(sideA?.cover === 'hard' || sideB?.cover === 'hard') continue;
                    const nRow = row + dr;
                    const nCol = col + dc;
                    if(nRow < 0 || nRow >= gridSize || nCol < 0 || nCol >= gridSize) continue;
                    if(visited.has(`${nRow}, ${nCol}`)) continue;
                    const neighbor = cells[nRow * gridSize + nCol];
                    if(neighbor.cover === 'hard') continue;
                    if(neighbor.unit && !(nRow === startRow && nCol === startCol)) continue;
                    queue.push({row: nRow, col: nCol, cost: cost + 1});
                }
            }
        }
        return result;
}