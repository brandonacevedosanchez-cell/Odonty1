import Icon from '../../components/Icon.jsx';
import { RoleBadge } from '../../components/Badges.jsx';
import { Alert } from '../../components/Feedback.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import {
  ALL_ROLES,
  PERMISSION_LABELS,
  PERMISSIONS,
  ROLE_DESCRIPTIONS,
  ROLE_PERMISSIONS,
} from '../../utils/permissions.js';

const PERMISSION_ORDER = [
  PERMISSIONS.USERS_VIEW,
  PERMISSIONS.USERS_CREATE,
  PERMISSIONS.USERS_MANAGE_ROLE,
  PERMISSIONS.AUDIT_VIEW,
  PERMISSIONS.CLINICS_REVIEW,
  PERMISSIONS.PATIENTS_VIEW,
  PERMISSIONS.APPOINTMENTS_VIEW,
  PERMISSIONS.CLINICAL_HISTORY_VIEW,
  PERMISSIONS.ODONTOGRAM_VIEW,
  PERMISSIONS.BILLING_VIEW,
  PERMISSIONS.NOTIFICATIONS_VIEW,
];

const RULES = [
  'Nadie puede cambiar su propio rol.',
  'Nadie puede modificar el rol del superadministrador.',
  'Un administrador no puede modificar a otro administrador.',
  'Un administrador solo puede crear o asignar odontólogo y recepcionista.',
  'El superadministrador es el único que puede crear administradores y no se puede crear desde la aplicación.',
];

export default function RolesPage() {
  const { role: myRole } = usePermissions();

  return (
    <>
      <PageHeader title="Roles y permisos" description="Qué puede hacer cada rol dentro de Odonty." />

      <Alert type="info">
        Los permisos administrativos provienen del contrato. Los accesos a módulos clínicos son la matriz frontend aprobada; aún requieren definición y validación equivalentes en el backend.
      </Alert>

      <section className="panel section">
        <h2 className="panel__title">Matriz de permisos</h2>
        <div className="table-wrap">
          <table className="table table--matrix">
            <thead>
              <tr>
                <th scope="col">Rol</th>
                {PERMISSION_ORDER.map((permission) => (
                  <th scope="col" key={permission} className="table__center">
                    {PERMISSION_LABELS[permission]}
                    <span className="table__code">{permission}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_ROLES.map((role) => (
                <tr key={role} className={role === myRole ? 'table__row--me' : undefined}>
                  <th scope="row">
                    <RoleBadge role={role} />
                    {role === myRole && <span className="cell-tag">Tu rol</span>}
                  </th>
                  {PERMISSION_ORDER.map((permission) => {
                    const granted = ROLE_PERMISSIONS[role].includes(permission);
                    return (
                      <td key={permission} className="table__center">
                        <span className={granted ? 'mark mark--yes' : 'mark mark--no'}>
                          <Icon name={granted ? 'check' : 'x'} size={15} />
                          <span className="sr-only">{granted ? 'Permitido' : 'No permitido'}</span>
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid--two section">
        <section className="panel">
          <h2 className="panel__title">Descripción de los roles</h2>
          <ul className="role-list">
            {ALL_ROLES.map((role) => (
              <li key={role}>
                <RoleBadge role={role} />
                <p>{ROLE_DESCRIPTIONS[role]}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2 className="panel__title">Reglas para cambiar roles</h2>
          <ul className="rule-list">
            {RULES.map((rule) => (
              <li key={rule}>
                <Icon name="shield-check" size={17} />
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
