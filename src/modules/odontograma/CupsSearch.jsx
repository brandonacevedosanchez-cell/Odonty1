import { useEffect, useMemo, useRef, useState } from 'react';
import { FieldError } from '../../components/FormField.jsx';
import Icon from '../../components/Icon.jsx';
import { CUPS_QUERY_MIN_LENGTH } from '../../constants/apiValues.js';
import { getCups, searchCups } from '../../services/catalogsService.js';
import { getErrorMessage } from '../../utils/errors.js';

/**
 * Buscador CUPS con autocompletado y debounce.
 * El valor del formulario es el código (`procedure_code`); el nombre oficial
 * se consulta con GET /catalogs/cups/{code} para mostrarlo aunque el código
 * venga ya guardado.
 */
export default function CupsSearch({
  id,
  value = '',
  onChange,
  disabled = false,
  error = '',
  placeholder = 'Busca por código o nombre (ej. 2321 u obturación resina)',
}) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selected, setSelected] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return undefined;
    }
    let active = true;
    getCups(value)
      .then((cups) => {
        if (active) setSelected(cups);
      })
      .catch(() => {
        if (active) setSelected(null);
      });
    return () => {
      active = false;
    };
  }, [value]);

  useEffect(() => {
    if (!open || debouncedQuery.length < CUPS_QUERY_MIN_LENGTH) {
      setResults([]);
      setSearchError('');
      return undefined;
    }
    let active = true;
    setLoading(true);
    setSearchError('');
    searchCups({ q: debouncedQuery })
      .then((items) => {
        if (active) setResults(Array.isArray(items) ? items : []);
      })
      .catch((searchFailure) => {
        if (active) {
          setResults([]);
          setSearchError(getErrorMessage(searchFailure));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, debouncedQuery]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const displayValue = useMemo(() => {
    if (open) return query;
    if (selected) return `${selected.code} — ${selected.name}`;
    return value || '';
  }, [open, query, selected, value]);

  function select(cups) {
    setSelected(cups);
    setQuery('');
    setOpen(false);
    onChange(cups.code);
  }

  function clear() {
    setSelected(null);
    setQuery('');
    onChange('');
  }

  return (
    <div className="combo cups-search" ref={rootRef}>
      <div className="cups-search__control">
        <input
          id={id}
          className="input"
          type="search"
          value={displayValue}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            if (selected) setSelected(null);
            if (value) onChange('');
          }}
          onFocus={() => {
            setOpen(true);
            setQuery('');
          }}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete="off"
          aria-invalid={error ? 'true' : undefined}
          aria-expanded={open}
          aria-autocomplete="list"
          role="combobox"
        />
        {value && !disabled && (
          <button type="button" className="cups-search__clear" onClick={clear} aria-label="Quitar código CUPS">
            <Icon name="x" size={15} />
          </button>
        )}
      </div>

      {open && (
        <div className="combo__panel cups-search__panel">
          {loading && <p className="combo__empty">Buscando en el catálogo CUPS…</p>}
          {!loading && debouncedQuery.length < CUPS_QUERY_MIN_LENGTH && (
            <p className="combo__empty">Escribe al menos {CUPS_QUERY_MIN_LENGTH} caracteres.</p>
          )}
          {!loading && searchError && <p className="combo__empty">{searchError}</p>}
          {!loading && !searchError && debouncedQuery.length >= CUPS_QUERY_MIN_LENGTH && (
            <div className="combo__list" role="listbox" aria-label="Procedimientos CUPS">
              {results.map((cups) => (
                <button
                  key={cups.code}
                  type="button"
                  className={`combo__option cups-search__option ${cups.code === value ? 'combo__option--selected' : ''}`.trim()}
                  role="option"
                  aria-selected={cups.code === value}
                  onClick={() => select(cups)}
                >
                  <span className="cups-search__code">{cups.code}</span>
                  <span>{cups.name}</span>
                </button>
              ))}
              {results.length === 0 && <p className="combo__empty">No se encontraron procedimientos.</p>}
            </div>
          )}
        </div>
      )}

      {selected && (
        <p className="field__hint">
          <strong>{selected.code}</strong> · {selected.name}
          {selected.section ? ` · ${selected.section}` : ''}
        </p>
      )}
      <FieldError error={error} />
    </div>
  );
}

/**
 * Muestra la descripción oficial de un código CUPS ya guardado.
 * Si el backend ya envió `name`, se usa ese valor y no se hace la consulta.
 */
export function CupsCodeLabel({ code, name }) {
  const [officialName, setOfficialName] = useState('');

  useEffect(() => {
    if (!code || name) {
      setOfficialName('');
      return undefined;
    }
    let active = true;
    getCups(code)
      .then((cups) => {
        if (active) setOfficialName(cups?.name ?? '');
      })
      .catch(() => {
        if (active) setOfficialName('');
      });
    return () => {
      active = false;
    };
  }, [code, name]);

  return <>{name || officialName || code}</>;
}

