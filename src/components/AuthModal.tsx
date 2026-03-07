import { useEffect, useState } from 'react';
import './AuthModal.css';

export type AuthMode = 'login' | 'signup';

type AuthModalProps = {
  isOpen: boolean;
  mode: AuthMode;
  loading: boolean;
  error: string;
  message: string;
  onClose: () => void;
  onModeChange: (mode: AuthMode) => void;
  onGithubSignIn: () => Promise<void>;
  onEmailAuth: (mode: AuthMode, email: string, password: string) => Promise<void>;
};

export function AuthModal({
  isOpen,
  mode,
  loading,
  error,
  message,
  onClose,
  onModeChange,
  onGithubSignIn,
  onEmailAuth,
}: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
    }
  }, [isOpen, mode]);

  if (!isOpen) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    await onEmailAuth(mode, email.trim(), password);
  }

  return (
    <div className="auth-modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <button className="auth-modal-close" type="button" onClick={onClose} aria-label="Close authentication dialog">
          x
        </button>

        <h2 id="auth-modal-title" className="auth-modal-title">
          {mode === 'login' ? 'Log in to ReadMe Ai' : 'Create your account'}
        </h2>

        <div className="auth-modal-tabs" role="tablist" aria-label="Authentication mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-modal-tab ${mode === 'login' ? 'auth-modal-tab--active' : ''}`}
            onClick={() => onModeChange('login')}
          >
            Login
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            className={`auth-modal-tab ${mode === 'signup' ? 'auth-modal-tab--active' : ''}`}
            onClick={() => onModeChange('signup')}
          >
            Sign up
          </button>
        </div>

        <div className="auth-modal-oauth">
          <button className="auth-modal-provider auth-modal-provider--github" type="button" onClick={onGithubSignIn} disabled={loading}>
            Continue with GitHub
          </button>
        </div>

        <p className="auth-modal-divider">or use email and password</p>

        <form className="auth-modal-form" onSubmit={handleSubmit}>
          <label className="auth-modal-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="auth-modal-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter password"
              minLength={6}
              required
            />
          </label>

          <button className="auth-modal-submit" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Login with email' : 'Sign up with email'}
          </button>
        </form>

        {error && <p className="auth-modal-feedback auth-modal-feedback--error">{error}</p>}
        {message && <p className="auth-modal-feedback auth-modal-feedback--success">{message}</p>}
      </section>
    </div>
  );
}
