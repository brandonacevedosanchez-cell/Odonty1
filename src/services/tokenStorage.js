// Almacenamiento de tokens.
//  - access token: SOLO en memoria (dura 15 min; se recupera con el refresh token).
//  - refresh token: sessionStorage (por pestaña). Con la rotación del backend, usar
//    localStorage compartido entre pestañas provocaría invalidaciones cruzadas.
// Los tokens nunca se muestran en la interfaz ni se escriben en consola.

const REFRESH_KEY = 'odonty.refresh_token';

let accessToken = null;
let memoryRefreshToken = null; // respaldo cuando sessionStorage no está disponible

function session() {
  try {
    return typeof sessionStorage !== 'undefined' ? sessionStorage : null;
  } catch {
    return null;
  }
}

export const getAccessToken = () => accessToken;

export function getRefreshToken() {
  const store = session();
  if (store) {
    try {
      return store.getItem(REFRESH_KEY) || memoryRefreshToken;
    } catch {
      return memoryRefreshToken;
    }
  }
  return memoryRefreshToken;
}

/** Guarda el par de tokens; el refresh anterior se sustituye de inmediato (rotación). */
export function setTokens({ access_token, refresh_token }) {
  if (access_token) accessToken = access_token;
  if (refresh_token) {
    memoryRefreshToken = refresh_token;
    const store = session();
    if (store) {
      try {
        store.setItem(REFRESH_KEY, refresh_token);
      } catch {
        /* se usa el respaldo en memoria */
      }
    }
  }
}

export function clearTokens() {
  accessToken = null;
  memoryRefreshToken = null;
  const store = session();
  if (store) {
    try {
      store.removeItem(REFRESH_KEY);
    } catch {
      /* nada que limpiar */
    }
  }
}
