import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import RepoCard from './components/RepoCard';
import SettingsModal from './components/SettingsModal';
import { useToken } from './context/TokenContext';
import { DEFAULT_DEBUG_SETTINGS, useDebugSettings } from './context/DebugContext';
import { searchRepositoryBatch } from './utils/github';
import { buildSearchPlan, enrichPreference, recordPreference } from './utils/recommendations';

const interleaveResults = (batches, seenIds) => {
  const queues = batches.map((batch) => batch.items
    .filter((repo) => !repo.fork && !repo.archived && !repo.disabled)
    .map((repo) => ({ ...repo, discoveryMode: batch.mode })));
  const mixed = [];

  while (queues.some((queue) => queue.length)) {
    queues.forEach((queue) => {
      const repo = queue.shift();
      if (repo && !seenIds.has(repo.id)) {
        seenIds.add(repo.id);
        mixed.push(repo);
      }
    });
  }
  return mixed;
};

const errorMessage = (error) => {
  if (error?.resetAt) {
    return `GitHub's limit resets around ${error.resetAt.toLocaleTimeString([], {
      hour: 'numeric', minute: '2-digit',
    })}. You can also add a token in Settings.`;
  }
  return error?.message || 'Could not load repositories. Please try again.';
};

function App() {
  const { token } = useToken();
  const { debugSettings } = useDebugSettings();
  const [repos, setRepos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const feedRef = useRef(null);
  const seenIds = useRef(new Set());
  const searchCycle = useRef(0);
  const loadingRef = useRef(false);
  const debugRef = useRef(DEFAULT_DEBUG_SETTINGS);

  useEffect(() => {
    debugRef.current = debugSettings.enabled ? debugSettings : DEFAULT_DEBUG_SETTINGS;
  }, [debugSettings]);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const options = debugRef.current;
      const plan = buildSearchPlan(searchCycle.current, options.batchQueryCount, options);
      searchCycle.current += plan.length;
      const batches = await searchRepositoryBatch(plan, token, options);
      const candidates = interleaveResults(batches, seenIds.current);
      setRepos((existing) => [...existing, ...candidates]);
      if (!candidates.length) setError('No new repositories found. Try again for another batch.');
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadMore();
  }, [loadMore]);

  useEffect(() => {
    const threshold = (debugSettings.enabled ? debugSettings : DEFAULT_DEBUG_SETTINGS).prefetchThreshold;
    if (repos.length && repos.length - currentIndex < threshold) loadMore();
  }, [currentIndex, debugSettings, loadMore, repos.length]);

  const moveTo = useCallback((index) => {
    const safeIndex = Math.max(0, Math.min(index, repos.length - 1));
    feedRef.current?.scrollTo({
      top: safeIndex * feedRef.current.clientHeight,
      behavior: 'smooth',
    });
  }, [repos.length]);

  const next = useCallback(() => moveTo(currentIndex + 1), [currentIndex, moveTo]);

  const rateRepo = useCallback((liked) => {
    const repo = repos[currentIndex];
    if (!repo) return;
    recordPreference(repo, liked, repo.readmeContent || '');
    next();
  }, [currentIndex, next, repos]);

  const handleHydrated = useCallback((repo, readme) => {
    setRepos((current) => current.map((item) => (
      item.id === repo.id ? { ...item, readmeContent: readme } : item
    )));
    enrichPreference(repo, readme);
  }, []);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === 'ArrowDown' || event.key.toLowerCase() === 'j') next();
      if (event.key.toLowerCase() === 'l') rateRepo(true);
      if (event.key.toLowerCase() === 'd') rateRepo(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [next, rateRepo]);

  const handleScroll = () => {
    const feed = feedRef.current;
    if (!feed) return;
    setCurrentIndex(Math.round(feed.scrollTop / feed.clientHeight));
  };

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand" aria-label="GitScroll home">
          <span className="brand-mark" aria-hidden="true" />
          <span>GitScroll</span>
        </div>
        <div className="topbar-meta">
          {repos.length > 0 && <span>{currentIndex + 1} / {repos.length}</span>}
          <button className="icon-button" onClick={() => setSettingsOpen(true)} aria-label="Open settings">
            <Settings size={19} />
          </button>
        </div>
      </header>

      <section ref={feedRef} onScroll={handleScroll} className="feed" aria-label="Repository feed">
        {repos.map((repo, index) => (
          <article className="feed-page" key={repo.id}>
            {Math.abs(index - currentIndex) <= 2 && (
              <RepoCard
                repo={repo}
                isActive={index === currentIndex}
                onLike={() => rateRepo(true)}
                onDislike={() => rateRepo(false)}
                onNext={next}
                onHydrated={handleHydrated}
              />
            )}
          </article>
        ))}

        {(loading || error) && (
          <div className="feed-page feed-status">
            <div className="status-card" role={error ? 'alert' : 'status'}>
              {loading && <span className="spinner" aria-hidden="true" />}
              <h1>{loading ? 'Finding good projects' : 'The feed paused'}</h1>
              <p>{loading ? 'Searching in a small, rate-limit-friendly batch…' : error}</p>
              {!loading && <button className="primary-button" onClick={loadMore}>Try again</button>}
            </div>
          </div>
        )}
      </section>

      <SettingsModal isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}

export default App;
