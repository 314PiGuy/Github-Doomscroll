import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, ChevronRight, FileCode2, Folder, FolderOpen, Search,
} from 'lucide-react';
import CodeViewer from './CodeViewer';
import { useToken } from '../context/TokenContext';
import { DEFAULT_DEBUG_SETTINGS, useDebugSettings } from '../context/DebugContext';
import { getFileContent, getRepoTree } from '../utils/github';

const CODE_EXTENSIONS = new Set([
  'c', 'cpp', 'cs', 'css', 'go', 'h', 'html', 'java', 'js', 'json', 'jsx',
  'kt', 'lua', 'md', 'php', 'py', 'rb', 'rs', 'sh', 'swift', 'ts', 'tsx',
  'vue', 'yaml', 'yml',
]);

const NOISY_PATHS = /(^|\/)(dist|build|coverage|node_modules|vendor|target|\.git)(\/|$)|(?:^|\/)(package-lock|yarn\.lock|pnpm-lock)/i;

const createTree = (files) => {
  const root = { name: '', path: '', folders: new Map(), files: [] };

  files.forEach((file) => {
    const parts = file.path.split('/');
    let node = root;
    parts.slice(0, -1).forEach((part) => {
      if (!node.folders.has(part)) {
        const path = node.path ? `${node.path}/${part}` : part;
        node.folders.set(part, { name: part, path, folders: new Map(), files: [] });
      }
      node = node.folders.get(part);
    });
    node.files.push(file);
  });

  return root;
};

const FileRow = ({ file, onOpen, depth = 0, showPath = false }) => (
  <button className="tree-row file-row" style={{ '--depth': depth }} onClick={() => onOpen(file)}>
    <FileCode2 size={15} />
    <span title={file.path}>{showPath ? file.path : file.path.split('/').pop()}</span>
    <small>{file.size ? `${Math.ceil(file.size / 1024)} KB` : ''}</small>
  </button>
);

const FolderNode = ({ node, onOpen, depth = 0 }) => {
  const [expanded, setExpanded] = useState(depth === 0 && ['src', 'app', 'lib'].includes(node.name));
  const folders = [...node.folders.values()].sort((a, b) => a.name.localeCompare(b.name));
  const files = [...node.files].sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div className="tree-folder">
      <button
        className="tree-row folder-row"
        style={{ '--depth': depth }}
        onClick={() => setExpanded((value) => !value)}
        aria-expanded={expanded}
      >
        <ChevronRight className={expanded ? 'chevron expanded' : 'chevron'} size={14} />
        {expanded ? <FolderOpen size={16} /> : <Folder size={16} />}
        <span>{node.name}</span>
        <small>{folders.length + files.length}</small>
      </button>
      {expanded && (
        <div>
          {folders.map((folder) => <FolderNode key={folder.path} node={folder} onOpen={onOpen} depth={depth + 1} />)}
          {files.map((file) => <FileRow key={file.path} file={file} onOpen={onOpen} depth={depth + 1} />)}
        </div>
      )}
    </div>
  );
};

const FileExplorer = ({ repo }) => {
  const { token } = useToken();
  const { debugSettings } = useDebugSettings();
  const requestOptions = debugSettings.enabled ? debugSettings : DEFAULT_DEBUG_SETTINGS;
  const [files, setFiles] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let current = true;
    setStatus('loading');
    getRepoTree(repo, token, requestOptions)
      .then((tree) => {
        if (!current) return;
        setFiles(tree.filter((file) => {
          const extension = file.path.split('.').pop().toLowerCase();
          return CODE_EXTENSIONS.has(extension) && !NOISY_PATHS.test(file.path);
        }));
        setStatus('ready');
      })
      .catch(() => current && setStatus('error'));
    return () => { current = false; };
  }, [repo, requestOptions, token]);

  const tree = useMemo(() => createTree(files), [files]);
  const matches = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return files.filter((file) => file.path.toLowerCase().includes(normalizedQuery)).slice(0, 200);
  }, [files, query]);

  const openFile = async (file) => {
    setSelected({ ...file, name: file.path.split('/').pop(), content: '', loading: true });
    try {
      const content = await getFileContent(repo, file.path, token, requestOptions);
      setSelected({ ...file, name: file.path.split('/').pop(), content, loading: false });
    } catch {
      setSelected({ ...file, name: file.path.split('/').pop(), content: '// This file could not be loaded.', loading: false });
    }
  };

  if (selected) {
    return (
      <div className="file-viewer">
        <button className="back-button" onClick={() => setSelected(null)}>
          <ArrowLeft size={16} /> Files
        </button>
        {selected.loading
          ? <div className="preview-state"><span className="spinner" /><p>Loading file…</p></div>
          : <CodeViewer inlineFile={selected} />}
      </div>
    );
  }

  const rootFolders = [...tree.folders.values()].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="file-browser">
      <div className="file-search">
        <Search size={16} />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search files and folders" aria-label="Search files and folders" />
      </div>
      {status === 'loading' && <div className="preview-state"><span className="spinner" /><p>Loading the file index once…</p></div>}
      {status === 'error' && <div className="empty-state">The file index could not be loaded.</div>}
      {status === 'ready' && (
        <div className="file-tree">
          {query.trim() ? (
            <>
              <div className="search-count">{matches.length} matching files</div>
              {matches.map((file) => <FileRow key={file.path} file={file} onOpen={openFile} showPath />)}
              {!matches.length && <div className="empty-state">No matching files.</div>}
            </>
          ) : (
            <>
              {rootFolders.map((folder) => <FolderNode key={folder.path} node={folder} onOpen={openFile} />)}
              {[...tree.files].sort((a, b) => a.path.localeCompare(b.path)).map((file) => (
                <FileRow key={file.path} file={file} onOpen={openFile} />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
