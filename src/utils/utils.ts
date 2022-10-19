import {User} from 'discord.js';

export function format( user: User ) {
	return `${user.username}#${user.discriminator}`;
}
