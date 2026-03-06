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
}: ToolbarProps) {
  return (
    <section className="toolbar">
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
    </section>
  );
}
