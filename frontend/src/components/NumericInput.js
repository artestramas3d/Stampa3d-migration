import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';

/**
 * Input numerico "amichevole" con virgola/punto decimale.
 * - Accetta sia "1,5" che "1.5" (converte virgola → punto)
 * - Permette stati intermedi ("", "1.", ".5") senza forzare il parseFloat
 * - Chiama onChange(number) SOLO con un numero valido (o 0 se vuoto)
 * - Compatible mobile (inputMode="decimal" attiva tastiera numerica)
 */
export function NumericInput({ value, onChange, step, className, placeholder, ...rest }) {
  // Stato locale: la stringa mostrata all'utente
  const [text, setText] = useState(() => value == null || value === 0 ? '' : String(value).replace('.', ','));
  const focusedRef = useRef(false);

  // Sync esterno → interno (solo quando non ho il focus, evita di sovrascrivere mentre digita)
  useEffect(() => {
    if (focusedRef.current) return;
    const external = value == null ? '' : String(value);
    // Normalizza per confronto: se rappresentano lo stesso numero, non toccare
    const currentNum = parseFloat(text.replace(',', '.'));
    if (!Number.isFinite(currentNum) || currentNum !== Number(value)) {
      setText(value == null || value === 0 || value === '' ? '' : String(value).replace('.', ','));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    let v = e.target.value;
    // Consenti solo cifre, virgola, punto, segno meno
    v = v.replace(/[^\d.,-]/g, '');
    // Un solo separatore decimale (mantieni il primo, elimina i successivi)
    const firstSep = v.search(/[.,]/);
    if (firstSep !== -1) {
      v = v.slice(0, firstSep + 1) + v.slice(firstSep + 1).replace(/[.,]/g, '');
    }
    setText(v);
    // Notifica il parent solo con un numero valido
    if (v === '' || v === '-') {
      onChange(0);
    } else {
      const num = parseFloat(v.replace(',', '.'));
      if (Number.isFinite(num)) onChange(num);
    }
  };

  const handleBlur = () => {
    focusedRef.current = false;
    // Al blur, normalizza: rimuovi separatore finale ("1," → "1")
    if (text.endsWith(',') || text.endsWith('.')) {
      setText(text.slice(0, -1));
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={text}
      onChange={handleChange}
      onFocus={() => { focusedRef.current = true; }}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      step={step}
      {...rest}
    />
  );
}
