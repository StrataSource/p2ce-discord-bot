import fs from 'fs';

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
}

export let data: PersistentData;

export function loadData() {
	if (!fs.existsSync('./data.json')) {
		fs.writeFileSync('./data.json', fs.readFileSync('./data_default.json'));
	}
	data = JSON.parse(fs.readFileSync('./data.json').toString());
}

export function saveData() {
	fs.writeFileSync('./data.json', JSON.stringify(data, undefined, '\t') + '\n');
}
