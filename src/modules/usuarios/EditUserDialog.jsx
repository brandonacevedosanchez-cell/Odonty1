import { useEffect, useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { TextField } from '../../components/FormField.jsx';
import { validateEmail, validateFullName } from '../../utils/validators.js';

const EMPTY = { full_name: '', email: '', phone_number: '' };

export default function EditUserDialog({ target, loading, error, fieldErrors = {}, onConfirm, onCancel }) {
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [dismissedErrors, setDismissedErrors] = useState({});

  useEffect(() => {
    setValues({
      full_name: target?.full_name ?? '',
      email: target?.email ?? '',
      phone_number: target?.phone_number ?? '',
    });
    setTouched({});
    setDismissedErrors({});
  }, [target?.id, target?.full_name, target?.email, target?.phone_number]);

  if (!target) return null;

  const errors = {
    full_name: values.full_name.trim() ? validateFullName(values.full_name) : '',
    email: values.email.trim() ? validateEmail(values.email) : '',
  };
  const showError = (field) => (
    (!dismissedErrors[field] && fieldErrors[field]) || (touched[field] || touched.all ? errors[field] : '')
  );
  const hasErrors = Object.values(errors).some(Boolean);

  function submit() {
    setTouched({ all: true });
    if (hasErrors) return;
    onConfirm({
      full_name: values.full_name.trim(),
      email: values.email.trim(),
      phone_number: values.phone_number.trim(),
    });
  }

  return (
    <ConfirmDialog
      open
      title="Editar trabajador"
      confirmLabel="Guardar cambios"
      loading={loading}
      confirmDisabled={hasErrors}
      error={error}
      onCancel={onCancel}
      onConfirm={submit}
    >
      <p>
        Actualiza los datos de <strong>{target.full_name}</strong>. El rol y el estado se gestionan por separado.
      </p>
      <TextField
        label="Nombre completo"
        value={values.full_name}
        onChange={(event) => {
          setDismissedErrors((current) => ({ ...current, full_name: true }));
          setValues((v) => ({ ...v, full_name: event.target.value }));
        }}
        onBlur={() => setTouched((t) => ({ ...t, full_name: true }))}
        error={showError('full_name')}
        disabled={loading}
        autoComplete="off"
        maxLength={150}
      />
      <TextField
        label="Correo electrónico"
        type="email"
        value={values.email}
        onChange={(event) => {
          setDismissedErrors((current) => ({ ...current, email: true }));
          setValues((v) => ({ ...v, email: event.target.value }));
        }}
        onBlur={() => setTouched((t) => ({ ...t, email: true }))}
        error={showError('email')}
        disabled={loading}
        autoComplete="off"
      />
      <TextField
        label="Teléfono"
        value={values.phone_number}
        onChange={(event) => {
          setDismissedErrors((current) => ({ ...current, phone_number: true }));
          setValues((v) => ({ ...v, phone_number: event.target.value }));
        }}
        onBlur={() => setTouched((t) => ({ ...t, phone_number: true }))}
        inputMode="tel"
        disabled={loading}
        autoComplete="off"
      />
    </ConfirmDialog>
  );
}
