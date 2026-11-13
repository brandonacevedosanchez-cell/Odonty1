import { Link } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { RoleBadge } from '../components/Badges.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePermissions } from '../hooks/usePermissions.js';
import { CLINICAL_MODULES } from '../routes/navigation.js';
import { firstName } from '../utils/format.js';
import { getPermissions, PERMISSIONS, ROLE_DESCRIPTIONS } from '../utils/permissions.js';

// Accesos rápidos: solo se muestran los que el usuario tiene autorizados.
const QUICK_ACTIONS = [
  { id: 'users', label: 'Ver usuarios', text: 'Consulta y gestiona a los trabajadores.', path: '/usuarios', icon: 'users', permission: PERMISSIONS.USERS_VIEW },
  { id: 'create', label: 'Crear trabajador', text: 'Registra un nuevo trabajador de la clínica.', path: '/usuarios/nuevo', icon: 'user-plus', permission: PERMISSIONS.USERS_CREATE },
  { id: 'roles', label: 'Roles y permisos', text: 'Revisa qué puede hacer cada rol.', path: '/roles', icon: 'shield-check', permission: PERMISSIONS.USERS_VIEW },
  { id: 'audit', label: 'Auditoría', text: 'Historial de acciones administrativas.', path: '/auditoria', icon: 'audit', permission: PERMISSIONS.AUDIT_VIEW },
  { id: 'settings', label: 'Mi cuenta', text: 'Datos de tu cuenta, MFA y cambio de contraseña.', path: '/configuracion', icon: 'settings' },
];

export default function HomePage() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const actions = QUICK_ACTIONS.filter((action) => !action.permission || can(action.permission));
  const hasAdminAccess = can(PERMISSIONS.USERS_VIEW);
  const clinicalModules = CLINICAL_MODULES.filter((module) => getPermissions(user).includes(module.permission));

  return (
    <>
      <section className="hero">
        <div>
          <p className="hero__eyebrow">Bienvenido a Odonty</p>
          <h1 className="hero__title">Hola, {firstName(user?.full_name)}</h1>
          <p className="hero__text">
            {hasAdminAccess
              ? 'Desde aquí puedes administrar a los trabajadores de la clínica, la agenda y los módulos clínicos.'
              : 'Tu cuenta está activa. Consulta los módulos disponibles para tu rol.'}
          </p>
        </div>
        <div className="hero__role">
          <span className="hero__role-label">Tu rol</span>
          <RoleBadge role={user?.role_name} />
          <p>{ROLE_DESCRIPTIONS[user?.role_name]}</p>
        </div>
      </section>

      <section className="section">
        <PageHeader title="Accesos rápidos" description="Funciones disponibles para tu rol." />
        <div className="grid grid--cards">
          {actions.map((action) => (
            <Link key={action.id} to={action.path} className="card card--link">
              <span className="card__icon">
                <Icon name={action.icon} size={22} />
              </span>
              <h3 className="card__title">{action.label}</h3>
              <p className="card__text">{action.text}</p>
              <span className="card__cta">
                Abrir <Icon name="arrow-right" size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="section">
        <PageHeader title="Estado del sistema" description="Módulos de Odonty y su disponibilidad." />
        <div className="grid grid--cards">
          <div className="card">
            <span className="card__icon card__icon--ok">
              <Icon name="shield-check" size={22} />
            </span>
            <h3 className="card__title">Usuarios, roles y permisos</h3>
            <p className="card__text">Conectado al backend de Odonty.</p>
            <span className="badge badge--success">
              <span className="badge__dot" aria-hidden="true" />
              Disponible
            </span>
          </div>
          {clinicalModules.map((module) => {
            const pending = module.id === 'facturacion';
            return (
              <Link key={module.id} to={module.path} className="card card--link">
                <span className={`card__icon ${pending ? 'card__icon--muted' : 'card__icon--ok'}`}>
                  <Icon name={module.icon} size={22} />
                </span>
                <h3 className="card__title">{module.label}</h3>
                <p className="card__text">
                  {pending
                    ? 'El catálogo actual no incluye endpoints financieros; la pantalla queda informativa.'
                    : 'Conectado al backend de Odonty.'}
                </p>
                <span className="card__cta">Abrir módulo <Icon name="arrow-right" size={15} /></span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
