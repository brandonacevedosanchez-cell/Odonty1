const DEFAULT_API_URL = 'https://odontyoriginal-1.onrender.com';

// La URL base se configura con la variable de entorno VITE_API_URL (sin barra final).
export const API_URL = String(import.meta.env?.VITE_API_URL || DEFAULT_API_URL).replace(/\/+$/, '');
