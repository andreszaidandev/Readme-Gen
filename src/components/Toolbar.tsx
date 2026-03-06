import { Plus } from 'lucide-react';
import type { RepoInfo } from '../types';
import './Toolbar.css';

type ToolbarProps = {
  activeTab: 'preview' | 'edit';
  onTabChange: (tab: 'preview' | 'edit') => void;
  onCopy: () => void;
  copied: boolean;
  onDownload: () => void;
  onAddImage: () => void;
  isGeneratingImage: boolean;
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
  onAddImage,
  isGeneratingImage,
  markdown,
  repoInfo,
  onNewReadme,
}: ToolbarProps) {
  return (
    <header className="workspace-header">
      <div className="workspace-header-left">
        <button className="toolbar-new-button" type="button" onClick={onNewReadme} aria-label="New README">
          <Plus size={18} />
          <span className="toolbar-new-tooltip" role="tooltip">
            New README
          </span>
          <span className="sr-only">New README</span>
        </button>
      </div>

      <div className="workspace-header-actions">
        <button className="toolbar-button" type="button" onClick={() => onTabChange('preview')} disabled={activeTab === 'preview'}>
          Preview
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
        <button className="toolbar-button" type="button" onClick={onAddImage} disabled={isGeneratingImage || !markdown}>
          {isGeneratingImage ? 'Generating image...' : 'Add image'}
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
