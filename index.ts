import { run } from "./jdis"; 

import * as aloMethods from "./scripts/alo"
import * as moMethods from "./scripts/mo"

const token = "7jwwq3gh";

run(
    () => {
        console.log("New game started!");
    },
    (bot, gameState) => {
        console.clear();
        bot.print();

        console.log(gameState)

        return bot.move({x: 0, y:0});
    },
    token,
);
