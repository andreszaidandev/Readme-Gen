import type { RepoInfo } from '../types';

const GITHUB_REPO_URL_PATTERN = /^https?:\/\/github\.com\/([^/]+)\/([^/#?]+?)(?:\.git)?(?:\/)?(?:[#?].*)?$/i;

type GitTreeResponse = {
  tree?: Array<{ path: string }>;
};

function parseRepositoryUrl(repoUrl: string): { owner: string; repo: string } {
  const trimmedUrl = repoUrl.trim();
  const match = trimmedUrl.match(GITHUB_REPO_URL_PATTERN);

  if (!match) {
    throw new Error('Invalid GitHub URL. Use this format: https://github.com/owner/repo');
  }

  const owner = match[1];
  const repo = match[2];

  return { owner, repo };
}

export async function fetchRepoInfo(repoUrl: string): Promise<RepoInfo> {
  const { owner, repo } = parseRepositoryUrl(repoUrl);
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Repository not found. Confirm that the repository is public and the URL is correct.');
    }
    if (response.status === 403) {
      throw new Error('GitHub API rate limit hit. Wait a few minutes and try again.');
    }
    throw new Error('Failed to fetch repository information from GitHub.');
  }

  return response.json();
}

export async function fetchRepoTree(owner: string, repo: string, branch: string): Promise<string[]> {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as GitTreeResponse;
  return (data.tree ?? []).map((file) => file.path);
}
