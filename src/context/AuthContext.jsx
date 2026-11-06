import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { setAuthHandlers } from '../services/apiClient.js';
import * as authService from '../services/authService.js';
import { getRefreshToken, clearTokens } from '../services/tokenStorage.js';
import { PREVIEW_MODE, PREVIEW_USER } from '../config/preview.js';
import { useToast } from './ToastContext.jsx';

const AuthContext = createContext(null);

/**
 * Estados de la sesión:
 *  - loading: restaurando la sesión (puede tardar si el servidor estaba dormido).
 *  - authenticated / unauthenticated.
 *  - error: no se pudo contactar al servidor al restaurar; NO se cierra la sesión.
 */
export function AuthProvider({ children }) {
  const toast = useToast();
  const [user, setUser] = useState(PREVIEW_MODE ? PREVIEW_USER : null);
  const [status, setStatus] = useState(PREVIEW_MODE ? 'authenticated' : 'loading');
  const [mfaToken, setMfaToken] = useState(null);
  const [initError, setInitError] = useState(null);
  const userRef = useRef(null);
  userRef.current = user;

  const resetSession = useCallback(() => {
    setUser(null);
    setMfaToken(null);
    setStatus('unauthenticated');
  }, []);

  // Reacciones globales de la capa HTTP.
  useEffect(() => {
    setAuthHandlers({
      onSessionExpired: () => {
        if (userRef.current) toast.info('Tu sesión expiró. Inicia sesión de nuevo.');
        resetSession();
      },
      // 403 PASSWORD_CHANGE_REQUIRED en cualquier endpoint: fuerza la pantalla de cambio.
      onPasswordChangeRequired: () => {
        setUser((current) => (current ? { ...current, must_change_password: true } : current));
      },
    });
  }, [resetSession, toast]);

  const loadUser = useCallback(async () => {
    const me = await authService.fetchMe();
    setUser(me);
    setMfaToken(null);
    setStatus('authenticated');
    return me;
  }, []);

  const bootstrap = useCallback(async () => {
    setInitError(null);
    if (PREVIEW_MODE) {
      setUser(PREVIEW_USER);
      setStatus('authenticated');
      return;
    }
    if (!getRefreshToken()) {
      setStatus('unauthenticated');
      return;
    }
    setStatus('loading');
    try {
      await loadUser();
    } catch (error) {
      if (error?.status === 0 || error?.status >= 500) {
        // Servidor dormido o sin conexión: se conserva la sesión y se permite reintentar.
        setInitError(error);
        setStatus('error');
      } else {
        clearTokens();
        resetSession();
      }
    }
  }, [loadUser, resetSession]);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const signIn = useCallback(
    async (email, password) => {
      if (PREVIEW_MODE) {
        setUser(PREVIEW_USER);
        setStatus('authenticated');
        return { mfaRequired: false };
      }
      const result = await authService.login(email, password);
      if (result.mfaRequired) {
        setMfaToken(result.mfaToken);
        return { mfaRequired: true };
      }
      await loadUser();
      return { mfaRequired: false };
    },
    [loadUser],
  );

  const completeMfa = useCallback(
    async (code) => {
      if (PREVIEW_MODE) {
        setUser(PREVIEW_USER);
        setStatus('authenticated');
        return;
      }
      await authService.verifyMfa(mfaToken, code);
      await loadUser();
    },
    [mfaToken, loadUser],
  );

  const cancelMfa = useCallback(() => setMfaToken(null), []);

  const signOut = useCallback(async () => {
    if (PREVIEW_MODE) return;
    await authService.logout();
    resetSession();
  }, [resetSession]);

  // Tras el 204 el backend cierra todas las sesiones: se limpian los tokens y se vuelve al login.
  const updatePassword = useCallback(
    async (currentPassword, newPassword) => {
      if (PREVIEW_MODE) throw new Error('El cambio de contraseña está deshabilitado en la vista previa.');
      await authService.changePassword(currentPassword, newPassword);
      resetSession();
    },
    [resetSession],
  );

  const value = useMemo(
    () => ({
      user,
      status,
      initError,
      mfaToken,
      isAuthenticated: status === 'authenticated' && Boolean(user),
      signIn,
      completeMfa,
      cancelMfa,
      signOut,
      updatePassword,
      retryBootstrap: bootstrap,
    }),
    [user, status, initError, mfaToken, signIn, completeMfa, cancelMfa, signOut, updatePassword, bootstrap],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
