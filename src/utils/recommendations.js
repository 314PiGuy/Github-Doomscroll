import topicsText from './topics.txt?raw';
import similarityMatrix from './similarity_matrix.json';

const TOPICS = topicsText.split('\n').map(t => t.trim()).filter(t => t);

const STORAGE_KEY = 'repo_recommendation_weights_v3';

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
  
  const weights = {};
  TOPICS.forEach(t => weights[t] = 0.0);
  return weights;
};

export const saveWeights = (weights) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weights));
};

export const getNextKeyword = () => {
  const weights = getWeights();
  return selectFromWeights(weights);
};

export const updatePreference = (keyword, liked) => {
  let normalizedKeyword = keyword.toLowerCase();

  const weights = getWeights();
  
  const targetIndex = TOPICS.indexOf(normalizedKeyword);
  
  if (targetIndex !== -1) {
    const sign = liked ? 1.0 : -1.0;
    
    weights[normalizedKeyword] += sign;
    
    // SImilarity matrix to update ALL other topics
    TOPICS.forEach((topic, index) => {
      if (index === targetIndex) return;
      
      const row = similarityMatrix[targetIndex];
      const similarity = row ? row[index] : 0;
      
      // change = (similarity - 0.5) * sign
      const change = (similarity - 0.5) * sign;
      
      weights[topic] += change;
    });
    
    saveWeights(weights);
    console.log(`Updated preferences for ${normalizedKeyword}: ${liked ? 'Like' : 'Dislike'}`);
  } else {
    console.log(`Keyword ${normalizedKeyword} not found in topics, skipping update.`);
  }
};
