import { useEffect, useState } from 'react';
import { Alert, EmptyState, ErrorState, LoadingState, Spinner } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import { FieldError } from '../../components/FormField.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import {
  NOTIFICATION_MESSAGE_MIN_LENGTH,
  NOTIFICATION_TITLE_MAX_LENGTH,
  NOTIFICATION_TITLE_MIN_LENGTH,
  NOTIFICATION_TYPE_MAX_LENGTH,
  NOTIFICATION_TYPE_MIN_LENGTH,
} from '../../constants/apiValues.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import {
  createNotification,
  listNotifications,
  markNotificationRead,
} from '../../services/notificationsService.js';
import { listUsers } from '../../services/usersService.js';
import { getErrorMessage, getFieldErrors } from '../../utils/errors.js';
import { formatDateTime } from '../../utils/format.js';
import { PERMISSIONS } from '../../utils/permissions.js';

const LIMIT = 15;
const EMPTY = { user_id: '', title: '', message: '', type: 'info', appointment_id: '', patient_id: '' };

const isRead = (notification) => Boolean(notification?.is_read ?? notification?.read_at);

export default function NotificationsPage() {
  const toast = useToast();
  const { can } = usePermissions();
  const canView = can(PERMISSIONS.NOTIFICATIONS_VIEW);
  const canCreate = can(PERMISSIONS.NOTIFICATIONS_CREATE);

  const [filter, setFilter] = useState('all');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState(null);
  const [marking, setMarking] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setOffset(0);
    setSelected(null);
  }, [filter]);

  const listQuery = useAsync(
    () => listNotifications({ unreadOnly: filter === 'unread', limit: LIMIT, offset }),
    { enabled: canView, deps: [filter, offset] },
  );
  const notifications = Array.isArray(listQuery.data?.data) ? listQuery.data.data : [];
  const total = Number.isFinite(listQuery.data?.total) ? listQuery.data.total : notifications.length;
  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const page = Math.floor(offset / LIMIT) + 1;

  const usersQuery = useAsync(
    () => listUsers({ limit: 100 }),
    { enabled: canCreate && formOpen, deps: [formOpen] },
  );
  const users = Array.isArray(usersQuery.data?.data) ? usersQuery.data.data : [];

  async function handleMarkRead(notification) {
    if (!notification || marking || isRead(notification)) return;
    setMarking(true);
    try {
      const updated = await markNotificationRead(notification.id);
      toast.success('Notificación marcada como leída.');
      setSelected(updated && typeof updated === 'object' ? updated : { ...notification, is_read: true });
      await listQuery.reload({ silent: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setMarking(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    if (saving) return;
    setFormError('');
    setFieldErrors({});
    if (!values.user_id) {
      setFieldErrors({ user_id: 'Selecciona el destinatario.' });
      return;
    }
    const type = values.type.trim();
    const title = values.title.trim();
    const message = values.message.trim();
    if (type.length < NOTIFICATION_TYPE_MIN_LENGTH || type.length > NOTIFICATION_TYPE_MAX_LENGTH) {
      setFieldErrors({ type: `El tipo debe tener entre ${NOTIFICATION_TYPE_MIN_LENGTH} y ${NOTIFICATION_TYPE_MAX_LENGTH} caracteres.` });
      return;
    }
    if (title.length < NOTIFICATION_TITLE_MIN_LENGTH || title.length > NOTIFICATION_TITLE_MAX_LENGTH) {
      setFieldErrors({ title: `El título debe tener entre ${NOTIFICATION_TITLE_MIN_LENGTH} y ${NOTIFICATION_TITLE_MAX_LENGTH} caracteres.` });
      return;
    }
    if (message.length < NOTIFICATION_MESSAGE_MIN_LENGTH) {
      setFieldErrors({ message: `El mensaje debe tener al menos ${NOTIFICATION_MESSAGE_MIN_LENGTH} caracteres.` });
      return;
    }
    setSaving(true);
    try {
      await createNotification({
        user_id: Number(values.user_id),
        type,
        title,
        message,
        appointment_id: values.appointment_id ? Number(values.appointment_id) : undefined,
        patient_id: values.patient_id ? Number(values.patient_id) : undefined,
      });
      toast.success('Notificación creada.');
      setFormOpen(false);
      setValues(EMPTY);
      setOffset(0);
      await listQuery.reload();
    } catch (error) {
      const validationErrors = getFieldErrors(error);
      setFieldErrors(validationErrors);
      setFormError(Object.keys(validationErrors).length ? '' : getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Notificaciones"
        description="Consulta tus avisos y administra los recordatorios del sistema."
        actions={
          canCreate && (
            <button type="button" className="btn btn--primary" onClick={() => { setFormOpen((open) => !open); setFormError(''); }}>
              <Icon name="plus" size={17} /> Nueva notificación
            </button>
          )
        }
      />

      {formOpen && canCreate && (
        <section className="panel section" aria-labelledby="notification-form-heading">
          <div className="module-section-heading">
            <div>
              <h2 className="panel__title" id="notification-form-heading">Nueva notificación</h2>
              <p className="module-muted">El destinatario debe pertenecer a tu clínica.</p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFormOpen(false)} disabled={saving}>Cerrar formulario</button>
          </div>
          <form onSubmit={handleCreate} className="form form--spaced">
            {formError && <Alert type="error">{formError}</Alert>}
            <div className="module-form-grid">
              <label className="field">
                <span className="field__label">Destinatario</span>
                <select className="input" value={values.user_id} onChange={(event) => { setValues((v) => ({ ...v, user_id: event.target.value })); setFieldErrors((current) => ({ ...current, user_id: '' })); }} disabled={saving || usersQuery.loading} required>
                  <option value="">Selecciona un usuario</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.full_name} · {user.email}</option>
                  ))}
                </select>
                <FieldError error={fieldErrors.user_id} />
              </label>
              <label className="field">
                <span className="field__label">Tipo</span>
                <input className="input" value={values.type} onChange={(event) => { setValues((v) => ({ ...v, type: event.target.value })); setFieldErrors((current) => ({ ...current, type: '' })); }} disabled={saving} minLength={NOTIFICATION_TYPE_MIN_LENGTH} maxLength={NOTIFICATION_TYPE_MAX_LENGTH} required />
                <span className="field__hint">Texto libre, entre {NOTIFICATION_TYPE_MIN_LENGTH} y {NOTIFICATION_TYPE_MAX_LENGTH} caracteres.</span>
                <FieldError error={fieldErrors.type} />
              </label>
              <label className="field module-form-grid__wide">
                <span className="field__label">Título</span>
                <input className="input" value={values.title} onChange={(event) => { setValues((v) => ({ ...v, title: event.target.value })); setFieldErrors((current) => ({ ...current, title: '' })); }} disabled={saving} minLength={NOTIFICATION_TITLE_MIN_LENGTH} maxLength={NOTIFICATION_TITLE_MAX_LENGTH} required />
                <FieldError error={fieldErrors.title} />
              </label>
              <label className="field module-form-grid__wide">
                <span className="field__label">Mensaje</span>
                <textarea className="input module-textarea" value={values.message} onChange={(event) => { setValues((v) => ({ ...v, message: event.target.value })); setFieldErrors((current) => ({ ...current, message: '' })); }} disabled={saving} minLength={NOTIFICATION_MESSAGE_MIN_LENGTH} required />
                <FieldError error={fieldErrors.message} />
              </label>
              <label className="field">
                <span className="field__label">ID de cita (opcional)</span>
                <input className="input" type="number" min="1" value={values.appointment_id} onChange={(event) => setValues((v) => ({ ...v, appointment_id: event.target.value }))} disabled={saving} />
                <FieldError error={fieldErrors.appointment_id} />
              </label>
              <label className="field">
                <span className="field__label">ID de paciente (opcional)</span>
                <input className="input" type="number" min="1" value={values.patient_id} onChange={(event) => setValues((v) => ({ ...v, patient_id: event.target.value }))} disabled={saving} />
                <FieldError error={fieldErrors.patient_id} />
              </label>
            </div>
            <div className="form__actions">
              <button type="button" className="btn btn--secondary" onClick={() => setFormOpen(false)} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? <Spinner size={16} /> : <Icon name="bell" size={16} />}
                {saving ? 'Enviando…' : 'Crear notificación'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel section notifications-panel">
        <div className="notifications-toolbar">
          <div>
            <h2 className="panel__title">Centro de notificaciones</h2>
            <p className="module-muted">{total} {total === 1 ? 'notificación' : 'notificaciones'}{filter === 'unread' ? ' sin leer' : ''}</p>
          </div>
          <div className="module-segmented" role="group" aria-label="Filtrar notificaciones">
            {[['all', 'Todas'], ['unread', 'Sin leer']].map(([key, label]) => (
              <button
                type="button"
                key={key}
                className={filter === key ? 'module-segmented__active' : ''}
                aria-pressed={filter === key}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {listQuery.loading && <LoadingState message="Cargando notificaciones…" />}
        {!listQuery.loading && listQuery.error && (
          <ErrorState message={listQuery.error} onRetry={() => listQuery.reload()} title="No se pudieron cargar las notificaciones" />
        )}
        {!listQuery.loading && !listQuery.error && notifications.length === 0 && (
          <EmptyState
            icon="bell"
            title={filter === 'unread' ? 'No tienes notificaciones sin leer' : 'No hay notificaciones'}
            text={filter === 'unread' ? 'Cuando llegue un aviso nuevo aparecerá aquí.' : 'Los avisos del sistema aparecerán en este espacio.'}
          />
        )}
        {!listQuery.loading && !listQuery.error && notifications.length > 0 && (
          <>
            <div className="notifications-content">
              <ul className="notifications-list notification-items">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={`notification-item ${isRead(notification) ? '' : 'notification-item--unread'} ${selected?.id === notification.id ? 'notification-item--active' : ''}`.trim()}
                      onClick={() => { setSelected(notification); handleMarkRead(notification); }}
                    >
                      <span className="notification-item__date">{formatDateTime(notification.created_at)}</span>
                      <span className="notification-item__body">
                        <strong>{notification.title || notification.type || 'Notificación'}</strong>
                        <span className="module-muted">{notification.message || notification.body || ''}</span>
                      </span>
                      <span className={`badge ${isRead(notification) ? 'badge--neutral' : 'badge--info'}`}>
                        {isRead(notification) ? 'Leída' : 'Sin leer'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <aside className="notification-detail" aria-live="polite">
                <span className="notification-detail__icon"><Icon name="bell" size={21} /></span>
                {selected ? (
                  <>
                    <h3>{selected.title || 'Notificación'}</h3>
                    <p className="module-muted">{formatDateTime(selected.created_at)}</p>
                    <p>{selected.message || selected.body || 'Sin mensaje.'}</p>
                    {!isRead(selected) && (
                      <button type="button" className="btn btn--secondary btn--sm" onClick={() => handleMarkRead(selected)} disabled={marking}>
                        {marking ? <Spinner size={15} /> : <Icon name="check" size={15} />} Marcar como leída
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <h3>Detalle</h3>
                    <p className="module-muted">Selecciona una notificación para leerla completa.</p>
                  </>
                )}
              </aside>
            </div>
            <div className="pagination" role="navigation" aria-label="Paginación de notificaciones">
              <span className="pagination__info">{total > 0 ? `${offset + 1}–${Math.min(offset + LIMIT, total)} de ${total}` : '0 notificaciones'}</span>
              <div className="pagination__actions">
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffset((current) => Math.max(0, current - LIMIT))} disabled={offset === 0 || listQuery.loading}>Anterior</button>
                <span className="pagination__page">Página {page} de {pages}</span>
                <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOffset((current) => current + LIMIT)} disabled={offset + LIMIT >= total || listQuery.loading}>Siguiente</button>
              </div>
            </div>
          </>
        )}
      </section>
    </>
  );
}
