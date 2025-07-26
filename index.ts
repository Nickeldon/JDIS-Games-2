import { run } from "./jdis"; 

const token = "7jwwq3gh";

run(
    () => {
        console.log("New game started!");
    },
    (bot, gameState) => {
        console.clear();
        bot.print();

        gameState.player.name = "hehehe"
        // Ajoutez votre code ici!
        
        console.log(gameState)

        return bot.doNothing();
    },
    token,
);
