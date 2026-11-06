import { useEffect, useState } from 'react';

/**
 * Devuelve true cuando una operación lleva más de `delay` ms cargando.
 * Sirve para avisar que el servidor (plan gratuito de Render) puede estar iniciando.
 */
export function useSlowLoading(loading, delay = 5000) {
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setSlow(true), delay);
    return () => window.clearTimeout(timer);
  }, [loading, delay]);

  return slow;
}

export const SLOW_SERVER_MESSAGE =
  'El servidor puede estar iniciando. Esto puede tardar cerca de un minuto, por favor espera…';
