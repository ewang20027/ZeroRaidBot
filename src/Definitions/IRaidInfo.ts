import { RaidStatus } from "./RaidStatus";
import { IDungeonData } from "./IDungeonData";
import { ISection } from "../Templates/ISection";
import { OverwriteResolvable } from "discord.js";

export interface IRaidInfo {
	/**
	 * The raiding number. 
	 */
	raidNum: number;

	/**
	 * The raid section.
	 */
	section: ISection; 

	/**
	 * The voice channel ID.
	 */
	vcID: string;

	/**
	 * VC Name
	 */
	vcName: string;

	/**
	 * VC info
	 */
	vcInfo: {
		isOld: boolean;
		oldPerms: OverwriteResolvable[];
	};

	/**
	 * The location of the raid.
	 */
	location: string;

	/**
	 * The message ID of the AFK check message.
	 */
	msgID: string;

	/**
	 * Control panel message ID.
	 */
	controlPanelMsgId: string; 

	/**
	 * Dungeon information
	 */
	dungeonInfo: IDungeonData;

	/**
	 * The time this was started.
	 */
	startTime: number;

	/**
	 * The ID of the person that started this AFK check.
	 */
	startedBy: string;

	/**
	 * The current raid status. 
	 */
	status: RaidStatus;

	/**
	 * Key reactions.
	 */
	keyReacts: { keyId: string; userId: string; }[];
	
	/**
	 * Early reactions.
	 */
	earlyReacts: string[];

	/**
	 * Dungeons completed.
	 */
	dungeonsDone: number;
}