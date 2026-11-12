import { NavLink } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import Logo from '../components/Logo.jsx';
import { usePermissions } from '../hooks/usePermissions.js';
import { CLINICAL_MODULES, NAV_SECTIONS } from '../routes/navigation.js';
import { getPermissions } from '../utils/permissions.js';

function NavItem({ item, onNavigate }) {
  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) => `nav__link ${isActive ? 'nav__link--active' : ''}`.trim()}
    >
      <Icon name={item.icon} size={19} />
      <span>{item.label}</span>
    </NavLink>
  );
}

export default function Sidebar({ open, onClose, onSignOut }) {
  const { can, user } = usePermissions();
  const clinicalPermissions = getPermissions(user);
  const clinicalModules = CLINICAL_MODULES.filter((module) => clinicalPermissions.includes(module.permission));

  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => (!item.permission || can(item.permission)) && (!item.role || user?.role_name === item.role)),
  })).filter((section) => section.items.length > 0);

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'sidebar-overlay--visible' : ''}`.trim()} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`.trim()} aria-label="Barra lateral">
        <div className="sidebar__header">
          <Logo light />
          <button type="button" className="sidebar__close" onClick={onClose} aria-label="Cerrar menú">
            <Icon name="x" size={20} />
          </button>
        </div>

        <nav className="nav" aria-label="Navegación principal">
          {sections.map((section) => (
            <div className="nav__section" key={section.id}>
              {section.title && <p className="nav__title">{section.title}</p>}
              {section.items.map((item) => (
                <NavItem key={item.id} item={item} onNavigate={onClose} />
              ))}
            </div>
          ))}

          {clinicalModules.length > 0 && (
            <div className="nav__section">
              <p className="nav__title">Módulos clínicos</p>
              {clinicalModules.map((module) => (
                <NavItem key={module.id} item={module} onNavigate={onClose} />
              ))}
            </div>
          )}

          <div className="nav__section">
            <p className="nav__title">Cuenta</p>
            <NavItem item={{ id: 'settings', label: 'Configuración', path: '/configuracion', icon: 'settings' }} onNavigate={onClose} />
            <button type="button" className="nav__link nav__button" onClick={onSignOut}>
              <Icon name="logout" size={19} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
