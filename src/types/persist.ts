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
