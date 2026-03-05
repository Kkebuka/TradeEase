import { useMemo, useState } from 'react';
import BackButton from '../components/BackButton';
import { TrashIcon } from '../components/Icons';
import { useModal } from '../components/Modal';
import NumericInput from '../components/NumericInput';
import { useToast } from '../components/Toast';
import { exportInvoiceDetailedPdf, exportInvoicePdf } from '../utils/pdf';
import { formatDate, formatNaira, generateId } from '../utils/helpers';
import {
  createInvoiceSkeleton,
  deleteInvoice,
  getBusinessProfile,
  getInvoices,
  saveBusinessProfile,
  saveInvoice
} from '../utils/storage';

function normalizeItems(items) {
  return items.map((item) => ({
    ...item,
    unitPrice: Number(item.unitPrice) || 0,
    quantity: Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0,
    subtotal: (Number(item.unitPrice) || 0) * (Number.isFinite(Number(item.quantity)) ? Number(item.quantity) : 0)
  }));
}

function ReceiptPaper({ invoice, business }) {
  return (
    <section className="receipt-paper">
      <h3 className="receipt-business">{(business?.name || 'OUR STORE').toUpperCase()}</h3>
      <p className="receipt-sub receipt-center">{business?.phone || ''} {business?.address ? `| ${business.address}` : ''}</p>
      <hr className="receipt-rule" />

      <div className="receipt-meta-grid">
        <strong>INVOICE</strong>
        <strong>{invoice.invoiceNumber}</strong>
        <span>Date:</span>
        <span>{formatDate(invoice.createdAt)}</span>
        <span>Customer:</span>
        <span>{invoice.customerName || '-'}</span>
      </div>

      <hr className="receipt-rule" />

      <div className="receipt-table-head">
        <strong>Item</strong>
        <strong>Qty</strong>
        <strong>Price</strong>
        <strong>Total</strong>
      </div>
      {invoice.items.map((row) => (
        <div className="receipt-table-row" key={row.id}>
          <span>{row.name}</span>
          <span>{row.quantity}</span>
          <span>{formatNaira(row.unitPrice)}</span>
          <strong>{formatNaira(row.subtotal)}</strong>
        </div>
      ))}
      <div className="receipt-table-foot">
        <strong />
        <strong />
        <strong>TOTAL</strong>
        <strong>{formatNaira(invoice.grandTotal)}</strong>
      </div>

      <small className="receipt-source">
        Generated with Trade<span className="receipt-ease">Ease</span>
      </small>
    </section>
  );
}

