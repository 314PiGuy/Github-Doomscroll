import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CodeViewer = ({ files = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!files || files.length === 0) return <div className="p-8 text-center text-gray-500">No code files found</div>;

  const file = files[currentIndex];

  const nextFile = () => {
    setCurrentIndex((prev) => (prev + 1) % files.length);
  };

  const prevFile = () => {
    setCurrentIndex((prev) => (prev - 1 + files.length) % files.length);
  };

  const getLanguage = (filename) => {
    const ext = filename.split('.').pop();
    const map = {
      js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
      py: 'python', rs: 'rust', go: 'go', java: 'java',
      c: 'c', cpp: 'cpp', h: 'cpp', css: 'css', html: 'html',
      json: 'json', md: 'markdown'
    };
    return map[ext] || 'text';
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-[#1a1a1a] border-b border-gray-800 p-2 px-4 text-sm font-mono text-gray-400 flex items-center justify-between">
        <span className="truncate flex-1 mr-4">{file.path}</span>
        
        {files.length > 1 && (
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-500 mr-2">{currentIndex + 1} / {files.length}</span>
            <button 
              onClick={prevFile}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Previous file"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              onClick={nextFile}
              className="p-1 hover:bg-gray-700 rounded transition-colors"
              title="Next file"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <SyntaxHighlighter
          language={getLanguage(file.name)}
          style={vscDarkPlus}
          customStyle={{ margin: 0, borderRadius: 0, height: '100%' }}
          showLineNumbers={true}
        >
          {file.content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeViewer;
