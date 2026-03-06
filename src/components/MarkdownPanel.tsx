import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './MarkdownPanel.css';

type MarkdownPanelProps = {
  activeTab: 'preview' | 'edit';
  markdown: string;
  onMarkdownChange: (value: string) => void;
};

export function MarkdownPanel({ activeTab, markdown, onMarkdownChange }: MarkdownPanelProps) {
  if (activeTab === 'preview') {
    return (
      <section className="markdown-panel markdown-preview">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </section>
    );
  }

  return (
    <section className="markdown-panel">
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
