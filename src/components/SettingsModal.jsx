import { useEffect, useState } from 'react';
import { Bug, KeyRound, RotateCcw, X } from 'lucide-react';
import { useToken } from '../context/TokenContext';
import { useDebugSettings } from '../context/DebugContext';
import { clearPreferences, getPreferenceStats } from '../utils/recommendations';

const NumberSetting = ({ label, setting, value, min, max, step = 1, onChange }) => (
  <label className="debug-field">
    <span>{label}</span>
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(event) => {
        const number = Number(event.target.value);
        if (Number.isFinite(number)) onChange(setting, Math.min(max, Math.max(min, number)));
      }}
    />
  </label>
);

const ToggleSetting = ({ label, checked, onChange }) => (
  <label className="toggle-setting">
    <span>{label}</span>
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
  </label>
);

const SettingsModal = ({ isOpen, onClose }) => {
  const { token, setToken, clearToken } = useToken();
  const { debugSettings, updateDebugSetting, resetDebugSettings } = useDebugSettings();
  const [draft, setDraft] = useState(token || '');
  const [stats, setStats] = useState(getPreferenceStats);

  useEffect(() => {
    if (!isOpen) return undefined;
    setDraft(token || '');
    setStats(getPreferenceStats());
    const closeOnEscape = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose, token]);

  if (!isOpen) return null;

  const saveToken = () => {
    const value = draft.trim();
    if (value) setToken(value);
    else clearToken();
  };

  const resetLearning = () => {
    clearPreferences();
    setStats({ likes: 0, dislikes: 0 });
  };

  const numberField = (label, setting, min, max, step) => (
    <NumberSetting
      label={label}
      setting={setting}
      value={debugSettings[setting]}
      min={min}
      max={max}
      step={step}
      onChange={updateDebugSetting}
    />
  );

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" onMouseDown={(event) => event.stopPropagation()}>
        <header>
          <div>
            <div className="eyebrow">Preferences</div>
            <h2 id="settings-title">Settings</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close settings"><X size={19} /></button>
        </header>

        <div className="modal-body">
          <div className="setting-group">
            <label htmlFor="github-token"><KeyRound size={16} /> GitHub token</label>
            <p>Optional. It raises GitHub&apos;s request allowance and stays in this browser.</p>
            <div className="input-row">
              <input id="github-token" type="password" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="github_pat_…" />
              <button className="primary-button" onClick={saveToken}>Save</button>
            </div>
          </div>

          <div className="setting-group">
            <label>Recommendations</label>
            <p>{stats.likes} liked · {stats.dislikes} disliked. Feedback never leaves this browser.</p>
            <button className="secondary-button" onClick={resetLearning}><RotateCcw size={16} /> Reset learning</button>
          </div>

          <div className="setting-group debug-settings">
            <ToggleSetting
              label={<><Bug size={16} /> Debug controls</>}
              checked={debugSettings.enabled}
              onChange={(value) => updateDebugSetting('enabled', value)}
            />
            <p>Advanced values apply to future requests. Defaults are restored whenever debug controls are off.</p>

            {debugSettings.enabled && (
              <div className="debug-panel">
                <div className="debug-section">
                  <h3>Loading and API</h3>
                  <div className="debug-grid">
                    {numberField('README wait (ms)', 'lazyLoadDelayMs', 0, 10000, 50)}
                    {numberField('Queries per batch', 'batchQueryCount', 1, 4)}
                    {numberField('Results per query', 'resultsPerQuery', 5, 100, 5)}
                    {numberField('Refill threshold', 'prefetchThreshold', 1, 50)}
                    {numberField('Search cache (min)', 'searchCacheMinutes', 0, 1440)}
                    {numberField('Content cache (min)', 'contentCacheMinutes', 0, 1440)}
                  </div>
                  <ToggleSetting label="Cache requests" checked={debugSettings.requestCacheEnabled} onChange={(value) => updateDebugSetting('requestCacheEnabled', value)} />
                  <ToggleSetting label="Run searches sequentially" checked={debugSettings.sequentialSearches} onChange={(value) => updateDebugSetting('sequentialSearches', value)} />
                </div>

                <div className="debug-section">
                  <h3>Recommendations</h3>
                  <div className="debug-grid">
                    {numberField('Explore (%)', 'explorePercent', 0, 100)}
                    {numberField('Rocchio α', 'rocchioAlpha', 0, 5, 0.05)}
                    {numberField('Rocchio β', 'rocchioBeta', 0, 5, 0.05)}
                    {numberField('Generic penalty', 'genericPenalty', 0, 1, 0.05)}
                    {numberField('Likes before tuning', 'minLikes', 1, 20)}
                    {numberField('Query bundles', 'maxBundles', 1, 5)}
                    {numberField('Bundle companions', 'bundleCompanions', 0, 4)}
                    {numberField('Negative filters', 'negativeFilters', 0, 5)}
                    {numberField('Minimum stars', 'minimumStars', 0, 100000)}
                    {numberField('Maximum stars', 'maximumStars', 10, 1000000, 10)}
                  </div>
                </div>

                <button className="secondary-button" onClick={resetDebugSettings}><RotateCcw size={16} /> Restore debug defaults</button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsModal;
