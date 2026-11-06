import { useEffect, useId, useRef } from 'react';
import { Spinner } from './Feedback.jsx';

/** Diálogo modal accesible: Escape cierra, el foco entra al diálogo y vuelve al cerrarlo. */
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  confirmDisabled = false,
  error = '',
  onConfirm,
  onCancel,
}) {
  const titleId = useId();
  const cancelRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    cancelRef.current?.focus();

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loading) onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previousFocus.current?.focus?.();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !loading && onCancel()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="modal__title">
          {title}
        </h2>
        <div className="modal__body">{children}</div>
        {error && (
          <p className="modal__error" role="alert">
            {error}
          </p>
        )}
        <div className="modal__actions">
          <button ref={cancelRef} type="button" className="btn btn--secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button type="button" className="btn btn--primary" onClick={onConfirm} disabled={loading || confirmDisabled}>
            {loading && <Spinner size={16} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
