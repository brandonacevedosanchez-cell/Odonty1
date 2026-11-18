// Reglas del formulario del odontograma (contrato 13-nov-2026).
// `cups_code` solo aplica cuando se registra un procedimiento (`procedure_code`).

export const EMPTY_ODONTOGRAM_FORM = Object.freeze({
  appointment_id: '',
  condition_code: '',
  procedure_code: '',
  cups_code: '',
  notes: '',
});

const text = (value) => String(value ?? '').trim();

/** El CUPS es obligatorio solo cuando hay un procedimiento seleccionado. */
export function validateOdontogramCups(values) {
  if (!text(values?.procedure_code)) return '';
  if (!text(values?.cups_code)) return 'Selecciona el código CUPS vigente del procedimiento.';
  return '';
}

/** Cambiar o quitar el procedimiento descarta el CUPS elegido. */
export function withProcedureCode(values, code) {
  const procedureCode = String(code ?? '');
  if (procedureCode === values.procedure_code) return { ...values, procedure_code: procedureCode };
  return { ...values, procedure_code: procedureCode, cups_code: '' };
}

/**
 * Campos comunes de POST /odontogram.
 * `cups_code` solo viaja cuando hay `procedure_code`, como exige el contrato.
 */
export function buildOdontogramFields(values) {
  const procedureCode = text(values?.procedure_code);
  const cupsCode = text(values?.cups_code);

  return {
    appointment_id: Number(values?.appointment_id),
    condition_code: text(values?.condition_code) || undefined,
    procedure_code: procedureCode || undefined,
    cups_code: procedureCode ? cupsCode || undefined : undefined,
    notes: values?.notes ?? '',
  };
}
