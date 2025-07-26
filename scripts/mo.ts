import type { CardinalDirection, GameState, Position } from "../jdis/types";

// Store firewall detection state
let firewallDetected = false;
let firewallPattern: "center" | "corner" | "side" | "unknown" = "unknown";
let safeDirection: Position | null = null;

// Priority levels for decision making
const PRIORITY = {
  ESCAPE_FIREWALL: 100,
  ATTACK_ENEMY: 80,
  COLLECT_CHEST: 60,
  NORMAL_MOVEMENT: 40
};

// Find nearby chests within scanning range (increased for better detection)
function findNearbyChests(gameState: GameState, bot: any): Position[] {
  const currentPos = gameState.player.position;
  const chests: Position[] = [];
  
  // Scan for chests in an even larger range for continuous exploration
  const scanRadius = 20; // Increased from 12 to 20 for wider chest detection
  for (let x = currentPos.x - scanRadius; x <= currentPos.x + scanRadius; x++) {
    for (let y = currentPos.y - scanRadius; y <= currentPos.y + scanRadius; y++) {
      try {
        const cell = bot.getGlobalCell({ x, y });
        if (cell === "chest") {
          chests.push({ x, y });
          console.log(`🎁 CHEST DETECTED at (${x}, ${y}) - Distance: ${distance(currentPos, { x, y }).toFixed(2)}`);
        }
      } catch (e) {
        // Out of bounds or can't get cell info
      }
    }
  }
  
  return chests;
}

// Find the closest chest
function findClosestChest(currentPos: Position, chests: Position[]): Position | null {
  if (chests.length === 0) return null;
  
  let closest: Position = chests[0]!;
  let minDistance = distance(currentPos, closest);
  
  for (const chest of chests) {
    const dist = distance(currentPos, chest);
    if (dist < minDistance) {
      minDistance = dist;
      closest = chest;
    }
  }
  
  return closest;
}

// Check if we should prioritize chest collection (now always true - chests have top priority)
function shouldCollectChest(gameState: GameState, bot: any): boolean {
  // Always prioritize chests - as requested by user
  return true;
}

// Use items from inventory strategically
function useInventoryItems(gameState: GameState, bot: any): any | null {
  const inventory = gameState.player.inventory;
  
  for (const item of inventory) {
    console.log(`📦 Inventory item: ${item.name} (type: ${item.type})`);
    
    // Use buff items strategically
    if (item.type === "buff") {
      console.log(`💪 Using buff item: ${item.name}`);
      return bot.useItemBuff(item);
    }
    
    // Use placed items (traps/walls) if enemies are nearby
    if (item.type === "placed" && gameState.enemies.length > 0) {
      const currentPos = gameState.player.position;
      const nearestEnemy = gameState.enemies[0]!;
      
      // Place trap between us and enemy
      const trapPos = {
        x: Math.floor((currentPos.x + nearestEnemy.position.x) / 2),
        y: Math.floor((currentPos.y + nearestEnemy.position.y) / 2)
      };
      
      console.log(`🪤 Placing ${item.object.type}: ${item.name} at (${trapPos.x}, ${trapPos.y})`);
      return bot.useItemPlaced(item, trapPos);
    }
    
    // Use projectiles to attack nearby enemies
    if (item.type === "projectile" && gameState.enemies.length > 0) {
      const currentPos = gameState.player.position;
      const nearestEnemy = gameState.enemies[0]!;
      const direction = getDirectionToTarget(currentPos, nearestEnemy.position);
      
      console.log(`🏹 Firing projectile: ${item.name} ${direction} at enemy`);
      return bot.useItemProjectile(item, direction);
    }
    
    // Use nuke if multiple enemies or in danger
    if (item.type === "nuke" && (gameState.enemies.length >= 2 || gameState.player.hp < 30)) {
      console.log(`💥 Using nuke: ${item.name}!`);
      return bot.useItemNuke(item);
    }
  }
  
  return null;
}

