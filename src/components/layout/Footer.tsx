import { Link } from 'react-router-dom';
import Icon from '../ui/Icon';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../auth/AuthProvider';
import './Footer.css';

export default function Footer() {
  const { t } = useI18n();
  const { user, logout } = useAuth();

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__top">
          <div>
            <div className="site-footer__brand">
              <Icon name="shield" />
              {t.common.brand}
            </div>
            <p className="site-footer__tagline">{t.footer.tagline}</p>
          </div>

          <div className="site-footer__cols">
            <div className="site-footer__col">
              <h4>{t.nav.evaluate}</h4>
              <Link to="/evaluate">{t.common.startEvaluate}</Link>
              <Link to="/pricing">{t.nav.pricing}</Link>
            </div>
            <div className="site-footer__col">
              <h4>Account</h4>
              <Link to="/mypage">{t.common.myPage}</Link>
              {user ? (
                <button type="button" className="site-footer__link-btn" onClick={logout}>
                  {t.common.logout}
                </button>
              ) : (
                <Link to="/login">{t.common.login}</Link>
              )}
            </div>
          </div>
        </div>

        <div className="site-footer__bottom">
          <span>{t.footer.rights}</span>
          <span>Made for K-culture lovers everywhere</span>
        </div>
      </div>
    </footer>
  );
}
