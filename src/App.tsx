import { useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { EditForm } from './components/EditForm';
import { GenerateForm } from './components/GenerateForm';
import { MarkdownPanel } from './components/MarkdownPanel';
import { Toolbar } from './components/Toolbar';
import { BGPattern } from './components/ui/bg-pattern';
import { editReadmeContentStream, generateImage, generateReadmeContentStream } from './services/gemini';
import { fetchRepoInfo, fetchRepoTree } from './services/github';
import type { RepoInfo } from './types';
import './App.css';

export default function App() {
  const aiGenerationStatuses = [
    'AI is analyzing repository structure...',
    'AI is identifying project purpose and stack...',
    'AI is drafting README sections...',
    'AI is polishing wording and formatting...',
    'AI is finalizing output...',
  ];
  const navigate = useNavigate();
  const location = useLocation();
  const streamSessionIdRef = useRef(0);

  const [url, setUrl] = useState('');
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'edit'>('preview');
  const [editPrompt, setEditPrompt] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const hasGeneratedContent = markdown.trim().length > 0;
  const hasWorkspaceSession = loading || isEditing || Boolean(repoInfo) || hasGeneratedContent;
  const isWorkspaceRoute = location.pathname === '/workspace';

  function resetState() {
    streamSessionIdRef.current += 1;
    setRepoInfo(null);
    setMarkdown('');
    setStatusMessage('');
    setError('');
    setActiveTab('preview');
    setEditPrompt('');
    setAttachedImage(null);
    setCopied(false);
    setLoading(false);
    setIsEditing(false);
    setIsGeneratingImage(false);
  }

  function handleNewReadme() {
    resetState();
    navigate('/');
  }

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    if (!url.trim()) {
      return;
    }

    const currentSessionId = streamSessionIdRef.current + 1;
    streamSessionIdRef.current = currentSessionId;

    setLoading(true);
    setError('');
    setMarkdown('');
    setStatusMessage('Connecting to GitHub...');

    try {
      const info = await fetchRepoInfo(url);
      if (currentSessionId !== streamSessionIdRef.current) {
        return;
      }
      setRepoInfo(info);

      setStatusMessage('Reading repository structure...');
      const fileTree = await fetchRepoTree(info.owner.login, info.name, info.default_branch);
      if (currentSessionId !== streamSessionIdRef.current) {
        return;
      }

      navigate('/workspace');
      setActiveTab('preview');
      setStatusMessage(aiGenerationStatuses[0]);

      const stream = generateReadmeContentStream(info, fileTree);
      let fullContent = '';
      let streamPhaseIndex = 0;
      let streamedChunkCount = 0;

      for await (const chunk of stream) {
        if (currentSessionId !== streamSessionIdRef.current) {
          return;
        }
        fullContent += chunk;
        setMarkdown(fullContent);

        streamedChunkCount += 1;
        if (streamedChunkCount % 10 === 0 && streamPhaseIndex < aiGenerationStatuses.length - 1) {
          streamPhaseIndex += 1;
          setStatusMessage(aiGenerationStatuses[streamPhaseIndex]);
        }
      }

      if (currentSessionId !== streamSessionIdRef.current) {
        return;
      }
      setStatusMessage('Done.');
    } catch (requestError) {
      if (currentSessionId !== streamSessionIdRef.current) {
        return;
      }
      const message = requestError instanceof Error ? requestError.message : 'Unexpected error while generating README.';
      setError(message);
      setStatusMessage('');
      navigate('/');
    } finally {
      if (currentSessionId === streamSessionIdRef.current) {
        setLoading(false);
      }
    }
  }

  function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleEdit(event: React.FormEvent) {
    event.preventDefault();
    if ((!editPrompt.trim() && !attachedImage) || isEditing) {
      return;
    }

    const currentSessionId = streamSessionIdRef.current;
    setIsEditing(true);
    setError('');

    const instruction = attachedImage
      ? `${editPrompt} (Reference image attached: ${attachedImage.substring(0, 50)}...)`
      : editPrompt;

    setEditPrompt('');
    setAttachedImage(null);

    try {
      const stream = editReadmeContentStream(markdown, instruction);
      let fullContent = '';

      for await (const chunk of stream) {
        if (currentSessionId !== streamSessionIdRef.current) {
          return;
        }
        fullContent += chunk;
        setMarkdown(fullContent);
      }
    } catch (editError) {
      if (currentSessionId !== streamSessionIdRef.current) {
        return;
      }
      const message = editError instanceof Error ? editError.message : 'Unexpected error while editing README.';
      setError(message);
    } finally {
      if (currentSessionId === streamSessionIdRef.current) {
        setIsEditing(false);
      }
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error('Failed to copy markdown', copyError);
    }
  }

  function handleDownload() {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const fileUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = 'README.md';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(fileUrl);
  }

  async function handleAddImage() {
    const prompt = window.prompt('Image prompt');
    if (!prompt) {
      return;
    }

    setIsGeneratingImage(true);
    try {
      const imageUrl = await generateImage(prompt);
      setMarkdown((current) => `${current}\n![${prompt}](${imageUrl})\n`);
    } catch (imageError) {
      const message = imageError instanceof Error ? imageError.message : 'Image generation failed.';
      setError(message);
    } finally {
      setIsGeneratingImage(false);
    }
  }

  return (
    <main className={`app-shell ${isWorkspaceRoute ? 'app-shell--workspace' : 'app-shell--centered'}`}>
      <BGPattern className="z-0 opacity-100" variant="grid" mask="fade-edges" size={34} fill="rgba(255, 255, 255, 0.08)" />

      <Routes>
        <Route
          path="/"
          element={
            <section className="hero">
              <h1 className="hero-title">ReadMe Ai</h1>
              <GenerateForm
                url={url}
                onUrlChange={setUrl}
                onSubmit={handleGenerate}
                onImageUpload={handleImageUpload}
                loading={loading}
                attachedImage={attachedImage}
                loadingMessage={statusMessage}
              />
              {repoInfo && (
                <p className="repo-line">
                  Repository: <a href={repoInfo.html_url}>{repoInfo.full_name}</a>
                </p>
              )}
              {statusMessage && <p className="status-line">{statusMessage}</p>}
              {error && <p className="error-line">{error}</p>}
            </section>
          }
        />
        <Route
          path="/workspace"
          element={
            hasWorkspaceSession ? (
              <section className="workspace-screen">
                <Toolbar
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onCopy={handleCopy}
                  copied={copied}
                  onDownload={handleDownload}
                  onAddImage={handleAddImage}
                  isGeneratingImage={isGeneratingImage}
                  markdown={markdown}
                  repoInfo={repoInfo}
                  onNewReadme={handleNewReadme}
                />

                <div className="workspace-content">
                  {repoInfo && (
                    <p className="repo-line">
                      Repository: <a href={repoInfo.html_url}>{repoInfo.full_name}</a>
                    </p>
                  )}
                  {statusMessage && <p className="status-line">{statusMessage}</p>}
                  {error && <p className="error-line">{error}</p>}

                  <MarkdownPanel activeTab={activeTab} markdown={markdown} onMarkdownChange={setMarkdown} />
                  <p className="character-count">Characters: {markdown.length}</p>
                </div>

                <div className="workspace-bottom">
                  <EditForm
                    editPrompt={editPrompt}
                    onEditPromptChange={setEditPrompt}
                    onSubmit={handleEdit}
                    onImageUpload={handleImageUpload}
                    onRemoveImage={() => setAttachedImage(null)}
                    attachedImage={attachedImage}
                    isEditing={isEditing}
                    loading={loading || !hasGeneratedContent}
                  />
                </div>
              </section>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </main>
  );
}