// Find enemies within attack range
function findAttackableEnemies(gameState: GameState): any[] {
  const currentPos = gameState.player.position;
  const attackRange = 2; // Adjust based on game mechanics
  
  return gameState.enemies.filter(enemy => {
    const dist = distance(currentPos, enemy.position);
    return dist <= attackRange;
  });
}

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
        x: Math.floor(currentPos.x - (avgFirewall.x - currentPos.x) * 2),
        y: Math.floor(currentPos.y - (avgFirewall.y - currentPos.y) * 2)
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

// Auto-equip items after collecting from chests
function autoEquipItems(gameState: GameState, bot: any): any | null {
  const inventory = gameState.player.inventory;
  
  for (const item of inventory) {
    console.log(`🎒 Checking inventory item: ${item.name} (type: ${item.type})`);
    
    // Auto-use buff items for permanent benefits (healing, shields, etc.)
    if (item.type === "buff") {
      console.log(`💪 Auto-using buff item: ${item.name}`);
      return bot.useItemBuff(item);
    }
    
    // Keep projectiles, traps, placed items, and nukes for combat situations
    // These should be used strategically, not automatically
  }
  
  return null;
}

// Main decision making function with priorities (CONTINUOUS EXPLORATION)
function makeStrategicDecision(gameState: GameState, bot: any): { position?: Position, phaseDirection?: CardinalDirection, action?: any } {
  const currentPos = gameState.player.position;
  
  console.log(`🤖 Decision making for position (${currentPos.x}, ${currentPos.y})`);
  
  // PRIORITY 1: Check for firewall FIRST - if detected, escape immediately
  const firewallAnalysis = analyzeFirewallPattern(gameState, bot);
  if (firewallAnalysis.pattern !== "no_firewall") {
    if (!firewallDetected) {
      firewallDetected = true;
      console.log("🚨 FIREWALL DETECTED! Stopping exploration and prioritizing escape...");
    }
    
    if (firewallAnalysis.safeDirection) {
      console.log("🏃 ESCAPING FROM FIREWALL");
      const escapeResult = moveTowardsTarget(gameState, firewallAnalysis.safeDirection, bot);
      console.log(`📋 Escape move result:`, escapeResult);
      return escapeResult;
    }
  }
  
  // PRIORITY 2: Check for nearby chests - if found, collect immediately
  const nearbyChests = findNearbyChests(gameState, bot);
  console.log(`🔍 Found ${nearbyChests.length} nearby chests`);
  
  const closestChest = findClosestChest(currentPos, nearbyChests);
  
  if (closestChest) {
    const distToChest = distance(currentPos, closestChest);
    console.log(`📦 Closest chest at (${closestChest.x}, ${closestChest.y}), distance: ${distToChest.toFixed(2)}`);
    
    if (distToChest <= 1) {
      // We're next to the chest, open it immediately
      console.log(`📦 Opening chest at (${closestChest.x}, ${closestChest.y})`);
      return { action: bot.openChest(closestChest) };
    } else {
      // Move towards the chest
      console.log(`🎁 CHEST FOUND: Moving towards chest at (${closestChest.x}, ${closestChest.y}) - Distance: ${distToChest.toFixed(2)}`);
      const moveResult = moveTowardsTarget(gameState, closestChest, bot);
      console.log(`📋 Move result:`, moveResult);
      return moveResult;
    }
  }
  
  // PRIORITY 3: Auto-equip items after collecting chests
  const equipAction = autoEquipItems(gameState, bot);
  if (equipAction) {
    console.log("🎮 Auto-equipping collected items");
    return { action: equipAction };
  }
  
  // PRIORITY 4: Attack enemies if they're very close (only if no firewall)
  const attackableEnemies = findAttackableEnemies(gameState);
  if (attackableEnemies.length > 0) {
    console.log(`⚔️ Attacking nearby enemy while exploring!`);
    const attackResult = moveTowardsTarget(gameState, attackableEnemies[0].position, bot);
    console.log(`📋 Attack move result:`, attackResult);
    return attackResult;
  }
  
  // PRIORITY 5: CONTINUOUS EXPLORATION - always keep moving to find chests
  console.log("🗺️ No chests or firewall detected, continuing exploration...");
  
  // Generate random direction for exploration
  const randomDirection = generateRandomDirection(currentPos, bot, gameState);
  if (randomDirection) {
    console.log(`🚶‍♂️ Exploring: Moving to (${randomDirection.x}, ${randomDirection.y}) to search for chests`);
    const randomResult = moveTowardsTarget(gameState, randomDirection, bot);
    console.log(`📋 Exploration result:`, randomResult);
    return randomResult;
  }
  
  // Fallback: Check for nearby PCB cells
  const nearbyPCB = findNearbyPCBCells(gameState, bot);
  console.log(`🔍 Found ${nearbyPCB.length} nearby PCB cells for movement`);
  if (nearbyPCB.length > 0) {
    const closestPCB = findClosestChest(currentPos, nearbyPCB); // reuse closest finding logic
    console.log(`🎯 Moving to closest PCB at (${closestPCB!.x}, ${closestPCB!.y})`);
    const pcbResult = moveTowardsTarget(gameState, closestPCB!, bot);
    console.log(`📋 PCB move result:`, pcbResult);
    return pcbResult;
  }
  
  // NEVER STOP MOVING! Force movement if all else fails
  console.log("🚀 FORCING CONTINUOUS MOVEMENT - generating aggressive exploration direction");
  const forcedDirection = generateAggressiveExploration(currentPos, bot);
  if (forcedDirection) {
    console.log(`💪 FORCED MOVEMENT: Moving to (${forcedDirection.x}, ${forcedDirection.y})`);
    const forcedResult = moveTowardsTarget(gameState, forcedDirection, bot);
    console.log(`📋 Forced move result:`, forcedResult);
    return forcedResult;
  }
  
  // Ultimate fallback: try phasing in a random direction
  const emergencyDirections: CardinalDirection[] = ["up", "down", "left", "right"];
  const randomPhaseDirection = emergencyDirections[Math.floor(Math.random() * emergencyDirections.length)];
  console.log(`🆘 EMERGENCY PHASE: Phasing ${randomPhaseDirection} to keep moving!`);
  return { phaseDirection: randomPhaseDirection };
}

