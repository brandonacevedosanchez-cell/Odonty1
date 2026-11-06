import { useCallback, useState } from 'react';
import { Alert, EmptyState, ErrorState, LoadingState } from '../../components/Feedback.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { PREVIEW_MODE } from '../../config/preview.js';
import { useToast } from '../../context/ToastContext.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { ApiError, getErrorMessage } from '../../utils/errors.js';
import { listPendingClinics, reviewClinic } from './clinicService.js';
import ClinicStatusBadge from './ClinicStatusBadge.jsx';

export default function ClinicsPage() {
  const toast = useToast();
  const { data, setData, loading, error, reload } = useAsync(listPendingClinics, { enabled: !PREVIEW_MODE });
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const clinics = Array.isArray(data) ? data : [];

  const closeDialog = useCallback(() => {
    if (saving) return;
    setSelected(null);
    setDialogError('');
  }, [saving]);

  async function confirmReview() {
    if (!selected || saving) return;
    setSaving(true);
    setDialogError('');
    try {
      const result = await reviewClinic(selected.clinic.id, selected.approve);
      setData((current) => (Array.isArray(current) ? current.filter((clinic) => clinic.id !== selected.clinic.id) : current));
      toast.success(
        selected.approve
          ? `La clínica ${result?.name ?? selected.clinic.name} fue aprobada.`
          : `La clínica ${result?.name ?? selected.clinic.name} fue rechazada.`,
      );
      setSelected(null);
      reload({ silent: true });
    } catch (reviewError) {
      setDialogError(getErrorMessage(reviewError));
      if (reviewError instanceof ApiError && (reviewError.status === 404 || reviewError.status === 400)) {
        if (reviewError.status === 404) {
          setData((current) => (Array.isArray(current) ? current.filter((clinic) => clinic.id !== selected.clinic.id) : current));
        }
        reload({ silent: true });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Revisión de clínicas"
        description="Revisa los documentos y decide si apruebas o rechazas cada solicitud."
        actions={
          <button type="button" className="btn btn--secondary" onClick={() => reload()} disabled={loading}>
            <Icon name="refresh" size={16} /> Actualizar
          </button>
        }
      />
      <section className="panel">
        {PREVIEW_MODE && (
          <Alert type="info">
            La revisión de clínicas requiere conexión con la API. Desactiva el modo de vista previa para consultar y revisar solicitudes.
          </Alert>
        )}
        {!PREVIEW_MODE && loading && <LoadingState message="Cargando clínicas pendientes…" />}
        {!PREVIEW_MODE && !loading && error && <ErrorState message={error} onRetry={() => reload()} title="No se pudieron cargar las clínicas" />}
        {!PREVIEW_MODE && !loading && !error && clinics.length === 0 && (
          <EmptyState icon="users" title="No hay clínicas pendientes" text="Las solicitudes que requieren revisión aparecerán aquí." />
        )}
        {!PREVIEW_MODE && !loading && !error && clinics.length > 0 && (
          <div className="table-wrap">
            <table className="table table--responsive">
              <thead>
                <tr>
                  <th scope="col">ID</th>
                  <th scope="col">Nombre</th>
                  <th scope="col">NIT</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Documentos</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clinics.map((clinic) => (
                  <tr key={clinic.id}>
                    <td data-label="ID">{clinic.id}</td>
                    <td data-label="Nombre"><span className="cell-strong">{clinic.name}</span></td>
                    <td data-label="NIT">{clinic.nit}</td>
                    <td data-label="Estado"><ClinicStatusBadge status={clinic.status} /></td>
                    <td data-label="Documentos">
                      <div className="clinic-documents">
                        {clinic.cedula_url && <a href={clinic.cedula_url} target="_blank" rel="noopener noreferrer">Ver cédula</a>}
                        {clinic.rut_url && <a href={clinic.rut_url} target="_blank" rel="noopener noreferrer">Ver RUT</a>}
                        {!clinic.cedula_url && !clinic.rut_url && '—'}
                      </div>
                    </td>
                    <td data-label="Acciones">
                      <div className="clinic-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => { setDialogError(''); setSelected({ clinic, approve: true }); }}
                        >
                          Aprobar
                        </button>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => { setDialogError(''); setSelected({ clinic, approve: false }); }}
                        >
                          Rechazar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(selected)}
        title={selected?.approve ? 'Aprobar clínica' : 'Rechazar clínica'}
        confirmLabel={selected?.approve ? 'Confirmar aprobación' : 'Confirmar rechazo'}
        loading={saving}
        error={dialogError}
        onConfirm={confirmReview}
        onCancel={closeDialog}
      >
        <p>
          {selected?.approve ? '¿Confirmas la aprobación de' : '¿Confirmas el rechazo de'}{' '}
          <strong>{selected?.clinic.name}</strong> (NIT {selected?.clinic.nit})?
        </p>
      </ConfirmDialog>
    </>
  );
}
