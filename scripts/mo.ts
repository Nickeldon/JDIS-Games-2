import type { CardinalDirection, GameState, Position } from "../jdis/types";

// Store firewall detection state
let firewallDetected = false;
let firewallPattern: "center" | "corner" | "side" | "unknown" = "unknown";
let safeDirection: Position | null = null;

// Analyze firewall pattern and determine escape strategy
function analyzeFirewallPattern(gameState: GameState, bot: any): { pattern: string, safeDirection: Position | null } {
  const currentPos = gameState.player.position;
  const firewallPositions: Position[] = [];
  
  // Scan for firewall positions in a larger area
  const scanRadius = 15;
  for (let x = currentPos.x - scanRadius; x <= currentPos.x + scanRadius; x++) {
    for (let y = currentPos.y - scanRadius; y <= currentPos.y + scanRadius; y++) {
      try {
        const cell = bot.getGlobalCell({ x, y });
        if (cell === "firewall") {
          firewallPositions.push({ x, y });
        }
      } catch (e) {
        // Out of bounds or can't get cell info
      }
    }
  }
  
  if (firewallPositions.length === 0) {
    return { pattern: "no_firewall", safeDirection: null };
  }
  
  console.log(`🔥 Detected ${firewallPositions.length} firewall cells`);
  
  // Analyze firewall distribution
  const center = { x: 0, y: 0 };
  const avgFirewall = {
    x: firewallPositions.reduce((sum, pos) => sum + pos.x, 0) / firewallPositions.length,
    y: firewallPositions.reduce((sum, pos) => sum + pos.y, 0) / firewallPositions.length
  };
  
  console.log(`📊 Firewall center: (${avgFirewall.x.toFixed(1)}, ${avgFirewall.y.toFixed(1)})`);
  
  // Determine pattern based on firewall distribution
  const distanceFromCenter = distance(avgFirewall, center);
  
  if (distanceFromCenter < 5) {
    // Firewall is growing from center - go to corners
    firewallPattern = "center";
    const corners = [
      { x: 50, y: 50 }, { x: -50, y: 50 }, 
      { x: 50, y: -50 }, { x: -50, y: -50 }
    ];
    safeDirection = findClosestPosition(currentPos, corners);
    console.log("🎯 Pattern: CENTER EXPANSION - Escaping to corners");
    
  } else {
    // Check if firewall is concentrated in one area (corner/side pattern)
    const firewallSpread = calculateSpread(firewallPositions);
    
    if (firewallSpread < 10) {
      // Concentrated firewall - go to opposite side
      firewallPattern = "corner";
      const oppositeDirection = {
        x: currentPos.x - (avgFirewall.x - currentPos.x) * 2,
        y: currentPos.y - (avgFirewall.y - currentPos.y) * 2
      };
      safeDirection = oppositeDirection;
      console.log("🎯 Pattern: CORNER/SIDE COLLAPSE - Escaping to opposite side");
      
    } else {
      // Widespread firewall from all sides - go to center
      firewallPattern = "side";
      safeDirection = center;
      console.log("🎯 Pattern: ALL SIDES CLOSING - Escaping to center");
    }
  }
  
  return { pattern: firewallPattern, safeDirection };
}

// Calculate how spread out the firewall positions are
function calculateSpread(positions: Position[]): number {
  if (positions.length < 2) return 0;
  
  const center = {
    x: positions.reduce((sum, pos) => sum + pos.x, 0) / positions.length,
    y: positions.reduce((sum, pos) => sum + pos.y, 0) / positions.length
  };
  
  const avgDistance = positions.reduce((sum, pos) => sum + distance(pos, center), 0) / positions.length;
  return avgDistance;
}

// Find closest position from a list of options
function findClosestPosition(currentPos: Position, positions: Position[]): Position {
  let closest = positions[0]!;
  let minDistance = distance(currentPos, closest);
  
  for (const pos of positions) {
    const dist = distance(currentPos, pos);
    if (dist < minDistance) {
      minDistance = dist;
      closest = pos;
    }
  }
  
  return closest;
}

