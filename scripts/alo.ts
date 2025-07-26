import type { GameState, Position } from "../jdis/types";

function findPathToCenter(gameState: GameState): Position {
    const center = { x: Math.floor(gameState.ground.width / 2), y: -Math.floor(gameState.ground.height / 2) };
    const initialPosition = gameState.player.position;
    const slope = (center.y - initialPosition.y) / (center.x - initialPosition.x);
    return { x: initialPosition.x * slope, y: initialPosition.y * slope };
}

function findPathToCorner(initial: Position, target: Position): { x: number; y: number } {
    const dx = target.x - initial.x;
    const dy = target.y - initial.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) {
        return { x: 0, y: 0 };
    } else {
        return {
            x: initial.x + (dx / length),
            y: initial.y + (dy / length)
        }
    }
}

const aloFuncs = {

    moveCenter(gameState: GameState): { x: number; y: number } {
        return findPathToCenter(gameState);
    },
    moveToCorner(gameState: GameState): Position {
        const initial = gameState.player.position;
        const leftUpCorner = { x: 0, y: 0 };
        const rightUpCorner = { x: gameState.ground.width, y: 0 };
        const leftDownCorner = { x: 0, y: gameState.ground.height };
        const rightDownCorner = { x: gameState.ground.width, y: gameState.ground.height };
        const center = { x: Math.floor(gameState.ground.width / 2), y: Math.floor(gameState.ground.height / 2) };

        // Check which quadrant the player is in
        if (initial.x < center.x && initial.y < center.y) {
            // Top-left quadrant
            return findPathToCorner(initial, leftUpCorner);
        }
        else if (initial.x >= center.x && initial.y < center.y) {
            // Top-right quadrant
            return findPathToCorner(initial, rightUpCorner);
        }
        else if (initial.x < center.x && initial.y >= center.y) {
            // Bottom-left quadrant
            return findPathToCorner(initial, leftDownCorner);
        }
        else {
            // Bottom-right quadrant
            return findPathToCorner(initial, rightDownCorner);
        }

    }
}

export default aloFuncs




