import topicsText from './topics.txt?raw';

const STORAGE_KEY = 'gitscroll_feedback_v4';
const MAX_HISTORY = 80;

const ALL_TOPICS = topicsText
  .split('\n')
  .map((topic) => topic.trim().toLowerCase())
  .filter(Boolean);

const TOPIC_SET = new Set(ALL_TOPICS);

const GENERIC_TOPICS = new Set([
  'api', 'app', 'application', 'automation', 'backend', 'boilerplate', 'cli',
  'code', 'coding', 'database', 'developer-tools', 'documentation', 'example',
  'framework', 'frontend', 'javascript', 'library', 'linux', 'open-source',
  'python', 'react', 'sdk', 'server', 'software', 'template', 'tool', 'tools',
  'typescript', 'utility', 'web', 'website',
]);

const LANGUAGE_TOPICS = new Map([
  ['c', 'C'], ['cpp', 'C++'], ['c-sharp', 'C#'], ['clojure', 'Clojure'],
  ['dart', 'Dart'], ['elixir', 'Elixir'], ['go', 'Go'], ['golang', 'Go'],
  ['haskell', 'Haskell'], ['java', 'Java'], ['javascript', 'JavaScript'],
  ['julia', 'Julia'], ['kotlin', 'Kotlin'], ['lua', 'Lua'], ['ocaml', 'OCaml'],
  ['php', 'PHP'], ['python', 'Python'], ['ruby', 'Ruby'], ['rust', 'Rust'],
  ['scala', 'Scala'], ['swift', 'Swift'], ['typescript', 'TypeScript'],
]);

const EXPLORE_SEEDS = [
  'accessibility', 'audio-processing', 'bioinformatics', 'creative-coding',
  'data-visualization', 'devops', 'embedded-systems', 'game-development',
  'home-automation', 'machine-learning', 'privacy', 'networking',
  'static-site-generator', 'terminal', 'webassembly',
];