// Wait for firewall detection before making strategic moves
function waitForFirewallDetection(gameState: GameState, bot: any): { position?: Position, phaseDirection?: CardinalDirection } {
  const analysis = analyzeFirewallPattern(gameState, bot);
  
  if (analysis.pattern === "no_firewall") {
    console.log("⏳ Waiting for firewall to appear...");
    // Stay put or move slightly to scan more area
    return { position: gameState.player.position };
  }
  
  if (!firewallDetected) {
    firewallDetected = true;
    console.log("🚨 FIREWALL DETECTED! Analyzing pattern...");
  }
  
  if (!analysis.safeDirection) {
    console.log("❓ Cannot determine safe direction, staying put");
    return { position: gameState.player.position };
  }
  
  // Move towards the safe direction
  return moveTowardsTarget(gameState, analysis.safeDirection, bot);
}

// Move towards target with obstacle detection and phasing
function moveTowardsTarget(gameState: GameState, target: Position, bot: any): { position?: Position, phaseDirection?: CardinalDirection } {
  const currentPos = gameState.player.position;
  
  // Calculate next step towards target
  const dx = target.x - currentPos.x;
  const dy = target.y - currentPos.y;
  
  // Normalize to single step
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
  
  const nextPosition = {
    x: currentPos.x + stepX,
    y: currentPos.y + stepY
  };
  
  console.log(`🎯 Target: (${target.x}, ${target.y}), Next step: (${nextPosition.x}, ${nextPosition.y})`);
  
  // Check if next position has obstacle
  if (hasObstacle(nextPosition, bot)) {
    const direction = getDirectionToTarget(currentPos, target);
    console.log(`🚧 Obstacle detected! Phasing ${direction}`);
    return { phaseDirection: direction };
  }
  
  console.log(`✅ Path clear, moving to (${nextPosition.x}, ${nextPosition.y})`);
  return { position: nextPosition };
}

function distance(pos1: Position, pos2: Position): number {
  return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
}

// Check if there's an obstacle at the target position
function hasObstacle(position: Position, bot: any): boolean {
  try {
    const cell = bot.getGlobalCell(position);
    // Only PCB is walkable, everything else is obstacle
    if (cell !== "pcb") {
      if (cell === "chest") {
        console.log(`🎁 CHEST at (${position.x}, ${position.y}) blocking path!`);
      }
      return true;
    }
    return false;
  } catch (e) {
    return true; // Assume obstacle if can't get cell info
  }
}

// Get the cardinal direction towards target
function getDirectionToTarget(currentPos: Position, targetPos: Position): CardinalDirection {
  const dx = targetPos.x - currentPos.x;
  const dy = targetPos.y - currentPos.y;
  
  // Choose the direction with larger absolute difference
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  } else {
    return dy > 0 ? "up" : "down";
  }
}

const moFuncs = {
  findBestMove(gameState: GameState, bot: any): { position?: Position, phaseDirection?: CardinalDirection } {
    return waitForFirewallDetection(gameState, bot);
  },
  
  logGameInfo(gameState: GameState, currentPos: Position, bot: any) {
    console.log(`Current position: (${currentPos.x}, ${currentPos.y})`);
    console.log(`Firewall detected: ${firewallDetected}, Pattern: ${firewallPattern}`);
    
    if (safeDirection) {
      console.log(`Safe direction: (${safeDirection.x}, ${safeDirection.y})`);
      console.log(`Distance to safety: ${distance(currentPos, safeDirection).toFixed(2)}`);
    }
    
    // Check current cell type
    try {
      const currentCell = bot.getGlobalCell(currentPos);
      console.log(`Current cell: ${currentCell}`);
    } catch (e) {
      console.log("Cannot determine current cell type");
    }
  },
  
  // Reset detection state (useful for new games)
  resetDetection() {
    firewallDetected = false;
    firewallPattern = "unknown";
    safeDirection = null;
    console.log("🔄 Detection state reset");
  }
};

export default moFuncs;
