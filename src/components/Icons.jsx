function BaseIcon({ children, className = '', strokeWidth = 2 }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function HomeIcon({ className = '' }) {
  return (
    <BaseIcon className={className}>
      <path d="M3 10.5L12 3l9 7.5" />
      <path d="M5.5 9.8V21h13V9.8" />
      <path d="M9.5 21v-6h5v6" />
    </BaseIcon>
  );
}

export function BoxIcon({ className = '' }) {
  return (
    <BaseIcon className={className}>
      <path d="M12 3l8 4.5-8 4.5-8-4.5L12 3z" />
      <path d="M4 7.5V16.5L12 21l8-4.5V7.5" />
      <path d="M12 12v9" />
    </BaseIcon>
  );
}

export function ReceiptIcon({ className = '' }) {
  return (
    <BaseIcon className={className}>
      <path d="M7 3h10v18l-2.5-1.8L12 21l-2.5-1.8L7 21V3z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </BaseIcon>
  );
}

export function LedgerIcon({ className = '' }) {
  return (
    <BaseIcon className={className}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M9 11h6M9 15h6" />
      <path d="M5 7h2M5 11h2M5 15h2" />
    </BaseIcon>
  );
}

export function CalculatorIcon({ className = '' }) {
  return (
    <BaseIcon className={className}>
      <rect x="6" y="3" width="12" height="18" rx="2" />
      <path d="M9 7h6" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="9" cy="16" r="1" />
      <circle cx="12" cy="16" r="1" />
      <circle cx="15" cy="16" r="1" />
    </BaseIcon>
  );
}

export function TrashIcon({ className = '' }) {
  return (
    <BaseIcon className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M7 7l1 13h8l1-13" />
      <path d="M10 11v6M14 11v6" />
    </BaseIcon>
  );
}

export function EditIcon({ className = '' }) {
  return (
    <BaseIcon className={className}>
      <path d="M4 20h4l10-10-4-4L4 16v4z" />
      <path d="M12 6l4 4" />
    </BaseIcon>
  );
}
