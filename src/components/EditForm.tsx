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
    <form className="edit-form" onSubmit={onSubmit}>
      <label className="edit-form-label">
        Edit instruction
        <input
          className="edit-form-input"
          type="text"
          value={editPrompt}
          onChange={(event) => onEditPromptChange(event.target.value)}
          placeholder="e.g. Add testing instructions"
          disabled={loading || isEditing}
        />
      </label>

      <label className="edit-form-label">
        Attach image (optional)
        <input className="edit-form-file" type="file" accept="image/*" onChange={onImageUpload} disabled={loading || isEditing} />
      </label>

      {attachedImage && (
        <p className="edit-form-note">
          Image attached.
          <button className="edit-form-remove" type="button" onClick={onRemoveImage}>
            Remove image
          </button>
        </p>
      )}

      <button className="edit-form-submit" type="submit" disabled={isEditing || loading || (!editPrompt.trim() && !attachedImage)}>
        {isEditing ? 'Applying edit...' : 'Apply edit'}
      </button>
    </form>
  );
}
