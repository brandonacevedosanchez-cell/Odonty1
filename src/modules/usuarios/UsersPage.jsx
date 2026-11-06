import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { changeUserRole, listUsers } from '../../services/usersService.js';
import { ApiError, getErrorMessage } from '../../utils/errors.js';
import { normalizeText } from '../../utils/format.js';
import { PERMISSIONS, roleLabel, roleOptionsFor } from '../../utils/permissions.js';
import { PREVIEW_MODE } from '../../config/preview.js';
import ChangeRoleDialog from './ChangeRoleDialog.jsx';
import UsersTable from './UsersTable.jsx';

export default function UsersPage() {
  const toast = useToast();
  const { user: me, can } = usePermissions();
  const { data, setData, loading, error, reload } = useAsync(listUsers, { enabled: can(PERMISSIONS.USERS_VIEW) });
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const users = Array.isArray(data) ? data : [];

  // Búsqueda en el frontend sobre los datos ya cargados (el backend no pagina ni filtra).
  const filtered = useMemo(() => {
    const q = normalizeText(query.trim());
    if (!q) return users;
    return users.filter((u) => [u.full_name, u.email, u.document_number].some((value) => normalizeText(value).includes(q)));
  }, [users, query]);

  function openDialog(user) {
    setDialogError('');
    setTarget(user);
  }

  function closeDialog() {
    if (saving) return;
    setTarget(null);
    setDialogError('');
  }

  async function confirmRoleChange(newRole) {
    if (!target || saving) return;
    setSaving(true);
    setDialogError('');
    try {
      const updated = await changeUserRole(target.id, newRole);
      // Se refleja el cambio confirmado por el backend y luego se sincroniza el listado.
      const patch = updated && typeof updated === 'object' && updated.id === target.id ? updated : { role_name: newRole };
      setData(users.map((u) => (u.id === target.id ? { ...u, ...patch } : u)));
      toast.success(`El rol de ${target.full_name} ahora es ${roleLabel(newRole)}.`);
      setTarget(null);
      reload({ silent: true });
    } catch (err) {
      // Los datos mostrados no se tocan: se informa el motivo del rechazo del backend.
      setDialogError(getErrorMessage(err));
      if (err instanceof ApiError && err.status === 404) reload({ silent: true });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Trabajadores registrados en el sistema y su rol."
        actions={
          can(PERMISSIONS.USERS_CREATE) && (
            <Link to="/usuarios/nuevo" className="btn btn--primary">
              <Icon name="user-plus" size={17} /> Crear trabajador
            </Link>
          )
        }
      />

      <section className="panel">
        <div className="toolbar">
          <div className="search">
            <Icon name="search" size={18} />
            <input
              type="search"
              className="search__input"
              placeholder="Buscar por nombre, correo o documento"
              aria-label="Buscar usuarios por nombre, correo o documento"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading || Boolean(error)}
            />
          </div>
          <div className="toolbar__end">
            {!loading && !error && (
              <span className="toolbar__count">
                {filtered.length} de {users.length} {users.length === 1 ? 'usuario' : 'usuarios'}
              </span>
            )}
            <button type="button" className="btn btn--secondary" onClick={() => reload()} disabled={loading}>
              <Icon name="refresh" size={16} /> Actualizar
            </button>
          </div>
        </div>

        {loading && <LoadingState message="Cargando usuarios…" />}
        {!loading && error && <ErrorState message={error} onRetry={() => reload()} title="No se pudo cargar el listado" />}
        {!loading && !error && users.length === 0 && (
          <EmptyState icon="users" title="Aún no hay usuarios" text="Cuando se registren trabajadores aparecerán aquí." />
        )}
        {!loading && !error && users.length > 0 && filtered.length === 0 && (
          <EmptyState
            icon="search"
            title="Sin resultados"
            text="Ningún usuario coincide con tu búsqueda."
            action={
              <button type="button" className="btn btn--secondary" onClick={() => setQuery('')}>
                Limpiar búsqueda
              </button>
            }
          />
        )}
        {!loading && !error && filtered.length > 0 && (
          <UsersTable users={filtered} onChangeRole={openDialog} readOnly={PREVIEW_MODE} />
        )}
      </section>

      <ChangeRoleDialog
        target={target}
        roleOptions={target ? roleOptionsFor(me, target) : []}
        loading={saving}
        error={dialogError}
        onConfirm={confirmRoleChange}
        onCancel={closeDialog}
      />
    </>
  );
}
