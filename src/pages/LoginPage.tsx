import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import GoogleIcon from '../components/ui/GoogleIcon';
import Button from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import './LoginPage.css';

export default function LoginPage() {
  const { t } = useI18n();
  const { user, loading: authLoading, login, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const a = t.auth;

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate('/mypage', { replace: true });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = mode === 'login' ? await login({ email, password }) : await signup({ name, email, password });
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.needsConfirmation) {
      setNeedsConfirmation(true);
      return;
    }
    navigate('/mypage');
  };

  const handleGoogle = async () => {
    setError(null);
    const result = await loginWithGoogle();
    if (result.error) setError(result.error);
    // 성공 시 Google 페이지로 리디렉션되므로 여기서 별도 네비게이션은 하지 않는다.
  };

  if (needsConfirmation) {
    return (
      <div className="login-page">
        <div className="card login-card login-confirmation">
          <div className="login-confirmation__icon">
            <Icon name="check" size={24} />
          </div>
          <h1>{a.confirmationTitle}</h1>
          <p>{a.confirmationDesc}</p>
          <Button variant="outline" onClick={() => setNeedsConfirmation(false)}>
            {a.loginTab}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => {
              setMode('login');
              setError(null);
            }}
          >
            {a.loginTab}
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'is-active' : ''}
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
          >
            {a.signupTab}
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="login-field">
              <label htmlFor="login-name">{a.nameLabel}</label>
              <input
                id="login-name"
                type="text"
                placeholder={a.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="login-field">
            <label htmlFor="login-email">{a.emailLabel}</label>
            <input
              id="login-email"
              type="email"
              placeholder={a.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">{a.passwordLabel}</label>
            <input
              id="login-password"
              type="password"
              placeholder={a.passwordPlaceholder}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          {error && (
            <p className="login-error">
              {a.errorPrefix}
              {error}
            </p>
          )}

          <Button type="submit" block size="lg" disabled={submitting}>
            {submitting ? a.submitting : mode === 'login' ? a.loginButton : a.signupButton}
          </Button>
        </form>

        <div className="login-divider">{a.or}</div>

        <button type="button" className="login-google" onClick={handleGoogle}>
          <GoogleIcon size={18} />
          {a.googleButton}
        </button>

        <div className="login-switch">
          {mode === 'login' ? a.switchToSignup : a.switchToLogin}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login');
              setError(null);
            }}
          >
            {mode === 'login' ? a.signupTab : a.loginTab}
          </button>
        </div>
      </div>

      <p className="login-disclaimer">
        <Icon name="shield" size={13} />
        {a.disclaimer}
      </p>
    </div>
  );
}
