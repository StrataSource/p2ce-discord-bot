import { Octokit } from 'octokit';
import { GitHubIssue } from '../types/github';

import * as config from '../config.json';
import * as persist from '../utils/persist';

// Octokit instance for GitHub api stuff
const octokit = new Octokit({ auth: config.github_token });

// This will and should be lost when the bot restarts
const ISSUE_CACHE = new Map<string, { issues: GitHubIssue[], time: number }>();

export async function getIssuesInRepo(guildID: string, repo: string) {
	const identifier = `${guildID}_${repo}`;
	if (ISSUE_CACHE.has(identifier) && (ISSUE_CACHE.get(identifier)?.time ?? 0) > Date.now()) {
		return ISSUE_CACHE.get(repo)?.issues ?? [];
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

export async function getIssueInRepo(guildID: string, repo: string, issueID: number): Promise<GitHubIssue | undefined> {
	const issues = await getIssuesInRepo(guildID, repo).then(issues => issues.filter(issue => issue.number === issueID));
	if (issues.length > 0) {
		return issues[0];
	}
	return undefined;
}

export async function searchIssuesInRepo(guildID: string, repo: string, query: string, open?: boolean | null | undefined) {
	return getIssuesInRepo(guildID, repo).then(issues => issues.filter(issue => {
		const inTitle = issue.title.toLowerCase().includes(query.toLowerCase());
		const inBody = issue.body && issue.body.toLowerCase().includes(query.toLowerCase());
		return (inTitle || inBody) && (!open || issue.state === 'open');
	}));
}
