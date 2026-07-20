import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/ui/Icon';
import Button from '../components/ui/Button';
import { useI18n } from '../i18n/I18nProvider';
import { useAuth } from '../auth/AuthProvider';
import { tpoOptions } from '../data/tpoOptions';
import { supabase } from '../lib/supabaseClient';
import { invokeFunction } from '../lib/payments/invokeFunction';
import './MyPage.css';

interface EvaluationRow {
  id: string;
  tpo: string;
  overall_score: number;
  created_at: string;
}

export default function MyPage() {
  const { t, locale } = useI18n();
  const { user, loading: authLoading, logout, updateProfile } = useAuth();
  const m = t.mypage;

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [showSaved, setShowSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [history, setHistory] = useState<EvaluationRow[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setBio(user.bio);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('evaluations')
      .select('id, tpo, overall_score, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (!cancelled) setHistory(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (authLoading) {
    return <div className="container mypage-loading" aria-busy="true" />;
  }

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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    const result = await updateProfile({ name, bio });
    if (result.error) {
      setSaveError(result.error);
      return;
    }
    setShowSaved(true);
    window.setTimeout(() => setShowSaved(false), 2000);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(m.historyDeleteConfirm)) return;
    setDeletingId(id);
    setDeleteError(null);
    try {
      await invokeFunction('delete-evaluation', { evaluationId: id });
      setHistory((prev) => prev?.filter((entry) => entry.id !== id) ?? prev);
    } catch {
      setDeleteError(m.historyDeleteError);
    } finally {
      setDeletingId(null);
    }
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
          {saveError && <p className="mypage-error">{t.auth.errorPrefix}{saveError}</p>}
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
        {deleteError && <p className="mypage-error">{deleteError}</p>}
        {history === null ? (
          <div className="history-list" aria-busy="true" />
        ) : history.length === 0 ? (
          <div className="card mypage-protected">
            <div className="mypage-protected__icon">
              <Icon name="shirt" size={26} />
            </div>
            <h1>{m.historyEmptyTitle}</h1>
            <p>{m.historyEmptyDesc}</p>
            <Link to="/evaluate">
              <Button>{m.historyEmptyCta}</Button>
            </Link>
          </div>
        ) : (
          <div className="history-list">
            {history.map((entry) => {
              const tpo = tpoOptions.find((o) => o.key === entry.tpo);
              if (!tpo) return null;
              return (
                <div className="card history-card" key={entry.id}>
                  <Link className="history-card__link" to={`/mypage/history/${entry.id}`}>
                    <div className="history-card__icon">
                      <Icon name={tpo.icon} size={18} />
                    </div>
                    <div className="history-card__body">
                      <div className="history-card__title">
                        {locale === 'ko' ? tpo.labelKo : tpo.labelEn}
                      </div>
                      <div className="history-card__date">
                        {new Date(entry.created_at).toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US')}
                      </div>
                    </div>
                    <div className="history-card__score">
                      {entry.overall_score}
                      <span>/100</span>
                    </div>
                    <Icon name="chevronRight" size={16} className="history-card__chevron" />
                  </Link>
                  <button
                    type="button"
                    className="history-card__delete"
                    aria-label={m.historyDeleteCta}
                    disabled={deletingId === entry.id}
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
