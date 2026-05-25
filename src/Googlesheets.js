// ============================================================
//  googleSheets.js — optimized stable version
// ============================================================

export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbysToetB8kTtJMiv4maOokGgbX2X0ItbQ4YLvESP9Gd16VxIggIrVJznqRzrh3R73dXcg/exec";

// ── Generic GET request ──────────────────────────────────────
async function call(action, payload = {}) {
  try {
    const body = JSON.stringify({
      action,
      ...payload,
    });

    const url =
      `${SCRIPT_URL}?payload=${encodeURIComponent(body)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    return json.data;

  } catch (error) {
    console.error("GoogleSheets API Error:", error);
    throw error;
  }
}

// ── READ ─────────────────────────────────────────────────────
export const getParties = () =>
  call("getSheet", { sheet: "Parties" });

export const getItems = () =>
  call("getSheet", { sheet: "Items" });

export const getBills = () =>
  call("getSheet", { sheet: "Bills" });

export const getLedger = () =>
  call("getSheet", { sheet: "Ledger" });

export const getCash = () =>
  call("getSheet", { sheet: "Cash" });

// ── WRITE ────────────────────────────────────────────────────
export const addParty = (row) =>
  call("appendRow", { sheet: "Parties", row });

export const addItem = (row) =>
  call("appendRow", { sheet: "Items", row });

export const addBill = (row) =>
  call("appendRow", { sheet: "Bills", row });

export const addLedger = (row) =>
  call("appendRow", { sheet: "Ledger", row });

export const addCash = (row) =>
  call("appendRow", { sheet: "Cash", row });

export const updateItem = (id, row) =>
  call("updateRow", {
    sheet: "Items",
    id,
    row,
  });

// ── HELPERS ──────────────────────────────────────────────────
export const generateId = () =>
  Date.now().toString();

// ── PARTY ────────────────────────────────────────────────────
export function partyToRow(p) {
  return [
    p.id,
    p.name,
    p.phone,
    p.city,
    p.address || "",
    Number(p.creditLimit || 0),
    Number(p.openingBalance || 0),
  ];
}

export function rowToParty([
  id,
  name,
  phone,
  city,
  address,
  creditLimit,
  openingBalance,
]) {
  return {
    id,
    name,
    phone,
    city,
    address,
    creditLimit: Number(creditLimit || 0),
    openingBalance: Number(openingBalance || 0),
  };
}

// ── ITEM ─────────────────────────────────────────────────────
export function itemToRow(i) {
  return [
    i.id,
    i.name,
    i.category,
    i.unit,
    Number(i.rate || 0),
    Number(i.reorderLevel || 0),
    Number(i.stock || 0),
  ];
}

export function rowToItem([
  id,
  name,
  category,
  unit,
  rate,
  reorderLevel,
  stock,
]) {
  return {
    id,
    name,
    category,
    unit,
    rate: Number(rate || 0),
    reorderLevel: Number(reorderLevel || 0),
    stock: Number(stock || 0),
  };
} 