import { forwardRef } from 'react';
import { Input } from './ui/input';
import { ChevronUp, ChevronDown } from 'lucide-react';

/**
 * Input number con frecce +/- custom sempre chiare/leggibili.
 * Nasconde le frecce native (via CSS globale in index.css) e mostra chevron SVG
 * cliccabili posizionati a destra dell'input.
 *
 * Props:
 *  - value: number
 *  - onChange: (num: number) => void   // riceve il numero già parsato
 *  - min, max, step (opzionali, default step=1)
 *  - className, placeholder, disabled, ...rest → passati all'<Input>
 *  - data-testid, id, name → passati all'<Input>
 */
export const NumberSpinner = forwardRef(function NumberSpinner(
  { value, onChange, min, max, step = 1, className = '', disabled = false, ...rest },
  ref
) {
  const parsedValue = value === '' || value === null || value === undefined ? '' : value;

  const clamp = (n) => {
    if (typeof min === 'number' && n < min) return min;
    if (typeof max === 'number' && n > max) return max;
    return n;
  };

  const handleChange = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange?.('');
      return;
    }
    const n = parseFloat(raw);
    if (isNaN(n)) return;
    onChange?.(n);
  };

  const bump = (dir) => {
    if (disabled) return;
    const current = typeof parsedValue === 'number' ? parsedValue : parseFloat(parsedValue) || 0;
    const next = clamp(Math.round((current + dir * step) * 1e9) / 1e9);
    onChange?.(next);
  };

  return (
    <div className={`relative inline-flex w-full items-center ${disabled ? 'opacity-60' : ''}`}>
      <Input
        ref={ref}
        type="number"
        value={parsedValue}
        onChange={handleChange}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`pr-6 ${className}`}
        {...rest}
      />
      <div className="absolute right-0.5 top-1/2 -translate-y-1/2 flex flex-col leading-none pointer-events-auto">
        <button
          type="button"
          tabIndex={-1}
          onClick={() => bump(1)}
          disabled={disabled || (typeof max === 'number' && (parseFloat(parsedValue) || 0) >= max)}
          className="h-3 w-4 flex items-center justify-center text-foreground/70 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Aumenta"
        >
          <ChevronUp className="w-3 h-3" strokeWidth={2.5} />
        </button>
        <button
          type="button"
          tabIndex={-1}
          onClick={() => bump(-1)}
          disabled={disabled || (typeof min === 'number' && (parseFloat(parsedValue) || 0) <= min)}
          className="h-3 w-4 flex items-center justify-center text-foreground/70 hover:text-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="Diminuisci"
        >
          <ChevronDown className="w-3 h-3" strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
});
