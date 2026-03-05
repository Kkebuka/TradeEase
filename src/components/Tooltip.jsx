import { useEffect, useRef, useState } from 'react';

export default function Tooltip({ text }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  return (
    <span ref={wrapperRef} style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          border: '1px solid var(--border)',
          background: 'var(--bg-surface2)',
          color: 'var(--text-secondary)'
        }}
      >
        i
      </button>
      {open ? (
        <span
          style={{
            position: 'absolute',
            zIndex: 9,
            top: 26,
            right: 0,
            width: 220,
            background: 'var(--bg-surface2)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 10,
            color: 'var(--text-secondary)',
            fontSize: 13,
            boxShadow: 'var(--shadow)'
          }}
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
