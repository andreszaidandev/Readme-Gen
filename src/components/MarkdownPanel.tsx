import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownPanel.css';

type MarkdownPanelProps = {
  activeTab: 'preview' | 'raw' | 'edit';
  markdown: string;
  onMarkdownChange: (value: string) => void;
  statusMessage?: string;
};

export function MarkdownPanel({ activeTab, markdown, onMarkdownChange, statusMessage = '' }: MarkdownPanelProps) {
  if (activeTab === 'preview') {
    return (
      <section className="markdown-panel markdown-preview">
        {statusMessage && <p className="markdown-panel-status">{statusMessage}</p>}
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </section>
    );
  }

  if (activeTab === 'raw') {
    return (
      <section className="markdown-panel">
        {statusMessage && <p className="markdown-panel-status">{statusMessage}</p>}
        <pre className="markdown-raw">{markdown}</pre>
      </section>
    );
  }

  return (
    <section className="markdown-panel">
      {statusMessage && <p className="markdown-panel-status">{statusMessage}</p>}
      <textarea
        className="markdown-editor"
        value={markdown}
        onChange={(event) => onMarkdownChange(event.target.value)}
        rows={24}
        spellCheck={false}
      />
    </section>
  );
}
