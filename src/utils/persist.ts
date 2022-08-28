import fs from 'fs';

import * as config from '../config.json';

// Modify this interface when adding new data things, or don't if you hate TypeScript and everything it stands for
export interface PersistentData {
	reaction_roles: {
		[message: string]: {
			channel: string,
			roles: Array<{
				emoji_name: string,
				role: string,
			}>,
		},
	};
	watched_threads: Array<string>;
	statistics: {
		joins: number,
		leaves: number
	}
}

export let data: PersistentData;

const dataURL = `./data_${config.guild}.json`;

export function loadData() {
	if (!fs.existsSync(dataURL)) {
		fs.writeFileSync(dataURL, fs.readFileSync('./data.default.json'));
	}
	data = JSON.parse(fs.readFileSync(dataURL).toString());
}

export function saveData() {
	fs.writeFileSync(dataURL, JSON.stringify(data, undefined, '\t') + '\n');
}
