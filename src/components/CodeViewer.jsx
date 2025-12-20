import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeViewer = ({ file }) => {
  if (!file) return <div className="p-8 text-center text-gray-500">No code file found</div>;

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
      <div className="bg-[#1a1a1a] border-b border-gray-800 p-2 px-4 text-sm font-mono text-gray-400 flex items-center">
        <span className="truncate">{file.path}</span>
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
