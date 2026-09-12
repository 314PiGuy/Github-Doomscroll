import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeViewer from './CodeViewer';

const resolveUrl = (url, repo, raw = false) => {
  if (!url || /^(https?:|mailto:|#)/i.test(url)) return url;
  const cleanPath = url.replace(/^\.\//, '');
  const base = raw
    ? `https://raw.githubusercontent.com/${repo.full_name}/${repo.default_branch}/`
    : `https://github.com/${repo.full_name}/blob/${repo.default_branch}/`;
  return `${base}${cleanPath}`;
};

const ReadmeViewer = ({ content, repo }) => {
  if (!content) return <div className="empty-state">No README available.</div>;

  return (
    <div className="readme-scroll">
      <div className="readme">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          skipHtml
          components={{
            a: ({ href, children, ...props }) => (
              <a {...props} href={resolveUrl(href, repo)} target="_blank" rel="noreferrer">{children}</a>
            ),
            img: ({ src, alt, ...props }) => (
              <img {...props} src={resolveUrl(src, repo, true)} alt={alt || ''} loading="lazy" />
            ),
            code: ({ className, children }) => {
              const language = /language-(\w+)/.exec(className || '')?.[1];
              const value = String(children).replace(/\n$/, '');
              return language
                ? <CodeViewer inlineFile={{ name: `example.${language}`, path: language, content: value }} compact />
                : <code className={className}>{children}</code>;
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default ReadmeViewer;
