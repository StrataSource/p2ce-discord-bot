import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/command';
import { PermissionLevel } from '../../utils/permissions';
import { uwuify } from 'owoify-js';

const regular   = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const square    = ['\\🅰','\\🅱','🅲','🅳','🅴','🅵','🅶','🅷','🅸','🅹','🅺','🅻','🅼','🅽','\\🅾','\\🅿','🆀','🆁','🆂','🆃','🆄','🆅','🆆','🆇','🆈','🆉','\\🅰','\\🅱','🅲','🅳','🅴','🅵','🅶','🅷','🅸','🅹','🅺','🅻','🅼','🅽','\\🅾','\\🅿','🆀','🆁','🆂','🆃','🆄','🆅','🆆','🆇','🆈','🆉'];
const wide      = ['ａ','ｂ','ｃ','ｄ','ｅ','ｆ','ｇ','ｈ','ｉ','ｊ','ｋ','ｌ','ｍ','ｎ','ｏ','ｐ','ｑ','ｒ','ｓ','ｔ','ｕ','ｖ','ｗ','ｘ','ｙ','ｚ','Ａ','Ｂ','Ｃ','Ｄ','Ｅ','Ｆ','Ｇ','Ｈ','Ｉ','Ｊ','Ｋ','Ｌ','Ｍ','Ｎ','Ｏ','Ｐ','Ｑ','Ｒ','Ｓ','Ｔ','Ｕ','Ｖ','Ｗ','Ｘ','Ｙ','Ｚ'];
const cursive   = ['𝒶','𝒷','𝒸','𝒹','𝑒','𝒻','𝑔','𝒽','𝒾','𝒿','𝓀','𝓁','𝓂','𝓃','𝑜','𝓅','𝓆','𝓇','𝓈','𝓉','𝓊','𝓋','𝓌','𝓍','𝓎','𝓏','𝒜','𝐵','𝒞','𝒟','𝐸','𝐹','𝒢','𝐻','𝐼','𝒥','𝒦','𝐿','𝑀','𝒩','𝒪','𝒫','𝒬','𝑅','𝒮','𝒯','𝒰','𝒱','𝒲','𝒳','𝒴','𝒵'];
const medievalR = ['𝔞','𝔟','𝔠','𝔡','𝔢','𝔣','𝔤','𝔥','𝔦','𝔧','𝔨','𝔩','𝔪','𝔫','𝔬','𝔭','𝔮','𝔯','𝔰','𝔱','𝔲','𝔳','𝔴','𝔵','𝔶','𝔷','𝔄','𝔅','ℭ','𝔇','𝔈','𝔉','𝔊','ℌ','ℑ','𝔍','𝔎','𝔏','𝔐','𝔑','𝔒','𝔓','𝔔','ℜ','𝔖','𝔗','𝔘','𝔙','𝔚','𝔛','𝔜','ℨ'];
const medievalB = ['𝖆','𝖇','𝖈','𝖉','𝖊','𝖋','𝖌','𝖍','𝖎','𝖏','𝖐','𝖑','𝖒','𝖓','𝖔','𝖕','𝖖','𝖗','𝖘','𝖙','𝖚','𝖛','𝖜','𝖝','𝖞','𝖟','𝕬','𝕭','𝕮','𝕯','𝕰','𝕱','𝕲','𝕳','𝕴','𝕵','𝕶','𝕷','𝕸','𝕹','𝕺','𝕻','𝕼','𝕽','𝕾','𝕿','𝖀','𝖁','𝖂','𝖃','𝖄','𝖅'];
const monospace = ['𝚊','𝚋','𝚌','𝚍','𝚎','𝚏','𝚐','𝚑','𝚒','𝚓','𝚔','𝚕','𝚖','𝚗','𝚘','𝚙','𝚚','𝚛','𝚜','𝚝','𝚞','𝚟','𝚠','𝚡','𝚢','𝚣','𝙰','𝙱','𝙲','𝙳','𝙴','𝙵','𝙶','𝙷','𝙸','𝙹','𝙺','𝙻','𝙼','𝙽','𝙾','𝙿','𝚀','𝚁','𝚂','𝚃','𝚄','𝚅','𝚆','𝚇','𝚈','𝚉'];
const smallCaps = ['ᴀ','ʙ','ᴄ','ᴅ','ᴇ','ғ','ɢ','ʜ','ɪ','ᴊ','ᴋ','ʟ','ᴍ','ɴ','ᴏ','ᴘ','ǫ','ʀ','s','ᴛ','ᴜ','ᴠ','ᴡ','x','ʏ','ᴢ','ᴀ','ʙ','ᴄ','ᴅ','ᴇ','ғ','ɢ','ʜ','ɪ','ᴊ','ᴋ','ʟ','ᴍ','ɴ','ᴏ','ᴘ','ǫ','ʀ','s','ᴛ','ᴜ','ᴠ','ᴡ','x','ʏ','ᴢ'];
const tiny      = ['ᵃ','ᵇ','ᶜ','ᵈ','ᵉ','ᶠ','ᵍ','ʰ','ᶤ','ʲ','ᵏ','ˡ','ᵐ','ᶰ','ᵒ','ᵖ','ᵠ','ʳ','ˢ','ᵗ','ᵘ','ᵛ','ʷ','ˣ','ʸ','ᶻ','ᴬ','ᴮ','ᶜ','ᴰ','ᴱ','ᶠ','ᴳ','ᴴ','ᴵ','ᴶ','ᴷ','ᴸ','ᴹ','ᴺ','ᴼ','ᴾ','ᵠ','ᴿ','ˢ','ᵀ','ᵁ','ᵛ','ᵂ','ᵡ','ᵞ','ᶻ'];

