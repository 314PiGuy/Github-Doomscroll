import { useMemo, useState } from 'react';
import { Search, WrapText } from 'lucide-react';

const escapePattern = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const CodeViewer = ({ inlineFile, compact = false }) => {
  const [wrap, setWrap] = useState(true);
  const [query, setQuery] = useState('');
  const file = inlineFile;

  const highlighted = useMemo(() => {
    if (!query) return { parts: [file?.content || ''], count: 0 };
    const pattern = new RegExp(`(${escapePattern(query)})`, 'gi');
    const parts = (file?.content || '').split(pattern);
    return { parts, count: Math.floor(parts.length / 2) };
  }, [file?.content, query]);

  if (!file) return <div className="empty-state">Choose a file to read it.</div>;

  return (
    <div className={compact ? 'code-block compact' : 'code-block'}>
      {!compact && (
        <div className="code-toolbar">
          <span title={file.path}>{file.path}</span>
          <div className="code-tools">
            <label className="code-search">
              <Search size={14} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find in file" aria-label="Find in file" />
              {query && <small>{highlighted.count}</small>}
            </label>
            <button className={wrap ? 'active' : ''} onClick={() => setWrap((value) => !value)} aria-label="Toggle line wrapping">
              <WrapText size={16} /> Wrap
            </button>
          </div>
        </div>
      )}
      <pre className={wrap ? 'code-content wraps' : 'code-content'}>
        <code>
          {highlighted.parts.map((part, index) => (
            query && index % 2 === 1 ? <mark key={`${part}-${index}`}>{part}</mark> : part
          ))}
        </code>
      </pre>
    </div>
  );
};

export default CodeViewer;
