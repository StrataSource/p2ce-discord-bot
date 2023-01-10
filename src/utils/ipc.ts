import { Server, connect } from 'net';
import { ipc_port } from '../config.json';
import { Collection } from 'discord.js';
import { writeToLog } from './log';

const requestHandlers: Collection<string, () => void> = new Collection();

export function on(event: string, handler: () => void) {
	console.debug(`A listener for the event ${event} was registered`);
	requestHandlers.set(event, handler);
}

export function send(message: string) {
	console.log(`Sending command '${message}' to running instance..`);
	try {
		const connection = connect(ipc_port);
		connection.on('ready', () => {
			connection.on('drain', () => connection.destroy());
			if (connection.write(message))
				connection.destroy();
		});
	} catch (e) {
		console.log('Unable to send message! Check if application is actually running.');
	}
}

export async function listen() {
	console.log(`Listening for commands at ${ipc_port}!`);
	const server = new Server();
	server.on('connection', connection => {
		connection.on('data', data => {
			writeToLog(undefined, `Received command '${data.toString()}'!`);
			requestHandlers.get(data.toString())?.();
		});
	});
	server.listen(ipc_port);
}
