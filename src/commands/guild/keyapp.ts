// noinspection JSUnusedGlobalSymbols

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ModalActionRowComponentBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { MoralityCoreClient } from '../../types/client';
import { Command } from '../../types/interaction';
import { KeyStatus } from '../../types/keyapp';
import { PermissionLevel } from '../../utils/permissions';
import { checkUserKeyStatus, readUserApplication } from '../shared/keyapp';

import * as config from '../../config.json';
import * as log from '../../utils/log';
import * as persist from '../../utils/persist';

async function showApplicationModal(interaction: CommandInteraction) {
	const modalID = `keyapp_apply_modal_${interaction.user.id}`;
	const modal = new ModalBuilder()
		.setCustomId(modalID)
		.setTitle('Key Application Form');

	const rationaleInput = new TextInputBuilder()
		.setCustomId('rationale')
		.setLabel('Rationale For Access')
		.setPlaceholder('Why do you think you should be granted access?')
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true);

	const roleInput = new TextInputBuilder()
		.setCustomId('role')
		.setLabel('Community Role')
		.setPlaceholder('Are you a Gamer? Mapper? Artist? All of the above?')
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	const modInput = new TextInputBuilder()
		.setCustomId('mod')
		.setLabel('Active Mod')
		.setPlaceholder('If you are working on a mod, which one?')
		.setStyle(TextInputStyle.Short)
		.setRequired(false);

	const reportInput = new TextInputBuilder()
		.setCustomId('report')
		.setLabel('Reporting Bugs')
		.setPlaceholder('Will you report bugs to the GitHub issue tracker?')
		.setStyle(TextInputStyle.Short)
		.setRequired(true);

	const experienceInput = new TextInputBuilder()
		.setCustomId('experience')
		.setLabel('Experience')
		.setPlaceholder('State your experience, if you have any. Linking your portfolio helps!')
		.setStyle(TextInputStyle.Paragraph)
		.setRequired(true);

	modal.addComponents(
		new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(rationaleInput),
		new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(roleInput),
		new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(modInput),
		new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(reportInput),
		new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(experienceInput));

	(interaction.client as MoralityCoreClient).callbacks.addModalCallback(modalID, async modalInteraction => {
		const rationale = modalInteraction.fields.getTextInputValue('rationale');
		const role = modalInteraction.fields.getTextInputValue('role');
		const mod = modalInteraction.fields.getTextInputValue('mod');
		const report = modalInteraction.fields.getTextInputValue('report');
		const experience = modalInteraction.fields.getTextInputValue('experience');

		const claText = 'By clicking the "I Agree" button, you are voluntarily consenting to contribute to P2:CE and be polite to other test subjects. Your key may be revoked at any point for breaking the rules of the beta test, or at P2:CE team discretion. The contents of your application will be visible to all P2:CE team members.';
		const claButtonID = `${modalID}_button`;
		const claButton = new ButtonBuilder()
			.setCustomId(claButtonID)
			.setLabel('I Agree')
			.setStyle(ButtonStyle.Primary);

		(modalInteraction.client as MoralityCoreClient).callbacks.addButtonCallback(claButtonID, async buttonInteraction => {
			if (!buttonInteraction.guild) {
				return;
			}
			const data = persist.data(buttonInteraction.guild.id);

			let notes = '';
			if (!data.keyapps) {
				data.keyapps = {};
			} else if (Object.hasOwn(data.keyapps, buttonInteraction.user.id)) {
				notes = data.keyapps[buttonInteraction.user.id].notes;
			}
			data.keyapps[buttonInteraction.user.id] = {
				rationale: rationale,
				role: role,
				mod: mod,
				report: report,
				experience: experience,
				notes: notes,
				accept_state: KeyStatus.UNREVIEWED,
				key_given: '',
			};
			persist.saveData(buttonInteraction.guild.id);

			return buttonInteraction.reply({ content: 'Thank you! Your application has been submitted.', ephemeral: true });
		});

		const claActionRow = new ActionRowBuilder<ButtonBuilder>()
			.addComponents(claButton);

		return modalInteraction.reply({ content: claText, components: [claActionRow], ephemeral: true });
	});

	return interaction.showModal(modal);
}

const KeyApp: Command = {
	permissionLevel: PermissionLevel.EVERYONE,
	isP2CEOnly: true,

	data: new SlashCommandBuilder()
		.setName('keyapp')
		.setDescription('Various key application utilities.')
		.addSubcommand(subcommand => subcommand
			.setName('apply')
			.setDescription('Submit a new key application, which overwrites the old one if present.'))
		.addSubcommand(subcommand => subcommand
			.setName('check')
			.setDescription('Check the status of your key application.'))
		.addSubcommand(subcommand => subcommand
			.setName('read')
			.setDescription('Reads your latest key application.')),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand() || !interaction.guild) {
			return;
		}

		switch (interaction.options.getSubcommand()) {
		case 'apply': {
			// TODO: SWITCH THIS TO DB LATER !!
			const data = persist.data(interaction.guild.id);
			if (data.keyapps && Object.hasOwn(data.keyapps, interaction.user.id)) {
				return showApplicationModal(interaction);
			}

			const steamLoginText = 'Please link your Steam account to continue the application process. No login information will be stored, only your public account ID.\nPlease run the `/keyapp apply` command again when verification is complete.';
			const steamLoginButtonID = `keyapp_apply_steam_login_button_${interaction.user.id}`;
			const steamLoginButton = new ButtonBuilder()
				.setCustomId(steamLoginButtonID)
				.setLabel('Log Into Steam')
				.setURL('todo')
				.setStyle(ButtonStyle.Link);

			const steamLoginActionRow = new ActionRowBuilder<ButtonBuilder>()
				.addComponents(steamLoginButton);

			return interaction.reply({ content: steamLoginText, components: [steamLoginActionRow], ephemeral: true });
		}

		case 'check': {
			return checkUserKeyStatus(interaction, interaction.user, true);
		}

		case 'read': {
			return readUserApplication(interaction, interaction.user, true);
		}
		}
	}
};
export default KeyApp;
