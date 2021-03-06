import { Command } from "../../Templates/Command/Command";
import { CommandDetail } from "../../Templates/Command/CommandDetail";
import { CommandPermission } from "../../Templates/Command/CommandPermission";
import { Message, GuildMember, Guild, MessageEmbed, Role, TextChannel } from "discord.js";
import { IRaidGuild } from "../../Templates/IRaidGuild";
import { MessageUtil } from "../../Utility/MessageUtil";
import { MongoDbHelper } from "../../Helpers/MongoDbHelper";
import { UserHandler } from "../../Helpers/UserHandler";

export class MuteCommand extends Command {
	public static currentTimeout: { timeout: NodeJS.Timeout, id: string }[] = [];

	public constructor() {
		super(
			new CommandDetail(
				"Mute",
				"mute",
				[],
				"Mutes a user for a specified duration or for an indefinite period of time. This will prevent them from messaging in channels. ",
				["mute <@Mention | ID | IGN> <X = Time; Xs | Xm | Xh | Xd | perma> <Reason: STRING>"],
				["mute @Test#1234 30m Read the rules.", "mute 1234567890202010 7d Extreme toxicity", "mute Test perma Only here to troll."],
				2
			),
			new CommandPermission(
				["MUTE_MEMBERS"],
				["MANAGE_CHANNELS", "MANAGE_ROLES", "EMBED_LINKS"],
				["support", "headRaidLeader", "officer", "moderator"],
				[],
				false
			),
			true,
			false,
			false,
			5
		);
	}

