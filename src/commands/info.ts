import { SlashCommandBuilder } from '@discordjs/builders';
import { CommandInteraction, EmbedBuilder, EmbedAuthorOptions,ColorResolvable, APIEmbedField } from 'discord.js';
import * as config from "../config.json";
import { Command } from '../types/command';
import { PermissionLevel } from '../utils/permissions';


const BotInfo: Command = {
	permissionLevel: PermissionLevel.TEAM_MEMBER,

	data: new SlashCommandBuilder()
		.setName('info')
		.setDescription('Responds with information about the bot.'),

	async execute(interaction: CommandInteraction) {
        
        const username = interaction.guild?.members.cache.get(interaction.client.user?.id || "")?.nickname || interaction.client.user?.username || "";
        
        const ao: EmbedAuthorOptions = {
            name: username,
            url: interaction.client.user?.avatarURL()?.toString(),
            iconURL: interaction.client.user?.displayAvatarURL()?.toString()
        }

        const hasNickname = interaction.guild?.members.cache.get(interaction.client.user?.id || "")?.nickname;
        
        const fields:Array<APIEmbedField> = [
            {
                name:"Bot Version:",
                value: config.info.bot_version
            },
            {
                name:"Bot DiscordJS Version:",
                value: config.info.discord_js_version
            },
            {
                name:"Bot NodeJS Version:",
                value: config.info.node_version
            },
            {
                name:"Portal 2: Community Edition Version:",
                value: config.info.p2ce_release_version
            }

        ]
        
        const color = interaction.guild?.members.cache.get(interaction.client.user?.id || "")?.roles.color?.hexColor || "#ffffff";

        const embed = new EmbedBuilder()
        .setAuthor(ao)
        .setTimestamp(new Date())
        .setDescription(`${!hasNickname ? interaction.client.user?.username : username +" Also known as "+interaction.client.user?.username } is the official P2:CE Discord bot.`)
        .setColor(color)
        .addFields(fields);

        return interaction.reply({ embeds: [embed] });
	}
};

export default BotInfo;