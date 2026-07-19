import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../auth/AuthProvider';
import './UserMenu.css';

export default function UserMenu() {
  const { t } = useI18n();
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <details className="user-menu">
      <summary className="user-menu__trigger" aria-label={user.name}>
        <span className="user-menu__avatar">{user.name.charAt(0).toUpperCase()}</span>
      </summary>
      <div className="user-menu__panel">
        <div className="user-menu__who">
          <div className="user-menu__name">{user.name}</div>
          <div className="user-menu__email">{user.email}</div>
        </div>
        <Link to="/mypage" className="user-menu__item">
          <Icon name="user" size={16} />
          {t.common.myPage}
        </Link>
        <button type="button" className="user-menu__item" onClick={logout}>
          <Icon name="close" size={16} />
          {t.common.logout}
        </button>
      </div>
    </details>
  );
}
