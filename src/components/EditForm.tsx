import { ArrowUp, Paperclip, X } from 'lucide-react';
import './EditForm.css';

type EditFormProps = {
  editPrompt: string;
  onEditPromptChange: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: () => void;
  attachedImage: string | null;
  isEditing: boolean;
  loading: boolean;
};

export function EditForm({
  editPrompt,
  onEditPromptChange,
  onSubmit,
  onImageUpload,
  onRemoveImage,
  attachedImage,
  isEditing,
  loading,
}: EditFormProps) {
  return (
    <form className="edit-bar-form" onSubmit={onSubmit}>
      <div className="edit-bar-shell">
        <label className="edit-bar-attachment" aria-label="Attach image">
          <Paperclip size={18} />
          <span className="edit-bar-tooltip" role="tooltip">
            Attach image
          </span>
          <span className="sr-only">Attach image</span>
          <input type="file" accept="image/*" onChange={onImageUpload} disabled={loading || isEditing} />
        </label>

        <input
          className="edit-bar-input"
          type="text"
          value={editPrompt}
          onChange={(event) => onEditPromptChange(event.target.value)}
          placeholder="Ask AI to edit your README..."
          disabled={loading || isEditing}
        />

        <button className="edit-bar-submit" type="submit" disabled={isEditing || loading || (!editPrompt.trim() && !attachedImage)}>
          <ArrowUp size={18} />
          <span className="sr-only">{isEditing ? 'Applying edit...' : 'Apply edit'}</span>
        </button>
      </div>

      {attachedImage && (
        <p className="edit-bar-note">
          Image attached
          <button className="edit-bar-remove" type="button" onClick={onRemoveImage}>
            <X size={14} />
            <span className="sr-only">Remove attached image</span>
          </button>
        </p>
      )}
    </form>
  );
}