function replaceText(text: string, from: string[], to: string[]) {
	for (let i = 0; i < 26 * 2; i++) {
		text = text.replaceAll(from[i], to[i]);
	}
	return text;
}

const FunText: Command = {
	permissionLevel: PermissionLevel.MEMBER,

	data: new SlashCommandBuilder()
		.setName('funtext')
		.setDescription('Fun text commands.')
		.addSubcommand(subcommand => subcommand
			.setName('square')
			.setDescription('Squareify the input text.')
			.addStringOption(option => option
				.setName('text')
				.setDescription('Text to make square')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('wide')
			.setDescription('Widen the input text.')
			.addStringOption(option => option
				.setName('text')
				.setDescription('Text to widen')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('cursive')
			.setDescription('Cursiveify the input text.')
			.addStringOption(option => option
				.setName('text')
				.setDescription('Text to make cursive')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('medieval')
			.setDescription('Medievalify the input text.')
			.addStringOption(option => option
				.setName('text')
				.setDescription('Text to make medieval')
				.setRequired(true))
			.addBooleanOption(option => option
				.setName('bold')
				.setDescription('Use bold medieval font')))
		.addSubcommand(subcommand => subcommand
			.setName('monospace')
			.setDescription('Monospaceify the input text.')
			.addStringOption(option => option
				.setName('text')
				.setDescription('Text to make monospace')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('smallcaps')
			.setDescription('Smallcapsify the input text.')
			.addStringOption(option => option
				.setName('text')
				.setDescription('Text to make smallcaps')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('tiny')
			.setDescription('Minify the input text.')
			.addStringOption(option => option
				.setName('text')
				.setDescription('Text to make tiny')
				.setRequired(true)))
		.addSubcommand(subcommand => subcommand
			.setName('uwuify')
			.setDescription('UwUify the input text.')
			.addStringOption(option => option
				.setName('text')
				.setDescription('Text to UwUify')
				.setRequired(true))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand()) return;

		const text = interaction.options.getString('text', true);

		switch (interaction.options.getSubcommand()) {
		case 'square': {
			return interaction.reply(replaceText(text, regular, square));
		}

		case 'wide': {
			return interaction.reply(replaceText(text, regular, wide));
		}

		case 'cursive': {
			return interaction.reply(replaceText(text, regular, cursive));
		}

		case 'medieval': {
			if (interaction.options.getBoolean('bold')) {
				return interaction.reply(replaceText(text, regular, medievalB));
			} else {
				return interaction.reply(replaceText(text, regular, medievalR));
			}
		}

		case 'monospace': {
			return interaction.reply(replaceText(text, regular, monospace));
		}

		case 'smallcaps': {
			return interaction.reply(replaceText(text, regular, smallCaps));
		}

		case 'tiny': {
			return interaction.reply(replaceText(text, regular, tiny));
		}

		case 'uwuify': {
			return interaction.reply(uwuify(text));
		}
		}
	}
};
export default FunText;