const normalize = (value = '') => value
  .toLowerCase()
  .replace(/https?:\/\/\S+/g, ' ')
  .replace(/[^a-z0-9+#-]+/g, ' ')
  .trim();

const readHistory = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeHistory = (history) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
};

// A small FlashText-style pass: turn README words into 1-4 word phrases, then
// check those phrases against GitHub's topic vocabulary. Counts never matter;
// each topic is present or absent for a repository.
export const extractTopicPresence = (repo, readme = '') => {
  const explicitTopics = repo?.topics || [];
  const text = normalize([
    repo?.name,
    repo?.description,
    explicitTopics.join(' '),
    readme.slice(0, 80_000),
  ].filter(Boolean).join(' '));

  const words = text.split(/\s+/).filter(Boolean).slice(0, 14_000);
  const found = new Set(explicitTopics.map((topic) => topic.toLowerCase()));

  for (let index = 0; index < words.length; index += 1) {
    for (let size = 1; size <= 4 && index + size <= words.length; size += 1) {
      const phrase = words.slice(index, index + size).join('-');
      if (TOPIC_SET.has(phrase)) found.add(phrase);
    }
  }

  if (repo?.language) found.add(repo.language.toLowerCase().replace(/\s+/g, '-'));
  return [...found].filter((topic) => TOPIC_SET.has(topic)).slice(0, 80);
};

export const recordPreference = (repo, liked, readme = '') => {
  const history = readHistory();
  const record = {
    id: repo.id,
    liked,
    topics: extractTopicPresence(repo, readme),
    ratedAt: Date.now(),
  };
  const withoutRepo = history.filter((item) => item.id !== repo.id);
  writeHistory([...withoutRepo, record]);
};

export const enrichPreference = (repo, readme) => {
  const history = readHistory();
  const existing = history.find((item) => item.id === repo.id);
  if (!existing || !readme) return;
  recordPreference(repo, existing.liked, readme);
};

export const clearPreferences = () => localStorage.removeItem(STORAGE_KEY);

export const getPreferenceStats = () => {
  const history = readHistory();
  return {
    likes: history.filter((item) => item.liked).length,
    dislikes: history.filter((item) => !item.liked).length,
  };
};

const buildTopicScores = (history, options) => {
  const likes = history.filter((item) => item.liked);
  const dislikes = history.filter((item) => !item.liked);
  const topics = new Set(history.flatMap((item) => item.topics));

  return [...topics].map((topic) => {
    const likedDf = likes.length
      ? likes.filter((item) => item.topics.includes(topic)).length / likes.length
      : 0;
    const dislikedDf = dislikes.length
      ? dislikes.filter((item) => item.topics.includes(topic)).length / dislikes.length
      : 0;
    const discriminative = (options.rocchioAlpha * likedDf) - (options.rocchioBeta * dislikedDf);
    const specificity = GENERIC_TOPICS.has(topic)
      ? options.genericPenalty
      : Math.min(1, 0.55 + (topic.length / 32));

    return {
      topic,
      likedDf,
      dislikedDf,
      score: discriminative * specificity,
    };
  });
};

const coOccurrence = (topicA, topicB, likes) => likes.reduce(
  (count, item) => count + Number(item.topics.includes(topicA) && item.topics.includes(topicB)),
  0,
);

const makeBundles = (positiveTopics, likes, options) => {
  const bundles = [];
  const used = new Set();

  for (const seed of positiveTopics) {
    if (used.has(seed.topic)) continue;
    const overlapsExisting = bundles.some((bundle) => (
      bundle.some((topic) => coOccurrence(seed.topic, topic.topic, likes) > 0)
    ));
    if (overlapsExisting) continue;

    const companions = positiveTopics
      .filter((candidate) => candidate.topic !== seed.topic && !used.has(candidate.topic))
      .map((candidate) => ({
        ...candidate,
        overlap: coOccurrence(seed.topic, candidate.topic, likes),
      }))
      .filter((candidate) => candidate.overlap > 0)
      .sort((a, b) => (b.overlap - a.overlap) || (b.score - a.score))
      .slice(0, options.bundleCompanions);

    const bundle = [seed, ...companions];
    bundle.forEach((topic) => used.add(topic.topic));
    bundles.push(bundle);
    if (bundles.length === options.maxBundles) break;
  }

  return bundles;
};

const termForQuery = (topic) => topic.includes('-') ? `topic:${topic}` : topic;

const formatBundle = (bundle, negatives, options) => {
  const terms = bundle.map(({ topic }) => termForQuery(topic));
  const languageTopic = bundle.find(({ topic }) => LANGUAGE_TOPICS.has(topic));
  if (languageTopic) terms.push(`language:${LANGUAGE_TOPICS.get(languageTopic.topic)}`);
  negatives.slice(0, options.negativeFilters).forEach(({ topic }) => terms.push(`NOT ${termForQuery(topic)}`));
  terms.push(`stars:${options.minimumStars}..${options.maximumStars}`, 'archived:false', 'is:public');
  return terms.join(' ');
};

const exploreQuery = (cycle, options) => {
  const seed = EXPLORE_SEEDS[cycle % EXPLORE_SEEDS.length];
  return `topic:${seed} stars:${Math.max(0, options.minimumStars - 3)}..${options.maximumStars} archived:false is:public`;
};

export const buildSearchPlan = (cycle = 0, count = 2, overrides = {}) => {
  const options = {
    rocchioAlpha: 1,
    rocchioBeta: 1.75,
    genericPenalty: 0.2,
    minLikes: 2,
    maxBundles: 3,
    bundleCompanions: 2,
    negativeFilters: 2,
    minimumStars: 5,
    maximumStars: 50000,
    explorePercent: 30,
    ...overrides,
  };
  options.maximumStars = Math.max(options.minimumStars, options.maximumStars);
  const history = readHistory();
  const likes = history.filter((item) => item.liked);
  const scores = buildTopicScores(history, options);
  const positives = scores
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 18);
  const negatives = scores
    .filter((item) => item.dislikedDf >= 0.5 && item.likedDf <= 0.15)
    .sort((a, b) => b.dislikedDf - a.dislikedDf);
  const bundles = likes.length >= options.minLikes ? makeBundles(positives, likes, options) : [];
  const recommendationQueries = bundles.map((bundle) => formatBundle(bundle, negatives, options));
  const plan = [];

  for (let index = 0; index < count; index += 1) {
    // Keep roughly 30% of discovery slots exploratory. With small batches this
    // alternates over time rather than spending another Search API request.
    const explorationSlot = ((cycle + index) * 37) % 100;
    const shouldExplore = recommendationQueries.length === 0 || explorationSlot < options.explorePercent;
    const query = shouldExplore
      ? exploreQuery(cycle + index, options)
      : recommendationQueries[(cycle + index) % recommendationQueries.length];
    plan.push({
      query,
      mode: shouldExplore ? 'explore' : 'for-you',
      page: 1 + ((cycle + index) % 3),
    });
  }

  return plan;
};
