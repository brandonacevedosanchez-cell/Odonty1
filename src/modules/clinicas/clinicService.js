import { request } from '../../services/apiClient.js';

/**
 * @typedef {Object} ClinicOut
 * @property {number} id
 * @property {string} name
 * @property {string} nit
 * @property {'pending_email' | 'pending_review' | 'active' | 'rejected' | 'suspended'} status
 * @property {string} cedula_url
 * @property {string} rut_url
 */

export const registerClinic = (formData) =>
  request('/clinics/register', { method: 'POST', body: formData, auth: false });

/** @returns {Promise<ClinicOut[]>} */
export const listPendingClinics = () => request('/clinics/pending');

export const reviewClinic = (clinicId, approve) =>
  request(`/clinics/${encodeURIComponent(clinicId)}/review`, { method: 'PATCH', body: { approve } });