export default function Invoice({ onNavigate }) {
  const [business, setBusiness] = useState(getBusinessProfile());
  const [invoice, setInvoice] = useState(createInvoiceSkeleton());
  const [mode, setMode] = useState('form');
  const [history, setHistory] = useState(getInvoices());
  const [activeInvoice, setActiveInvoice] = useState(null);
  const [errors, setErrors] = useState({});
  const { showToast } = useToast();
  const { openModal } = useModal();

  const clearError = (key) => {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const totals = useMemo(() => {
    const normalized = normalizeItems(invoice.items);
    const subtotal = normalized.reduce((sum, row) => sum + row.subtotal, 0);
    return { items: normalized, subtotal, grandTotal: subtotal };
  }, [invoice.items]);

  const saveBusiness = (event) => {
    event.preventDefault();
    const payload = {
      name: event.target.name.value.trim(),
      phone: event.target.phone.value.trim(),
      address: event.target.address.value.trim()
    };
    if (!payload.name) return;
    saveBusinessProfile(payload);
    setBusiness(payload);
    showToast('Business profile saved ✓');
  };

  const validateForm = () => {
    const next = {};
    if (!invoice.customerName.trim()) next.customerName = 'Customer name is required';
    totals.items.forEach((item, index) => {
      if (!item.name.trim()) next[`name_${index}`] = 'Item name required';
      if (item.unitPrice <= 0) next[`unit_${index}`] = 'Unit price required';
      if (item.quantity <= 0) next[`qty_${index}`] = 'Quantity required';
    });
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const persistInvoice = () => {
    const payload = { ...invoice, items: totals.items, grandTotal: totals.grandTotal };
    saveInvoice(payload);
    setHistory(getInvoices());
    return payload;
  };

  const sharePdf = (row) => {
    exportInvoicePdf(row, business);
    const message = `Invoice ${row.invoiceNumber} for ${row.customerName} · ${formatNaira(row.grandTotal)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const openDelete = (id) => {
    openModal(({ closeModal }) => (
      <div className="stack">
        <h3>Delete invoice?</h3>
        <button
          className="btn btn-danger"
          onClick={() => {
            deleteInvoice(id);
            setHistory(getInvoices());
            showToast('Invoice deleted', 'warning');
            closeModal();
          }}
        >
          Delete
        </button>
        <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
      </div>
    ));
  };

  if (!business) {
    return (
      <main className="stack page-anim-enter">
        <header className="page-header">
          <div className="row"><BackButton onClick={() => onNavigate('home')} /><h2 className="page-title">Invoice Generator</h2></div>
        </header>
        <form className="card stack" onSubmit={saveBusiness}>
          <h3>Business Profile Setup</h3>
          <div className="field"><label className="field-label">Business Name</label><input className="field-input" name="name" required /></div>
          <div className="field"><label className="field-label">Business Phone</label><input className="field-input" name="phone" /></div>
          <div className="field"><label className="field-label">Business Address</label><input className="field-input" name="address" /></div>
          <button className="btn btn-primary" type="submit">Save & Continue</button>
        </form>
      </main>
    );
  }

  return (
    <main className="stack page-anim-enter">
      <header className="page-header">
        <div className="row"><BackButton onClick={() => onNavigate('home')} /><h2 className="page-title">Invoice Generator</h2></div>
        <div className="row">
          <button className="btn btn-secondary" style={{ width: 'auto', minHeight: 40, padding: '8px 12px' }} onClick={() => setMode('history')}>History</button>
        </div>
      </header>

      {mode === 'form' ? (
        <section className="card stack">
          <div className="row" style={{ flexWrap: 'wrap' }}>
            <span className="badge live">{invoice.invoiceNumber}</span>
            <span className="badge offline">{formatDate(new Date().toISOString())}</span>
          </div>

          <div className="field">
            <label className="field-label">Customer Name</label>
            <input
              className="field-input"
              value={invoice.customerName}
              onChange={(e) => {
                clearError('customerName');
                setInvoice((prev) => ({ ...prev, customerName: e.target.value }));
              }}
            />
            {errors.customerName ? <small className="error">{errors.customerName}</small> : null}
          </div>

          <h3>Line Items</h3>
          {invoice.items.map((item, index) => (
            <div className="card stack" key={item.id} style={{ padding: 14 }}>
              <div className="field">
                <label className="field-label">Item Name</label>
                <input
                  className="field-input"
                  value={item.name}
                  onChange={(e) => {
                    clearError(`name_${index}`);
                    setInvoice((prev) => ({
                      ...prev,
                      items: prev.items.map((row, i) => (i === index ? { ...row, name: e.target.value } : row))
                    }));
                  }}
                />
                {errors[`name_${index}`] ? <small className="error">{errors[`name_${index}`]}</small> : null}
              </div>
              <div className="row" style={{ alignItems: 'flex-end' }}>
                <div className="field" style={{ flex: 1 }}>
                  <label className="field-label">Unit Price (₦)</label>
                  <NumericInput
                    value={item.unitPrice}
                    allowDecimal
                    onValueChange={(value) => {
                      clearError(`unit_${index}`);
                      setInvoice((prev) => ({
                        ...prev,
                        items: prev.items.map((row, i) => (i === index ? { ...row, unitPrice: value } : row))
                      }));
                    }}
                  />
                  {errors[`unit_${index}`] ? <small className="error">{errors[`unit_${index}`]}</small> : null}
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label className="field-label">Quantity</label>
                  <NumericInput
                    value={item.quantity}
                    onValueChange={(value) => {
                      clearError(`qty_${index}`);
                      setInvoice((prev) => ({
                        ...prev,
                        items: prev.items.map((row, i) => (i === index ? { ...row, quantity: value } : row))
                      }));
                    }}
                  />
                  {errors[`qty_${index}`] ? <small className="error">{errors[`qty_${index}`]}</small> : null}
                </div>
                {invoice.items.length > 1 ? (
                  <button
                    className="icon-action danger"
                    aria-label="Delete row"
                    onClick={() => setInvoice((prev) => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }))}
                  >
                    <TrashIcon className="action-icon" />
                  </button>
                ) : null}
              </div>
              <div className="row-between">
                <small className="muted">Subtotal</small>
                <strong>{formatNaira((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))}</strong>
              </div>
            </div>
          ))}

          <button
            className="btn btn-secondary"
            onClick={() => {
              if (invoice.items.length >= 20) {
                showToast('Maximum 20 line items', 'warning');
                return;
              }
              setInvoice((prev) => ({
                ...prev,
                items: [...prev.items, { id: generateId('line'), name: '', unitPrice: '', quantity: 1, subtotal: 0 }]
              }));
            }}
          >
            + Add Item
          </button>

          <section className="card" style={{ padding: 14 }}>
            <div className="row-between"><span>Subtotal</span><strong>{formatNaira(totals.subtotal)}</strong></div>
            <div className="row-between"><span>Grand Total</span><strong style={{ color: 'var(--accent-green)', fontSize: 22 }}>{formatNaira(totals.grandTotal)}</strong></div>
          </section>

          <button className="btn btn-primary" onClick={() => validateForm() && setMode('preview')}>Preview Invoice</button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              if (!validateForm()) return;
              persistInvoice();
              showToast('Draft saved ✓');
              setMode('history');
            }}
          >
            Save as Draft
          </button>
        </section>
      ) : null}

      {mode === 'preview' ? (
        <section className="card stack">
          <ReceiptPaper invoice={{ ...invoice, items: totals.items, grandTotal: totals.grandTotal }} business={business} />

          <button
            className="btn btn-whatsapp"
            onClick={() => sharePdf({ ...invoice, items: totals.items, grandTotal: totals.grandTotal })}
          >
            Share Receipt PDF
          </button>
          <button className="btn btn-secondary" onClick={() => exportInvoicePdf({ ...invoice, items: totals.items, grandTotal: totals.grandTotal }, business)}>Download POS PDF</button>
          <button className="btn btn-secondary" onClick={() => exportInvoiceDetailedPdf({ ...invoice, items: totals.items, grandTotal: totals.grandTotal }, business)}>Download Detailed PDF</button>
          <button className="btn btn-secondary" onClick={() => setMode('form')}>Edit Invoice</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              persistInvoice();
              showToast('Invoice saved ✓');
              setInvoice(createInvoiceSkeleton());
              setMode('history');
            }}
          >
            Save & Done
          </button>
        </section>
      ) : null}

      {mode === 'history' ? (
        <section className="card stack">
          <div className="row-between"><h3>Invoice History</h3><button className="btn btn-secondary" style={{ width: 'auto', minHeight: 40, padding: '8px 12px' }} onClick={() => setMode('form')}>New Invoice</button></div>
          {history.length ? history.map((row) => (
            <button
              className="card"
              style={{ textAlign: 'left' }}
              key={row.id}
              onClick={() => {
                setActiveInvoice(row);
                setMode('detail');
              }}
            >
              <div className="row-between">
                <strong className="history-name">{row.customerName || 'Unnamed Customer'}</strong>
                <div className="inline-tools">
                  <strong style={{ color: 'var(--accent-green)' }}>{formatNaira(row.grandTotal)}</strong>
                  <button
                    className="icon-action danger"
                    aria-label="Delete invoice"
                    onClick={(e) => {
                      e.stopPropagation();
                      openDelete(row.id);
                    }}
                  >
                    <TrashIcon className="action-icon" />
                  </button>
                </div>
              </div>
              <small className="history-meta">{row.invoiceNumber} · {formatDate(row.createdAt)} · <span className="badge">Saved</span></small>
            </button>
          )) : (
            <div className="card stack"><h3>No invoices yet.</h3><small className="muted">Create your first one!</small><button className="btn btn-primary" onClick={() => setMode('form')}>Create Invoice</button></div>
          )}
        </section>
      ) : null}

      {mode === 'detail' && activeInvoice ? (
        <section className="card stack">
          <ReceiptPaper invoice={activeInvoice} business={business} />
          <button className="btn btn-whatsapp" onClick={() => sharePdf(activeInvoice)}>Share Receipt PDF</button>
          <button className="btn btn-secondary" onClick={() => exportInvoicePdf(activeInvoice, business)}>Download POS PDF</button>
          <button className="btn btn-secondary" onClick={() => exportInvoiceDetailedPdf(activeInvoice, business)}>Download Detailed PDF</button>
          <button className="btn btn-secondary" onClick={() => setMode('history')}>Back to History</button>
        </section>
      ) : null}
    </main>
  );
}
