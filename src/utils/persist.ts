import fs from 'fs';
import { PersistentData } from '../types/persist';

const guildData = new Map<string, PersistentData>();

export function getDataFilepath(guildID: string) { 
	return `./db/guild_${guildID}.json`;
}

function loadData(guildID: string) {
	const dataPath = getDataFilepath(guildID);
	if (!fs.existsSync(dataPath)) {
		fs.writeFileSync(dataPath, fs.readFileSync('./db/default.json'));
	}
	guildData.set(guildID, JSON.parse(fs.readFileSync(dataPath).toString()));
}

export function data(guildID: string): PersistentData {
	if (!guildData.has(guildID)) {
		loadData(guildID);
	}
	// thanks TypeScript
	return guildData.get(guildID) ?? ({} as PersistentData);
}

export function saveData(guildID: string) {
	fs.writeFileSync(getDataFilepath(guildID), JSON.stringify(data(guildID), undefined, '\t') + '\n');
}

export function saveAll() {
	for (const guildID of guildData.keys()) {
		saveData(guildID);
	}
}
