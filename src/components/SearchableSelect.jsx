import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';

/**
 * Select con búsqueda para listas largas (por ejemplo, el catálogo de EPS).
 * Mantiene el valor controlado y solo permite elegir una de las opciones.
 */
export default function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder = 'Selecciona una opción',
  clearLabel = 'Sin especificar',
  allowEmpty = false,
  disabled = false,
  required = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);

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

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => option.toLowerCase().includes(term));
  }, [options, query]);

  const select = (option) => {
    onChange(option);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="combo" ref={rootRef}>
      <button
        type="button"
        id={id}
        className={`input combo__control ${value ? '' : 'combo__control--placeholder'}`.trim()}
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required || undefined}
      >
        <span className="combo__value">{value || placeholder}</span>
        <Icon name="chevron-down" size={16} />
      </button>

      {open && (
        <div className="combo__panel">
          <input
            className="input combo__search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar…"
            aria-label="Buscar opción"
            autoFocus
          />
          <div className="combo__list" role="listbox" aria-label="Opciones disponibles">
            {allowEmpty && (
              <button
                type="button"
                className="combo__option"
                role="option"
                aria-selected={!value}
                onClick={() => select('')}
              >
                {clearLabel}
              </button>
            )}
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                className={`combo__option ${option === value ? 'combo__option--selected' : ''}`.trim()}
                role="option"
                aria-selected={option === value}
                onClick={() => select(option)}
              >
                {option}
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="combo__empty">No se encontraron coincidencias.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
