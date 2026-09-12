import { useEffect, useState } from 'react';
import { BookOpen, ExternalLink, Files, GitFork, Star } from 'lucide-react';
import Controls from './Controls';
import FileExplorer from './FileExplorer';
import ReadmeViewer from './ReadmeViewer';
import { useToken } from '../context/TokenContext';
import { DEFAULT_DEBUG_SETTINGS, useDebugSettings } from '../context/DebugContext';
import { getReadme } from '../utils/github';

const compactNumber = new Intl.NumberFormat('en', { notation: 'compact' });

const RepoCard = ({ repo, isActive, onLike, onDislike, onNext, onHydrated }) => {
  const { token } = useToken();
  const { debugSettings } = useDebugSettings();
  const requestOptions = debugSettings.enabled ? debugSettings : DEFAULT_DEBUG_SETTINGS;
  const [view, setView] = useState('readme');
  const [readme, setReadme] = useState(repo.readmeContent || null);
  const [status, setStatus] = useState(repo.readmeContent ? 'ready' : 'waiting');

  useEffect(() => {
    setView('readme');
    setReadme(repo.readmeContent || null);
    setStatus(repo.readmeContent ? 'ready' : 'waiting');
  }, [repo.id, repo.readmeContent]);

  useEffect(() => {
    if (!isActive || readme !== null || status !== 'waiting') return undefined;

    const dwellTimer = window.setTimeout(async () => {
      setStatus('loading');
      try {
        const content = await getReadme(repo, token, requestOptions);
        setReadme(content || '');
        setStatus(content ? 'ready' : 'missing');
        onHydrated(repo, content || '');
      } catch {
        setStatus('error');
      }
    }, requestOptions.lazyLoadDelayMs);

    return () => window.clearTimeout(dwellTimer);
  }, [isActive, onHydrated, readme, repo, requestOptions, status, token]);

  const previewTitle = status === 'waiting'
    ? 'Pause to preview'
    : status === 'loading' ? 'Loading README' : 'README unavailable';

  const previewCopy = status === 'waiting'
    ? 'The README loads after a brief pause, saving requests while you scroll.'
    : status === 'error'
      ? 'GitHub could not return this README right now.'
      : status === 'missing'
        ? 'This project does not have a readable README.'
        : 'Fetching only what you chose to view…';

  return (
    <div className="repo-card">
      <header className="repo-header">
        <div className="repo-heading">
          <div className="eyebrow">{repo.discoveryMode === 'for-you' ? 'For you' : 'Explore'}</div>
          <h1>{repo.full_name}</h1>
          <p>{repo.description || 'No description provided.'}</p>
        </div>
        <a className="icon-button" href={repo.html_url} target="_blank" rel="noreferrer" aria-label={`Open ${repo.full_name} on GitHub`}>
          <ExternalLink size={18} />
        </a>
        <div className="repo-facts" aria-label="Repository details">
          {repo.language && <span className="language-pill">{repo.language}</span>}
          <span><Star size={15} /> {compactNumber.format(repo.stargazers_count)}</span>
          <span><GitFork size={15} /> {compactNumber.format(repo.forks_count)}</span>
          {repo.license?.spdx_id && repo.license.spdx_id !== 'NOASSERTION' && <span>{repo.license.spdx_id}</span>}
        </div>
      </header>

      <nav className="view-tabs" aria-label="Repository content">
        <button className={view === 'readme' ? 'active' : ''} onClick={() => setView('readme')}>
          <BookOpen size={16} /> README
        </button>
        <button className={view === 'files' ? 'active' : ''} onClick={() => setView('files')}>
          <Files size={16} /> Files
        </button>
      </nav>

      <section className="repo-content">
        {view === 'files' ? (
          <FileExplorer repo={repo} />
        ) : status === 'ready' ? (
          <ReadmeViewer content={readme} repo={repo} />
        ) : (
          <div className="preview-state">
            {status === 'loading' && <span className="spinner" aria-hidden="true" />}
            <h2>{previewTitle}</h2>
            <p>{previewCopy}</p>
          </div>
        )}
      </section>

      <Controls onLike={onLike} onDislike={onDislike} onNext={onNext} />
    </div>
  );
};

export default RepoCard;
