import type { BuffEffect, InventoryItem } from "./inventory";

export * from "./actions";
export * from "./inventory";
export * from "./messages";

export type TeamToken = string;

/**
 * Une position sur la carte.
 */
export type Position = {
    x: number;
    y: number;
};

export type CardinalDirection = "up" | "down" | "left" | "right";
export type Direction = "up" | "down" | "left" | "right" | "upLeft" | "upRight" | "downLeft" | "downRight";

export type Cell = "groundPlane" | "firewall" | "via" | "chest" | "resistance" | "pcb";
export type Object =
    | { type: "resistance"; position: Position; hp: number }
    | { type: "chest"; position: Position }
    | { type: "trap"; position: Position; owner: string; name: string; damage: number };

export type Projectile = {
    /**
     * Nom de l'item.
     */
    name: string;

    /**
     * Position du projectile.
     */
    position: Position;

    /**
     * Direction du mouvement.
     */
    direction: Direction;

    /**
     * Ticks restants avant que le projectile disparaise.
     */
    remainingTicks: number;

    /**
     * La distance parcourue par le projectile chaque tick.
     */
    speed: number;

    /**
     * Le nombre de points de vie perdus lorsque le projectile touche un joueur ou un mur.
     */
    damage: number;
};

/**
 * Un buff présentement actif.
 */
export type Buff = {
    /**
     * Nom de l'item.
     */
    name: string;
    /**
     * L'effet du buff.
     */
    effect: BuffEffect;

    /**
     * La puissance de l'effet.
     *
     * @example { effect: "shield", power: 10 }
     * ajoute 10 shield au joueur
     */
    power: number;

    /**
     * Le nombre de ticks où l'effet sera actif.
     */
    duration: number;
};

/**
 * Représente un joueur.
 */
export type Player = {
    /**
     * Le nom du joueur.
     */
    name: string;

    /**
     * Le score total du joueur.
     */
    score: number;

    /**
     * Nombre de points de vie actuel du joueur.
     */
    hp: number;

    /**
     * Nombre de points de bouclier actuel du joueur.
     */
    shield: number;

    /**
     * Position actuelle du joueur.
     */
    position: Position;

    /**
     * Position lors du dernier tick du joueur.
     */
    lastPosition: Position;

    /**
     * Nombre de ticks restants où l'effet de vitesse sera actif.
     */
    remainingHasteTicks: number;

    /**
     * Nombre de ticks restants où l'effet de dégat multiplié sera actif.
     */
    remainingDamageTicks: number;

    /**
     * Inventaire du joueur.
     */
    inventory: InventoryItem[];
};

export type GameState = {
    /**
     * Les informations de votre bot.
     */
    player: Player;

    /**
     * Les informations des bots ennemis avoisinant.
     */
    enemies: Player[];

    /**
     * Les informations de la partie.
     */
    stats: {
        aliveCount: number;
        deadCount: number;
    };

    /**
     * Le terrain autour de votre bot.
     */
    ground: {
        width: number;
        height: number;
        data: Cell[];
        offset: Position;
    };

    /**
     * Les objets autour de votre bot.
     */
    objects: Object[];

    /**
     * Les projectiles ennemis autour de votre bot.
     */
    projectiles: Projectile[];
};
