import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { Command } from "../../types/command";
import { PermissionLevel } from "../../utils/permissions";

const GetUserID: Command = {
    permissionLevel: PermissionLevel.MEMBER,

    data: new SlashCommandBuilder()
        .setName("getuserid")
        .setDescription("Gets the user ID of the user who typed the command"),

    async execute(interaction: CommandInteraction) {
        return interaction.reply({
            content: `Your user ID is ${interaction.user.id}`,
            ephemeral: true,
        });
    },
};
export default GetUserID;
