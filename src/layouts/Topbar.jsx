import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { RoleBadge } from '../components/Badges.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getSectionTitle } from '../routes/navigation.js';
import { initials } from '../utils/format.js';

export default function Topbar({ onMenu, onSignOut }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointer = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <header className="topbar">
      <button type="button" className="topbar__menu" onClick={onMenu} aria-label="Abrir menú">
        <Icon name="menu" size={22} />
      </button>
      <h2 className="topbar__title">{getSectionTitle(pathname)}</h2>

      <div className="profile" ref={menuRef}>
        <button
          type="button"
          className="profile__button"
          onClick={() => setMenuOpen((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="avatar" aria-hidden="true">
            {initials(user?.full_name)}
          </span>
          <span className="profile__info">
            <span className="profile__name">{user?.full_name}</span>
            <RoleBadge role={user?.role_name} />
          </span>
          <Icon name="chevron-down" size={16} />
        </button>

        {menuOpen && (
          <div className="menu" role="menu">
            <div className="menu__header">
              <p className="menu__name">{user?.full_name}</p>
              <p className="menu__email">{user?.email}</p>
            </div>
            <Link to="/configuracion" className="menu__item" role="menuitem">
              <Icon name="settings" size={17} /> Configuración de la cuenta
            </Link>
            <button type="button" className="menu__item menu__item--danger" role="menuitem" onClick={onSignOut}>
              <Icon name="logout" size={17} /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
