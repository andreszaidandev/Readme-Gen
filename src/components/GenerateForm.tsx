import { ArrowUp, Paperclip } from 'lucide-react';
import './GenerateForm.css';

type GenerateFormProps = {
  url: string;
  onUrlChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  loading: boolean;
  attachedImage: string | null;
};

export function GenerateForm({ url, onUrlChange, onSubmit, onImageUpload, loading, attachedImage }: GenerateFormProps) {
  return (
    <form className="generator-form" onSubmit={onSubmit}>
      <div className="generator-input-shell">
        <label className="generator-attachment" aria-label="Attach image">
          <Paperclip size={18} />
          <span className="generator-tooltip" role="tooltip">
            Attach image
          </span>
          <span className="sr-only">Attach image</span>
          <input type="file" accept="image/*" onChange={onImageUpload} />
        </label>

        <input
          className="generator-input"
          type="text"
          value={url}
          onChange={(event) => onUrlChange(event.target.value)}
          placeholder="Paste GitHub repository URL..."
        />

        <button className="generator-submit" type="submit" disabled={loading || !url.trim()}>
          <ArrowUp size={18} />
          <span className="sr-only">{loading ? 'Generating' : 'Generate README'}</span>
        </button>
      </div>

      {attachedImage && <p className="generator-attachment-note">Image attached.</p>}
    </form>
  );
}
