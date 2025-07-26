import type { GameState, Position } from "../jdis/types";

function findPathToCenter(gameState: GameState): Position {
    const center = { x: Math.floor(gameState.ground.width / 2), y: -Math.floor(gameState.ground.height / 2) };
    const initialPosition = gameState.player.position;
    const slope = (center.y - initialPosition.y) / (center.x - initialPosition.x);
    return { x: initialPosition.x * slope, y: initialPosition.y * slope };
}

function verifyPositionIntegrity(gameState: GameState){
    const 

}

const aloFuncs = {

    moveCenter(gameState: GameState): { x: number; y: number } {
        return findPathToCenter(gameState);
    },
}

export default aloFuncs