// Generate a random direction for exploration (more aggressive exploration)
function generateRandomDirection(currentPos: Position, bot: any, gameState: GameState): Position | null {
  const directions: Position[] = [
    { x: currentPos.x + 5, y: currentPos.y },     // Right (farther)
    { x: currentPos.x - 5, y: currentPos.y },     // Left (farther)
    { x: currentPos.x, y: currentPos.y + 5 },     // Up (farther)
    { x: currentPos.x, y: currentPos.y - 5 },     // Down (farther)
    { x: currentPos.x + 4, y: currentPos.y + 4 }, // Up-Right (farther)
    { x: currentPos.x - 4, y: currentPos.y + 4 }, // Up-Left (farther)
    { x: currentPos.x + 4, y: currentPos.y - 4 }, // Down-Right (farther)
    { x: currentPos.x - 4, y: currentPos.y - 4 }, // Down-Left (farther)
    { x: currentPos.x + 3, y: currentPos.y + 1 }, // Mixed directions for more coverage
    { x: currentPos.x - 3, y: currentPos.y + 1 },
    { x: currentPos.x + 1, y: currentPos.y + 3 },
    { x: currentPos.x + 1, y: currentPos.y - 3 }
  ];
  
  // Shuffle directions for randomness
  for (let i = directions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = directions[i]!;
    directions[i] = directions[j]!;
    directions[j] = temp;
  }
  
  // Find the first valid direction - prefer unexplored areas
  for (const direction of directions) {
    try {
      // Always return a direction to keep moving
      console.log(`🎲 Exploration direction chosen: (${direction.x}, ${direction.y})`);
      return direction;
    } catch (e) {
      // Skip invalid directions
    }
  }
  
  // If no direction found, just pick the first one
  return directions[0] || null;
}

