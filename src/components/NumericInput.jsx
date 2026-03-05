import { useEffect, useState } from 'react';

function sanitizeNumber(value, allowDecimal) {
  if (value === undefined || value === null) return '';
  const source = String(value);
  let clean = source.replace(/[^\d.]/g, '');
  if (!allowDecimal) {
    clean = clean.replace(/\./g, '');
  } else {
    const [integer, ...rest] = clean.split('.');
    clean = rest.length ? `${integer}.${rest.join('')}` : integer;
  }
  return clean;
}

function withCommas(raw) {
  if (!raw) return '';
  const [integer, fraction] = raw.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction !== undefined ? `${grouped}.${fraction}` : grouped;
}

export default function NumericInput({
  value,
  onValueChange,
  allowDecimal = false,
  className = 'field-input',
  placeholder = '',
  disabled = false,
  inputMode,
  min,
  name
}) {
  const [display, setDisplay] = useState(withCommas(sanitizeNumber(value, allowDecimal)));

  useEffect(() => {
    const normalized = sanitizeNumber(value, allowDecimal);
    setDisplay(withCommas(normalized));
  }, [allowDecimal, value]);

  return (
    <input
      className={className}
      type="text"
      inputMode={inputMode || (allowDecimal ? 'decimal' : 'numeric')}
      placeholder={placeholder}
      value={display}
      disabled={disabled}
      min={min}
      name={name}
      onChange={(event) => {
        const raw = sanitizeNumber(event.target.value, allowDecimal);
        setDisplay(withCommas(raw));
        if (onValueChange) onValueChange(raw);
      }}
    />
  );
}
