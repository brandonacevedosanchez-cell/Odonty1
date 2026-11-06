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

export const SURFACE_KEYS = ['vestibular', 'lingual', 'mesial', 'distal'];

export function getToothSurfaceType(toothNumber) {
  const lastDigit = Number(String(toothNumber).slice(-1));
  return lastDigit <= 3 ? 'incisal' : 'occlusal';
}

export function getToothSurfaces(toothNumber) {
  return [...SURFACE_KEYS, getToothSurfaceType(toothNumber)];
}

export function getSurfaceLabels(toothNumber, arch) {
  return {
    vestibular: 'Vestibular',
    lingual: arch === 'upper' ? 'Palatina' : 'Lingual',
    mesial: 'Mesial',
    distal: 'Distal',
    [getToothSurfaceType(toothNumber)]: getToothSurfaceType(toothNumber) === 'incisal' ? 'Incisal' : 'Oclusal',
  };
}
