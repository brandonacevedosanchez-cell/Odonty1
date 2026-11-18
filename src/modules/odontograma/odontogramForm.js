// Reglas del formulario del odontograma.

export const EMPTY_ODONTOGRAM_FORM = Object.freeze({
  appointment_id: '',
  condition_code: '',
  procedure_code: '',
  cups_code: '',
  notes: '',
});

export const FALLBACK_ODONTOGRAM_CATALOGS = Object.freeze({
  conditions: Object.freeze([
    { code: 'sano', name: 'Sano' },
    { code: 'caries', name: 'Caries' },
    { code: 'obturado', name: 'Obturado' },
    { code: 'fracturado', name: 'Fracturado' },
    { code: 'ausente', name: 'Ausente' },
    { code: 'corona', name: 'Corona' },
    { code: 'endodoncia_realizada', name: 'Endodoncia realizada' },
    { code: 'movil', name: 'Móvil' },
    { code: 'implante', name: 'Implante' },
    { code: 'sellante', name: 'Sellante' },
    { code: 'protesis_fija', name: 'Prótesis fija' },
    { code: 'protesis_removible', name: 'Prótesis removible' },
    { code: 'en_erupcion', name: 'En erupción' },
    { code: 'impactado', name: 'Impactado' },
  ]),
  procedures: Object.freeze([
    { code: 'profilaxis', name: 'Profilaxis' },
    { code: 'resina', name: 'Resina' },
    { code: 'amalgama', name: 'Amalgama' },
    { code: 'extraccion', name: 'Extracción' },
    { code: 'endodoncia', name: 'Endodoncia' },
    { code: 'corona', name: 'Corona' },
    { code: 'sellante', name: 'Sellante' },
    { code: 'blanqueamiento', name: 'Blanqueamiento' },
    { code: 'ortodoncia', name: 'Ortodoncia' },
    { code: 'implante', name: 'Implante' },
    { code: 'cirugia', name: 'Cirugía' },
    { code: 'raspado_alisado', name: 'Raspado y alisado' },
    { code: 'fluorizacion', name: 'Fluorización' },
    { code: 'radiografia', name: 'Radiografía' },
  ]),
});

const text = (value) => String(value ?? '').trim();
const sortByName = (items) => [...items].sort((a, b) => a.name.localeCompare(b.name, 'es'));

function normalizeCatalogItems(items) {
  if (!Array.isArray(items) || items.some((item) => (
    typeof item?.code !== 'string' || typeof item?.name !== 'string'
  ))) {
    throw new TypeError('El catálogo odontológico tiene un formato inválido.');
  }
  return sortByName(items.map(({ code, name }) => ({ code, name })));
}

/** Usa el catálogo de la API y, si no está disponible, los códigos del contrato. */
export async function loadOdontogramCatalogs(loadCatalogs) {
  try {
    const catalogs = await loadCatalogs();
    return {
      conditions: normalizeCatalogItems(catalogs?.conditions),
      procedures: normalizeCatalogItems(catalogs?.procedures),
    };
  } catch {
    return {
      conditions: sortByName(FALLBACK_ODONTOGRAM_CATALOGS.conditions),
      procedures: sortByName(FALLBACK_ODONTOGRAM_CATALOGS.procedures),
    };
  }
}

/** Debe elegirse al menos un hallazgo o un procedimiento. */
export function validateOdontogramSelection(values) {
  if (text(values?.condition_code) || text(values?.procedure_code)) return '';
  return 'Selecciona un hallazgo o un procedimiento.';
}

/** El CUPS es obligatorio y no puede superar seis caracteres cuando hay procedimiento. */
export function validateOdontogramCups(values) {
  if (!text(values?.procedure_code)) return '';
  const cupsCode = text(values?.cups_code);
  if (!cupsCode) return 'Selecciona el código CUPS vigente del procedimiento.';
  if (cupsCode.length > 6) return 'El código CUPS debe tener máximo 6 caracteres.';
  return '';
}

/** Cambiar o quitar el procedimiento descarta el CUPS elegido. */
export function withProcedureCode(values, code) {
  const procedureCode = String(code ?? '');
  if (procedureCode === values.procedure_code) return { ...values, procedure_code: procedureCode };
  return { ...values, procedure_code: procedureCode, cups_code: '' };
}

/** Construye los campos de formulario sin enviar opciones vacías. */
export function buildOdontogramFields(values) {
  const conditionCode = text(values?.condition_code);
  const procedureCode = text(values?.procedure_code);
  const cupsCode = text(values?.cups_code);
  const notes = String(values?.notes ?? '');

  return {
    appointment_id: Number(values?.appointment_id),
    ...(conditionCode ? { condition_code: conditionCode } : {}),
    ...(procedureCode ? { procedure_code: procedureCode } : {}),
    ...(procedureCode && cupsCode ? { cups_code: cupsCode } : {}),
    ...(notes.trim() ? { notes } : {}),
  };
}
