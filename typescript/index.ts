import { run } from "./jdis";

const token = "YOUR_TOKEN_HERE";

run(
    () => {
        console.log("New game started!");
    },
    (bot, gameState) => {
        console.clear();
        bot.print();

        // Ajoutez votre code ici!

        return bot.doNothing();
    },
    token,
);
