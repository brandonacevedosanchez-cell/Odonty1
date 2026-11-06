import { useState } from 'react';
import { EmptyState } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ModuleApiNotice from '../comun/ModuleApiNotice.jsx';

const PATIENT_FIELDS = [
  { label: 'Nombre completo', type: 'text' },
  { label: 'Tipo de documento', type: 'text' },
  { label: 'Número de documento', type: 'text' },
  { label: 'Fecha de nacimiento', type: 'date' },
  { label: 'Teléfono', type: 'tel' },
  { label: 'Correo electrónico', type: 'email' },
  { label: 'Dirección', type: 'text' },
];

export default function PatientsPage() {
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Pacientes"
        description="Consulta y administra la información de contacto de tus pacientes."
        actions={
          <button type="button" className="btn btn--primary" onClick={() => setFormOpen((open) => !open)}>
            <Icon name="plus" size={17} /> Registrar paciente
          </button>
        }
      />
      <ModuleApiNotice moduleName="Pacientes">
        No hay endpoint ni modelo de paciente disponible. No se consultan ni guardan datos; el formulario es solo una vista previa.
      </ModuleApiNotice>

      {formOpen && (
        <section className="panel section" aria-labelledby="patient-form-heading">
          <div className="module-section-heading">
            <div>
              <h2 className="panel__title" id="patient-form-heading">Datos del paciente</h2>
              <p className="module-muted">Los campos y su obligatoriedad deben confirmarse con el contrato del backend.</p>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setFormOpen(false)}>Cerrar formulario</button>
          </div>
          <div className="module-form-grid">
            {PATIENT_FIELDS.map((field) => (
              <label className="field" key={field.name}>
                <span className="field__label">{field.label}</span>
                  <input className="input" type={field.type} autoComplete="off" />
              </label>
            ))}
            <label className="field module-form-grid__wide">
              <span className="field__label">Información adicional</span>
                <textarea className="input module-textarea" />
            </label>
          </div>
          <p className="module-muted">Sexo, estado y otros atributos se añadirán solo si están definidos en el modelo de pacientes.</p>
          <div className="form__actions">
            <button type="button" className="btn btn--secondary" onClick={() => setFormOpen(false)}>Cancelar</button>
            <button type="button" className="btn btn--primary" disabled title="Pendiente de endpoint de pacientes">Guardar paciente</button>
          </div>
        </section>
      )}

      <section className="panel section">
        <div className="module-toolbar">
          <h2 className="panel__title">Directorio de pacientes</h2>
          <label className="search module-search">
            <Icon name="search" size={17} />
            <input
              className="search__input"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, documento o teléfono"
              aria-label="Buscar pacientes"
            />
          </label>
        </div>
        <div className="table-wrap">
          <table className="table table--responsive">
            <thead>
              <tr>
                <th scope="col">Paciente</th>
                <th scope="col">Documento</th>
                <th scope="col">Contacto</th>
                <th scope="col">Fecha de registro</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan="5">
                  <EmptyState
                    icon="users"
                    title={query ? 'No hay resultados disponibles' : 'Aún no hay pacientes para mostrar'}
                    text="La lista aparecerá cuando el backend publique el endpoint y existan registros reales."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
