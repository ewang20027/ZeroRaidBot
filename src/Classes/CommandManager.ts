import { Collection } from "discord.js";
import { Command } from "../Templates/Command/Command";
import { SendEmbedCommand } from "../Commands/Staff/SendEmbedCommand";
import { ConfigureSectionCommand } from "../Commands/Configuration/ConfigureSectionCommand";
import { StartAfkCheckCommand } from "../Commands/Raid Leader/StartAfkCheckCommand";
import { StartHeadcountCommand } from "../Commands/Raid Leader/StartHeadcountCommand";
import { FindUserCommand } from "../Commands/Staff/FindUserCommand";
import { MuteCommand } from "../Commands/Moderator/MuteCommand";
import { UnmuteCommand } from "../Commands/Moderator/UnmuteCommand";
import { SuspendCommand } from "../Commands/Moderator/SuspendCommand";
import { UnsuspendCommand } from "../Commands/Moderator/UnsuspendCommand";
import { CheckBlacklistCommand } from "../Commands/Staff/CheckBlacklistCommand";
import { BlacklistCommand } from "../Commands/Moderator/BlacklistCommand";
import { UnblacklistCommand } from "../Commands/Moderator/UnblacklistCommand";
import { PollCommand } from "../Commands/Staff/PollCommand";
import { HelpCommand } from "../Commands/Public/HelpCommand";
import { ManualVerifyCommand } from "../Commands/Staff/ManualVerifyCommand";
import { PingCommand } from "../Commands/Public/PingCommand";
import { RoleInfoCommand } from "../Commands/Server Information/RoleInfoCommand";
import { ServerInfoCommand } from "../Commands/Server Information/ServerInfoCommand";
import { ChannelInfoCommand } from "../Commands/Server Information/ChannelInfoCommand";
import { UserInfoCommand } from "../Commands/Server Information/UserInfoCommand";
import { ViewUserProfileCommand } from "../Commands/User Profile/ViewUserProfileCommand";
import { AddAltAccountCommand } from "../Commands/User Profile/AddAltAccountCommand";
import { ServerProfileCommand } from "../Commands/Server Profile/ServerProfileCommand";
import { SwitchMainAltAccountCommand } from "../Commands/User Profile/SwitchMainAltAccountCommand";
import { ReconnectDBCommand } from "../Commands/Bot Owner/ReconnectDBCommand";
import { AddToNicknameCommand } from "../Commands/Server Profile/AddToNicknameCommand";
import { RemoveFromNicknameCommand } from "../Commands/Server Profile/RemoveFromNicknameCommand";

/**
 * This class should only be called ONCE. 
 */
export class CommandManager {
	/**
	 * The commands in the bot.
 	 */
	private commands: Collection<string, Command[]>;

	/**
	 * Whether commands have been loaded or not for this particular object.
	 */
	private hasBeenLoaded: boolean = false;

	/**
	 * The constructor for this method.
	 */
	public constructor() {
		// instantiate collection obj
		this.commands = new Collection<string, Command[]>();
	}

	/**
	 * Loads all commands. This should only be called once.
	 */
	public loadAllCommands(): void {
		if (this.hasBeenLoaded) {
			return;
		}

		this.commands.set("Public", [
			new HelpCommand(),
			new PingCommand()
		]);

		this.commands.set("Server Information", [
			new RoleInfoCommand(),
			new ServerInfoCommand(),
			new ChannelInfoCommand(),
			new UserInfoCommand()
		]);

		this.commands.set("Configuration", [
			new ConfigureSectionCommand()
		]);

		this.commands.set("Raid Leader", [
			new StartAfkCheckCommand(), 
			new StartHeadcountCommand()
		]);

		this.commands.set("Staff", [
			new SendEmbedCommand(), 
			new FindUserCommand(),
			new PollCommand(),
			new CheckBlacklistCommand(),
			new ManualVerifyCommand()
		]);

		this.commands.set("Moderation", [
			new MuteCommand(), 
			new UnmuteCommand(), 
			new SuspendCommand(), 
			new UnsuspendCommand(),
			new BlacklistCommand(),
			new UnblacklistCommand()
		]);
		
		this.commands.set("User Profile", [
			new ViewUserProfileCommand(),
			new AddAltAccountCommand(),
			new SwitchMainAltAccountCommand()
		]);

		this.commands.set("Server Profile", [
			new ServerProfileCommand(),
			new AddToNicknameCommand(),
			new RemoveFromNicknameCommand()
		]);

		this.commands.set("Bot Owner", [
			new ReconnectDBCommand()
		]);

		this.hasBeenLoaded = true;
	}

	/**
	 * Gets all commands loaded.
	 */
	public getCommands(): Collection<string, Command[]> {
		return this.commands;
	}

	/**
	 * Looks for a command and returns it.
	 * @param {string} cmd The command name to look for.
	 * @returns {Command | null} The command, if available. 
	 */
	public findCommand(cmd: string): Command | null {
		for (let [, command] of this.commands) {
			for (let i = 0; i < command.length; i++) {
				if (command[i].getMainCommandName().toLowerCase() === cmd.toLowerCase()) {
					return command[i];
				}

				if (command[i].getAliases().length > 0) {
					for (let j = 0; j < command[i].getAliases().length; j++) {
						if (command[i].getAliases()[j].toLowerCase() === cmd.toLowerCase()) {
							return command[i];
						}
					}
				}
			}
		}

		return null;
	}
}