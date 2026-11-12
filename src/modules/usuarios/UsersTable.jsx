import { PasswordBadge, RoleBadge, StatusBadge } from '../../components/Badges.jsx';
import Icon from '../../components/Icon.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { PERMISSIONS, roleOptionsFor } from '../../utils/permissions.js';

export default function UsersTable({ users, onChangeRole, onEdit, onToggleActive, readOnly = false }) {
  const { user: me, can, roleChangeAccess } = usePermissions();
  const canEdit = can(PERMISSIONS.USERS_EDIT);
  const canManageActive = can(PERMISSIONS.USERS_MANAGE_ACTIVE);

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
            const canChangeRole = !readOnly && access.allowed && hasOptions;
            const isSelf = u.id === me?.id;
            const isSuperAdmin = u.role_name === 'super_admin';
            const canEditUser = !readOnly && canEdit && !isSuperAdmin;
            const canToggleActive = !readOnly && canManageActive && !isSelf && !isSuperAdmin;
            return (
              <tr key={u.id}>
                <td data-label="Nombre">
                  <span className="cell-strong">{u.full_name}</span>
                  {isSelf && <span className="cell-tag">Tú</span>}
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
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => onEdit(u)}
                      disabled={!canEditUser}
                      title={readOnly ? 'Deshabilitado en la vista previa' : canEditUser ? 'Editar datos del trabajador' : 'No puedes editar este usuario'}
                      aria-label={`Editar ${u.full_name}`}
                    >
                      <Icon name="edit" size={15} /> Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => onChangeRole(u)}
                      disabled={!canChangeRole}
                      title={readOnly ? 'Deshabilitado en la vista previa de solo lectura' : canChangeRole ? 'Cambiar el rol de este usuario' : access.reason || 'No hay roles disponibles para asignar.'}
                      aria-label={`Cambiar rol de ${u.full_name}`}
                    >
                      <Icon name="shield" size={15} /> Rol
                    </button>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => onToggleActive(u)}
                      disabled={!canToggleActive}
                      title={
                        readOnly
                          ? 'Deshabilitado en la vista previa de solo lectura'
                          : isSelf
                            ? 'No puedes desactivar tu propia cuenta'
                            : isSuperAdmin
                              ? 'No se puede desactivar al superadministrador'
                              : u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'
                      }
                      aria-label={`${u.is_active ? 'Desactivar' : 'Activar'} a ${u.full_name}`}
                    >
                      <Icon name={u.is_active ? 'lock' : 'check-circle'} size={15} /> {u.is_active ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
