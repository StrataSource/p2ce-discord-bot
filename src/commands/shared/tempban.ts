import {MoralityCoreClient} from '../../types/client';

import * as persist from '../../utils/persist';
import {resume} from '../../utils/scheduler';
import { ok as assert } from 'assert';
import {ScheduledTask} from '../../types/scheduler';

export function register( client: MoralityCoreClient ): void {
	for ( const guild of client.guilds.valueOf().values() )
		for ( const { taskId } of persist.data(guild.id).moderation.tempban )
			resume( guild.id, taskId, unbanHandler );
}

export function unbanHandler( task: ScheduledTask, data: unknown ): void {
	assert( data instanceof { guild: String }, 'unbanHandler was passed a non-string parameter!!' );

	const client = MoralityCoreClient.get();
	client.guilds.fetch(  )
}