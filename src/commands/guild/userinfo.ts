import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, EmbedBuilder } from "discord.js";
import { Command } from "../../types/command";
import { LogLevelColor } from "../../utils/log";
import { PermissionLevel } from "../../utils/permissions";

const UserInfo: Command = {
    permissionLevel: PermissionLevel.MEMBER,

    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Displays the user information of the message author."),

    async execute(interaction: CommandInteraction) {
        const user = interaction.options.getUser("user") ?? interaction.user;
        const name = `${user.username}#${user.discriminator}`;
        const avatar = user.avatarURL({ size: 1024 }) ?? "";

        // The EMBED
        const embed = new EmbedBuilder()
            .setColor(LogLevelColor.INFO)
            .setTitle(user.username)
            .setAuthor({
                name: name,
                iconURL: avatar,
            })
            .setDescription(`Your ID: ${user.id}`)
            .setThumbnail(avatar)
            .addFields({
                name: "Joined Discord",
                value: `<t:${(user.createdAt.getTime() / 1000).toFixed(0)}:D>`,
            })
            .setTimestamp()
            .setFooter({
                text: "Morality Core",
                iconURL:
                    "https://images-ext-2.discordapp.net/external/eH-_P4JXW9et_xYOdaWUlVc0vcS18n0UNL6-Y81Q0js/https/cdn.discordapp.com/avatars/945775761107857408/1c2481ba0874b2df26bb38798ee9837d.webp",
            });

        return interaction.reply({ embeds: [embed] });
    },
};
export default UserInfo;
