import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { tpoOptions } from '../data/tpoOptions';
import { mockHistory } from '../data/mockHistory';
import './MyPage.css';

export default function MyPage() {
  const { t, locale } = useI18n();
  const { user, logout, updateProfile } = useAuth();
  const m = t.mypage;

  const [name, setName] = useState(user?.name ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [showSaved, setShowSaved] = useState(false);

  if (!user) {
    return (
      <div className="container">
        <div className="card mypage-protected">
          <div className="mypage-protected__icon">
            <Icon name="user" size={26} />
          </div>
          <h1>{m.protectedTitle}</h1>
          <p>{m.protectedDesc}</p>
          <Link to="/login">
            <Button>{m.loginCta}</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({ name, bio });
    setShowSaved(true);
    window.setTimeout(() => setShowSaved(false), 2000);
  };

  return (
    <div className="container mypage">
      <div className="card mypage-profile">
        <div className="mypage-avatar">{user.name.charAt(0).toUpperCase()}</div>
        <div>
          <div className="mypage-profile__name">{user.name}</div>
          <div className="mypage-profile__email">{user.email}</div>
          <div className="mypage-profile__provider">
            <Icon name="check" size={12} />
            {user.provider === 'google' ? m.providerGoogle : m.providerEmail}
          </div>
        </div>
        <div className="mypage-profile__actions">
          <Button variant="ghost" size="sm" onClick={logout}>
            {t.common.logout}
          </Button>
        </div>
      </div>

      <section className="mypage-section">
        <h2>{m.profileTitle}</h2>
        <form className="card mypage-form" onSubmit={handleSave}>
          <div className="mypage-field">
            <label htmlFor="mypage-name">{m.nameLabel}</label>
            <input
              id="mypage-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="mypage-field">
            <label htmlFor="mypage-bio">{m.bioLabel}</label>
            <textarea
              id="mypage-bio"
              rows={2}
              placeholder={m.bioPlaceholder}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
            />
          </div>
          <div className="mypage-form__footer">
            <Button type="submit">{m.saveButton}</Button>
            {showSaved && (
              <span className="mypage-saved-note">
                <Icon name="check" size={14} />
                {m.savedNote}
              </span>
            )}
          </div>
        </form>
      </section>

      <section className="mypage-section">
        <h2>{m.historyTitle}</h2>
        <div className="history-list">
          {mockHistory.map((entry) => {
            const tpo = tpoOptions.find((o) => o.key === entry.tpoKey)!;
            return (
              <div className="card history-card" key={entry.id}>
                <div className="history-card__icon">
                  <Icon name={tpo.icon} size={18} />
                </div>
                <div className="history-card__body">
                  <div className="history-card__title">
                    {locale === 'ko' ? tpo.labelKo : tpo.labelEn}
                  </div>
                  <div className="history-card__date">{entry.date}</div>
                </div>
                <div className="history-card__score">
                  {entry.score}
                  <span>/100</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
