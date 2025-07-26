/**
 * Un item dans l'inventaire d'un joueur
 */
export type InventoryItem = {
    /**
     * Le nom de l'item.
     */
    name: string;

    /**
     * Le nombre de ticks restant avant de pouvoir utiliser l'item.
     * Une valeur de `0` signifie que l'item peut être utilisé.
     */
    remainingTicks: number;

    /**
     * Le nombre d'utilisations disponibles pour cet item.
     * La quantité est `null` lorsque l'item peut être utilisé à l'infini.
     */
    quantity: null | number;
} & (
    | {
          type: "buff";

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
      }
    | {
          type: "projectile";

          /**
           * La distance totale qui peut être parcourue par le projectile.
           */
          range: number;

          /**
           * La distance parcourue par le projectile chaque tick.
           */
          speed: number;

          /**
           * Le nombre de points de vie perdus lorsque le projectile touche un joueur ou un mur.
           */
          damage: number;

          /**
           * Le positionnement et la quantité de projectiles tirés lors de l'utilisation de l'item.
           *
           * - `single` Un seul projectile dans la direction spécifiée
           * - `line` Trois projectiles côtes-à-côtes dans la direction spécifiée
           * - `star` Un projectile par direction cardinale (quatres au total)
           * - `global` Un projectile par case sur la carte
           */
          pattern: "single" | "line" | "star";
      }
    | {
          type: "placed";

          /**
           * Le type d'objet.
           */
          object: ItemPlacedObject;

          /**
           * La forme du placement de l'objet.
           */
          pattern: ItemPlacedPattern;

          /**
           * La distance maximale de placement par rapport au joueur.
           */
          range: number;
      }
    | {
          type: "nuke";

          /**
           * Le nombre de points de vie enlevé à tous les joueurs et murs.
           */
          damage: number;
      }
);

/**
 * Le type d'objet.
 *
 * - `wall` Un mur
 * - `trap` Un piège
 */
export type ItemPlacedObject =
    | { type: "wall" }
    | {
          type: "trap";

          /**
           * Le nombre de points de vie perdus lorsqu'un joueur marche sur le piège.
           */
          damage: number;
      };

/**
 * Le positionnement et la quantité d'objets placés sur la carte lors de l'utilisation de l'item.
 *
 * - `single` Un seul objet à la position spécifiée
 * - `rectangle` Un rectangle remplis de l'objet à la position spécifiée
 * - `square` Un carré vide centré sur le joueur entouré par l'objet
 */
export type ItemPlacedPattern =
    | { type: "single" }
    | {
          type: "rectangle";

          /**
           * La longueur du rectangle.
           */
          width: number;

          /**
           * La largeur du rectangle.
           */
          height: number;
      }
    | {
          type: "box";

          /**
           * La distance entre les objets et le joueur.
           */
          radius: number;
      };

/**
 * L'effet d'un buff lors de son utilisation.
 *
 * - `heal` Gagne des points de vie
 * - `score` Gagne du score
 * - `shield` Gagne des points de bouclier
 * - `damage` Multiplie tous les dégats du joueur
 * - `haste` Permet au joueur d'ignorer tous les cooldowns de ses items
 * - `healAndShield` Gagne des points de vie et des points de bouclier
 */
export type BuffEffect = "heal" | "haste" | "score" | "shield" | "damage" | "healAndShield";
