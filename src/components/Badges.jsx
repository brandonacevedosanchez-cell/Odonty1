import { roleLabel } from '../utils/permissions.js';

export function RoleBadge({ role }) {
  return <span className={`badge badge--role-${role ?? 'unknown'}`}>{roleLabel(role)}</span>;
}

export function StatusBadge({ active }) {
  return (
    <span className={`badge ${active ? 'badge--success' : 'badge--neutral'}`}>
      <span className="badge__dot" aria-hidden="true" />
      {active ? 'Activa' : 'Desactivada'}
    </span>
  );
}

export function PasswordBadge({ mustChange }) {
  return mustChange ? (
    <span className="badge badge--warning">Debe cambiarla</span>
  ) : (
    <span className="badge badge--neutral">No</span>
  );
}
