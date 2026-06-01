// // ============================================================
// //  googleSheets.js — optimized stable version
// // ============================================================

// export const SCRIPT_URL =
//   "https://script.google.com/macros/s/AKfycbzgAt_KCbqsw7HgXgJqAQY6jYrz6zI-gSKUk3-P5LLZpjUwQblF3k489DCByXsq1lCizQ/exec";

// // ── Generic GET request ──────────────────────────────────────
// async function call(action, payload = {}) {
//   try {
//     const body = JSON.stringify({
//       action,
//       ...payload,
//     });

//     const url =
//       `${SCRIPT_URL}?payload=${encodeURIComponent(body)}`;

//     const response = await fetch(url);

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }

//     const json = await response.json();

//     if (json.error) {
//       throw new Error(json.error);
//     }

//     return json.data;

//   } catch (error) {
//     console.error("GoogleSheets API Error:", error);
//     throw error;
//   }
// }

// // ── READ ─────────────────────────────────────────────────────
// export const getParties = () =>
//   call("getSheet", { sheet: "Parties" });

// export const getItems = () =>
//   call("getSheet", { sheet: "Items" });

// export const getBills = () =>
//   call("getSheet", { sheet: "Bills" });

// export const getLedger = () =>
//   call("getSheet", { sheet: "Ledger" });

// export const getCash = () =>
//   call("getSheet", { sheet: "Cash" });

// // ── WRITE ────────────────────────────────────────────────────
// export const addParty = (row) =>
//   call("appendRow", { sheet: "Parties", row });

// export const addItem = (row) =>
//   call("appendRow", { sheet: "Items", row });

// export const addBill = (row) =>
//   call("appendRow", { sheet: "Bills", row });

// export const addLedger = (row) =>
//   call("appendRow", { sheet: "Ledger", row });

// export const addCash = (row) =>
//   call("appendRow", { sheet: "Cash", row });

// export const updateItem = (id, row) =>
//   call("updateRow", {
//     sheet: "Items",
//     id,
//     row,
//   });

// // ── HELPERS ──────────────────────────────────────────────────
// export const generateId = () =>
//   Date.now().toString();

// // ── PARTY ────────────────────────────────────────────────────
// export function partyToRow(p) {
//   return [
//     p.id,
//     p.name,
//     p.phone,
//     p.city,
//     p.address || "",
//     Number(p.creditLimit || 0),
//     Number(p.openingBalance || 0),
//   ];
// }

// export function rowToParty([
//   id,
//   name,
//   phone,
//   city,
//   address,
//   creditLimit,
//   openingBalance,
// ]) {
//   return {
//     id,
//     name,
//     phone,
//     city,
//     address,
//     creditLimit: Number(creditLimit || 0),
//     openingBalance: Number(openingBalance || 0),
//   };
// }

// // ── ITEM ─────────────────────────────────────────────────────
// export function itemToRow(i) {
//   return [
//     i.id,
//     i.name,
//     i.category,
//     i.unit,
//     Number(i.rate || 0),
//     Number(i.reorderLevel || 0),
//     Number(i.stock || 0),
//   ];
// }

// export function rowToItem([
//   id,
//   name,
//   category,
//   unit,
//   rate,
//   reorderLevel,
//   stock,
// ]) {
//   return {
//     id,
//     name,
//     category,
//     unit,
//     rate: Number(rate || 0),
//     reorderLevel: Number(reorderLevel || 0),
//     stock: Number(stock || 0),
//   };
// } 



// ============================================================
//  googleSheets.js — FULL STABLE VERSION
// ============================================================
// ============================================================
// googleSheets.js — FULL STABLE VERSION
// ============================================================

// ============================================================
// googleSheets.js — FULL STABLE VERSION
// ============================================================

export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwQOHWt5hTpfKMSKCV7n1rglhsg26HVwRg3gU_LgtfX0rgJ0J6dRIl-IhzdLUqAHeth/exec";

// ============================================================
// GENERIC API CALL
// ============================================================

async function call(action, payload = {}) {
  try {
    const body = JSON.stringify({
      action,
      ...payload,
    });

    const url =
      `${SCRIPT_URL}?payload=${encodeURIComponent(body)}`;

    const response = await fetch(url, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const json = await response.json();

    if (json.error) {
      throw new Error(json.error);
    }

    return json.data;

  } catch (error) {
    console.error("Google Sheets API Error:", error);
    throw error;
  }
}

// ============================================================
// READ FUNCTIONS
// ============================================================

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

// ============================================================
// WRITE FUNCTIONS
// ============================================================

export const addParty = (row) =>
  call("appendRow", {
    sheet: "Parties",
    row,
  });

export const addItem = (row) =>
  call("appendRow", {
    sheet: "Items",
    row,
  });

export const addBill = (row) =>
  call("appendRow", {
    sheet: "Bills",
    row,
  });

export const addLedger = (row) =>
  call("appendRow", {
    sheet: "Ledger",
    row,
  });

export const addCash = (row) =>
  call("appendRow", {
    sheet: "Cash",
    row,
  });

export const updateItem = (id, row) =>
  call("updateRow", {
    sheet: "Items",
    id,
    row,
  });

// ============================================================
// HELPERS
// ============================================================

export const generateId = (prefix = "") =>
  prefix + Date.now().toString();

export const todayDate = () =>
  new Date().toISOString().split("T")[0];

// ==============================================================
// PARTY HELPERS
// ==============================================================

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

// ============================================================
// ITEM HELPERS
// ============================================================

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

// ============================================================
// BILL HELPERS
// ============================================================

export function billToRow(b) {
  return [
    b.id,
    b.partyId,
    b.partyName,
    b.date,
    b.billNo,
    JSON.stringify(b.items || []),
    Number(b.total || 0),
    b.type,
    b.notes || "",
  ];
}

export function rowToBill([
  id,
  partyId,
  partyName,
  date,
  billNo,
  itemsJson,
  total,
  type,
  notes,
]) {
  return {
    id,
    partyId,
    partyName,
    date,
    billNo,
    items: JSON.parse(itemsJson || "[]"),
    total: Number(total || 0),
    type,
    notes,
  };
}

// ============================================================
// LEDGER HELPERS
// ============================================================

export function ledgerToRow(l) {
  return [
    l.id,
    l.partyId,
    l.partyName,
    l.date,
    l.type,
    l.ref,
    l.note,
    Number(l.amount || 0),
  ];
}

export function rowToLedger([
  id,
  partyId,
  partyName,
  date,
  type,
  ref,
  note,
  amount,
]) {
  return {
    id,
    partyId,
    partyName,
    date,
    type,
    ref,
    note,
    amount: Number(amount || 0),
  };
}

// ============================================================
// CASH HELPERS
// ============================================================

export function cashToRow(c) {
  return [
    c.id,
    c.date,
    c.type,
    c.ref,
    c.note,
    Number(c.amount || 0),
  ];
}

export function rowToCash([
  id,
  date,
  type,
  ref,
  note,
  amount,
]) {
  return {
    id,
    date,
    type,
    ref,
    note,
    amount: Number(amount || 0),
  };
}