import type { CardinalDirection, Direction, Position } from ".";

export type Action = MoveAction | PhaseAction | OpenChestAction | UseItemAction | SegFaultAction | SkipAction;

export type MoveAction = {
    action: "move";
    position: Position;
};

export type PhaseAction = {
    action: "phase";
    direction: CardinalDirection;
};

export type OpenChestAction = {
    action: "openChest";
    position: Position;
};

export type UseItemAction = {
    action: "useItem";
    name: string;
    data:
        | {
              type: "buff" | "nuke";
          }
        | {
              type: "projectile";
              direction: Direction;
          }
        | { type: "placed"; position: Position; placeRectangleVertical: boolean };
};

export type SegFaultAction = {
    action: "segFault";
};

export type SkipAction = {
    action: "skip";
};
