export * from "./types";

import colors from "yoctocolors";
import { createBot } from "./bot";
import type { Action, GameState, Message, TeamToken } from "./types";

type GameStartFn = () => void;
type TickFn = (bot: ReturnType<typeof createBot>, gameState: GameState) => Action;

export function run(gameStart: GameStartFn, tick: TickFn, token: TeamToken) {
    console.clear();
    console.log(colors.bold(colors.yellow(" 🔥  FireWall  🔥")));
    console.log(`~ ${colors.red("JDIS Games 2025")} ~`);
    console.log();

    if (globalThis._jdis_internal && globalThis._jdis_internal.token === token) {
        console.log(colors.dim("Reusing existing WebSocket connection..."));
        console.log();

        globalThis._jdis_internal.gameStart = gameStart;
        globalThis._jdis_internal.tick = tick;
        return;
    }

    if (globalThis._jdis_internal) {
        globalThis._jdis_internal.ws.close();
    }

    const ws = new WebSocket(process.env.SERVER_URL || "ws://127.0.0.1:32945");
    globalThis._jdis_internal = {
        ws,
        token,
        gameStart,
        tick,
    };

    ws.addEventListener("open", () => {
        console.log(colors.dim("WebSocket connection opened!"));
        if (!globalThis._jdis_internal) {
            throw new Error("Missing internal JDIS state. Please restart.");
        }

        sendJson({
            type: "link",
            clientType: "agent",
            teamId: globalThis._jdis_internal.token,
        });
    });

    ws.addEventListener("close", () => {
        console.error("⚠️ WebSocket connection closed.");
    });

    ws.addEventListener("error", (error) => {
        console.error("⚠️ WebSocket error:", error);
    });

    ws.addEventListener("message", (event) => {
        if (!globalThis._jdis_internal) {
            throw new Error("Missing internal JDIS state. Please restart.");
        }

        try {
            const data = JSON.parse(event.data);

            switch (data.type) {
                case "gameStart": {
                    globalThis._jdis_internal.gameStart();
                    break;
                }
                case "tickInfo": {
                    const gameState = data.state as GameState;
                    const bot = createBot(gameState);

                    const action = globalThis._jdis_internal.tick(bot, gameState);
                    sendJson({ type: "action", action });
                    break;
                }
                case "tickInfoDead": {
                    console.clear();
                    console.log("You are dead...");
                    break;
                }
                case "info": {
                    sendJson({
                        type: "confirm",
                        teamToken: globalThis._jdis_internal.token,
                    });
                    break;
                }
                case "linkFailed": {
                    console.error("Invalid token!");
                    break;
                }
                default:
                    console.log("Received unknown message:", data);
            }
        } catch (error) {
            console.error("An error occurred:", error);
        }
    });
}

function sendJson(data: Message) {
    globalThis._jdis_internal?.ws.send(JSON.stringify(data));
}

declare global {
    var _jdis_internal:
        | {
              ws: WebSocket;
              token: TeamToken;
              gameStart: GameStartFn;
              tick: TickFn;
          }
        | undefined;
}
