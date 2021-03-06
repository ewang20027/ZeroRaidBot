import { Command } from "../../Templates/Command/Command";
import { CommandDetail } from "../../Templates/Command/CommandDetail";
import { CommandPermission } from "../../Templates/Command/CommandPermission";
import { Message, Guild, GuildMember, Role, MessageEmbed, TextChannel } from "discord.js";
import { MessageUtil } from "../../Utility/MessageUtil";
import { IRaidGuild } from "../../Templates/IRaidGuild";
import { MongoDbHelper } from "../../Helpers/MongoDbHelper";
import { UserHandler } from "../../Helpers/UserHandler";
import { ISuspendedData } from "../../Definitions/IPunishmentObject";

export class UnsuspendCommand extends Command {
	public constructor() {
		super(
			new CommandDetail(
				"Unsuspend",
				"unsuspend",
				[],
				"Unsuspends a user, with a reason if needed.",
				["unsuspend <@Mention | ID> <Reason: STRING>"],
				["unsuspend @Test#1234 For being good."],
				2
			),
			new CommandPermission(
                ["KICK_MEMBERS"],
                ["MANAGE_ROLES", "EMBED_LINKS"],
                ["universalRaidLeader", "headRaidLeader", "officer", "moderator"],
                ["SECTION_RL", "SECTION_HRL"],
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
        const mod: GuildMember = msg.member as GuildMember;

        let memberToUnsuspend: GuildMember | null = await UserHandler.resolveMember(msg, guildDb);

        if (memberToUnsuspend === null) {
            await MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "NO_MEMBER_FOUND", null), msg.channel);
            return;
        }

        if (memberToUnsuspend.id === msg.author.id) {
            await MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "SAME_PERSON_AS_AUTHOR", null), msg.channel);
            return;
        }

        if (msg.author.id !== guild.ownerID && (msg.member as GuildMember).roles.highest.comparePositionTo(memberToUnsuspend.roles.highest) <= 0) {
            MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "DEFAULT", null).setTitle("Role Hierarchy Error").setDescription("The person you are trying to unsuspend is equal to or has higher role permissions than you."), msg.channel);
            return;
        }

        const role: Role | void = guild.roles.cache.find(x => x.id === guildDb.roles.suspended);
        let resolvedSuspendedRole: Role;

        if (typeof role === "undefined") {
            MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "DEFAULT", null).setTitle("No Registered Suspended Role").setDescription("There is no suspended role; this most likely means you didn't suspend anyone yet."), msg.channel);
            return;
        }
        else {
            resolvedSuspendedRole = role;
        }

        let suspensionData: ISuspendedData | undefined;
        for (const suspensionEntry of guildDb.moderation.suspended) {
            if (suspensionEntry.userId === memberToUnsuspend.id) {
                suspensionData = suspensionEntry;
                break;
            }
        }

        if (!memberToUnsuspend.roles.cache.has(resolvedSuspendedRole.id) || typeof suspensionData === "undefined") {
            await MessageUtil.send(MessageUtil.generateBuiltInEmbed(msg, "DEFAULT", null).setTitle("Member Not Suspended").setDescription("The member is already unsuspended. If the person still has the suspended role, then the person was improperly suspended -- you will have to manually remove the suspended role."), msg.channel);
            return;
        }

        args.shift();
        let reason: string = args.join(" ").trim().length === 0 ? "No reason provided" : args.join(" ").trim();

        await memberToUnsuspend.roles.remove(role).catch(() => { });
        await memberToUnsuspend.roles.set(suspensionData.roles).catch(() => { });
        await MongoDbHelper.MongoDbGuildManager.MongoGuildClient.updateOne({ guildID: guild.id }, {
            $pull: {
                "moderation.suspended": {
                    userId: memberToUnsuspend.id,
                }
            }
        });
        await MessageUtil.send({ content: `${memberToUnsuspend} has been unsuspended successfully.` }, msg.channel).catch(() => { });

        // send to member
        await memberToUnsuspend.send(`**\`[${guild.name}]\`** You have been unsuspended from \`${guild.name}\` for the following reason: ${reason}\nThank you for your cooperation and please make sure you read the rules again.`).catch(() => { });

		const suspensionChannel: TextChannel | undefined = guild.channels.cache.get(guildDb.generalChannels.logging.suspensionLogs) as TextChannel | undefined;

        const embed: MessageEmbed = new MessageEmbed()
            .setAuthor(memberToUnsuspend.user.tag, memberToUnsuspend.user.displayAvatarURL())
            .setTitle("🏁 Member Unsuspended")
            .setDescription(`⇒ Unsuspended Member: ${memberToUnsuspend} (${memberToUnsuspend.displayName})\n⇒ Moderator: ${msg.author} (${mod.displayName})`)
            .addField("⇒ Unsuspension Reason", reason)
            .setColor("GREEN")
            .setTimestamp()
            .setFooter("Unsuspended Command Executed At");
        if (typeof suspensionChannel !== "undefined") {
            await suspensionChannel.send(embed).catch(() => { });
        }
    }
}