import { Plus } from 'lucide-react';
import type { RepoInfo } from '../types';
import './Toolbar.css';

type ToolbarProps = {
  activeTab: 'preview' | 'raw' | 'edit';
  onTabChange: (tab: 'preview' | 'raw' | 'edit') => void;
  onCopy: () => void;
  copied: boolean;
  onDownload: () => void;
  markdown: string;
  repoInfo: RepoInfo | null;
  onNewReadme: () => void;
};

export function Toolbar({
  activeTab,
  onTabChange,
  onCopy,
  copied,
  onDownload,
  markdown,
  repoInfo,
  onNewReadme,
}: ToolbarProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-left">
        <button className="toolbar-new-button" type="button" onClick={onNewReadme} aria-label="New README">
          <Plus size={16} />
          <span className="toolbar-new-label">New</span>
          <span className="toolbar-new-tooltip" role="tooltip">
            New README
          </span>
        </button>
      </div>

      <div className="workspace-header-actions">
        <button className="toolbar-button" type="button" onClick={() => onTabChange('preview')} disabled={activeTab === 'preview'}>
          Preview
        </button>
        <button className="toolbar-button" type="button" onClick={() => onTabChange('raw')} disabled={activeTab === 'raw'}>
          Raw
        </button>
        <button className="toolbar-button" type="button" onClick={() => onTabChange('edit')} disabled={activeTab === 'edit'}>
          Edit
        </button>
        <button className="toolbar-button" type="button" onClick={onCopy} disabled={!markdown}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button className="toolbar-button" type="button" onClick={onDownload} disabled={!markdown}>
          Download
        </button>
        {repoInfo && (
          <a className="toolbar-link" href={repoInfo.html_url} target="_blank" rel="noreferrer">
            Open Repository
          </a>
        )}
      </div>
    </header>
  );
}
