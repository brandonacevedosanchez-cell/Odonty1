import Icon from './Icon.jsx';
import { SLOW_SERVER_MESSAGE, useSlowLoading } from '../hooks/useSlowLoading.js';

export function Spinner({ size = 20, label }) {
  return (
    <span className="spinner" role={label ? 'status' : undefined} aria-label={label} style={{ width: size, height: size }} />
  );
}

export function LoadingState({ message = 'Cargando…', showSlowNotice = true }) {
  const slow = useSlowLoading(showSlowNotice);
  return (
    <div className="state state--loading" role="status" aria-live="polite">
      <Spinner size={32} />
      <p className="state__title">{message}</p>
      {slow && <p className="state__text">{SLOW_SERVER_MESSAGE}</p>}
    </div>
  );
}

export function ErrorState({ message, onRetry, title = 'No se pudo cargar la información' }) {
  return (
    <div className="state state--error" role="alert">
      <span className="state__icon state__icon--error">
        <Icon name="alert-circle" size={28} />
      </span>
      <p className="state__title">{title}</p>
      <p className="state__text">{message}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          <Icon name="refresh" size={16} /> Reintentar
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'info', title, text, action }) {
  return (
    <div className="state state--empty">
      <span className="state__icon">
        <Icon name={icon} size={28} />
      </span>
      <p className="state__title">{title}</p>
      {text && <p className="state__text">{text}</p>}
      {action}
    </div>
  );
}

export function Alert({ type = 'error', children, onClose }) {
  const icon = type === 'success' ? 'check-circle' : type === 'info' ? 'info' : 'alert-circle';
  return (
    <div className={`alert alert--${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon name={icon} size={18} />
      <div className="alert__body">{children}</div>
      {onClose && (
        <button type="button" className="alert__close" onClick={onClose} aria-label="Cerrar mensaje">
          <Icon name="x" size={16} />
        </button>
      )}
    </div>
  );
}