// Generate even more aggressive exploration when stuck
function generateAggressiveExploration(currentPos: Position, bot: any): Position | null {
  const aggressiveDirections: Position[] = [
    // Very far movements to break out of stuck situations
    { x: currentPos.x + 10, y: currentPos.y },
    { x: currentPos.x - 10, y: currentPos.y },
    { x: currentPos.x, y: currentPos.y + 10 },
    { x: currentPos.x, y: currentPos.y - 10 },
    { x: currentPos.x + 8, y: currentPos.y + 8 },
    { x: currentPos.x - 8, y: currentPos.y + 8 },
    { x: currentPos.x + 8, y: currentPos.y - 8 },
    { x: currentPos.x - 8, y: currentPos.y - 8 },
    // Random far jumps in all directions
    { x: currentPos.x + 15, y: currentPos.y + 3 },
    { x: currentPos.x - 15, y: currentPos.y + 3 },
    { x: currentPos.x + 3, y: currentPos.y + 15 },
    { x: currentPos.x + 3, y: currentPos.y - 15 },
    // Corner exploration for chests
    { x: 50, y: 50 }, { x: -50, y: 50 }, 
    { x: 50, y: -50 }, { x: -50, y: -50 },
    // Central area exploration
    { x: 0, y: 0 }, { x: 25, y: 0 }, { x: -25, y: 0 },
    { x: 0, y: 25 }, { x: 0, y: -25 }
  ];
  
  // Randomize to prevent predictable patterns
  for (let i = aggressiveDirections.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = aggressiveDirections[i]!;
    aggressiveDirections[i] = aggressiveDirections[j]!;
    aggressiveDirections[j] = temp;
  }
  
  // Always return a direction - aggressive exploration never fails
  console.log(`🚀 AGGRESSIVE EXPLORATION: Heading to (${aggressiveDirections[0]!.x}, ${aggressiveDirections[0]!.y})`);
  return aggressiveDirections[0] || { x: currentPos.x + 7, y: currentPos.y + 7 };
}

// Move towards target with obstacle detection and phasing
function moveTowardsTarget(gameState: GameState, target: Position, bot: any): { position?: Position, phaseDirection?: CardinalDirection } {
  const currentPos = {
    x: Math.floor(gameState.player.position.x),
    y: Math.floor(gameState.player.position.y)
  };
  
  const targetPos = {
    x: Math.floor(target.x),
    y: Math.floor(target.y)
  };
  
  // Calculate next step towards target
  const dx = targetPos.x - currentPos.x;
  const dy = targetPos.y - currentPos.y;
  
  // Try direct movement first
  const stepX = dx === 0 ? 0 : dx > 0 ? 1 : -1;
  const stepY = dy === 0 ? 0 : dy > 0 ? 1 : -1;
  
  const directPosition = {
    x: Math.floor(currentPos.x + stepX),
    y: Math.floor(currentPos.y + stepY)
  };
  
  console.log(`🎯 Target: (${targetPos.x}, ${targetPos.y}), Current: (${currentPos.x}, ${currentPos.y}), Direct next: (${directPosition.x}, ${directPosition.y})`);
  
  // Check what's at the direct position
  try {
    const directCell = bot.getGlobalCell(directPosition);
    console.log(`🔍 Direct cell type: ${directCell}`);
    
    if (!hasObstacle(directPosition, bot)) {
      console.log(`✅ Direct path clear, moving to (${directPosition.x}, ${directPosition.y})`);
      return { position: directPosition };
    }
  } catch (e) {
    console.log(`⚠️ Cannot check direct cell type`);
  }
  
  // Direct path blocked, try alternative directions
  const alternatives = [
    { x: Math.floor(currentPos.x + stepX), y: Math.floor(currentPos.y) }, // Try X-only movement
    { x: Math.floor(currentPos.x), y: Math.floor(currentPos.y + stepY) }, // Try Y-only movement
  ];
  
  for (const altPos of alternatives) {
    try {
      const altCell = bot.getGlobalCell(altPos);
      console.log(`� Alternative (${altPos.x}, ${altPos.y}) cell type: ${altCell}`);
      
      if (!hasObstacle(altPos, bot)) {
        console.log(`✅ Alternative path found, moving to (${altPos.x}, ${altPos.y})`);
        return { position: altPos };
      }
    } catch (e) {
      console.log(`⚠️ Cannot check alternative position (${altPos.x}, ${altPos.y})`);
    }
  }
  
  // All paths blocked, try phasing
  const direction = getDirectionToTarget(currentPos, targetPos);
  console.log(`🚧 All paths blocked! Phasing ${direction}`);
  return { phaseDirection: direction };
}

