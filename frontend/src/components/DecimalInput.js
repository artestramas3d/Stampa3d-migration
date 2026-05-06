import { useState } from 'react';
import { Input } from './ui/input';

export function DecimalInput({ value, onChange, className, placeholder, ...props }) {
  const [localValue, setLocalValue] = useState(null);

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[0-9]*[.,]?[0-9]*$/.test(val)) {
      setLocalValue(val);
      const num = parseFloat(val.replace(',', '.'));
      if (!isNaN(num)) {
        onChange(num);
      } else if (val === '') {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    setLocalValue(null);
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={localValue !== null ? localValue : value}
      onChange={handleChange}
      onBlur={handleBlur}
      className={className}
      placeholder={placeholder}
      {...props}
    />
  );
}
