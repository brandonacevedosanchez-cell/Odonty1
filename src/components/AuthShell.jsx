import Icon from './Icon.jsx';
import Logo from './Logo.jsx';

const HIGHLIGHTS = [
  { icon: 'shield-check', text: 'Acceso seguro con verificación en dos pasos' },
  { icon: 'users', text: 'Roles y permisos según el cargo de cada trabajador' },
  { icon: 'audit', text: 'Historial de auditoría de las acciones administrativas' },
];

/**
 * Estructura común de las pantallas de acceso: panel de marca + tarjeta con el formulario.
 * `wide` amplía la tarjeta para formularios largos (registro de clínica) manteniendo
 * el mismo panel de marca y la misma escala tipográfica que el login.
 */
export default function AuthShell({ title, subtitle, children, footer, wide = false }) {
  return (
    <div className={`auth ${wide ? 'auth--wide' : ''}`.trim()}>
      <section className="auth__brand" aria-hidden="true">
        <Logo size="lg" light />
        <h2 className="auth__tagline">Gestión odontológica clara, ordenada y segura.</h2>
        <ul className="auth__list">
          {HIGHLIGHTS.map((item) => (
            <li key={item.text}>
              <span className="auth__list-icon">
                <Icon name={item.icon} size={18} />
              </span>
              {item.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="auth__panel">
        <div className={`auth__card ${wide ? 'auth__card--wide' : ''}`.trim()}>
          <div className="auth__mobile-logo">
            <Logo />
          </div>
          <h1 className="auth__title">{title}</h1>
          {subtitle && <p className="auth__subtitle">{subtitle}</p>}
          {children}
          {footer && <div className="auth__footer">{footer}</div>}
        </div>
      </section>
    </div>
  );
}
