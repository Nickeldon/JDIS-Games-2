import type { Action, TeamToken } from ".";

export type Message = SetActionsMessage | LinkMessage | ConfirmMessage;

export type SetActionsMessage = {
    type: "action";
    action: Action;
};

export type LinkMessage = {
    type: "link";
    clientType: "agent";
    teamId: TeamToken;
};

export type ConfirmMessage = {
    type: "confirm";
    teamToken: TeamToken;
};
