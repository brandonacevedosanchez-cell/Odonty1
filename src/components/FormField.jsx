import { useId, useState } from 'react';
import Icon from './Icon.jsx';

export function FieldError({ error }) {
  if (!error) return null;
  return <p className="field__error" role="alert">{error}</p>;
}

/** Campo con etiqueta visible, ayuda y mensaje de error asociado (accesible). */
export function FormField({ label, error, hint, children, htmlFor }) {
  return (
    <div className={`field ${error ? 'field--error' : ''}`.trim()}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && <p className="field__hint">{hint}</p>}
      {error && (
        <p className="field__error" id={htmlFor ? `${htmlFor}-error` : undefined} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, id, ...inputProps }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={fieldId}>
      <input
        id={fieldId}
        className="input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...inputProps}
      />
    </FormField>
  );
}

export function SelectField({ label, error, hint, id, children, ...selectProps }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={fieldId}>
      <select id={fieldId} className="input" aria-invalid={error ? 'true' : undefined} {...selectProps}>
        {children}
      </select>
    </FormField>
  );
}

export function PasswordField({ label, error, hint, id, ...inputProps }) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const [visible, setVisible] = useState(false);
  return (
    <FormField label={label} error={error} hint={hint} htmlFor={fieldId}>
      <div className="input-group">
        <input
          id={fieldId}
          className="input"
          type={visible ? 'text' : 'password'}
          aria-invalid={error ? 'true' : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className="input-group__button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          <Icon name={visible ? 'eye-off' : 'eye'} size={18} />
        </button>
      </div>
    </FormField>
  );
}
