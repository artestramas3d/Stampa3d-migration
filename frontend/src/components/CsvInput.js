import { useState, useEffect, useRef } from 'react';
import { Input } from './ui/input';

/**
 * Input per liste separate da virgola.
 * Mantiene lo stato locale come stringa raw (permette di digitare virgole,
 * spazi, valori temporanei) e converte in array solo su blur.
 *
 * Props:
 *  - value: string[] — array corrente
 *  - onChange: (arr: string[]) => void — chiamato solo su blur
 *  - ...rest — passati all'<Input>
 */
export function CsvInput({ value, onChange, ...rest }) {
  const [raw, setRaw] = useState((value || []).join(', '));
  const dirty = useRef(false);

  // Sincronizza dall'esterno SOLO se l'utente non sta editando
  useEffect(() => {
    if (!dirty.current) {
      setRaw((value || []).join(', '));
    }
  }, [value]);

  const commit = () => {
    dirty.current = false;
    const arr = raw.split(',').map(x => x.trim()).filter(Boolean);
    onChange?.(arr);
    // Normalizza la stringa visibile (rimuove spazi extra, virgole doppie)
    setRaw(arr.join(', '));
  };

  return (
    <Input
      {...rest}
      value={raw}
      onChange={(e) => { dirty.current = true; setRaw(e.target.value); }}
      onBlur={commit}
    />
  );
}
