// noinspection JSUnusedGlobalSymbols

import { AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import { Command } from '../../types/interaction';
import { PermissionLevel } from '../../utils/permissions';
import { escapeSpecialCharacters, getUploadLimitForChannel } from '../../utils/utils';
import { CanvasRenderingContext2D, createCanvas, ImageData, loadImage } from 'canvas';
import GIFEncoder from 'gif-encoder';
import { parseGIF, decompressFrames } from 'gifuct-js';
import { uwuify } from 'owoify-js';

const regular      = ['a','b','c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
const square       = ['\\🅰','\\🅱','🅲','🅳','🅴','🅵','🅶','🅷','🅸','🅹','🅺','🅻','🅼','🅽','\\🅾','\\🅿','🆀','🆁','🆂','🆃','🆄','🆅','🆆','🆇','🆈','🆉','\\🅰','\\🅱','🅲','🅳','🅴','🅵','🅶','🅷','🅸','🅹','🅺','🅻','🅼','🅽','\\🅾','\\🅿','🆀','🆁','🆂','🆃','🆄','🆅','🆆','🆇','🆈','🆉'];
const bubble       = ['ⓐ','ⓑ','ⓒ','ⓓ','ⓔ','ⓕ','ⓖ','ⓗ','ⓘ','ⓙ','ⓚ','ⓛ','ⓜ','ⓝ','ⓞ','ⓟ','ⓠ','ⓡ','ⓢ','ⓣ','ⓤ','ⓥ','ⓦ','ⓧ','ⓨ','ⓩ','Ⓐ','Ⓑ','Ⓒ','Ⓓ','Ⓔ','Ⓕ','Ⓖ','Ⓗ','Ⓘ','Ⓙ','Ⓚ','Ⓛ','Ⓜ','Ⓝ','Ⓞ','Ⓟ','Ⓠ','Ⓡ','Ⓢ','Ⓣ','Ⓤ','Ⓥ','Ⓦ','Ⓧ','Ⓨ','Ⓩ'];
const bubbleFilled = ['🅐','🅑','🅒','🅓','🅔','🅕','🅖','🅗','🅘','🅙','🅚','🅛','🅜','🅝','🅞','🅟','🅠','🅡','🅢','🅣','🅤','🅥','🅦','🅧','🅨','🅩','🅐','🅑','🅒','🅓','🅔','🅕','🅖','🅗','🅘','🅙','🅚','🅛','🅜','🅝','🅞','🅟','🅠','🅡','🅢','🅣','🅤','🅥','🅦','🅧','🅨','🅩'];
const wide         = ['ａ','ｂ','ｃ','ｄ','ｅ','ｆ','ｇ','ｈ','ｉ','ｊ','ｋ','ｌ','ｍ','ｎ','ｏ','ｐ','ｑ','ｒ','ｓ','ｔ','ｕ','ｖ','ｗ','ｘ','ｙ','ｚ','Ａ','Ｂ','Ｃ','Ｄ','Ｅ','Ｆ','Ｇ','Ｈ','Ｉ','Ｊ','Ｋ','Ｌ','Ｍ','Ｎ','Ｏ','Ｐ','Ｑ','Ｒ','Ｓ','Ｔ','Ｕ','Ｖ','Ｗ','Ｘ','Ｙ','Ｚ'];
const cursive      = ['𝒶','𝒷','𝒸','𝒹','𝑒','𝒻','𝑔','𝒽','𝒾','𝒿','𝓀','𝓁','𝓂','𝓃','𝑜','𝓅','𝓆','𝓇','𝓈','𝓉','𝓊','𝓋','𝓌','𝓍','𝓎','𝓏','𝒜','𝐵','𝒞','𝒟','𝐸','𝐹','𝒢','𝐻','𝐼','𝒥','𝒦','𝐿','𝑀','𝒩','𝒪','𝒫','𝒬','𝑅','𝒮','𝒯','𝒰','𝒱','𝒲','𝒳','𝒴','𝒵'];
const medievalR    = ['𝔞','𝔟','𝔠','𝔡','𝔢','𝔣','𝔤','𝔥','𝔦','𝔧','𝔨','𝔩','𝔪','𝔫','𝔬','𝔭','𝔮','𝔯','𝔰','𝔱','𝔲','𝔳','𝔴','𝔵','𝔶','𝔷','𝔄','𝔅','ℭ','𝔇','𝔈','𝔉','𝔊','ℌ','ℑ','𝔍','𝔎','𝔏','𝔐','𝔑','𝔒','𝔓','𝔔','ℜ','𝔖','𝔗','𝔘','𝔙','𝔚','𝔛','𝔜','ℨ'];
const medievalB    = ['𝖆','𝖇','𝖈','𝖉','𝖊','𝖋','𝖌','𝖍','𝖎','𝖏','𝖐','𝖑','𝖒','𝖓','𝖔','𝖕','𝖖','𝖗','𝖘','𝖙','𝖚','𝖛','𝖜','𝖝','𝖞','𝖟','𝕬','𝕭','𝕮','𝕯','𝕰','𝕱','𝕲','𝕳','𝕴','𝕵','𝕶','𝕷','𝕸','𝕹','𝕺','𝕻','𝕼','𝕽','𝕾','𝕿','𝖀','𝖁','𝖂','𝖃','𝖄','𝖅'];
const monospace    = ['𝚊','𝚋','𝚌','𝚍','𝚎','𝚏','𝚐','𝚑','𝚒','𝚓','𝚔','𝚕','𝚖','𝚗','𝚘','𝚙','𝚚','𝚛','𝚜','𝚝','𝚞','𝚟','𝚠','𝚡','𝚢','𝚣','𝙰','𝙱','𝙲','𝙳','𝙴','𝙵','𝙶','𝙷','𝙸','𝙹','𝙺','𝙻','𝙼','𝙽','𝙾','𝙿','𝚀','𝚁','𝚂','𝚃','𝚄','𝚅','𝚆','𝚇','𝚈','𝚉'];
const smallCaps    = ['ᴀ','ʙ','ᴄ','ᴅ','ᴇ','ғ','ɢ','ʜ','ɪ','ᴊ','ᴋ','ʟ','ᴍ','ɴ','ᴏ','ᴘ','ǫ','ʀ','s','ᴛ','ᴜ','ᴠ','ᴡ','x','ʏ','ᴢ','ᴀ','ʙ','ᴄ','ᴅ','ᴇ','ғ','ɢ','ʜ','ɪ','ᴊ','ᴋ','ʟ','ᴍ','ɴ','ᴏ','ᴘ','ǫ','ʀ','s','ᴛ','ᴜ','ᴠ','ᴡ','x','ʏ','ᴢ'];
const tiny         = ['ᵃ','ᵇ','ᶜ','ᵈ','ᵉ','ᶠ','ᵍ','ʰ','ᶤ','ʲ','ᵏ','ˡ','ᵐ','ᶰ','ᵒ','ᵖ','ᵠ','ʳ','ˢ','ᵗ','ᵘ','ᵛ','ʷ','ˣ','ʸ','ᶻ','ᴬ','ᴮ','ᶜ','ᴰ','ᴱ','ᶠ','ᴳ','ᴴ','ᴵ','ᴶ','ᴷ','ᴸ','ᴹ','ᴺ','ᴼ','ᴾ','ᵠ','ᴿ','ˢ','ᵀ','ᵁ','ᵛ','ᵂ','ᵡ','ᵞ','ᶻ'];
const wingdings    = ['♋︎','♌︎','♍︎','♎︎','♏︎','♐︎','♑︎','♒︎','♓︎','🙰','🙵','●︎','❍︎','■︎','□︎','◻︎','❑︎','❒︎','⬧︎','⧫︎','◆︎','❖︎','⬥︎','⌧︎','⍓︎','⌘︎','\\✌','👌︎','👍︎','👎︎','☜︎','☞︎','☝︎','☟︎','✋︎','☺︎','😐︎','☹︎','💣︎','☠︎','⚐︎','🏱︎','✈︎','☼︎','💧︎','❄︎','🕆︎','✞︎','🕈︎','✠︎','✡︎','\\☪'];

function replaceText(text: string, from: string[], to: string[]) {
	for (let i = 0; i < 26 * 2; i++) {
		text = text.replaceAll(from[i], to[i]);
	}
	return text;
}

const Fun: Command = {
	permissionLevel: PermissionLevel.EVERYONE,
	canBeExecutedWithoutPriorGuildSetup: true,

	data: new SlashCommandBuilder()
		.setName('fun')
		.setDescription('Fun text commands.')
		.addSubcommandGroup(group => group
			.setName('text')
			.setDescription('Fun commands that print funny text.')
			.addSubcommand(subcommand => subcommand
				.setName('square')
				.setDescription('Squareify the input text.')
				.addStringOption(option => option
					.setName('text')
					.setDescription('Text to make square')
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('bubble')
				.setDescription('Bubbleify the input text.')
				.addStringOption(option => option
					.setName('text')
					.setDescription('Text to make bubbly')
					.setRequired(true))
				.addBooleanOption(option => option
					.setName('invert')
					.setDescription('Invert bubble filling')))
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
				.setName('wingdings')
				.setDescription('Wingdingsify the input text.')
				.addStringOption(option => option
					.setName('text')
					.setDescription('Text to make wingdings')
					.setRequired(true)))
			.addSubcommand(subcommand => subcommand
				.setName('uwuify')
				.setDescription('UwUify the input text.')
				.addStringOption(option => option
					.setName('text')
					.setDescription('Text to UwUify')
					.setRequired(true))))
		.addSubcommandGroup(group => group
			.setName('image')
			.setDescription('Fun commands to modify images.')
			.addSubcommand(subcommand => subcommand
				.setName('speechbubble')
				.setDescription('Add a transparent speech bubble to the given image.')
				.addAttachmentOption(option => option
					.setName('image')
					.setDescription('The image to add a speech bubble to')
					.setRequired(true))
				.addNumberOption(option => option
					.setName('x')
					.setDescription('The X position of the tip of the speech bubble, from 0-1 (with (0,0) as the top left of the image)')
					.setMinValue(0)
					.setMaxValue(1))
				.addNumberOption(option => option
					.setName('y')
					.setDescription('The Y position of the tip of the speech bubble, from 0-1 (with (0,0) as the top left of the image)')
					.setMinValue(0)
					.setMaxValue(1)))
			.addSubcommand(subcommand => subcommand
				.setName('overlay')
				.setDescription('Overlay a given image over the base image.')
				.addAttachmentOption(option => option
					.setName('base')
					.setDescription('The base image')
					.setRequired(true))
				.addAttachmentOption(option => option
					.setName('overlay')
					.setDescription('The image to overlay on top of the base image')
					.setRequired(true))
				.addNumberOption(option => option
					.setName('opacity')
					.setDescription('The opacity of the overlay image, from 0-100 (default 30)')
					.setMinValue(0)
					.setMaxValue(100)))),

	async execute(interaction: CommandInteraction) {
		if (!interaction.isChatInputCommand() || !interaction.channel) return;

		switch (interaction.options.getSubcommandGroup()) {
		case 'text': {
			const text = interaction.options.getString('text', true);

			switch (interaction.options.getSubcommand()) {
			case 'square': {
				return interaction.reply(replaceText(text, regular, square));
			}

			case 'bubble': {
				if (interaction.options.getBoolean('invert')) {
					return interaction.reply(replaceText(text, regular, bubbleFilled));
				} else {
					return interaction.reply(replaceText(text, regular, bubble));
				}
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

			case 'wingdings': {
				return interaction.reply(replaceText(text, regular, wingdings));
			}

			case 'uwuify': {
				return interaction.reply(escapeSpecialCharacters(uwuify(text)));
			}
			}
			break;
		}
		case 'image': {
			switch (interaction.options.getSubcommand()) {
			case 'speechbubble': {
				const image = interaction.options.getAttachment('image', true);
				if (!image.contentType || !image.contentType.startsWith('image')) {
					return interaction.reply({ content: 'File attached does not appear to be an image!', ephemeral: true });
				}

				const imageResponse = await fetch(image.url);
				if (!imageResponse.body) {
					return interaction.reply({ content: 'Unable to download attachment.', ephemeral: true });
				}

				await interaction.deferReply();

				let imageName = 'image';
				if (image.name) {
					imageName = image.name.slice(0, image.name.lastIndexOf('.'));
				}

				const imageBuf = Buffer.from(await imageResponse.arrayBuffer());

				const tipX = interaction.options.getNumber('x');
				const tipY = interaction.options.getNumber('y');

				const drawSpeechBubble = (ctx: CanvasRenderingContext2D, width: number, height: number, fillColor?: string) => {
					ctx.save();
					ctx.beginPath();
					const semiMajor = width / 1.9;
					const semiMajorSquared = Math.pow(semiMajor, 2);
					const semiMinor = height / 6;
					const semiMinorSquared = Math.pow(semiMinor, 2);
					ctx.ellipse(width / 2, 0, semiMajor, semiMinor, 0, 0, 2 * Math.PI);
					ctx.moveTo(width / 2, semiMinor);
					ctx.lineTo(tipX ? tipX * width : semiMajor, tipY ? tipY * height : height / 3);
					// i'm a genius
					const endPointX = width / 2.5;
					const endPointY = Math.sqrt(semiMinorSquared - ((Math.pow(endPointX, 2) * semiMinorSquared) / semiMajorSquared));
					ctx.lineTo(endPointX, endPointY);
					ctx.clip();
					if (fillColor) {
						ctx.fillStyle = fillColor;
						ctx.fillRect(0, 0, width, height);
					} else {
						ctx.clearRect(0, 0, width, height);
					}
					ctx.restore();
				};

				let attachment: AttachmentBuilder;
				const gif = image.contentType.endsWith('gif');
				if (!gif) {
					const drawableImage = await loadImage(imageBuf);
					const canvas = createCanvas(drawableImage.width, drawableImage.height);
					const ctx = canvas.getContext('2d');

					ctx.drawImage(drawableImage, 0, 0);
					drawSpeechBubble(ctx, canvas.width, canvas.height);

					attachment = new AttachmentBuilder(canvas.createPNGStream())
						.setName(`${imageName}_speech_bubble.png`);
				} else {
					const gif = parseGIF(imageBuf);
					const frames = decompressFrames(gif, true);

					const tempCanvas = createCanvas(frames[0].dims.width, frames[0].dims.height);
					const tempCtx = tempCanvas.getContext('2d');
					const gifCanvas = createCanvas(tempCanvas.width, tempCanvas.height);
					const gifCtx = gifCanvas.getContext('2d');

					const encoder = new GIFEncoder(gifCanvas.width, gifCanvas.height);
					encoder.setDispose(1);
					encoder.setRepeat(0);
					encoder.writeHeader();

					const outputBufChunks: Buffer[] = [];
					encoder.on('data', chunk => {
						outputBufChunks.push(chunk);
					});

					let frameImageData: ImageData | undefined = undefined;
					for (const frame of frames) {
						if (!frameImageData || frame.dims.width != frameImageData.width || frame.dims.height != frameImageData.height) {
							tempCanvas.width = frame.dims.width;
							tempCanvas.height = frame.dims.height;
							frameImageData = tempCtx.createImageData(frame.dims.width, frame.dims.height);
						}
						frameImageData.data.set(frame.patch);
						tempCtx.putImageData(frameImageData, 0, 0);
						gifCtx.drawImage(tempCanvas, frame.dims.left, frame.dims.top);
						drawSpeechBubble(gifCtx, frame.dims.width, frame.dims.height, '#313338');

						encoder.setDelay(frame.delay);
						encoder.addFrame(gifCtx.getImageData(0, 0, gifCanvas.width, gifCanvas.height).data);
					}
					encoder.finish();
					const outputBuf = Buffer.concat(outputBufChunks);

					if ((getUploadLimitForChannel(interaction.channel) * 1024 * 1024) <= outputBuf.length) {
						return interaction.editReply(`Sorry, the processed GIF is too big to upload! It weighs in at ${(outputBuf.length / 1024 / 1024).toFixed(2)}mb.`);
					}

					attachment = new AttachmentBuilder(outputBuf)
						.setName(`${imageName}_speech_bubble.gif`);
				}
				return interaction.editReply({ files: [attachment] });
			}

			case 'overlay': {
				const base = interaction.options.getAttachment('base', true);
				const overlay = interaction.options.getAttachment('overlay', true);

				if (!base.contentType || !base.contentType.startsWith('image')) {
					return interaction.reply({ content: 'File attached for `base` does not appear to be an image!', ephemeral: true });
				}
				if (!overlay.contentType || !overlay.contentType.startsWith('image')) {
					return interaction.reply({ content: 'File attached for `overlay` does not appear to be an image!', ephemeral: true });
				}

				const baseResponse = await fetch(base.url);
				if (!baseResponse.body) {
					return interaction.reply({ content: 'Unable to download attachment.', ephemeral: true });
				}
				const overlayResponse = await fetch(overlay.url);
				if (!overlayResponse.body) {
					return interaction.reply({ content: 'Unable to download attachment.', ephemeral: true });
				}

				const baseBuf = Buffer.from(await baseResponse.arrayBuffer());
				const drawableImageBase = await loadImage(baseBuf);
				const overlayBuf = Buffer.from(await overlayResponse.arrayBuffer());
				const drawableImageOverlay = await loadImage(overlayBuf);

				const canvas = createCanvas(drawableImageBase.width, drawableImageBase.height);
				const ctx = canvas.getContext('2d');

				ctx.drawImage(drawableImageBase, 0, 0);
				ctx.globalAlpha = (interaction.options.getNumber('opacity') ?? 30) / 100;
				ctx.drawImage(drawableImageOverlay, 0, 0, canvas.width, canvas.height);

				let baseName = 'image';
				if (base.name) {
					baseName = base.name.slice(0, base.name.lastIndexOf('.'));
				}
				const attachment = new AttachmentBuilder(canvas.createPNGStream())
					.setName(`${baseName}_plus_overlay.png`);
				return interaction.reply({ files: [attachment] });
			}
			}
			break;
		}
		}
	}
};
export default Fun;
