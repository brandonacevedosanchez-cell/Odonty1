const STATUS_LABELS = {
  pending_email: 'Pendiente de correo',
  pending_review: 'Pendiente de revisión',
  active: 'Activa',
  rejected: 'Rechazada',
  suspended: 'Suspendida',
};

const STATUS_CLASSES = {
  pending_email: 'badge--warning',
  pending_review: 'badge--warning',
  active: 'badge--success',
  rejected: 'badge--danger',
  suspended: 'badge--neutral',
};

export default function ClinicStatusBadge({ status }) {
  return <span className={`badge ${STATUS_CLASSES[status] ?? 'badge--neutral'}`}>{STATUS_LABELS[status] ?? status}</span>;
}
