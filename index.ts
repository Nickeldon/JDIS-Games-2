import { run } from "./jdis";
import type { Position, GameState } from "./jdis";

import * as aloMethods from "./scripts/alo";
import * as moMethods from "./scripts/mo";

const token = "7jwwq3gh";

const mo = moMethods.default;

run(
  () => {
    console.log("New game started!");
    // Reset firewall detection for new game
    mo.resetDetection();
  },
  (bot, gameState) => {
    console.clear();
    console.log(`HP: ${gameState.player.hp}`);
    
    if(gameState.player.hp > 0) {
        bot.print();
    }

    // Get the best move from mo.ts
    const moveResult = mo.findBestMove(gameState, bot);
    
    // Log game info
    mo.logGameInfo(gameState, gameState.player.position, bot);
    
    // Check if we need to phase or move
    if (moveResult.phaseDirection) {
        console.log(`🌊 Phasing ${moveResult.phaseDirection} to bypass obstacle`);
        return bot.phase(moveResult.phaseDirection);
    } else if (moveResult.position) {
        console.log(`🚶 Moving to (${moveResult.position.x}, ${moveResult.position.y})`);
        return bot.move(moveResult.position);
    } else {
        console.log("⚠️ No valid move found, staying in place");
        return bot.doNothing();
    }
  },
  token
);
