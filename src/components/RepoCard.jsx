import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, GitFork, Eye, FileCode, BookOpen, ExternalLink } from 'lucide-react';
import ReadmeViewer from './ReadmeViewer';
import CodeViewer from './CodeViewer';
import { getReadme, getRandomCodeFile } from '../utils/github';
import { useToken } from '../context/TokenContext';

const RepoCard = ({ repo, isActive }) => {
  const { token } = useToken();
  const [view, setView] = useState('readme'); // 'readme' or 'code'
  const [readme, setReadme] = useState(null);
  const [codeFile, setCodeFile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isActive && repo) {
      setLoading(true);
      Promise.all([
        getReadme(repo.owner.login, repo.name, token),
        getRandomCodeFile(repo.owner.login, repo.name, token)
      ]).then(([readmeContent, codeContent]) => {
        setReadme(readmeContent);
        setCodeFile(codeContent);
        setLoading(false);
      });
    }
  }, [isActive, repo, token]);

  if (!repo) return null;

  return (
    <div className="h-full w-full flex flex-col bg-[#242424] text-white overflow-hidden relative">
      {/* Header */}
      <div className="p-4 pt-20 border-b border-gray-800 bg-[#1a1a1a] z-10">
        <div className="flex justify-between items-start">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold truncate pr-4">{repo.full_name}</h2>
            <p className="text-sm text-gray-400 truncate">{repo.description}</p>
          </div>
          <a 
            href={repo.html_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
          >
            <ExternalLink size={20} />
          </a>
        </div>
        
        <div className="flex gap-4 mt-3 text-sm text-gray-400">
          <span className="flex items-center gap-1"><Star size={14} /> {repo.stargazers_count}</span>
          <span className="flex items-center gap-1"><GitFork size={14} /> {repo.forks_count}</span>
          <span className="flex items-center gap-1"><Eye size={14} /> {repo.watchers_count}</span>
          <span className="bg-gray-800 px-2 py-0.5 rounded text-xs">{repo.language}</span>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        ) : (
          <div className="h-full">
            {view === 'readme' ? (
              <ReadmeViewer content={readme} />
            ) : (
              <CodeViewer file={codeFile} />
            )}
          </div>
        )}
      </div>

      {/* View Toggle Tabs */}
      <div className="flex border-t border-gray-800 bg-[#1a1a1a]">
        <button 
          onClick={() => setView('readme')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            view === 'readme' ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          <BookOpen size={18} /> README
        </button>
        <button 
          onClick={() => setView('code')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            view === 'code' ? 'text-blue-400 bg-gray-800/50' : 'text-gray-400 hover:bg-gray-800'
          }`}
        >
          <FileCode size={18} /> Code
        </button>
      </div>
    </div>
  );
};

export default RepoCard;
