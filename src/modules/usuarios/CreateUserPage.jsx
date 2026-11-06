import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Spinner } from '../../components/Feedback.jsx';
import { SelectField, TextField } from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { usePermissions } from '../../hooks/usePermissions.js';
import { SLOW_SERVER_MESSAGE, useSlowLoading } from '../../hooks/useSlowLoading.js';
import { createUser } from '../../services/usersService.js';
import { ApiError, getErrorMessage } from '../../utils/errors.js';
import { roleLabel } from '../../utils/permissions.js';
import { PREVIEW_MODE } from '../../config/preview.js';
import {
  hasErrors,
  normalizePhone,
  validateDocument,
  validateEmail,
  validateFullName,
  validatePhone,
  validateRole,
} from '../../utils/validators.js';

const EMPTY = { full_name: '', email: '', document_number: '', phone_number: '', role: '' };

export default function CreateUserPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { assignableRoles } = usePermissions();
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState({});
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const slow = useSlowLoading(submitting);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const errors = {
    full_name: validateFullName(values.full_name),
    email: validateEmail(values.email),
    document_number: validateDocument(values.document_number),
    phone_number: validatePhone(values.phone_number),
    role: validateRole(values.role, assignableRoles),
  };
  const showError = (field) => serverErrors[field] || (touched[field] || touched.all ? errors[field] : '');

  if (PREVIEW_MODE) {
    return (
      <>
        <PageHeader title="Crear trabajador" description="Vista previa del formulario de registro." />
        <section className="panel panel--narrow">
          <Alert type="info">
            El formulario está disponible solo para visualización. La creación de usuarios requiere conexión con el servidor.
          </Alert>
          <Link to="/usuarios" className="btn btn--secondary">
            <Icon name="arrow-left" size={16} /> Volver al listado
          </Link>
        </section>
      </>
    );
  }

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setServerErrors((current) => ({ ...current, [field]: '' }));
  };
  const blur = (field) => () => setTouched((current) => ({ ...current, [field]: true }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting) return;
    setTouched({ all: true });
    setFormError('');
    if (hasErrors(errors)) return;

    setSubmitting(true);
    try {
      await createUser({
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        document_number: values.document_number.trim(),
        phone_number: normalizePhone(values.phone_number),
        role: values.role,
      });
      toast.success('Trabajador creado. Debe revisar su correo para obtener la contraseña temporal.');
      // Al volver al listado se consulta de nuevo GET /users, por lo que aparece actualizado.
      navigate('/usuarios');
    } catch (error) {
      if (!mounted.current) return;
      if (error instanceof ApiError && error.status === 422) {
        setServerErrors(error.fieldErrors);
        if (Object.keys(error.fieldErrors).length === 0) setFormError(error.message);
      } else {
        // 409 duplicado, 403 (p. ej. admin creando admin), 5xx, red...
        setFormError(getErrorMessage(error));
      }
    } finally {
      if (mounted.current) setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Crear trabajador"
        description="Registra a un nuevo trabajador de la clínica."
        actions={
          <Link to="/usuarios" className="btn btn--secondary">
            <Icon name="arrow-left" size={16} /> Volver al listado
          </Link>
        }
      />

      <section className="panel panel--narrow">
        <Alert type="info">
          No se solicita contraseña: el sistema genera una temporal y la envía por correo al trabajador. Deberá cambiarla en su
          primer ingreso.
        </Alert>

        <form onSubmit={handleSubmit} noValidate className="form form--spaced">
          {formError && <Alert type="error">{formError}</Alert>}

          <TextField
            label="Nombre completo"
            value={values.full_name}
            onChange={update('full_name')}
            onBlur={blur('full_name')}
            error={showError('full_name')}
            autoComplete="off"
            maxLength={150}
            disabled={submitting}
          />
          <TextField
            label="Correo electrónico"
            type="email"
            value={values.email}
            onChange={update('email')}
            onBlur={blur('email')}
            error={showError('email')}
            autoComplete="off"
            disabled={submitting}
          />
          <div className="form__row">
            <TextField
              label="Número de documento"
              value={values.document_number}
              onChange={update('document_number')}
              onBlur={blur('document_number')}
              error={showError('document_number')}
              hint="Solo números, entre 5 y 10 dígitos."
              inputMode="numeric"
              maxLength={10}
              autoComplete="off"
              disabled={submitting}
            />
            <TextField
              label="Teléfono"
              value={values.phone_number}
              onChange={update('phone_number')}
              onBlur={blur('phone_number')}
              error={showError('phone_number')}
              hint="10 dígitos, con o sin +57."
              inputMode="tel"
              autoComplete="off"
              disabled={submitting}
            />
          </div>
          <SelectField
            label="Rol"
            value={values.role}
            onChange={update('role')}
            onBlur={blur('role')}
            error={showError('role')}
            hint={
              assignableRoles.includes('admin')
                ? 'Como superadministrador puedes crear administradores.'
                : 'Solo un superadministrador puede crear administradores.'
            }
            disabled={submitting}
          >
            <option value="">Selecciona un rol</option>
            {assignableRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </SelectField>

          <div className="form__actions">
            <Link to="/usuarios" className="btn btn--secondary" aria-disabled={submitting}>
              Cancelar
            </Link>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? <Spinner size={16} /> : <Icon name="user-plus" size={17} />}
              {submitting ? 'Creando…' : 'Crear trabajador'}
            </button>
          </div>
          {slow && <Alert type="info">{SLOW_SERVER_MESSAGE}</Alert>}
        </form>
      </section>
    </>
  );
}
