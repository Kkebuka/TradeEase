import { useEffect, useMemo, useState } from 'react';
import { BoxIcon, LedgerIcon, ReceiptIcon } from '../components/Icons';
import { useModal } from '../components/Modal';
import NumericInput from '../components/NumericInput';
import { useToast } from '../components/Toast';
import { fetchDollarRate } from '../utils/currency';
import { formatDate, formatNaira } from '../utils/helpers';
import { getDebtors, getInvoices, getSessions, saveUser } from '../utils/storage';

function RateBanner({ rateInfo, onTap }) {
  if (!rateInfo?.rate) {
    return (
      <button className="card rate-card surface-glow" onClick={onTap}>
        <div className="rate-left">
          <span className="rate-dot warn" />
          <strong style={{ color: 'var(--accent-amber)' }}>No rate available</strong>
        </div>
        <small style={{ color: 'var(--accent-amber)' }}>OFFLINE</small>
      </button>
    );
  }

  const isLive = rateInfo.source === 'live';

  return (
    <button className="card rate-card surface-glow" onClick={onTap}>
      <div className="rate-left">
        <span className={`rate-dot ${isLive ? '' : 'warn'}`} />
        <strong style={{ color: isLive ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
          $1 = {formatNaira(rateInfo.rate)}
        </strong>
      </div>
      <small style={{ color: isLive ? 'var(--accent-green)' : 'var(--accent-amber)', fontWeight: 600 }}>
        {isLive ? 'LIVE RATE' : `UPDATED ${formatDate(rateInfo.date)}`}
      </small>
    </button>
  );
}

export default function Home({ user, onNavigate, onUserChange }) {
  const [rateInfo, setRateInfo] = useState({ rate: null, source: 'offline', date: null });
  const [activeTab, setActiveTab] = useState('recent');
  const { openModal, closeModal } = useModal();
  const { showToast } = useToast();

  useEffect(() => {
    fetchDollarRate().then(setRateInfo);
  }, []);

  const debtors = getDebtors();
  const debtTotal = debtors.reduce((sum, debtor) => {
    const totalDebt = debtor.debts.reduce((acc, row) => acc + Number(row.amount), 0);
    const totalPaid = debtor.payments.reduce((acc, row) => acc + Number(row.amount), 0);
    return sum + (totalDebt - totalPaid);
  }, 0);

  const combinedHistory = useMemo(() => {
    const sessionEvents = getSessions().map((session) => {
      const totalAmount = session.items?.reduce((sum, item) => sum + (item.result?.totalCartonCost || 0), 0) || 0;
      return {
        id: session.id,
        type: 'calculation',
        date: new Date(session.createdAt),
        title: session.name || 'Import Calculation',
        amount: totalAmount,
        meta: `${session.items?.length || 0} product${session.items?.length === 1 ? '' : 's'} · Rate: ₦${session.constants?.dollarRate || '0'}`
      };
    });
    const invoiceEvents = getInvoices().map((invoice) => ({
      id: invoice.id,
      type: 'invoice',
      date: new Date(invoice.createdAt),
      title: invoice.customerName || 'Unnamed Customer',
      amount: invoice.grandTotal,
      meta: invoice.invoiceNumber
    }));
    return [...sessionEvents, ...invoiceEvents]
      .sort((a, b) => b.date - a.date);
  }, [debtTotal]);

  const openRateInfo = () => {
    let manualRate = rateInfo.rate || '';
    openModal(({ closeModal: close }) => (
      <div className="stack">
        <h3>Dollar Rate Source</h3>
        <p className="muted">Source: {rateInfo.source} {rateInfo.date ? `· ${formatDate(rateInfo.date)}` : ''}</p>
        <div className="field">
          <label className="field-label">Manual override for this session</label>
          <NumericInput value={manualRate} allowDecimal onValueChange={(value) => { manualRate = value; }} />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            setRateInfo((prev) => ({ ...prev, rate: Number(manualRate) || prev.rate, source: 'cached' }));
            showToast('Rate updated for this session ✓');
            close();
          }}
        >
          Apply
        </button>
        <button className="btn btn-secondary" onClick={close}>Cancel</button>
      </div>
    ));
  };

  const openSettings = () => {
    let nextName = user.name;
    openModal(() => (
      <div className="stack">
        <h3>Profile Settings</h3>
        <div className="field">
          <label className="field-label">Your name</label>
          <input className="field-input" defaultValue={user.name} onChange={(e) => { nextName = e.target.value; }} />
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            const payload = { ...user, name: nextName.trim() || user.name };
            saveUser(payload);
            onUserChange(payload);
            showToast('Name updated ✓');
            closeModal();
          }}
        >
          Save
        </button>
        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
      </div>
    ));
  };

  return (
    <main className="stack page-anim-enter home-stack">
      <header className="page-header">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h1 className="brand brand-wordmark">
            Trade<span className="accent">Ease</span>
          </h1>
          <small className="muted">Welcome back, {user.name}</small>
        </div>
        <button className="avatar" onClick={openSettings} aria-label="Settings">{user.name.charAt(0).toUpperCase()}</button>
      </header>

      <RateBanner rateInfo={rateInfo} onTap={openRateInfo} />

      <button className="card tile feature-card green surface-glow" onClick={() => onNavigate('converter')}>
        <span className="icon-chip"><BoxIcon /></span>
        <div className="grow">
          <div className="title">Import Calculator</div>
          <small className="subtitle">Calculate landed cost from China</small>
        </div>
      </button>

      <button className="card tile feature-card blue surface-glow" onClick={() => onNavigate('invoice')}>
        <span className="icon-chip"><ReceiptIcon /></span>
        <div className="grow">
          <div className="title">Invoice Generator</div>
          <small className="subtitle">Create & share PDF receipts</small>
        </div>
      </button>

      <button className="card tile feature-card amber surface-glow" onClick={() => onNavigate('ledger')}>
        <span className="icon-chip"><LedgerIcon /></span>
        <div className="grow">
          <div className="row-between">
            <div className="title">Oni Gbese</div>
            {debtTotal > 0 ? <span className="badge" style={{ color: 'var(--accent-red)', borderColor: 'var(--accent-red)' }}>{formatNaira(debtTotal)} owed</span> : null}
          </div>
          <small className="subtitle">Track who owes you money</small>
        </div>
      </button>

      <section className="history-tabs-container">
        <div className="history-header">
          <h3>Activity Feed</h3>
          <div className="history-tabs">
            <button
              className={`history-tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveTab('recent')}
            >
              Recent
            </button>
            <button
              className={`history-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              History
            </button>
          </div>
        </div>
        
        <div className="history-list">
          {(() => {
            const list = activeTab === 'recent' ? combinedHistory.slice(0, 3) : combinedHistory;
            if (!list.length) {
              return <small className="muted" style={{ display: 'block', padding: '20px 0', textAlign: 'center' }}>No activity yet.</small>;
            }
            return list.map((item) => (
              <button
                key={item.id}
                className="history-item-card surface-glow"
                onClick={() => {
                  if (item.type === 'calculation') {
                    onNavigate(`converter?edit=${item.id}`);
                  } else {
                    onNavigate(`invoice?edit=${item.id}`);
                  }
                }}
              >
                <span className={`history-icon-wrapper ${item.type}`}>
                  {item.type === 'calculation' ? <BoxIcon /> : <ReceiptIcon />}
                </span>
                <div className="history-item-info">
                  <div className="row-between">
                    <strong className="history-item-title">{item.title}</strong>
                    <strong className="history-item-amount">{formatNaira(item.amount)}</strong>
                  </div>
                  <div className="row-between" style={{ marginTop: 2 }}>
                    <small className="muted">{item.meta}</small>
                    <small className="muted">{formatDate(item.date.toISOString())}</small>
                  </div>
                </div>
              </button>
            ));
          })()}
        </div>
      </section>
    </main>
  );
}
