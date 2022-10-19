import {PartialUser, User} from 'discord.js';

export function format( user: User | PartialUser ) {
	return `${user.username}#${user.discriminator}`;
}
