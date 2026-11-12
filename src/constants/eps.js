/**
 * Catálogo de EPS autorizadas en Colombia.
 *
 * Fuente: listado consolidado de EPS vigentes (formato de referencia
 * junio de 2025, transcripción de Medifolios a partir del listado de
 * Supersalud/ADRES). El backend guarda `eps` como texto libre de máximo
 * 100 caracteres, por eso aquí se usan los nombres completos y legibles.
 *
 * Actualizar este archivo cuando cambie el listado oficial. La opción
 * "Particular / Sin EPS" no es una EPS: representa la atención particular.
 */
export const EPS_OPTIONS = Object.freeze([
  'ALIANSALUD',
  'ANAS WAYUU',
  'ASMET SALUD',
  'ASOCIACIÓN INDÍGENA DEL CAUCA',
  'CAJACOPI ATLÁNTICO',
  'CAPITAL SALUD',
  'CAPRESOCA',
  'COMFACHOCÓ',
  'COMFAORIENTE',
  'COMFENALCO VALLE',
  'COMPENSAR',
  'COOSALUD',
  'DUSAKAWI',
  'EMSSANAR',
  'EPS FAMILIAR DE COLOMBIA',
  'EPM',
  'FAMISANAR',
  'FONDO DE PASIVO SOCIAL DE FERROCARRILES',
  'MALLAMAS',
  'MUTUAL SER',
  'NUEVA EPS',
  'PIJAOS SALUD',
  'SALUD MÍA',
  'SALUD TOTAL',
  'SANITAS',
  'SAVIA SALUD',
  'SOS',
  'SURA',
]);

/** Opción explícita para pacientes que no usan EPS. */
export const NO_EPS_OPTION = 'Particular / Sin EPS';

export const EPS_SELECT_OPTIONS = Object.freeze([...EPS_OPTIONS, NO_EPS_OPTION]);
