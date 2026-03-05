import { generateId } from './helpers';

export const KEYS = {
  user: 'tradeease_user',
  rate: 'tradeease_dollar_rate',
  sessions: 'tradeease_sessions',
  business: 'tradeease_business',
  invoices: 'tradeease_invoices',
  invoiceCounter: 'tradeease_invoice_counter',
  debtors: 'tradeease_debtors'
};

export function getItem(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeItem(key) {
  localStorage.removeItem(key);
}

export function getUser() {
  return getItem(KEYS.user, null);
}

export function saveUser(payload) {
  setItem(KEYS.user, payload);
  return payload;
}

export function getSessions() {
  return getItem(KEYS.sessions, []);
}

export function saveSession(session) {
  const sessions = getSessions();
  const index = sessions.findIndex((row) => row.id === session.id);
  if (index >= 0) sessions[index] = session;
  else sessions.unshift(session);
  setItem(KEYS.sessions, sessions);
}

export function getBusinessProfile() {
  return getItem(KEYS.business, null);
}

export function saveBusinessProfile(profile) {
  setItem(KEYS.business, profile);
}

export function getInvoices() {
  return getItem(KEYS.invoices, []);
}

export function getNextInvoiceNumber() {
  const current = Number(localStorage.getItem(KEYS.invoiceCounter) || '0');
  const safeCurrent = Number.isFinite(current) && current >= 0 ? current : 0;
  const next = safeCurrent + 1;
  localStorage.setItem(KEYS.invoiceCounter, String(next));
  return `INV-${String(next).padStart(4, '0')}`;
}

export function saveInvoice(invoice) {
  const invoices = getInvoices();
  const idx = invoices.findIndex((row) => row.id === invoice.id);
  if (idx >= 0) invoices[idx] = invoice;
  else invoices.unshift(invoice);
  setItem(KEYS.invoices, invoices);
}

export function deleteInvoice(id) {
  const invoices = getInvoices().filter((invoice) => invoice.id !== id);
  setItem(KEYS.invoices, invoices);
}

export function getDebtors() {
  return getItem(KEYS.debtors, []);
}

export function saveDebtors(debtors) {
  setItem(KEYS.debtors, debtors);
}

export function createSessionSkeleton(name = '') {
  return {
    id: generateId('sess'),
    name: name?.trim() || `Shipment · ${new Date().toLocaleDateString('en-NG')}`,
    createdAt: new Date().toISOString(),
    constants: {
      dollarRate: '',
      freightUSD: '',
      clearingNGN: '',
      containerCBM: ''
    },
    items: []
  };
}

export function createInvoiceSkeleton() {
  return {
    id: generateId('inv'),
    invoiceNumber: getNextInvoiceNumber(),
    createdAt: new Date().toISOString(),
    customerName: '',
    items: [{ id: generateId('line'), name: '', unitPrice: '', quantity: 1, subtotal: 0 }],
    grandTotal: 0,
    status: 'Saved'
  };
}
