import type { Session, User } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthModal, type AuthMode } from './components/AuthModal';
import { EditForm } from './components/EditForm';
import { GenerateForm } from './components/GenerateForm';
import { MarkdownPanel } from './components/MarkdownPanel';
import { Toolbar } from './components/Toolbar';
import { BGPattern } from './components/ui/bg-pattern';
import { editReadmeContentStream, generateReadmeContentStream } from './services/gemini';
import { fetchGithubUserRepos, fetchRepoInfo, fetchRepoTree, type GithubUserRepoOption } from './services/github';
import {
  SUPABASE_CONFIG_ERROR,
  getCurrentSession,
  onSupabaseAuthStateChange,
  signInWithEmailPassword,
  signInWithGithub,
  signOut,
  signUpWithEmailPassword,
} from './services/supabase';
import type { RepoInfo } from './types';
import './App.css';

function normalizeAuthError(error: unknown): string {
  if (SUPABASE_CONFIG_ERROR) {
    return SUPABASE_CONFIG_ERROR;
  }

  const message = error instanceof Error ? error.message : 'Authentication failed.';
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }

  if (normalizedMessage.includes('email not confirmed')) {
    return 'Email is not confirmed yet. Check your inbox and confirm your account.';
  }

  return message;
}

function getUserDisplayName(user: User): string {
  const metadataName = (user.user_metadata?.full_name || user.user_metadata?.name) as string | undefined;
  return metadataName || user.email || 'Account';
}

