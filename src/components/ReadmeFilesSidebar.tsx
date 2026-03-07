import { Pencil, Save, Trash2, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import type { ReadmeFile } from '../types';
import './ReadmeFilesSidebar.css';

type ReadmeFilesSidebarProps = {
  files: ReadmeFile[];
  activeFileId: string | null;
  isLoading: boolean;
  error: string;
  renamingFileId: string | null;
  deletingFileId: string | null;
  onSelectFile: (file: ReadmeFile) => void;
  onRenameFile: (fileId: string, title: string) => Promise<void>;
  onDeleteFile: (file: ReadmeFile) => Promise<void>;
};

function formatFileDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ReadmeFilesSidebar({
  files,
  activeFileId,
  isLoading,
  error,
  renamingFileId,
  deletingFileId,
  onSelectFile,
  onRenameFile,
  onDeleteFile,
}: ReadmeFilesSidebarProps) {
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const editingFile = useMemo(() => files.find((file) => file.id === editingFileId) ?? null, [editingFileId, files]);

  useEffect(() => {
    if (!editingFile) {
      setRenameValue('');
      return;
    }
    setRenameValue(editingFile.title);
  }, [editingFile]);

  function startRename(file: ReadmeFile) {
    setEditingFileId(file.id);
    setRenameValue(file.title);
  }

  function cancelRename() {
    setEditingFileId(null);
    setRenameValue('');
  }

  async function commitRename() {
    if (!editingFileId || !editingFile) {
      return;
    }

    const nextTitle = renameValue.trim();
    if (!nextTitle) {
      cancelRename();
      return;
    }

    if (nextTitle === editingFile.title) {
      cancelRename();
      return;
    }

    try {
      await onRenameFile(editingFileId, nextTitle);
      cancelRename();
    } catch {
      // Keep input open so the user can retry after error is shown in the sidebar.
    }
  }

  async function handleDelete(file: ReadmeFile) {
    const confirmed = window.confirm(`Delete "${file.title}"? This action cannot be undone.`);
    if (!confirmed) {
      return;
    }

    try {
      await onDeleteFile(file);
    } catch {
      // Error is surfaced through parent state.
    }
  }

  return (
    <aside className="files-sidebar">
      <div className="files-sidebar-head">
        <h2>Files</h2>
      </div>

      {error && <p className="files-sidebar-error">{error}</p>}
      {isLoading && <p className="files-sidebar-note">Loading files...</p>}

      {!isLoading && !error && files.length === 0 && <p className="files-sidebar-note">No files yet. Generate a README to create your first file.</p>}

      <div className="files-list">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = editingFileId === file.id;
          const isRenaming = renamingFileId === file.id;
          const isDeleting = deletingFileId === file.id;

          return (
            <div key={file.id} className={`files-item ${isActive ? 'files-item--active' : ''}`}>
              {isEditing ? (
                <input
                  className="files-item-rename-input"
                  value={renameValue}
                  onChange={(event) => setRenameValue(event.target.value)}
                  onBlur={() => {
                    void commitRename();
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void commitRename();
                    }
                    if (event.key === 'Escape') {
                      event.preventDefault();
                      cancelRename();
                    }
                  }}
                  autoFocus
                  disabled={isRenaming}
                />
              ) : (
                <button className="files-item-select" type="button" onClick={() => onSelectFile(file)} disabled={isDeleting}>
                  <span className="files-item-title">{file.title}</span>
                  <span className="files-item-meta">{formatFileDate(file.updatedAt)}</span>
                </button>
              )}

              <div className="files-item-actions">
                {isEditing ? (
                  <>
                    <button className="files-item-action" type="button" onClick={() => void commitRename()} disabled={isRenaming} aria-label="Save file name">
                      <Save size={14} />
                    </button>
                    <button className="files-item-action" type="button" onClick={cancelRename} disabled={isRenaming} aria-label="Cancel rename">
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button className="files-item-action" type="button" onClick={() => startRename(file)} disabled={isDeleting} aria-label="Rename file">
                      <Pencil size={14} />
                    </button>
                    <button className="files-item-action files-item-action--danger" type="button" onClick={() => void handleDelete(file)} disabled={isDeleting} aria-label="Delete file">
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
