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
  const { user, login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const a = t.auth;

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (user) navigate('/mypage', { replace: true });
  }, [user, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ name, email });
    navigate('/mypage');
  };

  const handleGoogle = () => {
    loginWithGoogle();
    navigate('/mypage');
  };

  return (
    <div className="login-page">
      <div className="card login-card">
        <div className="login-tabs">
          <button
            type="button"
            className={mode === 'login' ? 'is-active' : ''}
            onClick={() => setMode('login')}
          >
            {a.loginTab}
          </button>
          <button
            type="button"
            className={mode === 'signup' ? 'is-active' : ''}
            onClick={() => setMode('signup')}
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

          <Button type="submit" block size="lg">
            {mode === 'login' ? a.loginButton : a.signupButton}
          </Button>
        </form>

        <div className="login-divider">{a.or}</div>

        <button type="button" className="login-google" onClick={handleGoogle}>
          <GoogleIcon size={18} />
          {a.googleButton}
        </button>

        <div className="login-switch">
          {mode === 'login' ? a.switchToSignup : a.switchToLogin}
          <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
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