function getUserAvatar(user: User): string | null {
  const metadataAvatar = (user.user_metadata?.avatar_url || user.user_metadata?.picture) as string | undefined;
  return metadataAvatar ?? null;
}

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const streamSessionIdRef = useRef(0);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  const [url, setUrl] = useState('');
  const [repoInfo, setRepoInfo] = useState<RepoInfo | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [error, setError] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'raw' | 'edit'>('preview');
  const [editPrompt, setEditPrompt] = useState('');
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthInitializing, setIsAuthInitializing] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authMessage, setAuthMessage] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [githubRepoOptions, setGithubRepoOptions] = useState<GithubUserRepoOption[]>([]);
  const [selectedRepoUrl, setSelectedRepoUrl] = useState('');
  const [isRepoListLoading, setIsRepoListLoading] = useState(false);
  const [repoListError, setRepoListError] = useState('');

  const user = session?.user ?? null;
  const hasGeneratedContent = markdown.trim().length > 0;
  const hasWorkspaceSession = loading || isEditing || Boolean(repoInfo) || hasGeneratedContent;
  const isWorkspaceRoute = location.pathname === '/workspace';
  const userDisplayName = user ? getUserDisplayName(user) : '';
  const userAvatar = user ? getUserAvatar(user) : null;
  const userInitial = userDisplayName.trim().charAt(0).toUpperCase() || 'U';
  const isGithubLogin = user?.app_metadata?.provider === 'github';
  const githubUsername = (
    user?.user_metadata?.user_name ||
    user?.user_metadata?.preferred_username ||
    user?.user_metadata?.login ||
    ''
  )
    .toString()
    .trim();
  const repoDropdownPlaceholder = !user
    ? 'Login with GitHub to load your repositories'
    : !isGithubLogin
      ? 'Sign in through GitHub to load repositories'
      : isRepoListLoading
        ? 'Loading your GitHub repositories...'
        : repoListError
          ? repoListError
          : githubRepoOptions.length === 0
            ? 'No repositories found'
            : 'Select one of your repositories';

  const openAuthModal = useCallback((mode: AuthMode) => {
    setAuthMode(mode);
    setAuthError(SUPABASE_CONFIG_ERROR ?? '');
    setAuthMessage('');
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setAuthError('');
    setAuthMessage('');
  }, []);

  useEffect(() => {
    let mounted = true;

    if (SUPABASE_CONFIG_ERROR) {
      setIsAuthInitializing(false);
      return () => {
        mounted = false;
      };
    }

    getCurrentSession()
      .then((currentSession) => {
        if (mounted) {
          setSession(currentSession);
        }
      })
      .catch((authInitError) => {
        if (mounted) {
          setAuthError(normalizeAuthError(authInitError));
        }
      })
      .finally(() => {
        if (mounted) {
          setIsAuthInitializing(false);
        }
      });

    const authState = onSupabaseAuthStateChange((nextSession) => {
      if (!mounted) {
        return;
      }

      setSession(nextSession);
      if (nextSession) {
        setIsAuthModalOpen(false);
        setAuthError('');
        setAuthMessage('');
      }
    });

    return () => {
      mounted = false;
      authState.data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (location.pathname === '/workspace' && !isAuthInitializing && !user) {
      openAuthModal('login');
      navigate('/', { replace: true });
    }
  }, [isAuthInitializing, location.pathname, navigate, openAuthModal, user]);

  useEffect(() => {
    if (!isUserMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!userMenuRef.current) {
        return;
      }
      if (!userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isUserMenuOpen]);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setGithubRepoOptions([]);
      setSelectedRepoUrl('');
      setRepoListError('');
      setIsRepoListLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!isGithubLogin) {
      setGithubRepoOptions([]);
      setSelectedRepoUrl('');
      setRepoListError('');
      setIsRepoListLoading(false);
      return () => {
        cancelled = true;
      };
    }

    if (!githubUsername) {
      setGithubRepoOptions([]);
      setSelectedRepoUrl('');
      setRepoListError('GitHub username not found in account profile.');
      setIsRepoListLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setIsRepoListLoading(true);
    setRepoListError('');

    fetchGithubUserRepos(githubUsername, session?.provider_token ?? undefined)
      .then((repos) => {
        if (cancelled) {
          return;
        }
        setGithubRepoOptions(repos);
      })
      .catch((repoError) => {
        if (cancelled) {
          return;
        }
        const message = repoError instanceof Error ? repoError.message : 'Failed to load your repositories.';
        setRepoListError(message);
        setGithubRepoOptions([]);
      })
      .finally(() => {
        if (cancelled) {
          return;
        }
        setIsRepoListLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [githubUsername, isGithubLogin, session?.provider_token, user]);

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
    setSelectedRepoUrl('');
  }

  function handleNewReadme() {
    resetState();
    navigate('/');
  }

  function handleUrlChange(nextUrl: string) {
    setUrl(nextUrl);
    if (nextUrl !== selectedRepoUrl) {
      setSelectedRepoUrl('');
    }
  }

  function handleRepoSelect(nextRepoUrl: string) {
    setSelectedRepoUrl(nextRepoUrl);
    if (nextRepoUrl) {
      setUrl(nextRepoUrl);
    }
  }

  async function handleGenerate(event: React.FormEvent) {
    event.preventDefault();
    if (!url.trim()) {
      return;
    }
    if (isAuthInitializing) {
      setError('Checking sign-in status. Please wait a moment.');
      return;
    }
    if (!user) {
      openAuthModal('login');
      setError('Please log in to generate a README.');
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
      setStatusMessage('AI is generating your README...');

      const stream = generateReadmeContentStream(info, fileTree);
      let fullContent = '';

      for await (const chunk of stream) {
        if (currentSessionId !== streamSessionIdRef.current) {
          return;
        }
        fullContent += chunk;
        setMarkdown(fullContent);
      }

      if (currentSessionId !== streamSessionIdRef.current) {
        return;
      }
      setStatusMessage('');
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
    if (isAuthInitializing) {
      setError('Checking sign-in status. Please wait a moment.');
      return;
    }
    if (!user) {
      openAuthModal('login');
      setError('Please log in to edit your README.');
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

  async function handleGithubSignIn() {
    if (SUPABASE_CONFIG_ERROR) {
      setAuthError(SUPABASE_CONFIG_ERROR);
      return;
    }

    setAuthError('');
    setAuthMessage('');
    setIsAuthBusy(true);

    try {
      await signInWithGithub();
    } catch (loginError) {
      setAuthError(normalizeAuthError(loginError));
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function handleEmailAuth(mode: AuthMode, email: string, password: string) {
    if (SUPABASE_CONFIG_ERROR) {
      setAuthError(SUPABASE_CONFIG_ERROR);
      return;
    }

    if (!email || !password) {
      setAuthError('Email and password are required.');
      return;
    }

    setAuthError('');
    setAuthMessage('');
    setIsAuthBusy(true);

    try {
      if (mode === 'login') {
        await signInWithEmailPassword(email, password);
        setIsAuthModalOpen(false);
      } else {
        const response = await signUpWithEmailPassword(email, password);
        if (response.data.session) {
          setIsAuthModalOpen(false);
        } else {
          setAuthMessage('Sign-up successful. Check your email to confirm your account before logging in.');
          setAuthMode('login');
        }
      }
    } catch (emailAuthError) {
      setAuthError(normalizeAuthError(emailAuthError));
    } finally {
      setIsAuthBusy(false);
    }
  }

  async function handleSignOut() {
    setIsUserMenuOpen(false);

    try {
      await signOut();
      resetState();
      navigate('/');
    } catch (logoutError) {
      setError(normalizeAuthError(logoutError));
    }
  }

  return (
    <main className={`app-shell ${isWorkspaceRoute ? 'app-shell--workspace' : 'app-shell--centered'}`}>
      <BGPattern className="z-0 opacity-100" variant="grid" mask="fade-edges" size={34} fill="rgba(255, 255, 255, 0.08)" />
      <div className="auth-corner">
        {isAuthInitializing && !SUPABASE_CONFIG_ERROR ? (
          <span className="auth-corner-status">Checking session...</span>
        ) : user ? (
          <div className="auth-user-menu" ref={userMenuRef}>
            <button className="auth-user-trigger" type="button" onClick={() => setIsUserMenuOpen((open) => !open)} aria-haspopup="menu" aria-expanded={isUserMenuOpen}>
              {userAvatar ? (
                <img src={userAvatar} alt={userDisplayName} className="auth-user-avatar" />
              ) : (
                <span className="auth-user-avatar auth-user-avatar--fallback">{userInitial}</span>
              )}
              <span className="auth-user-name">{userDisplayName}</span>
            </button>

            {isUserMenuOpen && (
              <div className="auth-user-dropdown" role="menu">
                <p className="auth-user-email">{user.email || 'Signed in user'}</p>
                <button className="auth-user-logout" type="button" onClick={handleSignOut}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-corner-actions">
            <button className="auth-corner-btn auth-corner-btn--ghost" type="button" onClick={() => openAuthModal('login')}>
              Login
            </button>
            <button className="auth-corner-btn" type="button" onClick={() => openAuthModal('signup')}>
              Sign up
            </button>
          </div>
        )}
      </div>

      <Routes>
        <Route
          path="/"
          element={
            <section className="hero">
              <h1 className="hero-title">ReadMe Ai</h1>
              <GenerateForm
                url={url}
                onUrlChange={handleUrlChange}
                onSubmit={handleGenerate}
                onImageUpload={handleImageUpload}
                loading={loading}
                attachedImage={attachedImage}
                loadingMessage={statusMessage}
                repoOptions={githubRepoOptions}
                selectedRepoUrl={selectedRepoUrl}
                onRepoSelect={handleRepoSelect}
                repoDropdownPlaceholder={repoDropdownPlaceholder}
              />
              {SUPABASE_CONFIG_ERROR && <p className="error-line">{SUPABASE_CONFIG_ERROR}</p>}
              {repoInfo && (
                <p className="repo-line">
                  Repository: <a href={repoInfo.html_url}>{repoInfo.full_name}</a>
                </p>
              )}
              {error && <p className="error-line">{error}</p>}
            </section>
          }
        />
        <Route
          path="/workspace"
          element={
            user && hasWorkspaceSession ? (
              <section className="workspace-screen">
                <Toolbar
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onCopy={handleCopy}
                  copied={copied}
                  onDownload={handleDownload}
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
                  {error && <p className="error-line">{error}</p>}

                  <MarkdownPanel
                    activeTab={activeTab}
                    markdown={markdown}
                    onMarkdownChange={setMarkdown}
                    statusMessage={loading ? statusMessage : ''}
                  />
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

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        loading={isAuthBusy}
        error={authError}
        message={authMessage}
        onClose={closeAuthModal}
        onModeChange={setAuthMode}
        onGithubSignIn={handleGithubSignIn}
        onEmailAuth={handleEmailAuth}
      />
    </main>
  );
}
