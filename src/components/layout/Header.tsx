import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import Icon from '../ui/Icon';
import Button from '../ui/Button';
import UserMenu from './UserMenu';
import { useI18n } from '../../i18n/I18nProvider';
import { useAuth } from '../../auth/AuthProvider';
import './Header.css';

export default function Header() {
  const { t, locale, toggleLocale } = useI18n();
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', label: t.nav.home },
    { to: '/evaluate', label: t.nav.evaluate },
    { to: '/pricing', label: t.nav.pricing },
  ];

  return (
    <header className="site-header">
      <div className="container site-header__bar">
        <Link to="/" className="site-header__brand" onClick={() => setMobileOpen(false)}>
          <Icon name="shield" />
          {t.common.brand}
        </Link>

        <nav className="site-header__nav" aria-label="Main">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="site-header__actions">
          <button
            className="lang-toggle"
            onClick={toggleLocale}
            aria-label={locale === 'ko' ? 'Switch to English' : '한국어로 전환'}
          >
            {locale === 'ko' ? 'English' : '한국어'}
          </button>
          {user ? (
            <UserMenu />
          ) : (
            <Link to="/login">
              <Button size="sm" variant="outline" aria-label={t.common.login}>
                <Icon name="user" size={16} />
                <span className="site-header__label">{t.common.login}</span>
              </Button>
            </Link>
          )}
          <button
            className="site-header__menu-btn"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            <Icon name={mobileOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      <div className={`container site-header__mobile ${mobileOpen ? 'is-open' : ''}`}>
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.to === '/'} onClick={() => setMobileOpen(false)}>
            {item.label}
          </NavLink>
        ))}
      </div>
    </header>
  );
}
