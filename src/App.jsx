import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Settings } from 'lucide-react';
import RepoCard from './components/RepoCard';
import Controls from './components/Controls';
import TokenModal from './components/TokenModal';
import SettingsModal from './components/SettingsModal';
import { useToken } from './context/TokenContext';
import { SettingsProvider } from './context/SettingsContext';
import { searchRepos, getReadme } from './utils/github';
import { getNextKeyword, updatePreference } from './utils/recommendations';

function AppContent() {
  const { token } = useToken();
  const [repos, setRepos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (repos.length === 0) {
      loadMoreRepos();
    }
  }, []);

  useEffect(() => {
    if (repos.length - currentIndex < 5) {
      loadMoreRepos();
    }
  }, [currentIndex, repos.length]);

  const loadMoreRepos = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const KEYWORDS_TO_FETCH = 3;
      const promises = [];
      
      for (let i = 0; i < KEYWORDS_TO_FETCH; i++) {
        const keyword = getNextKeyword();
        const page = Math.floor(Math.random() * 5) + 1;
        promises.push(
          searchRepos(keyword, token, page)
            .then(data => ({ keyword, items: data.items || [] }))
            .catch(e => {
              console.error(`Failed to fetch for ${keyword}`, e);
              return { keyword, items: [] };
            })
        );
      }
      
      const results = await Promise.all(promises);
      
      let allCandidates = [];
      results.forEach(({ keyword, items }) => {
        const itemsWithKeyword = items.map(item => ({ ...item, sourceKeyword: keyword }));
        allCandidates.push(...itemsWithKeyword);
      });
      
      if (allCandidates.length > 0) {
        const existingIds = new Set(repos.map(r => r.id));
        let candidates = allCandidates.filter(r => !existingIds.has(r.id));

        candidates = candidates.sort(() => Math.random() - 0.5);

        // Filter by README length (>= 100 words)
        const validRepos = [];
        const CHUNK_SIZE = 5;
        const TARGET_COUNT = 10; // Increased target count for larger batches

        for (let i = 0; i < candidates.length; i += CHUNK_SIZE) {
          if (validRepos.length >= TARGET_COUNT) break;

          const chunk = candidates.slice(i, i + CHUNK_SIZE);
          const results = await Promise.all(chunk.map(async (repo) => {
            try {
              const readme = await getReadme(repo.owner.login, repo.name, token);
              if (readme && readme.split(/\s+/).length >= 100) {
                return { ...repo, readmeContent: readme, sourceKeyword: repo.sourceKeyword };
              }
            } catch (e) {
              console.error(`Failed to fetch README for ${repo.full_name}`, e);
            }
            return null;
          }));

          validRepos.push(...results.filter(r => r !== null));
        }

        setRepos(prev => [...prev, ...validRepos]);
      }
    } catch (error) {
      console.error("Failed to fetch repos", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const { scrollTop, clientHeight } = containerRef.current;
      const index = Math.round(scrollTop / clientHeight);
      if (index !== currentIndex) {
        setCurrentIndex(index);
      }
    }
  }, [currentIndex]);

  const scrollToNext = () => {
    if (containerRef.current) {
      const { clientHeight } = containerRef.current;
      containerRef.current.scrollTo({
        top: (currentIndex + 1) * clientHeight,
        behavior: 'smooth'
      });
    }
  };

  const handleLike = () => {
    const currentRepo = repos[currentIndex];
    if (currentRepo && currentRepo.sourceKeyword) {
      updatePreference(currentRepo.sourceKeyword, true);
    }
    scrollToNext();
  };

  const handleDislike = () => {
    const currentRepo = repos[currentIndex];
    if (currentRepo && currentRepo.sourceKeyword) {
      updatePreference(currentRepo.sourceKeyword, false);
    }
    scrollToNext();
  };

  return (
    <div className="h-screen w-full bg-black text-white relative">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center pointer-events-none">
        <h1 className="text-xl font-bold bg-black/50 backdrop-blur px-3 py-1 rounded-full pointer-events-auto">
          GitScroll
        </h1>
        <button 
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-2 bg-black/50 backdrop-blur rounded-full hover:bg-gray-800 pointer-events-auto transition-colors"
        >
          <Settings size={24} />
        </button>
      </div>

      {/* Main Scroll Container */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {repos.map((repo, index) => (
          <div key={`${repo.id}-${index}`} className="h-full w-full snap-start relative">
            <RepoCard repo={repo} isActive={index === currentIndex} />
          </div>
        ))}
        
        {repos.length === 0 && !loading && (
          <div className="h-full w-full flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to GitScroll</h2>
              <p className="text-gray-400 mb-8">Discover random repositories.</p>
              <button 
                onClick={loadMoreRepos}
                className="bg-blue-600 px-6 py-3 rounded-lg font-bold"
              >
                Start Scrolling
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      {repos.length > 0 && (
        <Controls 
          onLike={handleLike} 
          onDislike={handleDislike} 
          onSkip={scrollToNext} 
        />
      )}

      <TokenModal 
        isOpen={isTokenModalOpen} 
        onClose={() => setIsTokenModalOpen(false)} 
      />
      
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}

export default App;
