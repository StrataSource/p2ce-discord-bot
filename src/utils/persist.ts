import fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export let data: any = {};

export function loadData() {
	if (!fs.existsSync('./data.json')) {
		fs.writeFileSync('./data.json', fs.readFileSync('./data_default.json'));
	}
	data = JSON.parse(fs.readFileSync('./data.json').toString());
}

export function saveData() {
	fs.writeFileSync('./data.json', JSON.stringify(data, undefined, '\t') + '\n');
}
