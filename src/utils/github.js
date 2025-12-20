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

export const getRandomCodeFiles = async (owner, repo, token, count = 5) => {
  // BFS or DFS to find code files. Limit depth to avoid too many requests.
  
  try {
    const rootFiles = await getRepoFiles(owner, repo, '', token);
    if (!Array.isArray(rootFiles)) return [];

    // Filter for interesting code files
    const codeExtensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.rs', '.go', '.java', '.c', '.cpp', '.h', '.css', '.html', '.json'];
    const excludedPatterns = ['build', 'dist', 'config', 'license', 'package', 'lock', 'test', 'spec', 'node_modules', 'vendor', 'bin', 'obj'];
    
    const isInteresting = (file) => {
      if (file.type !== 'file') return false;
      const name = file.name.toLowerCase();
      if (excludedPatterns.some(p => name.includes(p))) return false;
      return codeExtensions.some(ext => name.endsWith(ext));
    };

    let candidates = rootFiles.filter(isInteresting);
    
    // If not enough code files in root, try one level deep in random folders
    if (candidates.length < count) {
      const folders = rootFiles.filter(f => f.type === 'dir' && !f.name.startsWith('.'));
      // Shuffle folders to explore randomly
      const shuffledFolders = folders.sort(() => Math.random() - 0.5).slice(0, 3); // Check up to 3 folders
      
      for (const folder of shuffledFolders) {
        const subFiles = await getRepoFiles(owner, repo, folder.path, token);
        if (Array.isArray(subFiles)) {
           const subCandidates = subFiles.filter(isInteresting);
           candidates = [...candidates, ...subCandidates];
        }
        if (candidates.length >= count * 2) break; // Stop if we have plenty
      }
    }
    
    if (candidates.length > 0) {
      // Shuffle and pick 'count' files
      const selectedFiles = candidates.sort(() => Math.random() - 0.5).slice(0, count);
      
      const filesWithContent = await Promise.all(selectedFiles.map(async (file) => {
        try {
          const contentRes = await fetch(file.download_url);
          return {
            name: file.name,
            path: file.path,
            content: await contentRes.text()
          };
        } catch (e) {
          return null;
        }
      }));
      
      return filesWithContent.filter(f => f !== null);
    }
  } catch (e) {
    console.error("Error fetching code files", e);
  }
  return [];
};
