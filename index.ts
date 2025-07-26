import { run } from "./jdis";

const token = "7jwwq3gh";

run(
    () => {
        console.log("New game started!");
    },
    (bot, gameState) => {
        console.clear();
        bot.print();

        console.log(gameState)
        // Ajoutez votre code ici!

        return bot.doNothing();
    },
    token,
);
