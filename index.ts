import { run } from "./jdis";
import type { Position, GameState } from "./jdis";

import * as aloMethods from "./scripts/alo";
import * as moMethods from "./scripts/mo";

const token = "7jwwq3gh";


run(
  () => {
    console.log("New game started!");
  },
  (bot, gameState) => {
    console.clear();
    console.log(gameState.player.hp)
    if(gameState.player.hp > 0)
        bot.print();

 
    return bot.move(aloMethods.default.moveCenter(gameState));
  },
  token
);
