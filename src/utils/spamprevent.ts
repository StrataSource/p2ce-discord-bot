import { Message } from 'discord.js';

import * as config from '../config.json';

export async function messageIsSpam(msg: Message<boolean>): Promise<boolean | undefined> {

    if (msg.mentions.users.size > config.options.maxMentions)
        return true;
    return false;
    
}