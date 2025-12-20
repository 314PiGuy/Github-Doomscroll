const BASE_URL = 'https://api.github.com';

export const searchRepos = async (keyword, token, page = 1) => {
  const headers = token ? { Authorization: `token ${token}` } : {};
  // Sort by updated to get somewhat fresh stuff, or stars? 
  // Randomness is better achieved by random pages or random sorts if possible.
  // GitHub API doesn't support random sort.
  // We can sort by 'stars', 'forks', 'updated', 'help-wanted-issues'.
  // Let's pick a random sort order each time? Or just default to 'stars' for quality?
  // User wants "random repositories".
  
  const sorts = ['stars', 'forks', 'updated'];
  const sort = sorts[Math.floor(Math.random() * sorts.length)];
  
  const response = await fetch(
    `${BASE_URL}/search/repositories?q=${keyword}&sort=${sort}&per_page=30&page=${page}`,
    { headers }
  );
  
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.statusText}`);
  }
  
  return response.json();
};

export const getReadme = async (owner, repo, token) => {
  const headers = token ? { Authorization: `token ${token}` } : {};
  // Try to get README.md specifically or let GitHub auto-resolve
  const response = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/readme`,
    { headers: { ...headers, Accept: 'application/vnd.github.raw' } }
  );
  
  if (!response.ok) return null;
  return response.text();
};

export const getRepoFiles = async (owner, repo, path = '', token) => {
  const headers = token ? { Authorization: `token ${token}` } : {};
  const response = await fetch(
    `${BASE_URL}/repos/${owner}/${repo}/contents/${path}`,
    { headers }
  );
  
  if (!response.ok) return [];
  return response.json();
};

export const getRandomCodeFile = async (owner, repo, token) => {
  // BFS or DFS to find a code file. Limit depth to avoid too many requests.
  // For simplicity, list root, pick a folder, list that, pick a file.
  
  try {
    const rootFiles = await getRepoFiles(owner, repo, '', token);
    if (!Array.isArray(rootFiles)) return null;

    // Filter for interesting code files
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.rs', '.go', '.java', '.c', '.cpp', '.h', '.css', '.html', '.json', '.md'];
    
    let candidates = rootFiles.filter(f => f.type === 'file' && codeExtensions.some(ext => f.name.endsWith(ext)));
    
    // If no code files in root, try one level deep in a random folder
    if (candidates.length === 0) {
      const folders = rootFiles.filter(f => f.type === 'dir' && !f.name.startsWith('.'));
      if (folders.length > 0) {
        const randomFolder = folders[Math.floor(Math.random() * folders.length)];
        const subFiles = await getRepoFiles(owner, repo, randomFolder.path, token);
        if (Array.isArray(subFiles)) {
           candidates = subFiles.filter(f => f.type === 'file' && codeExtensions.some(ext => f.name.endsWith(ext)));
        }
      }
    }
    
    if (candidates.length > 0) {
      const randomFile = candidates[Math.floor(Math.random() * candidates.length)];
      // Fetch content
      const headers = token ? { Authorization: `token ${token}` } : {};
      const res = await fetch(randomFile.download_url); // download_url is usually public, but for private repos (if token used) might need auth header on raw endpoint? 
      // Actually download_url works for public. For private, use the API blob endpoint or pass token?
      // The download_url usually redirects to raw.githubusercontent.com.
      // If we provide a token to the API, we should probably use the API to get content to be safe with private repos if the user has access.
      // But for this app, we are searching public repos mostly.
      
      // Better to use the API to get content (base64 encoded) to avoid CORS issues with raw.githubusercontent sometimes?
      // Actually raw.githubusercontent usually has CORS enabled.
      
      const contentRes = await fetch(randomFile.download_url);
      return {
        name: randomFile.name,
        path: randomFile.path,
        content: await contentRes.text()
      };
    }
  } catch (e) {
    console.error("Error fetching code file", e);
  }
  return null;
};
