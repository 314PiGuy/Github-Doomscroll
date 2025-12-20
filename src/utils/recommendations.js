const CLUSTERS = {
  'Machine Learning & AI': [
    'machine learning', 'ai', 'deep learning', 'neural network', 'tensorflow', 'pytorch', 
    'computer vision', 'nlp', 'generative ai', 'llm', 'gpt', 'multimodal',
    'reinforcement learning', 'huggingface', 'transformers', 'agentic', 'data mining', 'bayesian networks',
    'unsupervised learning', 'supervised learning', 'semi-supervised learning', 'clustering', 'classification'
  ],
  'Web Development': [
    'react', 'vue', 'angular', 'svelte', 'nextjs', 'javascript', 'typescript', 'html', 'css',
    'node', 'express', 'django', 'flask', 'rails', 'laravel', 'spring-boot', 'graphql', 
    'tailwind', 'bootstrap', 'webpack', 'vite', 'wasm', 'web components', 'frontend', 'backend',
    'fullstack', 'api development', 'rest api', 'web performance', 'seo', 'web accessibility'
  ],
  'Systems & Low Level': [
    'rust', 'cpp', 'c', 'go', 'assembly', 'kernel', 'operating system', 'embedded', 
    'arduino', 'raspberry pi', 'driver', 'firmware', 'system design', 'compiler', 'interpreter',
    'real-time systems', 'microcontrollers', 'bare metal programming', 'low latency', 'concurrency',
    'parallel computing', 'threading', 'memory management', 'file systems', 'network protocols'
  ],
  'Mobile & App Dev': [
    'ios', 'android', 'flutter', 'react-native', 'swift', 'kotlin', 'mobile', 'expo', 'ionic',
    'cross-platform', 'native development', 'mobile ux', 'mobile performance', 'app store optimization'
  ],
  'Game Development': [
    'game development', 'unity', 'unreal engine', 'godot', 'gamedev', 'graphics', 'shader', 
    'opengl', 'vulkan', 'threejs', 'webgl', 'game physics', 'game ai', 'game engines',
    'level design', 'game mechanics', 'multiplayer games', 'game networking', 'procedural generation'
  ],
  'DevOps & Cloud': [
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'ci-cd', 
    'devops', 'serverless', 'microservices', 'nginx', 'linux', 'bash', 'shell',
    'cloud architecture', 'infrastructure as code', 'monitoring', 'logging', 'load balancing',
    'scalability', 'high availability', 'disaster recovery', 'cloud security', 'cloud storage'
  ],
  'Tools & Productivity': [
    'vim', 'neovim', 'emacs', 'vscode extension', 'cli', 'terminal', 'productivity', 
    'automation', 'bot', 'scraper', 'utility', 'task runners', 'build tools', 'code linters',
    'formatters', 'debugging tools', 'shell scripting', 'workflow automation', 'time management'
  ],
  'Security & Blockchain': [
    'security', 'hacking', 'cryptography', 'blockchain', 'ethereum', 'bitcoin', 'smart contracts', 
    'solidity', 'web3', 'pentesting', 'malware', 'zero trust', 'cybersecurity', 'vulnerability scanning',
    'incident response', 'forensics', 'blockchain scalability', 'decentralized finance', 'nft', 'dapps'
  ],
  'Data & Database': [
    'database', 'sql', 'nosql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 
    'big data', 'analytics', 'visualization', 'data pipelines', 'data warehousing', 'etl',
    'data lakes', 'streaming data', 'real-time analytics', 'data governance', 'data modeling'
  ]
};

// Flatten keywords for easy lookup
const KEYWORD_TO_CLUSTER = {};
Object.entries(CLUSTERS).forEach(([cluster, keywords]) => {
  keywords.forEach(k => KEYWORD_TO_CLUSTER[k] = cluster);
});

const STORAGE_KEY = 'repo_recommendation_weights_v2';

const softmax = (weights) => {
  const values = Object.values(weights);
  const max = Math.max(...values); // For numerical stability
  const expValues = values.map(v => Math.exp(v - max));
  const sumExp = expValues.reduce((a, b) => a + b, 0);
  
  return Object.keys(weights).reduce((acc, key, i) => {
    acc[key] = expValues[i] / sumExp;
    return acc;
  }, {});
};

const selectFromWeights = (weights) => {
  const probs = softmax(weights);
  let random = Math.random();
  
  // Sort keys to ensure deterministic order for iteration
  const keys = Object.keys(probs);
  
  for (const key of keys) {
    const prob = probs[key];
    if (random < prob) return key;
    random -= prob;
  }
  
  return keys[keys.length - 1];
};

export const getWeights = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse weights", e);
    }
  }
  
  // Initialize with default logits (0.0 implies e^0 = 1)
  const clusterWeights = {};
  Object.keys(CLUSTERS).forEach(c => clusterWeights[c] = 0.0);
  
  const keywordWeights = {};
  Object.values(CLUSTERS).flat().forEach(k => keywordWeights[k] = 0.0);
  
  return { clusters: clusterWeights, keywords: keywordWeights };
};

export const saveWeights = (weights) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
};

export const getNextKeyword = () => {
  const { clusters, keywords } = getWeights();
  
  // 1. Select Cluster
  const selectedCluster = selectFromWeights(clusters);
  
  // 2. Select Keyword from Cluster
  const clusterKeywords = CLUSTERS[selectedCluster];
  const clusterKeywordWeights = {};
  
  clusterKeywords.forEach(k => {
    // Use stored weight or default 0.0
    clusterKeywordWeights[k] = keywords[k] !== undefined ? keywords[k] : 0.0;
  });
  
  return selectFromWeights(clusterKeywordWeights);
};

export const updatePreference = (keyword, liked) => {
  // Normalize keyword
  let normalizedKeyword = keyword.toLowerCase();
  
  // Simple mapping for common mismatches
  const mappings = {
    'c++': 'cpp',
    'c#': 'csharp',
    'vue.js': 'vue',
    'react.js': 'react'
  };
  if (mappings[normalizedKeyword]) normalizedKeyword = mappings[normalizedKeyword];

  const weights = getWeights();
  const cluster = KEYWORD_TO_CLUSTER[normalizedKeyword];
  
  // We use logits, so we add/subtract
  const delta = liked ? 1.0 : -1.0;
  
  // Only update if we know about this keyword
  if (cluster) {
    // Update keyword weight
    if (weights.keywords[normalizedKeyword] === undefined) weights.keywords[normalizedKeyword] = 0.0;
    weights.keywords[normalizedKeyword] += delta;
    
    // Update cluster weight
    if (weights.clusters[cluster] === undefined) weights.clusters[cluster] = 0.0;
    weights.clusters[cluster] += delta;
    
    saveWeights(weights);
    console.log(`Updated preferences for ${normalizedKeyword} (${cluster}): ${liked ? 'Like' : 'Dislike'}`);
  } else {
    console.log(`Keyword ${normalizedKeyword} not found in clusters, skipping update.`);
  }
};
