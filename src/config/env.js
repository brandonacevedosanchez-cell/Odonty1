// La URL base se configura con VITE_API_URL (sin barra final).
const configuredUrl = import.meta.env?.VITE_API_URL ?? globalThis.process?.env?.VITE_API_URL;

export const API_URL = String(configuredUrl ?? '').trim().replace(/\/+$/, '');
export const API_URL_IS_CONFIGURED = Boolean(API_URL);
