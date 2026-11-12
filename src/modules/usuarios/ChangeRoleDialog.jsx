import { useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { RoleBadge } from '../../components/Badges.jsx';
import { SelectField } from '../../components/FormField.jsx';
import { roleLabel } from '../../utils/permissions.js';

/**
 * Cambio de rol con confirmación: identifica al trabajador y muestra el rol actual y el nuevo.
 * El resultado final lo decide el backend; si rechaza, el error se muestra aquí y no se tocan los datos.
 */
export default function ChangeRoleDialog({ target, roleOptions, loading, error, fieldError, onConfirm, onCancel }) {
  const [newRole, setNewRole] = useState('');
  const [dismissedError, setDismissedError] = useState(false);

  useEffect(() => {
    setNewRole('');
    setDismissedError(false);
  }, [target?.id]);

  if (!target) return null;

  return (
    <ConfirmDialog
      open
      title="Cambiar rol"
      confirmLabel="Confirmar cambio"
      loading={loading}
      confirmDisabled={!newRole}
      error={error}
      onCancel={onCancel}
      onConfirm={() => newRole && onConfirm(newRole)}
    >
      <p>
        Vas a cambiar el rol de <strong>{target.full_name}</strong> ({target.email}).
      </p>
      <div className="role-change">
        <span>Rol actual</span>
        <RoleBadge role={target.role_name} />
      </div>
      <SelectField
        label="Nuevo rol"
        value={newRole}
        error={dismissedError ? '' : fieldError}
        onChange={(event) => {
          setDismissedError(true);
          setNewRole(event.target.value);
        }}
        disabled={loading}
      >
        <option value="">Selecciona un rol</option>
        {roleOptions.map((role) => (
          <option key={role} value={role}>
            {roleLabel(role)}
          </option>
        ))}
      </SelectField>
      {newRole && (
        <p className="modal__summary">
          {target.full_name} pasará de <strong>{roleLabel(target.role_name)}</strong> a <strong>{roleLabel(newRole)}</strong>.
        </p>
      )}
      {!newRole && <p className="field__hint">Elige el nuevo rol para poder confirmar.</p>}
    </ConfirmDialog>
  );
}
