import { CalculatorIcon, HomeIcon, LedgerIcon, ReceiptIcon } from './Icons';

const ITEMS = [
  { key: 'home', icon: HomeIcon, label: 'Home' },
  { key: 'converter', icon: CalculatorIcon, label: 'Calculator' },
  { key: 'invoice', icon: ReceiptIcon, label: 'Invoice' },
  { key: 'ledger', icon: LedgerIcon, label: 'Ledger' }
];

export default function BottomNav({ route, onChange }) {
  return (
    <nav className="bottom-nav">
      {ITEMS.map((item) => (
        <button key={item.key} className={route === item.key ? 'active' : ''} onClick={() => onChange(item.key)}>
          <item.icon className="nav-icon" />
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
