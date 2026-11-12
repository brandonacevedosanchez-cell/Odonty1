import { getSurfaceLabels, getToothSurfaces } from './toothData.js';

const REGIONS = {
  vestibular: {
    path: 'M66 43 Q120 28 174 43 L158 86 139 103 120 96 101 103 82 86 Z',
    position: [120, 68],
  },
  lingual: {
    path: 'M101 137 120 144 139 137 158 154 174 197 Q120 212 66 197 L82 154 Z',
    position: [120, 178],
  },
  mesialLeft: {
    path: 'M43 81 82 86 101 103 84 120 101 137 82 154 43 159 Q29 120 43 81 Z',
    position: [62, 120],
  },
  mesialRight: {
    path: 'M197 81 158 86 139 103 156 120 139 137 158 154 197 159 Q211 120 197 81 Z',
    position: [178, 120],
  },
  distalLeft: {
    path: 'M43 81 82 86 101 103 84 120 101 137 82 154 43 159 Q29 120 43 81 Z',
    position: [62, 120],
  },
  distalRight: {
    path: 'M197 81 158 86 139 103 156 120 139 137 158 154 197 159 Q211 120 197 81 Z',
    position: [178, 120],
  },
  center: {
    path: 'M101 103 120 96 139 103 156 120 139 137 120 144 101 137 84 120 Z',
    position: [120, 120],
  },
};

function SurfaceRegion({ label, region, selected, onToggle }) {
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onToggle();
    }
  };
  const abbreviation = label[0];

  return (
    <g
      className={`tooth-surface-region ${selected ? 'tooth-surface-region--selected' : ''}`}
      role="button"
      tabIndex="0"
      aria-label={`${label} ${selected ? 'seleccionada' : 'no seleccionada'}`}
      aria-pressed={selected}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <path className="tooth-surface-region__shape" d={region.path} />
      <text className="tooth-surface-region__label" x={region.position[0]} y={region.position[1]}>
        {abbreviation}
      </text>
    </g>
  );
}

export default function ToothSurfaceSelector({
  toothNumber,
  arch,
  selection,
  onToggleSurface,
  onToggleWholeTooth,
}) {
  const labels = getSurfaceLabels(toothNumber, arch);
  const surfaces = getToothSurfaces(toothNumber);
  const isRightQuadrant = ['1', '4', '5', '8'].includes(String(toothNumber)[0]);
  const mesialSide = isRightQuadrant ? 'Left' : 'Right';
  const distalSide = isRightQuadrant ? 'Right' : 'Left';

  return (
    <section className="tooth-surface-selector" aria-label={`Superficies de la pieza ${toothNumber}`}>
      <div className="tooth-surface-selector__heading">
        <div>
          <h3>Superficies dentales</h3>
          <p>Selecciona una o varias regiones</p>
        </div>
        <span className="tooth-surface-selector__tooth">FDI {toothNumber}</span>
      </div>

      <button
        type="button"
        className={`whole-tooth-toggle ${selection.wholeTooth ? 'whole-tooth-toggle--selected' : ''}`}
        aria-pressed={selection.wholeTooth}
        onClick={onToggleWholeTooth}
      >
        <span className="whole-tooth-toggle__icon" aria-hidden="true">+</span>
        Diente completo
        <span className="whole-tooth-toggle__hint">Condición general</span>
      </button>

      <div className="tooth-surface-diagram">
        <svg viewBox="0 0 240 240" role="group" aria-label="Diagrama interactivo de superficies">
          <path
            className="tooth-surface-diagram__outline"
            d="M120 18C83 16 48 36 37 69c-12 38-1 88 23 122 15 21 32 34 48 40 8 3 16 3 24 0 16-6 33-19 48-40 24-34 35-84 23-122-11-33-46-53-83-51Z"
          />
          {surfaces.map((surface) => {
            const region = surface === 'mesial'
              ? REGIONS[`mesial${mesialSide}`]
              : surface === 'distal'
                ? REGIONS[`distal${distalSide}`]
                : surface === 'vestibular'
                  ? REGIONS.vestibular
                  : surface === 'lingual_palatino'
                    ? REGIONS.lingual
                    : REGIONS.center;

            return (
              <SurfaceRegion
                key={surface}
                label={labels[surface]}
                region={region}
                selected={selection.surfaces.includes(surface)}
                onToggle={() => onToggleSurface(surface)}
              />
            );
          })}
        </svg>
        <div className="tooth-surface-diagram__orientation" aria-hidden="true">
          <span>{labels.vestibular}</span>
          <span>{labels.lingual_palatino}</span>
        </div>
      </div>

      <ul className="tooth-surface-legend" aria-label="Superficies de la pieza">
        {surfaces.map((surface) => (
          <li key={surface}>
            <span className={`tooth-surface-legend__swatch tooth-surface-legend__swatch--${surface}`} aria-hidden="true" />
            {labels[surface]}
            {selection.surfaces.includes(surface) && <span className="tooth-surface-legend__selected">Seleccionada</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
