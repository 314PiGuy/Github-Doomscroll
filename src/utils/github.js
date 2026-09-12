const API_URL = 'https://api.github.com';
const memoryCache = new Map();
const pendingRequests = new Map();

export class GitHubApiError extends Error {
  constructor(message, status, resetAt) {
    super(message);
    this.name = 'GitHubApiError';
    this.status = status;
    this.resetAt = resetAt;
  }
}

const cacheKey = (url, token) => `${token ? 'auth' : 'public'}:${url}`;

const getCached = (key) => {
  const inMemory = memoryCache.get(key);
  if (inMemory?.expiresAt > Date.now()) return inMemory.value;

  try {
    const stored = JSON.parse(sessionStorage.getItem(`github-cache:${key}`));
    if (stored?.expiresAt > Date.now()) {
      memoryCache.set(key, stored);
      return stored.value;
    }
  } catch {
    // Storage can be unavailable or full; the in-memory cache still works.
  }
  return undefined;
};

const setCached = (key, value, ttl) => {
  const entry = { value, expiresAt: Date.now() + ttl };
  memoryCache.set(key, entry);
  try {
    sessionStorage.setItem(`github-cache:${key}`, JSON.stringify(entry));
  } catch {
    // Large READMEs and private browsing may exceed session storage.
  }
};

const githubRequest = async (path, {
  token,
  accept = 'application/vnd.github+json',
  responseType = 'json',
  ttl = 10 * 60 * 1000,
  cache = true,
} = {}) => {
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const key = cacheKey(url, token);
  const cached = cache ? getCached(key) : undefined;
  if (cached !== undefined) return cached;
  if (pendingRequests.has(key)) return pendingRequests.get(key);

  const request = fetch(url, {
    headers: {
      Accept: accept,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      'X-GitHub-Api-Version': '2022-11-28',
    },
  }).then(async (response) => {
    if (!response.ok) {
      const resetHeader = Number(response.headers.get('x-ratelimit-reset'));
      const resetAt = resetHeader ? new Date(resetHeader * 1000) : null;
      const isLimited = response.status === 403 || response.status === 429;
      throw new GitHubApiError(
        isLimited ? 'GitHub request limit reached.' : `GitHub returned ${response.status}.`,
        response.status,
        resetAt,
      );
    }
    const value = responseType === 'text' ? await response.text() : await response.json();
    if (cache) setCached(key, value, ttl);
    return value;
  }).finally(() => pendingRequests.delete(key));

  pendingRequests.set(key, request);
  return request;
};

export const searchRepositories = async ({ query, page = 1 }, token, options = {}) => {
  const params = new URLSearchParams({
    q: query,
    per_page: String(options.resultsPerQuery || 40),
    page: String(page),
  });
  const data = await githubRequest(`/search/repositories?${params}`, {
    token,
    ttl: (options.searchCacheMinutes ?? 15) * 60 * 1000,
    cache: options.requestCacheEnabled ?? true,
  });
  return data.items || [];
};

// Search requests are deliberately sequential. Parallel calls are faster for a
// moment, but are more likely to trigger GitHub's secondary rate limiter.
export const searchRepositoryBatch = async (plan, token, options = {}) => {
  if (options.sequentialSearches === false) {
    return Promise.all(plan.map(async (request) => ({
      ...request,
      items: await searchRepositories(request, token, options),
    })));
  }

  const results = [];
  let lastError;
  for (const request of plan) {
    try {
      const items = await searchRepositories(request, token, options);
      results.push({ ...request, items });
    } catch (error) {
      lastError = error;
      // A limit response applies to the following calls too, so stop the batch.
      if (error.status === 403 || error.status === 429) break;
    }
  }
  if (!results.length && lastError) throw lastError;
  return results;
};

export const getReadme = (repo, token, options = {}) => githubRequest(
  `/repos/${repo.owner.login}/${repo.name}/readme`,
  {
    token,
    accept: 'application/vnd.github.raw+json',
    responseType: 'text',
    ttl: (options.contentCacheMinutes ?? 60) * 60 * 1000,
    cache: options.requestCacheEnabled ?? true,
  },
).catch((error) => {
  if (error.status === 404) return null;
  throw error;
});

export const getRepoTree = async (repo, token, options = {}) => {
  const branch = encodeURIComponent(repo.default_branch || 'main');
  const data = await githubRequest(
    `/repos/${repo.owner.login}/${repo.name}/git/trees/${branch}?recursive=1`,
    {
      token,
      ttl: (options.contentCacheMinutes ?? 60) * 60 * 1000,
      cache: options.requestCacheEnabled ?? true,
    },
  );
  return (data.tree || []).filter((item) => item.type === 'blob');
};

export const getFileContent = (repo, path, token, options = {}) => {
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const ref = encodeURIComponent(repo.default_branch || 'main');
  return githubRequest(
    `/repos/${repo.owner.login}/${repo.name}/contents/${encodedPath}?ref=${ref}`,
    {
      token,
      accept: 'application/vnd.github.raw+json',
      responseType: 'text',
      ttl: (options.contentCacheMinutes ?? 60) * 60 * 1000,
      cache: options.requestCacheEnabled ?? true,
    },
  );
};
