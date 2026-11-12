import { useEffect, useState } from 'react';
import { Alert, ErrorState, LoadingState, Spinner } from '../components/Feedback.jsx';
import Icon from '../components/Icon.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import PatientClinicalFields from '../modules/pacientes/PatientClinicalFields.jsx';
import {
  createMyPatientProfile,
  getMyPatientProfile,
  updateMyPatientProfile,
} from '../services/patientsService.js';
import { ApiError, getErrorMessage } from '../utils/errors.js';

const EMPTY = {
  document_type: 'CC',
  birth_date: '',
  gender: '',
  blood_type: '',
  address: '',
  eps: '',
  allergies: '',
  notes: '',
  guardian_full_name: '',
  guardian_document_number: '',
  guardian_phone: '',
  guardian_relationship: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

export default function MyPatientProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [values, setValues] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    setNotFound(false);
    try {
      const result = await getMyPatientProfile();
      setProfile(result);
      setExists(true);
      setValues({ ...EMPTY, ...result });
    } catch (loadError) {
      if (loadError instanceof ApiError && loadError.status === 404) {
        setExists(false);
        setNotFound(true);
        setValues(EMPTY);
      } else {
        setError(getErrorMessage(loadError));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (field, value) => setValues((current) => ({ ...current, [field]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setFormError('');
    setSaving(true);
    try {
      const result = exists ? await updateMyPatientProfile(values) : await createMyPatientProfile(values);
      setProfile(result && typeof result === 'object' ? result : { ...values });
      setExists(true);
      setNotFound(false);
      toast.success(exists ? 'Perfil actualizado.' : 'Perfil de paciente creado.');
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.status === 422) {
        setFormError(Object.values(submitError.fieldErrors).join(' ') || submitError.message);
      } else {
        setFormError(getErrorMessage(submitError));
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Mi perfil de paciente"
        description="Completa tus datos clínicos y de contacto para que la clínica pueda atenderte."
      />

      {loading && <LoadingState message="Cargando tu perfil…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} title="No se pudo cargar tu perfil" />}
      {!loading && !error && (
        <section className="panel panel--narrow">
          {notFound && (
            <Alert type="info">
              Aún no tienes un perfil de paciente. Complétalo una sola vez para que la clínica pueda asociarte a tus citas.
            </Alert>
          )}
          {profile?.full_name && (
            <p className="module-muted">Perfil asociado a <strong>{profile.full_name}</strong>.</p>
          )}
          {formError && <Alert type="error">{formError}</Alert>}
          <form onSubmit={handleSubmit} className="form form--spaced">
            <div className="module-form-grid">
              <PatientClinicalFields values={values} onChange={update} disabled={saving} />
            </div>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? <Spinner size={16} /> : <Icon name="check" size={16} />}
              {saving ? 'Guardando…' : exists ? 'Guardar cambios' : 'Crear mi perfil'}
            </button>
          </form>
        </section>
      )}
    </>
  );
}
