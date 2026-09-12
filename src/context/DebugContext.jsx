import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'gitscroll_debug_settings_v1';

export const DEFAULT_DEBUG_SETTINGS = {
  enabled: false,
  lazyLoadDelayMs: 850,
  batchQueryCount: 2,
  resultsPerQuery: 40,
  prefetchThreshold: 12,
  requestCacheEnabled: true,
  searchCacheMinutes: 15,
  contentCacheMinutes: 60,
  sequentialSearches: true,
  explorePercent: 30,
  rocchioAlpha: 1,
  rocchioBeta: 1.75,
  genericPenalty: 0.2,
  minLikes: 2,
  maxBundles: 3,
  bundleCompanions: 2,
  negativeFilters: 2,
  minimumStars: 5,
  maximumStars: 50000,
};

const DebugContext = createContext(null);

const readSettings = () => {
  try {
    return { ...DEFAULT_DEBUG_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') };
  } catch {
    return DEFAULT_DEBUG_SETTINGS;
  }
};

export const DebugProvider = ({ children }) => {
  const [debugSettings, setDebugSettings] = useState(readSettings);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(debugSettings));
  }, [debugSettings]);

  const updateDebugSetting = (key, value) => {
    setDebugSettings((current) => ({ ...current, [key]: value }));
  };

  const resetDebugSettings = () => setDebugSettings({ ...DEFAULT_DEBUG_SETTINGS, enabled: true });

  return (
    <DebugContext.Provider value={{ debugSettings, updateDebugSetting, resetDebugSettings }}>
      {children}
    </DebugContext.Provider>
  );
};

export const useDebugSettings = () => useContext(DebugContext);
