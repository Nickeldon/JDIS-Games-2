import type { GameState, Position } from "../jdis"

// Helper function to calculate distance between two positions
function distance(pos1: Position, pos2: Position): number {
  return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
}

// Helper function to calculate Manhattan distance (for A* heuristic)
function manhattanDistance(pos1: Position, pos2: Position): number {
  return Math.abs(pos1.x - pos2.x) + Math.abs(pos1.y - pos2.y);
}

// Helper function to check if a position is safe and walkable
function isSafePosition(position: Position, gameState: GameState, bot: any): boolean {
  // Check if it's a walkable cell - only PCB planes are walkable
  try {
    const cell = bot.getGlobalCell(position);
    // Only PCB planes are walkable, everything else is an obstacle
    if (cell !== "pcb") {
      return false;
    }
  } catch (e) {
    // If we can't get the cell info, assume it's unsafe (out of bounds)
    return false;
  }

  // Check if there are enemies too close
  const minEnemyDistance = 2.5;
  for (const enemy of gameState.enemies) {
    if (distance(position, enemy.position) < minEnemyDistance) {
      return false;
    }
  }

  // Check if there are projectiles that could hit us
  for (const projectile of gameState.projectiles) {
    const projectileDistance = distance(position, projectile.position);
    // Consider projectile speed and direction for better prediction
    if (projectileDistance < 3) {
      return false;
    }
  }

  return true;
}

// A* pathfinding algorithm to find optimal path to center
function findPathToCenter(gameState: GameState, bot: any): Position {
  const start = gameState.player.position;
  const goal = { x: 0, y: 0 }; // Assuming center is at (0,0)
  
  // If we're already very close to center, just fine-tune position
  if (distance(start, goal) < 2) {
    return findSafestNearbyPosition(gameState, bot);
  }

  // Simple pathfinding: find the best immediate move towards center
  const possibleMoves: Position[] = [
    { x: start.x + 1, y: start.y },     // right
    { x: start.x - 1, y: start.y },     // left
    { x: start.x, y: start.y + 1 },     // up
    { x: start.x, y: start.y - 1 },     // down
    { x: start.x + 1, y: start.y + 1 }, // up-right
    { x: start.x - 1, y: start.y + 1 }, // up-left
    { x: start.x + 1, y: start.y - 1 }, // down-right
    { x: start.x - 1, y: start.y - 1 }, // down-left
  ];

  let bestMove = start;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const move of possibleMoves) {
    if (isSafePosition(move, gameState, bot)) {
      // Score based on distance to center, with safety bonus
      const distanceToCenter = distance(move, goal);
      let score = distanceToCenter;
      
      // Add penalty for being too close to enemies
      for (const enemy of gameState.enemies) {
        const enemyDist = distance(move, enemy.position);
        if (enemyDist < 4) {
          score += (4 - enemyDist) * 2; // Penalty increases as we get closer to enemies
        }
      }

      if (score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
  }

  // If no safe move found, find the safest position nearby
  if (bestMove.x === start.x && bestMove.y === start.y) {
    return findSafestNearbyPosition(gameState, bot);
  }

  return bestMove;
}

// Find the safest position nearby when no good path to center exists
function findSafestNearbyPosition(gameState: GameState, bot: any): Position {
  const currentPos = gameState.player.position;
  
  const possibleMoves: Position[] = [
    { x: currentPos.x + 1, y: currentPos.y },
    { x: currentPos.x - 1, y: currentPos.y },
    { x: currentPos.x, y: currentPos.y + 1 },
    { x: currentPos.x, y: currentPos.y - 1 },
    { x: currentPos.x + 1, y: currentPos.y + 1 },
    { x: currentPos.x - 1, y: currentPos.y + 1 },
    { x: currentPos.x + 1, y: currentPos.y - 1 },
    { x: currentPos.x - 1, y: currentPos.y - 1 },
    { x: currentPos.x, y: currentPos.y } // Stay in place as last resort
  ];

  let safestMove = currentPos;
  let bestSafetyScore = -1;

  for (const move of possibleMoves) {
    let safetyScore = 0;
    
    // Check if position is walkable (only PCB planes are walkable)
    try {
      const cell = bot.getGlobalCell(move);
      if (cell !== "pcb") {
        continue; // Skip this move if it's not a PCB plane
      }
    } catch (e) {
      continue; // Skip if we can't get cell info (out of bounds)
    }

    // Calculate safety based on distance from enemies and projectiles
    let minEnemyDistance = Number.POSITIVE_INFINITY;
    for (const enemy of gameState.enemies) {
      const dist = distance(move, enemy.position);
      minEnemyDistance = Math.min(minEnemyDistance, dist);
    }
    
    let minProjectileDistance = Number.POSITIVE_INFINITY;
    for (const projectile of gameState.projectiles) {
      const dist = distance(move, projectile.position);
      minProjectileDistance = Math.min(minProjectileDistance, dist);
    }

    // Higher score for being farther from enemies and projectiles
    safetyScore = Math.min(minEnemyDistance, 10) + Math.min(minProjectileDistance, 5);

    if (safetyScore > bestSafetyScore) {
      bestSafetyScore = safetyScore;
      safestMove = move;
    }
  }

  return safestMove;
}

const moFuncs = {
    func1: function () {

    },

    game(gameState: GameState) {
        console.log(gameState)
    },

    // Main pathfinding function that returns the best move towards center
    findBestMove(gameState: GameState, bot: any): Position {
        return findPathToCenter(gameState, bot);
    },

    // Debug function to log game state information
    logGameInfo(gameState: GameState, currentPos: Position, nextPosition: Position, bot: any) {
        const center = { x: 0, y: 0 };
        
        // Log current cell type for debugging
        try {
            const currentCell = bot.getGlobalCell(currentPos);
            console.log(`Current cell type: ${currentCell}`);
        } catch (e) {
            console.log("Cannot determine current cell type");
        }
        
        console.log(`Current position: (${currentPos.x}, ${currentPos.y})`);
        console.log(`Distance to center: ${distance(currentPos, center).toFixed(2)}`);
        console.log(`Moving to: (${nextPosition.x}, ${nextPosition.y})`);
        
        // Log target cell type
        try {
            const targetCell = bot.getGlobalCell(nextPosition);
            console.log(`Target cell type: ${targetCell}`);
        } catch (e) {
            console.log("Cannot determine target cell type");
        }
        
        console.log(`Enemies nearby: ${gameState.enemies.length}`);
        console.log(`Projectiles nearby: ${gameState.projectiles.length}`);
        
        // Log enemy positions for debugging
        if (gameState.enemies.length > 0) {
            console.log("Enemy positions:");
            gameState.enemies.forEach((enemy, i) => {
                console.log(`  Enemy ${i}: (${enemy.position.x}, ${enemy.position.y}) - Distance: ${distance(currentPos, enemy.position).toFixed(2)}`);
            });
        }
    },

    // Utility functions
    distance,
    manhattanDistance,
    isSafePosition
}

export default moFuncs