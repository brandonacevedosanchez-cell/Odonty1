import { validateEmail, validatePassword } from '../../utils/validators.js';

const ALLOWED_FILE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_FILE_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const NIT_WEIGHTS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

export function calculateNitCheckDigit(nit) {
  const digits = String(nit ?? '');
  if (!/^\d+$/.test(digits) || digits.length > NIT_WEIGHTS.length) return '';

  const reversed = [...digits].reverse();
  const sum = reversed.reduce((total, digit, index) => total + Number(digit) * NIT_WEIGHTS[index], 0);
  const remainder = sum % 11;
  return String(remainder < 2 ? remainder : 11 - remainder);
}

export function validateClinicFile(file, label) {
  if (!file) return `Selecciona el archivo de ${label}.`;
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validType = ALLOWED_FILE_TYPES.has(file.type) || (!file.type && ALLOWED_FILE_EXTENSIONS.has(extension));
  if (!validType || !ALLOWED_FILE_EXTENSIONS.has(extension)) return 'El archivo debe ser JPG, PNG o WEBP.';
  if (file.size === 0) return 'El archivo no puede estar vacío.';
  if (file.size > MAX_FILE_SIZE) return 'El archivo no puede superar 5 MB.';
  return '';
}

export function validateClinicRegistration(values, files) {
  return {
    clinic_name: !values.clinic_name.trim()
      ? 'El nombre de la clínica es obligatorio.'
      : values.clinic_name.trim().length < 3
        ? 'El nombre de la clínica debe tener al menos 3 caracteres.'
        : '',
    nit: !values.nit
      ? 'El NIT es obligatorio.'
      : /^\d+$/.test(values.nit)
        ? ''
        : 'El NIT solo puede contener números.',
    nit_dv: !values.nit_dv
      ? 'El dígito de verificación es obligatorio.'
      : /^\d$/.test(values.nit_dv)
        ? ''
        : 'El dígito de verificación debe ser un solo número.',
    email: validateEmail(values.email),
    document_number: !values.document_number
      ? 'El número de documento es obligatorio.'
      : /^\d{6,10}$/.test(values.document_number)
        ? ''
        : 'El documento debe tener entre 6 y 10 dígitos.',
    full_name: !values.full_name.trim() ? 'El nombre completo es obligatorio.' : '',
    phone_number: !values.phone_number
      ? 'El teléfono es obligatorio.'
      : /^\d{10}$/.test(values.phone_number)
        ? ''
        : 'El teléfono debe tener exactamente 10 dígitos.',
    password: validatePassword(values.password),
    cedula_file: validateClinicFile(files.cedula_file, 'la cédula'),
    rut_file: validateClinicFile(files.rut_file, 'el RUT'),
  };
}

export const hasClinicErrors = (errors) => Object.values(errors).some(Boolean);