function distance(pos1: Position, pos2: Position): number {
  return Math.sqrt((pos1.x - pos2.x) ** 2 + (pos1.y - pos2.y) ** 2);
}

// Find nearby PCB cells that are walkable (expanded search)
function findNearbyPCBCells(gameState: GameState, bot: any): Position[] {
  const currentPos = gameState.player.position;
  const pcbCells: Position[] = [];
  
  // Scan for PCB cells in a larger area to ensure movement options
  const scanRadius = 8; // Increased from 3 to 8 for more movement options
  for (let x = currentPos.x - scanRadius; x <= currentPos.x + scanRadius; x++) {
    for (let y = currentPos.y - scanRadius; y <= currentPos.y + scanRadius; y++) {
      // Skip current position
      if (x === currentPos.x && y === currentPos.y) continue;
      
      try {
        const cell = bot.getGlobalCell({ x, y });
        if (cell === "pcb") {
          pcbCells.push({ x, y });
        }
      } catch (e) {
        // Out of bounds or can't get cell info
      }
    }
  }
  
  console.log(`🔍 Scanned area ${scanRadius}x${scanRadius} around (${currentPos.x}, ${currentPos.y}) - Found ${pcbCells.length} PCB cells`);
  return pcbCells;
}

// Check if there's an obstacle at the target position
function hasObstacle(position: Position, bot: any): boolean {
  try {
    const cell = bot.getGlobalCell(position);
    // PCB and CHEST are walkable, everything else is obstacle
    if (cell === "pcb" || cell === "chest") {
      if (cell === "chest") {
        console.log(`🎁 CHEST at (${position.x}, ${position.y}) - moving to collect!`);
      }
      return false; // Not an obstacle
    }
    return true; // Everything else is an obstacle
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
  findBestMove(gameState: GameState, bot: any): { position?: Position, phaseDirection?: CardinalDirection, action?: any } {
    return makeStrategicDecision(gameState, bot);
  },
  
  logGameInfo(gameState: GameState, currentPos: Position, bot: any) {
    console.log(`Current position: (${currentPos.x}, ${currentPos.y})`);
    console.log(`HP: ${gameState.player.hp}, Shield: ${gameState.player.shield}`);
    console.log(`Firewall detected: ${firewallDetected}, Pattern: ${firewallPattern}`);
    
    if (safeDirection) {
      console.log(`Safe direction: (${safeDirection.x}, ${safeDirection.y})`);
      console.log(`Distance to safety: ${distance(currentPos, safeDirection).toFixed(2)}`);
    }
    
    // Log inventory
    if (gameState.player.inventory.length > 0) {
      console.log(`Inventory (${gameState.player.inventory.length} items):`);
      gameState.player.inventory.forEach((item, i) => {
        console.log(`  ${i}: ${item.name} (type: ${item.type})`);
      });
    }
    
    // Log nearby enemies
    if (gameState.enemies.length > 0) {
      console.log(`Enemies nearby: ${gameState.enemies.length}`);
      gameState.enemies.forEach((enemy, i) => {
        const dist = distance(currentPos, enemy.position);
        console.log(`  Enemy ${i}: ${enemy.name} at (${enemy.position.x}, ${enemy.position.y}) - Distance: ${dist.toFixed(2)}`);
      });
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
