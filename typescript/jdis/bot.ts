import colors from "yoctocolors";

import type {
    CardinalDirection,
    Cell,
    Direction,
    GameState,
    InventoryItem,
    MoveAction,
    OpenChestAction,
    PhaseAction,
    Position,
    SegFaultAction,
    SkipAction,
    UseItemAction,
} from "./types";

/**
 * Fonction principale qui crée un "bot" basé sur l'état actuel du jeu
 */
export function createBot(gameState: GameState) {
    return {
        /**
         * Déplacement absolu du joueur vers une position précise.
         */
        move(position: Position): MoveAction {
            return {
                action: "move",
                position,
            };
        },

        /**
         * Action pour traverser un/des murs dans une direction cardinale
         */
        phase(direction: CardinalDirection): PhaseAction {
            return {
                action: "phase",
                direction,
            };
        },

        /**
         * Action pour ouvrir un coffre à une position donnée
         */
        openChest(position: Position): OpenChestAction {
            return {
                action: "openChest",
                position,
            };
        },

        /**
         * Action pour utiliser un buff.
         */
        useItemBuff(item: Extract<InventoryItem, { type: "buff" }>): UseItemAction {
            return {
                action: "useItem",
                name: item.name,
                data: { type: "buff" },
            };
        },

        /**
         * Action pour utiliser un projectile.
         */
        useItemProjectile(item: Extract<InventoryItem, { type: "projectile" }>, direction: Direction): UseItemAction {
            return {
                action: "useItem",
                name: item.name,
                data: { type: "projectile", direction },
            };
        },

        /**
         * Action pour utiliser un objet à placer.
         */
        useItemPlaced(
            item: Extract<InventoryItem, { type: "placed" }>,
            position: Position,
            verticalRectangle?: boolean,
        ): UseItemAction {
            return {
                action: "useItem",
                name: item.name,
                data: { type: "placed", position, placeRectangleVertical: verticalRectangle ?? false },
            };
        },

        /**
         * Action pour utiliser une nuke.
         */
        useItemNuke(item: Extract<InventoryItem, { type: "nuke" }>): UseItemAction {
            return {
                action: "useItem",
                name: item.name,
                data: { type: "nuke" },
            };
        },

        /**
         * Action pour abandonner la partie en cours.
         */
        segFault(): SegFaultAction {
            return { action: "segFault" };
        },

        /**
         * Action pour ne rien faire pendant un tour.
         */
        doNothing(): SkipAction {
            return { action: "skip" };
        },

        /**
         * Retourne le type de cellule à une position relative par rapport au joueur.
         * La position doit être dans le champ de vision 7x7 centré autour du joueur.
         */
        getCell(position: Position): Cell {
            const x = position.x - gameState.ground.offset.x;
            const y = position.y - gameState.ground.offset.y;

            return gameState.ground.data[y * gameState.ground.width + x] ?? "groundPlane";
        },

        /**
         * Retourne le type de cellule à une position absolue dans la map (convertie en position relative)
         */
        getGlobalCell(position: Position): Cell {
            return (
                gameState.ground.data[
                    (position.y - gameState.player.position.y) * gameState.ground.width +
                        (position.x - gameState.player.position.x)
                ] ?? "groundPlane"
            );
        },

        /**
         * Affiche des informations dans la console : position, stats et la carte
         */
        print() {
            console.log(
                `${colors.dim("Vie")}: ${gameState.player.hp} ${gameState.player.shield > 0 ? `(+${gameState.player.shield})` : ""}`,
            );
            console.log(`${colors.dim("Score")}: ${gameState.player.score}`);
            console.log(`${colors.dim("Position")}: (${gameState.player.position.x}, ${gameState.player.position.y})`);
            console.log(`${colors.dim("Carte")}:`);

            // Coordonnées du joueur sur la mini-carte affichée
            const player = {
                x: Math.floor(gameState.ground.width / 2),
                y: Math.floor(gameState.ground.height / 2),
            };

            // Parcours des lignes de la carte
            for (const y of Array.from({ length: gameState.ground.height }, (_, i) => i)) {
                const row = gameState.ground.data.slice(y * gameState.ground.width, (y + 1) * gameState.ground.width);

                // Affichage de chaque cellule de la ligne
                console.log(
                    ...row.map((cell, x) => {
                        // Affiche un "◉" pour la position du joueur
                        if (x === player.x && y === player.y) {
                            if (cell === "firewall") {
                                return colors.black(colors.bgRed("◉"));
                            }
                            return colors.blueBright("◉");
                        }

                        const ennemy = gameState.enemies.find((e) => e.position.x === x && e.position.y === y);
                        if (ennemy) {
                            if (cell === "firewall") {
                                return colors.gray(colors.bgRed("◉"));
                            }
                            return colors.red("◉");
                        }

                        const trap = gameState.objects.find(
                            (o) => o.type === "trap" && o.position.x === x && o.position.y === y,
                        );
                        if (trap) {
                            if (cell === "firewall") {
                                return colors.green(colors.bgRed("⚠"));
                            }
                            return colors.green("⚠");
                        }

                        // Représentation visuelle par type de cellule
                        switch (cell) {
                            case "groundPlane":
                                return colors.dim("░");
                            case "pcb":
                                return colors.green("░");
                            case "firewall":
                                return colors.red("█");
                            case "via":
                                return colors.black("█");
                            case "chest":
                                return colors.yellow(colors.bgBlack("▩"));
                            case "resistance":
                                return colors.yellow("█");
                        }
                    }),
                );
            }
        },
    };
}
