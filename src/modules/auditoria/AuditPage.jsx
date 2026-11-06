import { EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { usePermissions } from '../../hooks/usePermissions.js';
import { getAuditLog } from '../../services/usersService.js';
import { formatDateTime } from '../../utils/format.js';
import { PERMISSIONS } from '../../utils/permissions.js';

const LIMIT = 100;

function detailText(detail) {
  if (detail == null || detail === '') return '—';
  return typeof detail === 'string' ? detail : JSON.stringify(detail);
}

export default function AuditPage() {
  const { can } = usePermissions();
  // Sin el permiso audit.view ni siquiera se solicita la información.
  const { data, loading, error, reload } = useAsync(() => getAuditLog(LIMIT), { enabled: can(PERMISSIONS.AUDIT_VIEW) });
  const records = Array.isArray(data) ? data : [];

  return (
    <>
      <PageHeader
        title="Historial de auditoría"
        description={`Acciones administrativas registradas por el sistema (hasta ${LIMIT} registros).`}
        actions={
          <button type="button" className="btn btn--secondary" onClick={() => reload()} disabled={loading}>
            <Icon name="refresh" size={16} /> Actualizar
          </button>
        }
      />

      <section className="panel">
        {loading && <LoadingState message="Cargando historial…" />}
        {!loading && error && <ErrorState message={error} onRetry={() => reload()} title="No se pudo cargar el historial" />}
        {!loading && !error && records.length === 0 && (
          <EmptyState icon="audit" title="Sin registros" text="Todavía no hay acciones registradas en el historial." />
        )}
        {!loading && !error && records.length > 0 && (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">ID de usuario</th>
                  <th scope="col">Acción</th>
                  <th scope="col">Detalle</th>
                  <th scope="col">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td data-label="ID">{record.id}</td>
                    <td data-label="ID de usuario">{record.user_id ?? '—'}</td>
                    <td data-label="Acción">
                      <span className="badge badge--info">{record.action}</span>
                    </td>
                    <td data-label="Detalle" className="cell-wrap">
                      {detailText(record.detail)}
                    </td>
                    <td data-label="Fecha" className="cell-nowrap">
                      {formatDateTime(record.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
