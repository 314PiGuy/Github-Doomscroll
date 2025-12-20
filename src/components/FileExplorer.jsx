import React, { useState, useEffect } from 'react';
import { Folder, File, ChevronRight, ChevronDown, FileCode, ArrowLeft } from 'lucide-react';
import { getRepoFiles } from '../utils/github';
import { useToken } from '../context/TokenContext';
import { useSettings } from '../context/SettingsContext';
import CodeViewer from './CodeViewer';

const FileExplorer = ({ repo }) => {
  const { token } = useToken();
  const { settings } = useSettings();
  const [currentPath, setCurrentPath] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    loadFiles(currentPath);
  }, [currentPath, repo, token]);

  const loadFiles = async (path) => {
    setLoading(true);
    try {
      const data = await getRepoFiles(repo.owner.login, repo.name, path, token);
      if (Array.isArray(data)) {
        // Sort: folders first, then files
        const sorted = data.sort((a, b) => {
          if (a.type === b.type) return a.name.localeCompare(b.name);
          return a.type === 'dir' ? -1 : 1;
        });
        setFiles(sorted);
      }
    } catch (error) {
      console.error("Failed to load files", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folderName) => {
    setHistory([...history, currentPath]);
    setCurrentPath(currentPath ? `${currentPath}/${folderName}` : folderName);
  };

  const handleBack = () => {
    if (selectedFile) {
      setSelectedFile(null);
      return;
    }
    
    if (history.length > 0) {
      const prevPath = history[history.length - 1];
      setHistory(history.slice(0, -1));
      setCurrentPath(prevPath);
    }
  };

  const handleFileClick = async (file) => {
    setLoading(true);
    try {
      const res = await fetch(file.download_url);
      const content = await res.text();
      setSelectedFile({
        name: file.name,
        path: file.path,
        content: content
      });
    } catch (e) {
      console.error("Failed to fetch file content", e);
    } finally {
      setLoading(false);
    }
  };

  const isHidden = (file) => {
    if (!settings.hideConfig) return false;
    const name = file.name.toLowerCase();
    const excludedPatterns = ['build', 'dist', 'config', 'license', 'package', 'lock', 'test', 'spec', 'node_modules', 'vendor', 'bin', 'obj', '.git', '.github', '.vscode', '.idea'];
    return excludedPatterns.some(p => name.includes(p));
  };

  const filteredFiles = files.filter(f => !isHidden(f));

  if (selectedFile) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-[#1a1a1a] border-b border-gray-800 p-2 flex items-center gap-2">
          <button 
            onClick={() => setSelectedFile(null)}
            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <span className="text-sm font-mono text-gray-300 truncate">{selectedFile.path}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <CodeViewer files={[selectedFile]} />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#1a1a1a]">
      {/* Breadcrumbs / Header */}
      <div className="p-3 border-b border-gray-800 flex items-center gap-2 text-sm text-gray-400 overflow-x-auto whitespace-nowrap">
        {currentPath !== '' && (
          <button 
            onClick={handleBack}
            className="p-1 hover:bg-gray-700 rounded mr-1"
          >
            <ArrowLeft size={16} />
          </button>
        )}
        <span 
          className="cursor-pointer hover:text-white"
          onClick={() => {
            setCurrentPath('');
            setHistory([]);
          }}
        >
          {repo.name}
        </span>
        {currentPath.split('/').map((part, i, arr) => (
          <React.Fragment key={i}>
            <ChevronRight size={14} />
            <span className="cursor-default text-gray-200">{part}</span>
          </React.Fragment>
        ))}
      </div>

      {/* File List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredFiles.length === 0 && (
              <div className="text-center text-gray-500 py-8 text-sm">No files found</div>
            )}
            {filteredFiles.map((file) => (
              <div 
                key={file.sha}
                onClick={() => file.type === 'dir' ? handleFolderClick(file.name) : handleFileClick(file)}
                className="flex items-center gap-3 p-2 rounded hover:bg-gray-800 cursor-pointer group transition-colors"
              >
                {file.type === 'dir' ? (
                  <Folder size={18} className="text-blue-400 group-hover:text-blue-300" />
                ) : (
                  <FileCode size={18} className="text-gray-400 group-hover:text-gray-300" />
                )}
                <span className="text-sm text-gray-300 group-hover:text-white truncate">
                  {file.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
