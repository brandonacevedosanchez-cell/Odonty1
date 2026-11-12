import { TOOTH_SURFACES } from '../../constants/apiValues.js';

export const DENTITION = {
  permanent: {
    label: 'Permanente',
    upper: ['18', '17', '16', '15', '14', '13', '12', '11', '21', '22', '23', '24', '25', '26', '27', '28'],
    lower: ['48', '47', '46', '45', '44', '43', '42', '41', '31', '32', '33', '34', '35', '36', '37', '38'],
  },
  primary: {
    label: 'Temporal',
    upper: ['55', '54', '53', '52', '51', '61', '62', '63', '64', '65'],
    lower: ['85', '84', '83', '82', '81', '71', '72', '73', '74', '75'],
  },
};

/**
 * Enum ToothSurface del contrato (docs/openapi.json).
 * No existe `incisal` ni `lingual`: el borde incisal se registra como `oclusal`
 * y la cara interna como `lingual_palatino`.
 */
export const SURFACE_KEYS = TOOTH_SURFACES.filter((surface) => surface !== 'oclusal');
export const OCCLUSAL_SURFACE = TOOTH_SURFACES.find((surface) => surface === 'oclusal');

export function isAnteriorTooth(toothNumber) {
  return Number(String(toothNumber).slice(-1)) <= 3;
}

export function getToothSurfaceType() {
  return OCCLUSAL_SURFACE;
}

export function getToothSurfaces() {
  return [...SURFACE_KEYS, OCCLUSAL_SURFACE];
}

export function getSurfaceLabels(toothNumber, arch) {
  return {
    vestibular: 'Vestibular',
    lingual_palatino: arch === 'upper' ? 'Palatina' : 'Lingual',
    mesial: 'Mesial',
    distal: 'Distal',
    oclusal: isAnteriorTooth(toothNumber) ? 'Incisal' : 'Oclusal',
  };
}
