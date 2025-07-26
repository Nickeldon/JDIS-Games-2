import type { GameState } from "../jdis/types";

const aloFuncs = {
    moveToCenter: function (bot: ReturnType<typeof import("../jdis/bot").createBot>, gameState: GameState) {
        // Calculate the center of the visible ground
        const centerX = Math.floor(gameState.ground.width / 2) + gameState.ground.offset.x;
        const centerY = Math.floor(gameState.ground.height / 2) + gameState.ground.offset.y;

        // Move towards the center
        return bot.move({ x: centerX, y: centerY });
    }
};

export default aloFuncs