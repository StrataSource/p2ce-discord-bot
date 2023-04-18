import { GitHubIssue } from '../types/github';
import { Octokit } from 'octokit';
import { createAppAuth } from '@octokit/auth-app';

import * as config from '../config.json';
import * as persist from '../utils/persist';

// Octokit instance for GitHub api stuff
let octokit: Octokit | null = null;
if (config.github.auth.app_id > 0) {
	octokit = new Octokit({ authStrategy: createAppAuth, auth: {
		privateKey: config.github.auth.private_key,
		appId: config.github.auth.app_id,
		installationId: config.github.auth.installation_id,
		clientId: config.github.auth.client_id,
		clientSecret: config.github.auth.client_secret,
	}});
}

// This will and should be lost when the bot restarts
const ISSUE_CACHE = new Map<string, { issues: GitHubIssue[], time: number }>();

export async function getIssuesInRepo(guildID: string, repo: string) {
	if (!octokit) {
		return null;
	}

	const identifier = `${guildID}_${repo}`;
	if (ISSUE_CACHE.has(identifier)) {
		const cache = ISSUE_CACHE.get(identifier) ?? { issues: [], time: 0 };
		if (cache.time > Date.now()) {
			return cache.issues;
		}
	}

	const repoInfo = persist.data(guildID).github_repos[repo];
	const issues: GitHubIssue[] = [];
	let empty = false;
	let page = 1;
	while (!empty) {
		const issuesRaw = await octokit.rest.issues.listForRepo({
			owner: repoInfo.owner,
			repo: repoInfo.name,
			page: page++,
			per_page: 50,
			state: 'all',
		});
		for (const issue of issuesRaw.data) {
			issues.push(issue as GitHubIssue);
		}
		empty = (issuesRaw.data.length === 0);

		ISSUE_CACHE.set(identifier, { issues: issues, time: Date.now() + (config.github.search_page_cache_time * 1000 * 60) });
	}
	return issues;
}

export async function getIssueInRepo(guildID: string, repo: string, issueID: number) {
	if (!octokit) {
		return null;
	}

	const repoInfo = persist.data(guildID).github_repos[repo];
	const issue = await octokit.rest.issues.get({
		owner: repoInfo.owner,
		repo: repoInfo.name,
		issue_number: issueID,
		state: 'all',
	});
	return issue.data as GitHubIssue;
}

export async function searchIssuesInRepo(guildID: string, repo: string, query: string, open?: boolean | null | undefined) {
	return getIssuesInRepo(guildID, repo).then(issues => issues?.filter(issue => {
		const inTitle = issue.title.toLowerCase().includes(query.toLowerCase());
		const inBody = issue.body && issue.body.toLowerCase().includes(query.toLowerCase());
		return (inTitle || inBody) && (!open || issue.state === 'open');
	}));
}
