import { Alert } from '../../components/Feedback.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { getPatientAlerts } from '../../services/patientsService.js';

const ALERT_ITEMS = [
  ['allergies', 'Alergias'],
  ['current_medications', 'Medicamentos actuales'],
  ['medical_conditions', 'Condiciones médicas'],
];

/**
 * Aviso de alertas médicas para historia clínica y odontograma.
 * Solo se muestra cuando GET /patients/{id}/alerts responde has_alerts=true.
 * Es informativo (azul), no un error bloqueante.
 */
export default function PatientAlertsBanner({ patientId }) {
  const { data, loading, error, reload } = useAsync(
    () => getPatientAlerts(patientId),
    { enabled: Boolean(patientId), deps: [patientId] },
  );

  const currentPatientData = Number(data?.patient_id) === Number(patientId);
  if (loading && !currentPatientData) {
    return <Alert type="info">Cargando alertas médicas antes de la atención…</Alert>;
  }
  if (error) {
    return (
      <Alert type="info">
        <p>No se pudieron cargar las alertas médicas. Verifica esta información antes de atender.</p>
        <p className="module-muted">{error}</p>
        <button type="button" className="link-button" onClick={() => reload()}>
          Reintentar
        </button>
      </Alert>
    );
  }
  if (!currentPatientData || !data?.has_alerts) return null;

  return (
    <Alert type="info" className="alert--patient">
      <strong>Alertas médicas de {data.full_name}</strong>
      <p className="patient-alerts__intro">
        Revisa esta información antes de atender al paciente.
      </p>
      <ul className="patient-alerts__list">
        {ALERT_ITEMS.filter(([field]) => String(data[field] ?? '').trim() !== '').map(([field, label]) => (
          <li key={field}>
            <strong>{label}:</strong> {data[field]}
          </li>
        ))}
      </ul>
    </Alert>
  );
}
