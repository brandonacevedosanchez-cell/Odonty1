import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { changeUserRole, listUsers, setUserActive, updateUser } from '../../services/usersService.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';
import { ALL_ROLES, PERMISSIONS, roleLabel, roleOptionsFor } from '../../utils/permissions.js';
import { PREVIEW_MODE } from '../../config/preview.js';
import ChangeRoleDialog from './ChangeRoleDialog.jsx';
import EditUserDialog from './EditUserDialog.jsx';
import UsersTable from './UsersTable.jsx';

const LIMIT = 10;

export default function UsersPage() {
  const toast = useToast();
  const { user: me, can } = usePermissions();
  const canView = can(PERMISSIONS.USERS_VIEW);

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [offset, setOffset] = useState(0);

  const [roleTarget, setRoleTarget] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [activeTarget, setActiveTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [dialogFieldErrors, setDialogFieldErrors] = useState({});

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(0);
      setDebouncedQuery(query.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, loading, error, reload } = useAsync(
    () => listUsers({ search: debouncedQuery, role: roleFilter, isActive: activeFilter, limit: LIMIT, offset }),
    { enabled: canView, deps: [debouncedQuery, roleFilter, activeFilter, offset] },
  );

  const users = Array.isArray(data?.data) ? data.data : [];
  const total = Number.isFinite(data?.total) ? data.total : users.length;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const page = Math.floor(offset / LIMIT) + 1;

  function resetFilters() {
    setQuery('');
    setRoleFilter('');
    setActiveFilter('');
    setOffset(0);
  }

  function openRoleDialog(user) {
    setDialogError('');
    setDialogFieldErrors({});
    setRoleTarget(user);
  }

  function openEditDialog(user) {
    setDialogError('');
    setDialogFieldErrors({});
    setEditTarget(user);
  }

  function openActiveDialog(user) {
    setDialogError('');
    setDialogFieldErrors({});
    setActiveTarget(user);
  }

  function closeDialogs() {
    if (saving) return;
    setRoleTarget(null);
    setEditTarget(null);
    setActiveTarget(null);
    setDialogError('');
    setDialogFieldErrors({});
  }

  async function confirmRoleChange(newRole) {
    if (!roleTarget || saving) return;
    setSaving(true);
    setDialogError('');
    setDialogFieldErrors({});
    try {
      const updated = await changeUserRole(roleTarget.id, newRole);
      toast.success(`El rol de ${roleTarget.full_name} ahora es ${roleLabel(newRole)}.`);
      setRoleTarget(null);
      await reload({ silent: true });
      if (!updated) await reload();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setDialogFieldErrors(fieldErrors);
      setDialogError(Object.keys(fieldErrors).length ? '' : getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmEdit(values) {
    if (!editTarget || saving) return;
    setSaving(true);
    setDialogError('');
    setDialogFieldErrors({});
    try {
      const updated = await updateUser(editTarget.id, values);
      toast.success('Datos del trabajador actualizados.');
      setEditTarget(null);
      if (updated && typeof updated === 'object') await reload({ silent: true });
      else await reload();
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setDialogFieldErrors(fieldErrors);
      setDialogError(Object.keys(fieldErrors).length ? '' : getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmActiveChange() {
    if (!activeTarget || saving) return;
    setSaving(true);
    setDialogError('');
    setDialogFieldErrors({});
    try {
      await setUserActive(activeTarget.id, !activeTarget.is_active);
      toast.success(activeTarget.is_active ? 'Cuenta desactivada.' : 'Cuenta activada.');
      setActiveTarget(null);
      await reload({ silent: true });
    } catch (err) {
      const fieldErrors = getFieldErrors(err);
      setDialogFieldErrors(fieldErrors);
      setDialogError(Object.keys(fieldErrors).length ? '' : getErrorMessage(err));
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
        <div className="module-toolbar">
          <label className="search module-search">
            <Icon name="search" size={17} />
            <input
              type="search"
              className="search__input"
              placeholder="Buscar por nombre, correo o documento"
              aria-label="Buscar usuarios por nombre, correo o documento"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
          </label>
          <div className="module-filters">
            <label className="field">
              <span className="field__label">Rol</span>
              <select className="input" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setOffset(0); }} disabled={loading}>
                <option value="">Todos</option>
                {ALL_ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}
              </select>
            </label>
            <label className="field">
              <span className="field__label">Estado</span>
              <select className="input" value={activeFilter} onChange={(e) => { setActiveFilter(e.target.value); setOffset(0); }} disabled={loading}>
                <option value="">Todas</option>
                <option value="true">Activas</option>
                <option value="false">Desactivadas</option>
              </select>
            </label>
            <button type="button" className="btn btn--secondary" onClick={resetFilters} disabled={loading}>Limpiar</button>
            <button type="button" className="btn btn--secondary" onClick={() => reload()} disabled={loading}>
              <Icon name="refresh" size={16} /> Actualizar
            </button>
          </div>
        </div>

        {loading && <LoadingState message="Cargando usuarios…" />}
        {!loading && error && <ErrorState message={error} onRetry={() => reload()} title="No se pudo cargar el listado" />}
        {!loading && !error && users.length === 0 && (
          <EmptyState
            icon="users"
            title={debouncedQuery || roleFilter || activeFilter ? 'Sin resultados' : 'Aún no hay usuarios'}
            text={debouncedQuery || roleFilter || activeFilter ? 'Ningún usuario coincide con los filtros aplicados.' : 'Cuando se registren trabajadores aparecerán aquí.'}
            action={(debouncedQuery || roleFilter || activeFilter) ? <button type="button" className="btn btn--secondary" onClick={resetFilters}>Limpiar filtros</button> : null}
          />
        )}
        {!loading && !error && users.length > 0 && (
          <>
            <UsersTable
              users={users}
              onChangeRole={openRoleDialog}
              onEdit={openEditDialog}
              onToggleActive={openActiveDialog}
              readOnly={PREVIEW_MODE}
            />
            <div className="pagination" role="navigation" aria-label="Paginación de usuarios">
              <span className="pagination__info">{total > 0 ? `${offset + 1}–${Math.min(offset + LIMIT, total)} de ${total}` : '0 usuarios'}</span>
              <div className="pagination__actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffset((current) => Math.max(0, current - LIMIT))} disabled={offset === 0 || loading}>Anterior</button>
                <span className="pagination__page">Página {page} de {pages}</span>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffset((current) => current + LIMIT)} disabled={offset + LIMIT >= total || loading}>Siguiente</button>
              </div>
            </div>
          </>
        )}
      </section>

      <ChangeRoleDialog
        target={roleTarget}
        roleOptions={roleTarget ? roleOptionsFor(me, roleTarget) : []}
        loading={saving}
        error={dialogError}
        fieldError={dialogFieldErrors.role}
        onConfirm={confirmRoleChange}
        onCancel={closeDialogs}
      />

      <EditUserDialog
        target={editTarget}
        loading={saving}
        error={dialogError}
        fieldErrors={dialogFieldErrors}
        onConfirm={confirmEdit}
        onCancel={closeDialogs}
      />

      <ConfirmDialog
        open={Boolean(activeTarget)}
        title={activeTarget?.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
        confirmLabel={activeTarget?.is_active ? 'Desactivar' : 'Activar'}
        loading={saving}
        error={dialogError}
        onCancel={closeDialogs}
        onConfirm={confirmActiveChange}
      >
        <p>
          {activeTarget?.is_active
            ? 'El trabajador no podrá iniciar sesión mientras la cuenta esté desactivada.'
            : 'El trabajador podrá volver a iniciar sesión con su contraseña actual.'}
        </p>
        {activeTarget && <p><strong>{activeTarget.full_name}</strong> · {activeTarget.email}</p>}
        {dialogFieldErrors.is_active && <p className="field__error" role="alert">{dialogFieldErrors.is_active}</p>}
      </ConfirmDialog>
    </>
  );
}
