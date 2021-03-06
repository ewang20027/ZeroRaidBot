import { CommandDetail } from "../../Templates/Command/CommandDetail";
import { CommandPermission } from "../../Templates/Command/CommandPermission";
import { Command } from "../../Templates/Command/Command";
import { Message, Guild } from "discord.js";
import { IRaidGuild } from "../../Templates/IRaidGuild";
import { RaidHandler } from "../../Helpers/RaidHandler";

export class StartHeadcountCommand extends Command {
	public constructor() {
		super(
			new CommandDetail(
				"Start Headcount Command",
				"startheadcount",
				["starthc", "headcount", "hc", "shc"],
				"Starts a new headcount.",
				["startheadcount"],
				["startheadcount"],
				0
			),
			new CommandPermission(
				[],
				["ADD_REACTIONS", "EMBED_LINKS"],
				["headRaidLeader", "universalRaidLeader", "universalAlmostRaidLeader"],
				["ALL_RLS"],
				false
			),
			true,
			false,
			false,
			0
		);
	}

	public async executeCommand(message: Message, args: string[], guildData: IRaidGuild): Promise<void> {
		RaidHandler.startHeadCountWizard(message, guildData, message.guild as Guild);
	}
}