import { PrivateApiDefinitions } from "../Definitions/PrivateApiDefinitions";

export interface IManualVerification {
    /**
     * The Discord account that wants to verify.
     */
    userId: string; 

    /**
     * The in-game name.
     */
    inGameName: string;

    /**
     * Current stars.
     */
    rank: number;

    /**
     * Alive fame.
     */
    aFame: number;

    /**
     * Name History.
     */
    nameHistory: PrivateApiDefinitions.INameHistory;

    /**
     * The ID of the message corresponding to the message in the manual verification channel.
     */
    msgId: string;

    /**
     * The ID of the manual verification channel.
     */
    manualVerificationChannel: string;

    /**
     * The person that is currently looking into it.
     */
    currentHandler: string;
}