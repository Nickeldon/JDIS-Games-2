import { run } from "./jdis";
import type { Position, GameState } from "./jdis";

import * as aloMethods from "./scripts/alo";
import * as moMethods from "./scripts/mo";

const token = "7jwwq3gh";

const mo = moMethods.default

run(
  () => {
    console.log("New game started!");
  },
  (bot, gameState) => {
    console.clear();
    console.log(gameState.player.hp)
    if(gameState.player.hp > 0)
        bot.print();

    // mo.game(gameState)

    
    // Find the best move towards center while avoiding enemies and walls
    const nextPosition = mo.findBestMove(gameState, bot);
    console.log(nextPosition)
    // const currentPos = gameState.player.position;
    
    // Log game information for debugging
    // mo.logGameInfo(gameState, currentPos, nextPosition, bot);

    return bot.move(nextPosition);
  },
  token
);
