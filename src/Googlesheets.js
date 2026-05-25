// ============================================================
//  googleSheets.js  —  GET-based connector (CORS-safe)
//  Google Apps Script blocks POST from localhost due to CORS.
//  We send ALL requests as GET with ?payload=<json> instead.
//  This triggers no preflight and works from any origin.
// ============================================================

export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbysToetB8kTtJMiv4maOokGgbX2X0ItbQ4YLvESP9Gd16VxIggIrVJznqRzrh3R73dXcg/exec";

// ── Generic GET request with payload as URL param ────────────
async function call(action, payload = {}) {
  const body    = JSON.stringify({ action, ...payload });
  const url     = `${SCRIPT_URL}?payload=${encodeURIComponent(body)}`;
  const res     = await fetch(url, { method: "GET" });
  if (!res.ok)  throw new Error(`HTTP ${res.status}`);
  const json    = await res.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

// ── READ ─────────────────────────────────────────────────────
export const getParties = () => call("getSheet", { sheet: "Parties" });
export const getItems   = () => call("getSheet", { sheet: "Items"   });
export const getBills   = () => call("getSheet", { sheet: "Bills"   });
export const getLedger  = () => call("getSheet", { sheet: "Ledger"  });
export const getCash    = () => call("getSheet", { sheet: "Cash"    });

// ── WRITE ─────────────────────────────────────────────────────
export const addParty   = (row) => call("appendRow", { sheet: "Parties", row });
export const addItem    = (row) => call("appendRow", { sheet: "Items",   row });
export const addBill    = (row) => call("appendRow", { sheet: "Bills",   row });
export const addLedger  = (row) => call("appendRow", { sheet: "Ledger",  row });
export const addCash    = (row) => call("appendRow", { sheet: "Cash",    row });
export const updateItem = (id, row) => call("updateRow", { sheet: "Items", id, row });

// ── Row <-> Object converters ─────────────────────────────────
export function partyToRow(p) {
  return [p.id, p.name, p.phone, p.city, p.address || "", p.creditLimit, p.openingBalance];
}
export function rowToParty([id, name, phone, city, address, creditLimit, openingBalance]) {
  return { id, name, phone, city, address, creditLimit: Number(creditLimit), openingBalance: Number(openingBalance) };
}

export function itemToRow(i) {
  return [i.id, i.name, i.category, i.unit, i.rate, i.reorderLevel, i.stock];
}
export function rowToItem([id, name, category, unit, rate, reorderLevel, stock]) {
  return { id, name, category, unit, rate: Number(rate), reorderLevel: Number(reorderLevel), stock: Number(stock) };
}

export function billToRow(b) {
  return [b.id, b.partyId, b.partyName, b.date, b.billNo, JSON.stringify(b.items), b.total, b.type, b.notes || ""];
}
export function rowToBill([id, partyId, partyName, date, billNo, itemsJson, total, type, notes]) {
  return { id, partyId, partyName, date, billNo, items: JSON.parse(itemsJson || "[]"), total: Number(total), type, notes };
}

export function ledgerToRow(l) {
  return [l.id, l.partyId, l.partyName, l.date, l.type, l.ref, l.note, l.amount];
}
export function rowToLedger([id, partyId, partyName, date, type, ref, note, amount]) {
  return { id, partyId, partyName, date, type, ref, note, amount: Number(amount) };
}

export function cashToRow(c) {
  return [c.id, c.date, c.type, c.ref, c.note, c.amount];
}
export function rowToCash([id, date, type, ref, note, amount]) {
  return { id, date, type, ref, note, amount: Number(amount) };
}