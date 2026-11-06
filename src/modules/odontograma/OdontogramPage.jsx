import { useState } from 'react';
import Icon from '../../components/Icon.jsx';
import PageHeader from '../../components/PageHeader.jsx';
import ModuleApiNotice from '../comun/ModuleApiNotice.jsx';
import ToothSurfaceSelector from './ToothSurfaceSelector.jsx';
import { DENTITION } from './toothData.js';
import useToothSelection from './useToothSelection.js';

function ToothButton({ number, arch, dentition, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`tooth-button ${selected ? 'tooth-button--selected' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Pieza ${number}, dentición ${DENTITION[dentition].label.toLowerCase()}, ${arch === 'upper' ? 'arcada superior' : 'arcada inferior'}`}
    >
      <svg viewBox="0 0 42 46" aria-hidden="true">
        <path d="M10 5C5 5 3 10 5 16l4 15c1 4 4 5 6 1l4-8 4 8c2 4 5 3 6-1l4-15c2-6 0-11-5-11-3 0-5 2-7 2s-4-2-7-2Z" />
        <path d="M14 13c2-2 4-2 7-1" />
      </svg>
      <span>{number}</span>
    </button>
  );
}

export default function OdontogramPage() {
  const [dentition, setDentition] = useState('permanent');
  const [arch, setArch] = useState('upper');
  const [selectedTooth, setSelectedTooth] = useState(null);
  const toothSelection = useToothSelection();
  const teeth = DENTITION[dentition][arch];
  const selectedToothSelection = selectedTooth
    ? toothSelection.selections[selectedTooth] ?? { wholeTooth: false, surfaces: [] }
    : null;

  return (
    <>
      <PageHeader
        title="Odontograma"
        description="Explora las piezas dentales con numeración FDI y consulta su información."
      />
      <ModuleApiNotice moduleName="Odontograma">
        La pieza seleccionada es solo una selección visual. No hay diagnósticos ni procedimientos cargados y no se guarda información clínica.
      </ModuleApiNotice>

      <div className="odontogram-layout section">
        <section className="panel odontogram-panel">
          <div className="odontogram-controls">
            <div className="module-segmented" role="group" aria-label="Tipo de dentición">
              {Object.entries(DENTITION).map(([key, value]) => (
                <button
                  type="button"
                  key={key}
                  className={dentition === key ? 'module-segmented__active' : ''}
                  aria-pressed={dentition === key}
                  onClick={() => { setDentition(key); setSelectedTooth(null); }}
                >
                  {value.label}
                </button>
              ))}
            </div>
            <div className="module-segmented" role="group" aria-label="Arcada dental">
              {[
                ['upper', 'Superior'],
                ['lower', 'Inferior'],
              ].map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  className={arch === key ? 'module-segmented__active' : ''}
                  aria-pressed={arch === key}
                  onClick={() => { setArch(key); setSelectedTooth(null); }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="odontogram-arch">
            <div className="odontogram-arch__labels">
              <span>Derecha del paciente</span>
              <span>{arch === 'upper' ? 'Arcada superior' : 'Arcada inferior'}</span>
              <span>Izquierda del paciente</span>
            </div>
            <div className="tooth-row">
              {teeth.map((number) => (
                <ToothButton
                  key={number}
                  number={number}
                  arch={arch}
                  dentition={dentition}
                  selected={selectedTooth === number}
                  onSelect={() => setSelectedTooth(number)}
                />
              ))}
            </div>
          </div>
          <p className="odontogram-caption">Numeración FDI · Selecciona una pieza para consultar sus datos disponibles.</p>
        </section>

        <aside className="panel odontogram-details" aria-live="polite">
          <span className="odontogram-details__icon"><Icon name="tooth" size={23} /></span>
          <h2 className="panel__title">Detalle de pieza</h2>
          {selectedTooth ? (
            <>
              <dl className="details">
                <div className="detail"><dt>Identificador FDI</dt><dd>{selectedTooth}</dd></div>
                <div className="detail"><dt>Dentición</dt><dd>{DENTITION[dentition].label}</dd></div>
                <div className="detail"><dt>Arcada</dt><dd>{arch === 'upper' ? 'Superior' : 'Inferior'}</dd></div>
                <div className="detail"><dt>Condición / procedimientos</dt><dd>Pendiente de integración clínica</dd></div>
              </dl>
              <ToothSurfaceSelector
                toothNumber={selectedTooth}
                arch={arch}
                selection={selectedToothSelection}
                onToggleSurface={(surface) => toothSelection.toggleSurface(selectedTooth, surface)}
                onToggleWholeTooth={() => toothSelection.toggleWholeTooth(selectedTooth)}
              />
            </>
          ) : (
            <p className="module-muted">Selecciona una pieza dental. Su condición clínica no se puede inferir ni está registrada.</p>
          )}
          <div className="odontogram-details__note">
            Los estados dentales y el registro de procedimientos estarán disponibles cuando exista un modelo y endpoint clínico.
          </div>
        </aside>
      </div>
    </>
  );
}
