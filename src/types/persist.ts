// Modify this interface when adding new data things, or don't if you hate TypeScript and everything it stands for
export interface PersistentData {
	config: {
		first_time_setup: boolean,
		enable_p2ce_commands: boolean,
		log: {
			options: {
				user_updates: boolean,
				user_avatar_updates: boolean,
				user_bans: boolean,
				user_joins_and_leaves: boolean,
				message_deletes: boolean,
				message_edits: boolean
			},
			channel: string,
			user_exceptions: string[],
		},
		roles: {
			moderator: string,
			team_member?: string | undefined,
		}
	},
	autoroles: string[],
	github_repos: {
		[id: string]: {
			owner: string,
			name: string,
		},
	},
	reaction_roles: {
		[message: string]: {
			channel: string,
			roles: Array<{
				emoji_name: string,
				role: string,
			}>,
		},
	},
	responses: {
		[response_id: string]: string,
	},
	watched_threads: Array<string>,
	statistics: {
		joins: number,
		leaves: number,
	},
}
