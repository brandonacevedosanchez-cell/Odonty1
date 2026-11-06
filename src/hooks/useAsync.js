import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../utils/errors.js';

/**
 * Carga datos de forma asíncrona con estados de carga y error.
 * `fn` se ejecuta al montar (si `enabled`) y cada vez que se llama a `reload`.
 * `reload({ silent: true })` actualiza en segundo plano sin mostrar el indicador de carga.
 */
export function useAsync(fn, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const requestId = useRef(0);

  const reload = useCallback(async ({ silent = false } = {}) => {
    const current = ++requestId.current;
    if (!silent) {
      setLoading(true);
      setError('');
    }
    try {
      const result = await fnRef.current();
      if (current === requestId.current) {
        setData(result);
        setError('');
      }
    } catch (err) {
      // En una actualización silenciosa se conservan los datos ya mostrados.
      if (current === requestId.current && !silent) setError(getErrorMessage(err));
    } finally {
      if (current === requestId.current && !silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) reload();
    return () => {
      requestId.current += 1;
    };
  }, [enabled, reload]);

  return { data, setData, loading, error, reload };
}
