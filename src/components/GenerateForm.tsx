import { ArrowUp, ChevronDown, Paperclip } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import './GenerateForm.css';

type RepoOption = {
  id: number;
  fullName: string;
  url: string;
};

type GenerateFormProps = {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  attachedImage: string | null;
  loadingMessage?: string;
  repoOptions: RepoOption[];
  selectedRepoUrl: string;
  onRepoSelect: (url: string) => void;
  repoDropdownPlaceholder: string;
};

export function GenerateForm({
  url,
  onUrlChange,
  onSubmit,
  onImageUpload,
  loading,
  attachedImage,
  loadingMessage,
  repoOptions,
  selectedRepoUrl,
  onRepoSelect,
  repoDropdownPlaceholder,
}: GenerateFormProps) {
  const buttonText = loading ? loadingMessage || 'Thinking...' : 'Generate README';
  const [isRepoMenuOpen, setIsRepoMenuOpen] = useState(false);
  const comboRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isRepoMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!comboRef.current) {
        return;
      }
      if (!comboRef.current.contains(event.target as Node)) {
        setIsRepoMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsRepoMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isRepoMenuOpen]);

  function handleRepoPick(nextRepoUrl: string) {
    onRepoSelect(nextRepoUrl);
    setIsRepoMenuOpen(false);
  }

  return (
    <form className="generator-form" onSubmit={onSubmit}>
      <div className="generator-input-shell">
        <div className="generator-input-row">
          <label className="generator-attachment" aria-label="Attach image">
            <Paperclip size={18} />
            <span className="generator-tooltip" role="tooltip">
              Attach image
            </span>
            <span className="sr-only">Attach image</span>
            <input type="file" accept="image/*" onChange={onImageUpload} />
          </label>

          <div className="generator-combo" ref={comboRef}>
            <input
              className="generator-input"
              type="text"
              value={url}
              onChange={(event) => onUrlChange(event.target.value)}
              placeholder="Paste GitHub repository URL..."
              role="combobox"
              aria-expanded={isRepoMenuOpen}
              aria-controls="generator-repo-menu"
              aria-autocomplete="list"
            />

            <button
              className={`generator-combo-toggle ${isRepoMenuOpen ? 'generator-combo-toggle--open' : ''}`}
              type="button"
              aria-label="Show repositories"
              aria-haspopup="listbox"
              aria-expanded={isRepoMenuOpen}
              onClick={() => setIsRepoMenuOpen((open) => !open)}
            >
              <ChevronDown size={15} />
            </button>

            {isRepoMenuOpen && (
              <div className="generator-combo-menu" id="generator-repo-menu" role="listbox" aria-label="GitHub repositories">
                {repoOptions.length > 0 ? (
                  repoOptions.map((repo) => (
                    <button
                      key={repo.id}
                      className={`generator-combo-option ${selectedRepoUrl === repo.url ? 'generator-combo-option--active' : ''}`}
                      type="button"
                      role="option"
                      aria-selected={selectedRepoUrl === repo.url}
                      onClick={() => handleRepoPick(repo.url)}
                    >
                      {repo.fullName}
                    </button>
                  ))
                ) : (
                  <p className="generator-combo-empty">{repoDropdownPlaceholder}</p>
                )}
              </div>
            )}
          </div>

          <button className="generator-submit" type="submit" disabled={loading || !url.trim()}>
            <ArrowUp size={18} />
            <span className="sr-only">{buttonText}</span>
          </button>
        </div>

        {loading && <p className="generator-inline-status">{buttonText}</p>}
      </div>

      {attachedImage && <p className="generator-attachment-note">Image attached.</p>}
    </form>
  );
}
