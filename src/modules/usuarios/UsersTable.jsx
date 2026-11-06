import { PasswordBadge, RoleBadge, StatusBadge } from '../../components/Badges.jsx';
import Icon from '../../components/Icon.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { roleOptionsFor } from '../../utils/permissions.js';

export default function UsersTable({ users, onChangeRole, readOnly = false }) {
  const { user: me, roleChangeAccess } = usePermissions();

  return (
    <div className="table-wrap">
      <table className="table table--responsive">
        <thead>
          <tr>
            <th scope="col">Nombre</th>
            <th scope="col">Correo</th>
            <th scope="col">Documento</th>
            <th scope="col">Teléfono</th>
            <th scope="col">Rol</th>
            <th scope="col">Estado</th>
            <th scope="col">Cambio de contraseña</th>
            <th scope="col">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const access = roleChangeAccess(u);
            const hasOptions = roleOptionsFor(me, u).length > 0;
            const canChange = !readOnly && access.allowed && hasOptions;
            return (
              <tr key={u.id}>
                <td data-label="Nombre">
                  <span className="cell-strong">{u.full_name}</span>
                  {u.id === me?.id && <span className="cell-tag">Tú</span>}
                </td>
                <td data-label="Correo">{u.email}</td>
                <td data-label="Documento">{u.document_number || '—'}</td>
                <td data-label="Teléfono">{u.phone_number || '—'}</td>
                <td data-label="Rol">
                  <RoleBadge role={u.role_name} />
                </td>
                <td data-label="Estado">
                  <StatusBadge active={u.is_active} />
                </td>
                <td data-label="Cambio de contraseña">
                  <PasswordBadge mustChange={u.must_change_password} />
                </td>
                <td data-label="Acciones">
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => onChangeRole(u)}
                    disabled={!canChange}
                    title={readOnly ? 'Deshabilitado en la vista previa de solo lectura' : canChange ? 'Cambiar el rol de este usuario' : access.reason || 'No hay roles disponibles para asignar.'}
                    aria-label={`Cambiar rol de ${u.full_name}`}
                  >
                    <Icon name="edit" size={15} /> Cambiar rol
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
