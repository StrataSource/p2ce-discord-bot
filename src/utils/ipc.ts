import {Server, connect} from 'net';
import {ipc_port} from '../config.json';
import {Collection} from 'discord.js';
import * as log from './log';

const requestHandlers: Collection<string, () => void> = new Collection();

export function on( event: string, handler: () => void) {
	log.writeToLog( undefined, `A listener for the event ${event} was registered` );
	requestHandlers.set( event, handler );
}
export function send( message: string ) {
	log.writeToLog( undefined, `Sending command '${message}' to running instance..` );
	const connection = connect(ipc_port);
	connection.on('ready', () => {
		connection.on('drain', () => connection.destroy() );
		if ( connection.write(message) )
			connection.destroy();
	});
}
export async function listen() {
	log.writeToLog( undefined, `Listening for commands at ${ipc_port}!` );
	const server = new Server();
	server.on('connection', connection => {
		connection.on('data', data => {
			log.writeToLog( undefined, `Received command '${data.toString()}'!` );
			requestHandlers.get( data.toString() )?.();
		});
	});
	await server.listen( ipc_port );
}
