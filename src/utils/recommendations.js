const KEYWORDS = [
  'react', 'vue', 'angular', 'svelte', 'nextjs', 'rust', 'python', 'javascript', 'typescript', 'go',
  'machine learning', 'ai', 'deep-learning', 'web-assembly', 'docker', 'kubernetes', 'blockchain',
  'game development', 'unity', 'unreal-engine', 'ios', 'android', 'flutter', 'react-native',
  'linux', 'devops', 'serverless', 'graphql', 'database', 'sql', 'nosql', 'algorithm',
  'data-structure', 'system-design', 'security', 'hacking', 'cryptography', 'robotics',
  'arduino', 'raspberry-pi', 'electron', 'tauri', 'vim', 'neovim', 'vscode-extension',
  'compiler', 'interpreter', 'operating-system', 'kernel', 'networking', 'protocol',
  'http', 'websocket', 'webrtc', 'threejs', 'webgl', 'shader', 'generative-art',
  'automation', 'bot', 'scraper', 'cli', 'terminal', 'shell', 'bash', 'zsh',
  'productivity', 'tool', 'utility', 'library', 'framework', 'api', 'sdk'
];

const STORAGE_KEY = 'repo_recommendation_weights';

export const getWeights = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  // Initialize with equal weights
  const weights = {};
  KEYWORDS.forEach(k => weights[k] = 1);
  return weights;
};

export const saveWeights = (weights) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
};

export const getNextKeyword = () => {
  const weights = getWeights();
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (const keyword of KEYWORDS) {
    const weight = weights[keyword] || 1; // Default to 1 if new keyword added
    if (random < weight) {
      return keyword;
    }
    random -= weight;
  }
  return KEYWORDS[Math.floor(Math.random() * KEYWORDS.length)];
};

export const updatePreference = (keyword, liked) => {
  const weights = getWeights();
  const currentWeight = weights[keyword] || 1;
  
  // Increase weight if liked, decrease if disliked
  // Ensure weight doesn't go below 0.1
  let newWeight = liked ? currentWeight * 1.5 : currentWeight * 0.5;
  if (newWeight < 0.1) newWeight = 0.1;
  
  weights[keyword] = newWeight;
  saveWeights(weights);
};
