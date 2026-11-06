import { useState } from 'react';
import { EmptyState } from '../../components/Feedback.jsx';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ModuleApiNotice from '../comun/ModuleApiNotice.jsx';

const SECTIONS = [
  ['personal', 'Datos personales'],
  ['medical', 'Antecedentes y alergias'],
  ['care', 'Consultas y evolución'],
];

export default function ClinicalHistoryPage() {
  const [query, setQuery] = useState('');
  const [section, setSection] = useState('personal');

  return (
    <>
      <PageHeader
        title="Historia clínica"
        description="Consulta centralizada de antecedentes, diagnósticos y evolución del paciente."
      />
      <ModuleApiNotice moduleName="Historia clínica">
        No existe un endpoint clínico documentado. Esta vista no busca ni expone información médica real y no permite guardar registros.
      </ModuleApiNotice>

      <section className="panel section">
        <h2 className="panel__title">Buscar paciente</h2>
        <label className="search module-search">
          <Icon name="search" size={17} />
          <input
            className="search__input"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre o número de documento"
            aria-label="Buscar paciente para consultar la historia clínica"
          />
        </label>
      </section>

      <section className="panel section" aria-label="Información clínica">
        <div className="module-tabs" role="tablist" aria-label="Secciones de historia clínica">
          {SECTIONS.map(([id, label]) => (
            <button
              type="button"
              key={id}
              role="tab"
              aria-selected={section === id}
              className={section === id ? 'module-tabs__active' : ''}
              onClick={() => setSection(id)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="clinical-record-placeholder" role="tabpanel">
          <EmptyState
            icon="file-text"
            title={query ? 'No se encontraron pacientes' : 'Selecciona un paciente'}
            text="Los datos personales, antecedentes, alergias, medicamentos, diagnósticos, tratamientos y evolución solo se mostrarán al integrar la API con autorización clínica."
          />
          <p className="clinical-privacy-note">
            <Icon name="lock" size={16} /> Información clínica sensible: acceso sujeto a permisos del backend y a la matriz aprobada para el frontend.
          </p>
        </div>
      </section>
    </>
  );
}
