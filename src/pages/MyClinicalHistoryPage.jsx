import { useState } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../components/Feedback.jsx';
import Icon from '../components/Icon.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { getMyClinicalHistory } from '../services/clinicalHistoryService.js';
import { formatDateTime } from '../utils/format.js';

const FIELDS = [
  ['motivo_consulta', 'Motivo de consulta'],
  ['antecedentes', 'Antecedentes'],
  ['examen', 'Examen clínico'],
  ['diagnostico', 'Diagnóstico'],
  ['tratamiento', 'Tratamiento'],
];

export default function MyClinicalHistoryPage() {
  const { data, loading, error, reload } = useAsync(getMyClinicalHistory);
  const [expanded, setExpanded] = useState(null);
  const entries = Array.isArray(data) ? data : [];

  return (
    <>
      <PageHeader
        title="Mi historia clínica"
        description="Consulta las atenciones registradas por tu odontólogo, de la más reciente a la más antigua."
      />

      <section className="panel section">
        {loading && <LoadingState message="Cargando tu historia clínica…" />}
        {!loading && error && <ErrorState message={error} onRetry={() => reload()} title="No se pudo cargar tu historia clínica" />}
        {!loading && !error && entries.length === 0 && (
          <EmptyState icon="file-text" title="Aún no tienes registros" text="Cuando tu odontólogo registre una consulta aparecerá aquí." />
        )}
        {!loading && !error && entries.length > 0 && (
          <ul className="record-list">
            {entries.map((entry) => (
              <li className="record-card" key={entry.id}>
                <button
                  type="button"
                  className="record-card__head"
                  onClick={() => setExpanded((current) => (current === entry.id ? null : entry.id))}
                  aria-expanded={expanded === entry.id}
                >
                  <span>
                    <strong>{entry.motivo_consulta || 'Consulta clínica'}</strong>
                    <span className="module-muted"> · {formatDateTime(entry.created_at)}</span>
                  </span>
                  <Icon name={expanded === entry.id ? 'chevron-down' : 'arrow-right'} size={16} />
                </button>
                {expanded === entry.id && (
                  <dl className="details record-card__body">
                    {FIELDS.map(([field, label]) => (
                      <div className="detail" key={field}>
                        <dt>{label}</dt>
                        <dd>{entry[field] || '—'}</dd>
                      </div>
                    ))}
                    <div className="detail"><dt>Profesional</dt><dd>{entry.dentist_name || '—'}</dd></div>
                  </dl>
                )}
              </li>
            ))}
          </ul>
        )}
        <p className="clinical-privacy-note">
          <Icon name="lock" size={16} /> Esta información es confidencial y solo tú y el personal autorizado de tu clínica pueden verla.
        </p>
      </section>
    </>
  );
}
