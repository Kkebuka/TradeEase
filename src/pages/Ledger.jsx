import { useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import { useModal } from '../components/Modal';
import NumericInput from '../components/NumericInput';
import { useToast } from '../components/Toast';
import { formatDate, formatNaira, formatShortDate, generateId } from '../utils/helpers';
import { getBusinessProfile, getDebtors, saveDebtors } from '../utils/storage';

function getDebtorSummary(debtor) {
  const totalDebt = debtor.debts.reduce((sum, d) => sum + Number(d.amount), 0);
  const totalPaid = debtor.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const outstanding = totalDebt - totalPaid;
  const percentPaid = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0;
  return { totalDebt, totalPaid, outstanding, percentPaid };
}

function getTimestampFromId(id = '') {
  const match = String(id).match(/_(\d{10,})_/);
  return match ? Number(match[1]) : 0;
}

function getEntryOrder(entry) {
  const created = new Date(entry.createdAt || '').getTime();
  if (Number.isFinite(created) && created > 0) return created;
  const fromId = getTimestampFromId(entry.id);
  if (fromId > 0) return fromId;
  const fromDate = new Date(entry.date || '').getTime();
  return Number.isFinite(fromDate) ? fromDate : 0;
}

function timelineForDebtor(debtor) {
  const debtEntries = debtor.debts.map((entry) => ({
    id: entry.id,
    date: entry.date,
    createdAt: entry.createdAt,
    amount: entry.amount,
    type: entry.isInitial ? 'debt-initial' : 'debt-more',
    text: `${entry.isInitial ? 'Debt added' : 'More goods'} · ${formatShortDate(entry.date)} · +${formatNaira(entry.amount)}${entry.description ? ` — ${entry.description}` : ''}`
  }));

  const paymentEntries = debtor.payments.map((entry) => ({
    id: entry.id,
    date: entry.date,
    createdAt: entry.createdAt,
    amount: entry.amount,
    type: 'payment',
    text: `Payment received · ${formatShortDate(entry.date)} · ${formatNaira(entry.amount)}${entry.note ? ` — ${entry.note}` : ''}`
  }));

  // Oldest -> newest, with same-day events ordered by creation sequence.
  return [...debtEntries, ...paymentEntries].sort((a, b) => {
    const dateA = new Date(a.date || '').getTime();
    const dateB = new Date(b.date || '').getTime();
    if (dateA !== dateB) return dateA - dateB;
    return getEntryOrder(a) - getEntryOrder(b);
  });
}

export default function Ledger({ onNavigate }) {
  const [debtors, setDebtors] = useState(getDebtors());
  const [sortBy, setSortBy] = useState('highest');
  const [activeDebtorId, setActiveDebtorId] = useState(null);
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const { showToast } = useToast();
  const { openModal } = useModal();

  const activeDebtor = debtors.find((debtor) => debtor.id === activeDebtorId) || null;

  const sortedDebtors = useMemo(() => {
    const copy = [...debtors];
    if (sortBy === 'recent') {
      return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    if (sortBy === 'name') {
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    }
    return copy.sort((a, b) => getDebtorSummary(b).outstanding - getDebtorSummary(a).outstanding);
  }, [debtors, sortBy]);

  const totalOutstanding = debtors.reduce((sum, debtor) => sum + getDebtorSummary(debtor).outstanding, 0);

  const persist = (nextDebtors) => {
    setDebtors(nextDebtors);
    saveDebtors(nextDebtors);
  };

  const addDebtor = () => {
    openModal(({ closeModal }) => {
      let payload = {
        name: '',
        amount: '',
        description: '',
        date: new Date().toISOString().slice(0, 10)
      };

      return (
        <div className="stack">
          <h3>Add Debtor</h3>
          <div className="field"><label className="field-label">Name</label><input className="field-input" onChange={(e) => { payload.name = e.target.value; }} /></div>
          <div className="field"><label className="field-label">Original Amount Owed (₦)</label><NumericInput value={payload.amount} onValueChange={(value) => { payload.amount = value; }} /></div>
          <div className="field"><label className="field-label">What is this debt for?</label><input className="field-input" onChange={(e) => { payload.description = e.target.value; }} /></div>
          <div className="field"><label className="field-label">Date debt started</label><input className="field-input" type="date" defaultValue={payload.date} onChange={(e) => { payload.date = e.target.value; }} /></div>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!payload.name.trim() || Number(payload.amount) <= 0) {
                showToast('Fill required debtor fields', 'error');
                return;
              }
              const next = {
                id: generateId('debt'),
                name: payload.name.trim(),
                createdAt: new Date().toISOString(),
                isPaid: false,
                debts: [{ id: generateId('dbt'), amount: Number(payload.amount), description: payload.description, date: new Date(payload.date).toISOString(), isInitial: true, createdAt: new Date().toISOString() }],
                payments: []
              };
              const nextDebtors = [next, ...debtors];
              persist(nextDebtors);
              showToast(`${next.name} added to ledger ✓`);
              closeModal();
            }}
          >
            Add to Ledger
          </button>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
        </div>
      );
    });
  };

  const recordPayment = (debtor) => {
    openModal(({ closeModal }) => {
      const summary = getDebtorSummary(debtor);
      let payload = { amount: '', date: new Date().toISOString().slice(0, 10), note: '' };

      return (
        <div className="stack">
          <h3>Record Payment</h3>
          <div className="field"><label className="field-label">Amount Paid (₦)</label><NumericInput value={payload.amount} onValueChange={(value) => { payload.amount = value; }} /></div>
          <div className="field"><label className="field-label">Date</label><input className="field-input" type="date" defaultValue={payload.date} onChange={(e) => { payload.date = e.target.value; }} /></div>
          <div className="field"><label className="field-label">Note</label><input className="field-input" onChange={(e) => { payload.note = e.target.value; }} /></div>
          <button
            className="btn btn-primary"
            onClick={() => {
              const amount = Number(payload.amount);
              if (amount <= 0) {
                showToast('Enter a valid payment amount', 'error');
                return;
              }
              if (amount > summary.outstanding) {
                showToast(`Payment exceeds outstanding balance of ${formatNaira(summary.outstanding)}`, 'error');
                return;
              }
              const nextDebtors = debtors.map((row) => {
                if (row.id !== debtor.id) return row;
                const nextRow = {
                  ...row,
                  payments: [...row.payments, { id: generateId('pay'), amount, date: new Date(payload.date).toISOString(), note: payload.note, createdAt: new Date().toISOString() }]
                };
                return { ...nextRow, isPaid: getDebtorSummary(nextRow).outstanding <= 0 };
              });
              persist(nextDebtors);
              showToast('Payment recorded ✓');
              closeModal();
            }}
          >
            Save Payment
          </button>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
        </div>
      );
    });
  };

  const addMoreDebt = (debtor) => {
    openModal(({ closeModal }) => {
      let payload = { amount: '', description: '', date: new Date().toISOString().slice(0, 10) };
      return (
        <div className="stack">
          <h3>Add More Debt</h3>
          <div className="field"><label className="field-label">New Amount to Add (₦)</label><NumericInput value={payload.amount} onValueChange={(value) => { payload.amount = value; }} /></div>
          <div className="field"><label className="field-label">What is this for?</label><input className="field-input" onChange={(e) => { payload.description = e.target.value; }} /></div>
          <div className="field"><label className="field-label">Date</label><input className="field-input" type="date" defaultValue={payload.date} onChange={(e) => { payload.date = e.target.value; }} /></div>
          <button
            className="btn btn-primary"
            onClick={() => {
              const amount = Number(payload.amount);
              if (amount <= 0) {
                showToast('Enter a valid debt amount', 'error');
                return;
              }
              const nextDebtors = debtors.map((row) => row.id === debtor.id ? {
                ...row,
                debts: [...row.debts, { id: generateId('dbt'), amount, description: payload.description, date: new Date(payload.date).toISOString(), isInitial: false, createdAt: new Date().toISOString() }],
                isPaid: false
              } : row);
              persist(nextDebtors);
              showToast(`${formatNaira(amount)} added to ${debtor.name}'s balance ✓`);
              closeModal();
            }}
          >
            Add to Debt
          </button>
          <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
        </div>
      );
    });
  };

  const sendWhatsAppStatement = (debtor) => {
    const summary = getDebtorSummary(debtor);
    const businessName = getBusinessProfile()?.name || 'Our Store';
    const today = formatDate(new Date().toISOString());
    const debtLines = debtor.debts
      .map((d) => `  • ${formatDate(d.date)}: +${formatNaira(d.amount)}${d.description ? ` (${d.description})` : ''}`)
      .join('\n');
    const paymentLines = debtor.payments.length
      ? debtor.payments.map((p) => `  • ${formatDate(p.date)}: -${formatNaira(p.amount)}${p.note ? ` (${p.note})` : ''}`).join('\n')
      : '  • No payments recorded yet';

    const message = `━━━━━━━━━━━━━━━━━━━━━━━━\n🏪 *${businessName.toUpperCase()}*\n📋 *ACCOUNT STATEMENT*\n📅 Date: ${today}\n━━━━━━━━━━━━━━━━━━━━━━━━\n\nDear _${debtor.name}_,\n\nPlease find your account summary below:\n\n_GOODS RECEIVED:_\n${debtLines}\n\n_PAYMENTS MADE:_\n${paymentLines}\n\n━━━━━━━━━━━━━━━━━━━━━━━━\nTotal Goods: _${formatNaira(summary.totalDebt)}_\nTotal Paid: _${formatNaira(summary.totalPaid)}_\n_BALANCE DUE: ${formatNaira(summary.outstanding)}_\n━━━━━━━━━━━━━━━━━━━━━━━━\n\nKindly settle your outstanding balance at your earliest convenience.\n\nThank you for your business! 🙏\n_Sent via TradeEase_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const markPaid = (debtor) => {
    openModal(({ closeModal }) => (
      <div className="stack">
        <h3>Mark {debtor.name} as fully paid?</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            const summary = getDebtorSummary(debtor);
            if (summary.outstanding <= 0) {
              showToast('This debtor is already fully paid', 'warning');
              closeModal();
              return;
            }
            const nextDebtors = debtors.map((row) => row.id === debtor.id ? {
              ...row,
              payments: [...row.payments, { id: generateId('pay'), amount: summary.outstanding, date: new Date().toISOString(), note: 'Marked as fully paid', createdAt: new Date().toISOString() }],
              isPaid: true
            } : row);
            persist(nextDebtors);
            showToast(`${debtor.name} marked as paid ✓`);
            closeModal();
          }}
        >
          Confirm
        </button>
        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
      </div>
    ));
  };

  const deleteDebtor = (debtorId) => {
    openModal(({ closeModal }) => (
      <div className="stack">
        <h3>Delete debtor permanently?</h3>
        <button
          className="btn btn-danger"
          onClick={() => {
            const nextDebtors = debtors.filter((row) => row.id !== debtorId);
            persist(nextDebtors);
            setActiveDebtorId(null);
            showToast('Debtor removed', 'warning');
            closeModal();
          }}
        >
          Delete Debtor
        </button>
        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
      </div>
    ));
  };

  if (!activeDebtor) {
    return (
      <main className="stack page-anim-enter">
        <header className="page-header">
          <div className="row"><BackButton onClick={() => onNavigate('home')} /><h2 className="page-title">Oni Gbese</h2></div>
        </header>

        <section className="card" style={{ borderColor: totalOutstanding ? 'rgba(255,92,92,0.3)' : 'rgba(0,200,150,0.35)' }}>
          <h3 style={{ color: totalOutstanding ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: '1.9rem' }}>{formatNaira(totalOutstanding)}</h3>
          <small className="muted">{totalOutstanding ? `Owed to you across ${debtors.length} people` : "You're all clear! No outstanding debts."}</small>
        </section>

        <section className="row" style={{ overflowX: 'auto' }}>
          <button className="btn btn-secondary" style={{ width: 'auto', minHeight: 40, padding: '8px 12px' }} onClick={() => setSortBy('highest')}>Highest Debt</button>
          <button className="btn btn-secondary" style={{ width: 'auto', minHeight: 40, padding: '8px 12px' }} onClick={() => setSortBy('recent')}>Most Recent</button>
          <button className="btn btn-secondary" style={{ width: 'auto', minHeight: 40, padding: '8px 12px' }} onClick={() => setSortBy('name')}>Name A-Z</button>
        </section>

        {sortedDebtors.length ? sortedDebtors.map((debtor) => {
          const summary = getDebtorSummary(debtor);
          return (
            <button key={debtor.id} className="card" style={{ textAlign: 'left' }} onClick={() => setActiveDebtorId(debtor.id)}>
              <div className="row-between"><strong>{debtor.name}</strong>{debtor.isPaid ? <span className="badge live">PAID</span> : <strong style={{ color: 'var(--accent-red)' }}>{formatNaira(summary.outstanding)}</strong>}</div>
              <small className="muted">{debtor.payments.length ? `Paid ${formatNaira(debtor.payments[debtor.payments.length - 1].amount)} · ${formatShortDate(debtor.payments[debtor.payments.length - 1].date)}` : 'No payment yet'}</small>
              <div className="progress" style={{ marginTop: 8 }}><span style={{ width: `${summary.percentPaid}%` }} /></div>
            </button>
          );
        }) : (
          <section className="card stack">
            <h3>No debtors recorded.</h3>
            <small className="muted">Add someone who owes you.</small>
            <button className="btn btn-primary" onClick={addDebtor}>Add Debtor</button>
          </section>
        )}

        <button className="fab" onClick={addDebtor}>+</button>
      </main>
    );
  }

  const summary = getDebtorSummary(activeDebtor);
  const timeline = timelineForDebtor(activeDebtor);
  const displayedTimeline = timelineExpanded ? timeline : timeline.slice(-5);

  return (
    <main className="stack page-anim-enter">
      <header className="page-header">
        <div className="row"><BackButton onClick={() => setActiveDebtorId(null)} /><h2 className="page-title">{activeDebtor.name}</h2></div>
        <button className="btn btn-danger" style={{ width: 'auto', minHeight: 40, padding: '8px 12px' }} onClick={() => deleteDebtor(activeDebtor.id)}>Delete</button>
      </header>

      <section className="card stack">
        <div className="row-between"><span>Total Debt</span><strong>{formatNaira(summary.totalDebt)}</strong></div>
        <div className="row-between"><span>Total Paid</span><strong>{formatNaira(summary.totalPaid)}</strong></div>
        <div className="row-between"><span>Outstanding</span><strong style={{ color: 'var(--accent-red)' }}>{formatNaira(summary.outstanding)}</strong></div>
        <div className="progress"><span style={{ width: `${summary.percentPaid}%` }} /></div>
        <small className="muted">{summary.percentPaid}% paid</small>
      </section>

      <section className="card stack">
        <div className="row-between">
          <h3>Timeline</h3>
          {timeline.length > 5 ? (
            <button
              className="btn btn-secondary"
              style={{ width: 'auto', minHeight: 36, padding: '6px 10px' }}
              onClick={() => setTimelineExpanded((prev) => !prev)}
            >
              {timelineExpanded ? 'Show Last 5' : `Show All (${timeline.length})`}
            </button>
          ) : null}
        </div>
        {displayedTimeline.map((item) => (
          <div key={item.id} className={`timeline-item ${item.type === 'payment' ? 'green' : item.type === 'debt-more' ? 'amber' : 'red'}`}>
            <small>{item.text}</small>
          </div>
        ))}
      </section>

      <button className="btn btn-primary" onClick={() => recordPayment(activeDebtor)}>Record Payment</button>
      <button className="btn btn-secondary" onClick={() => addMoreDebt(activeDebtor)}>Add More Debt</button>
      <button className="btn btn-whatsapp" onClick={() => sendWhatsAppStatement(activeDebtor)}>Send WhatsApp Statement</button>
      {!activeDebtor.isPaid ? <button className="btn btn-secondary" onClick={() => markPaid(activeDebtor)}>Mark as Fully Paid</button> : null}
    </main>
  );
}

export { getDebtorSummary };