	public async executeCommand(
		msg: Message,
		args: string[],
		guildDb: IRaidGuild
	): Promise<void> {
		const guild: Guild = msg.guild as Guild;

		let memberToMute: GuildMember | null = await UserHandler.resolveMember(msg, guildDb);

		if (memberToMute === null) {
			await MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "NO_MEMBER_FOUND", null), msg.channel);
			return;
		}

		if (memberToMute.id === msg.author.id) {
			await MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "SAME_PERSON_AS_AUTHOR", null), msg.channel);
			return;
		}

		if (msg.author.id !== guild.ownerID && (msg.member as GuildMember).roles.highest.comparePositionTo(memberToMute.roles.highest) <= 0) {
			MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "DEFAULT", null).setTitle("Role Hierarchy Error").setDescription("The person you are trying to mute is equal or has higher role permissions than you."), msg.channel);
			return;
		}

		// remove member
		args.shift();
		// get other arguments
		const timeArgument: string = (args.shift() as string).toLowerCase();
		const reason: string = args.join(" ");

		let time: [number, string] = timeArgument.toLowerCase() === "perma"
			? [-1, "Indefinite"]
			: this.getMillisecondTime(timeArgument);

		if (time[0] > 2147483647) {
			MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "DEFAULT", null).setTitle("Mute Duration Too Long!").setDescription("The maximum duration you can use is 24.8 days."), msg.channel);
			return;
		}

		MuteCommand.muteUser(msg, guildDb, memberToMute, msg.member as GuildMember, reason, time);
	}

    /**
     * Mutes the user.
     * @param {Message} msg The guild. 
     * @param {IRaidGuild} guildDb The guild document.
     * @param {GuildMember} memberToMute The member that got a mute.
     * @param {GuildMember} moderator The moderator.
     * @param {string} reason The reason. 
     * @param {[number, string]} muteTime The amount of time to mute the user. 
     */
	private static async muteUser(
		msg: Message,
		guildDb: IRaidGuild,
		memberToMute: GuildMember,
		moderator: GuildMember,
		reason: string,
		muteTime: [number, string]
	): Promise<void> {
		const guild: Guild = msg.guild as Guild;
		const role: Role | void = guild.roles.cache.find(x => x.id === guildDb.roles.optRoles.mutedRole);
		let resolvedMutedRole: Role;

		if (typeof role === "undefined") {
			resolvedMutedRole = await guild.roles.create({
				data: {
					name: "Muted",
					permissions: []
				}
			});

			guildDb = (await MongoDbHelper.MongoDbGuildManager.MongoGuildClient.findOneAndUpdate({ guildID: guild.id }, {
				$set: {
					"roles.optRoles.mutedRole": resolvedMutedRole.id
				}
			}, { returnOriginal: false })).value as IRaidGuild;
		}
		else {
			resolvedMutedRole = role;
		}

		if (memberToMute.roles.cache.has(resolvedMutedRole.id)) {
			await MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "DEFAULT", null).setTitle("Member Already Muted").setDescription("The member you are trying to mute is already muted. Try again."), msg.channel);
			return;
		}

		const moderationChannel: TextChannel | undefined = guild.channels.cache.get(guildDb.generalChannels.logging.moderationLogs) as TextChannel | undefined;

		try {
			await memberToMute.roles.add(resolvedMutedRole);
		}
		catch (e) {
			await MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "DEFAULT", null).setTitle("Discord API Error").setDescription(e), msg.channel);
			return;
		}

		await MessageUtil.send({ content: `${memberToMute} has been muted successfully.` }, msg.channel).catch(() => { });

		const embed: MessageEmbed = new MessageEmbed()
			.setAuthor(memberToMute.user.tag, memberToMute.user.displayAvatarURL())
			.setTitle("🔇 User Muted")
			.setDescription(`⇒ Muted Member: ${memberToMute} (${memberToMute.displayName})\n⇒ Moderator: ${moderator} (${moderator.displayName})\n⇒ Duration: ${muteTime[1]}`)
			.addField("⇒ Mute Reason", reason)
			.setColor("RED")
			.setTimestamp()
			.setFooter("Mute Command Executed At");
		if (typeof moderationChannel !== "undefined") {
			await moderationChannel.send(embed).catch(() => { });
		}

		// send to member 
		await memberToMute.send(`**\`[${guild.name}]\`** You have been muted from \`${guild.name}\`.\n\t⇒ Reason: ${reason}\n\t⇒ Duration: ${muteTime[1]}`).catch(() => { });

		for await (const [, channel] of guild.channels.cache) {
			if (channel.permissionOverwrites.has(resolvedMutedRole.id)) {
				continue;
			}
			await channel.createOverwrite(resolvedMutedRole.id, {
				SEND_MESSAGES: false, // can't send msgs, obviously.
				ADD_REACTIONS: false, // can't add reactions.
				CONNECT: false, // can't connect to vc.
				SPEAK: false, // can't speak in vc (if they can connect).
				MANAGE_CHANNELS: false // can't manage channel (so they can't just bypass).
			}, "Muting user.").catch(() => { });
		}

		await MongoDbHelper.MongoDbGuildManager.MongoGuildClient.updateOne({ guildID: guild.id }, {
			$push: {
				"moderation.mutedUsers": {
					userId: memberToMute.id,
					modId: moderator.id,
					reason: reason,
					duration: muteTime[0],
					endsAt: muteTime[0] === -1 ? -1 : (new Date().getTime() + muteTime[0])
				}
			}
		});
		
		if (muteTime[0] !== -1) {
			MuteCommand.timeMute(guild, memberToMute, muteTime[0], moderationChannel);
		}
	}

    /**
     * Sets a timeout that will automatically remove the Muted role. The guild must already have a role called "Muted" defined.
     * @param {Guild} guild The guild. 
     * @param {GuildMember} memberToMute The member to mute. 
     * @param {number} timeToMute The duration to mute for. 
	 * @param {TextChannel} [moderationChannel] The mod channel.
     */
	public static async timeMute(
		guild: Guild,
		memberToMute: GuildMember,
		timeToMute: number,
		moderationChannel?: TextChannel
	): Promise<void> {
		const db: IRaidGuild = await new MongoDbHelper.MongoDbGuildManager(guild.id).findOrCreateGuildDb();
		const mutedRole: Role | void = guild.roles.cache.find(x => x.id === db.roles.optRoles.mutedRole);
		if (typeof mutedRole === "undefined") {
			return;
		}

		const to: NodeJS.Timeout = setTimeout(async () => {
			if (memberToMute.roles.cache.has(mutedRole.id)) {
				await memberToMute.roles.remove(mutedRole).catch(() => { });
				if (typeof moderationChannel !== "undefined") {
					const embed: MessageEmbed = new MessageEmbed()
						.setAuthor(memberToMute.user.tag, memberToMute.user.displayAvatarURL())
						.setTitle("🔈 Member Unmuted")
						.setDescription(`⇒ ${memberToMute} (${memberToMute.displayName}) has been unmuted.\n⇒ Moderator: Automatic`)
						.setColor("GREEN")
						.addField("⇒ Unmute Reason", "The member has served his or her time fully.")
						.setTimestamp()
						.setFooter("Unmuted At");
					await moderationChannel.send(embed).catch(() => { });
				}
			}
			// run just in case the person's role was taken off manually
			await MongoDbHelper.MongoDbGuildManager.MongoGuildClient.updateOne({ guildID: guild.id }, {
				$pull: {
					"moderation.mutedUsers": {
						userId: memberToMute.id,
					}
				}
			});

			const muteIndex: number = MuteCommand.currentTimeout.findIndex(x => x.id === memberToMute.id);
			if (muteIndex !== -1) {
				MuteCommand.currentTimeout.splice(muteIndex, 1);
			}
		}, timeToMute);
		MuteCommand.currentTimeout.push({ timeout: to, id: memberToMute.id });
	}

    /**
     * Converts the string input (e.g. 6h, 12m, 32s) into milliseconds.
     * @param {string} rawTime The raw input.
     * @returns {number} The time, in ms; -1 if unable to convert. 
     */
	private getMillisecondTime(rawTime: string): [number, string] {
		rawTime = rawTime.toLowerCase();
		let timeType: string = rawTime.substring(rawTime.length - 1, rawTime.length);
		let correspTime: string = rawTime.substring(0, rawTime.length - 1);
		const parsedNum: number = Number.parseInt(correspTime);
		if (Number.isNaN(parsedNum)) {
			return [-1, "Indefinite."];
		}
		switch (timeType) {
			case ("s"): {
				return [parsedNum * 1000, `${parsedNum} Seconds.`];
			}
			case ("m"): {
				return [parsedNum * 60000, `${parsedNum} Minutes.`];
			}
			case ("h"): {
				return [parsedNum * 3.6e+6, `${parsedNum} Hours.`];
			}
			case ("d"): {
				return [parsedNum * 8.64e+7, `${parsedNum} Days.`];
			}
			default: {
				return [-1, "Indefinite."];
			}
		}
	}
}