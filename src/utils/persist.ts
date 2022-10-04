import fs from 'fs';
import { PersistentData } from '../types/persist';

const serverData = new Map<string, PersistentData>();

function getDataURL(guildID: string) { 
	return `./cache/guild_${guildID}.json`;
}

export function loadData(guildID: string) {
	const dataURL = getDataURL(guildID);
	if (!fs.existsSync(dataURL)) {
		fs.writeFileSync(dataURL, fs.readFileSync('./cache/default.json'));
	}
	serverData.set(guildID, JSON.parse(fs.readFileSync(dataURL).toString()));
}

export function data(guildID: string): PersistentData {
	if (!serverData.has(guildID)) {
		loadData(guildID);
	}
	// thanks TypeScript
	return serverData.get(guildID) ?? ({} as PersistentData);
}

export function saveData(guildID: string) {
	fs.writeFileSync(getDataURL(guildID), JSON.stringify(data(guildID), undefined, '\t') + '\n');
}

export function saveAll() {
	for (const guildID of serverData.keys()) {
		saveData(guildID);
	}
}
