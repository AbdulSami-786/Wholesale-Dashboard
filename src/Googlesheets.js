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
// export const SCRIPT_URL =
//   "https://script.google.com/macros/s/AKfycbybNkhpXI6asH5z_vu-UWSoX4IbHkV-qPdtXA0JFIH3_DDjLhqcuGSf4o4c-UBhrNKS/exec";

// // ============================================================
// // GENERIC API CALL
// // ============================================================

// async function call(action, payload = {}) {
//   try {
//     const body = JSON.stringify({
//       action,
//       ...payload,
//     });

//     const url =
//       `${SCRIPT_URL}?payload=${encodeURIComponent(body)}`;

//     const response = await fetch(url, {
//       method: "GET",
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP ${response.status}`);
//     }

//     const json = await response.json();

//     if (json.error) {
//       throw new Error(json.error);
//     }

//     return json.data;

//   } catch (error) {
//     console.error("Google Sheets API Error:", error);
//     throw error;
//   }
// }

// // ============================================================
// // READ FUNCTIONS
// // ============================================================

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

// // ============================================================
// // WRITE FUNCTIONS
// // ============================================================

// export const addParty = (row) =>
//   call("appendRow", {
//     sheet: "Parties",
//     row,
//   });

// export const addItem = (row) =>
//   call("appendRow", {
//     sheet: "Items",
//     row,
//   });

// export const addBill = (row) =>
//   call("appendRow", {
//     sheet: "Bills",
//     row,
//   });

// export const addLedger = (row) =>
//   call("appendRow", {
//     sheet: "Ledger",
//     row,
//   });

// export const addCash = (row) =>
//   call("appendRow", {
//     sheet: "Cash",
//     row,
//   });

// export const updateItem = (id, row) =>
//   call("updateRow", {
//     sheet: "Items",
//     id,
//     row,
//   });

// // ============================================================
// // HELPERS
// // ============================================================

// export const generateId = (prefix = "") =>
//   prefix + Date.now().toString();

// export const todayDate = () =>
//   new Date().toISOString().split("T")[0];

// // ============================================================
// // PARTY HELPERS
// // ============================================================

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

// // ============================================================
// // ITEM HELPERS
// // ============================================================

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

// // ============================================================
// // BILL HELPERS
// // ============================================================

// export function billToRow(b) {
//   return [
//     b.id,
//     b.partyId,
//     b.partyName,
//     b.date,
//     b.billNo,
//     JSON.stringify(b.items || []),
//     Number(b.total || 0),
//     b.type,
//     b.notes || "",
//   ];
// }

// export function rowToBill([
//   id,
//   partyId,
//   partyName,
//   date,
//   billNo,
//   itemsJson,
//   total,
//   type,
//   notes,
// ]) {
//   return {
//     id,
//     partyId,
//     partyName,
//     date,
//     billNo,
//     items: JSON.parse(itemsJson || "[]"),
//     total: Number(total || 0),
//     type,
//     notes,
//   };
// }

// // ============================================================
// // LEDGER HELPERS
// // ============================================================

// export function ledgerToRow(l) {
//   return [
//     l.id,
//     l.partyId,
//     l.partyName,
//     l.date,
//     l.type,
//     l.ref,
//     l.note,
//     Number(l.amount || 0),
//   ];
// }

// export function rowToLedger([
//   id,
//   partyId,
//   partyName,
//   date,
//   type,
//   ref,
//   note,
//   amount,
// ]) {
//   return {
//     id,
//     partyId,
//     partyName,
//     date,
//     type,
//     ref,
//     note,
//     amount: Number(amount || 0),
//   };
// }

// // ============================================================
// // CASH HELPERS
// // ============================================================

// export function cashToRow(c) {
//   return [
//     c.id,
//     c.date,
//     c.type,
//     c.ref,
//     c.note,
//     Number(c.amount || 0),
//   ];
// }

// export function rowToCash([
//   id,
//   date,
//   type,
//   ref,
//   note,
//   amount,
// ]) {
//   return {
//     id,
//     date,
//     type,
//     ref,
//     note,
//     amount: Number(amount || 0),
//   };
// }







































// export const SCRIPT_URL =
//   "https://script.google.com/macros/s/AKfycbybNkhpXI6asH5z_vu-UWSoX4IbHkV-qPdtXA0JFIH3_DDjLhqcuGSf4o4c-UBhrNKS/exec";

// // ============================================================
// // OFFLINE / SYNC CONFIG
// // ============================================================

// const CACHE_PREFIX = "wms_cache_";
// const QUEUE_KEY    = "wms_sync_queue";
// const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// // ── LocalStorage helpers ──────────────────────────────────────
// function lsGet(key) {
//   try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
// }
// function lsSet(key, val) {
//   try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
// }

// // ── Online detection ──────────────────────────────────────────
// export function isOnline() {
//   return typeof navigator !== "undefined" ? navigator.onLine : true;
// }

// // ── Sync Queue ────────────────────────────────────────────────
// // Each item: { qid, action, sheet, payload, timestamp }
// // NOTE: qid is a unique queue-entry ID (separate from the data row ID)

// function getQueue() {
//   return lsGet(QUEUE_KEY) || [];
// }
// function saveQueue(q) {
//   lsSet(QUEUE_KEY, q);
// }
// export function getQueueLength() {
//   return getQueue().length;
// }

// function enqueue(action, sheet, payload) {
//   const q = getQueue();
//   // ── Dedup: if an identical operation for the same row is already queued,
//   //    replace it rather than stacking duplicates.
//   const rowId = payload.row?.[0] ?? payload.id;
//   const existing = q.findIndex(
//     item => item.sheet === sheet && item.action === action &&
//             (item.payload.row?.[0] === rowId || item.payload.id === rowId)
//   );
//   const entry = {
//     qid: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
//     action, sheet, payload, timestamp: Date.now(),
//   };
//   if (existing !== -1) {
//     q[existing] = entry; // replace stale queued op with latest
//   } else {
//     q.push(entry);
//   }
//   saveQueue(q);
//   return entry.qid;
// }

// function dequeueByQid(qid) {
//   saveQueue(getQueue().filter(item => item.qid !== qid));
// }

// // ── Sheet Cache ───────────────────────────────────────────────
// function getCached(sheet) {
//   const entry = lsGet(CACHE_PREFIX + sheet);
//   if (!entry) return null;
//   if (Date.now() - entry.savedAt > CACHE_TTL_MS) return null;
//   return entry.data;
// }

// function setCache(sheet, data) {
//   lsSet(CACHE_PREFIX + sheet, { data, savedAt: Date.now() });
// }

// function applyQueueToCache(sheet, rows) {
//   const q = getQueue();
//   let result = [...rows];

//   for (const item of q) {
//     if (item.sheet !== sheet) continue;
//     if (item.action === "appendRow") {
//       const id = item.payload.row[0];
//       if (!result.find(r => r[0] === id)) {
//         result.push(item.payload.row);
//       }
//     } else if (item.action === "updateRow") {
//       result = result.map(r => r[0] === item.payload.id ? item.payload.row : r);
//     } else if (item.action === "deleteRow") {
//       result = result.filter(r => r[0] !== item.payload.id);
//     }
//   }

//   return result;
// }

// // ============================================================
// // GENERIC API CALL (network)
// // ============================================================

// async function callNetwork(action, payload = {}) {
//   const body = JSON.stringify({ action, ...payload });
//   const url  = `${SCRIPT_URL}?payload=${encodeURIComponent(body)}`;
//   const response = await fetch(url, { method: "GET" });
//   if (!response.ok) throw new Error(`HTTP ${response.status}`);
//   const json = await response.json();
//   if (json.error) throw new Error(json.error);
//   return json.data;
// }

// // ============================================================
// // READ FUNCTIONS
// // ============================================================

// export async function getSheet(sheet) {
//   if (!isOnline()) {
//     const cached = getCached(sheet);
//     if (cached) return applyQueueToCache(sheet, cached);
//     throw new Error(`Offline and no cached data for "${sheet}"`);
//   }

//   try {
//     const data = await callNetwork("getSheet", { sheet });
//     const rows = data || [];
//     setCache(sheet, rows);
//     return applyQueueToCache(sheet, rows);
//   } catch (err) {
//     const cached = getCached(sheet);
//     if (cached) {
//       console.warn(`Network error for ${sheet}, using cache:`, err.message);
//       return applyQueueToCache(sheet, cached);
//     }
//     throw err;
//   }
// }

// // ============================================================
// // WRITE FUNCTIONS
// // ============================================================

// async function writeOp(action, sheet, payload) {
//   // 1. Enqueue first — get back a unique queue ID
//   const qid = enqueue(action, sheet, payload);

//   if (!isOnline()) {
//     // Offline: queued, will sync later
//     return;
//   }

//   // 2. Online: try to execute immediately
//   try {
//     await callNetwork(action, { sheet, ...payload });
//     // 3. SUCCESS — remove exactly this queue entry by its qid
//     dequeueByQid(qid);
//   } catch (err) {
//     console.warn(`Write failed for ${sheet}, queued for later sync:`, err.message);
//     // Stays in queue for syncQueue() to retry
//   }
// }

// export const appendRow = (sheet, row)     => writeOp("appendRow", sheet, { row });
// export const updateRow = (sheet, id, row) => writeOp("updateRow", sheet, { id, row });
// export const deleteRow = (sheet, id)      => writeOp("deleteRow", sheet, { id });

// // ============================================================
// // SYNC ENGINE — call when coming back online
// // ============================================================

// export async function syncQueue(onProgress) {
//   const q = getQueue();
//   if (q.length === 0) return { synced: 0, failed: 0 };

//   let synced = 0;
//   let failed = 0;
//   const remaining = [];

//   for (const item of q) {
//     try {
//       const { action, sheet, payload } = item;
//       await callNetwork(action, { sheet, ...payload });
//       synced++;
//       onProgress?.({ synced, total: q.length, item });
//     } catch (err) {
//       console.warn("Sync failed for queued item:", item, err.message);
//       failed++;
//       remaining.push(item);
//     }
//   }

//   saveQueue(remaining);

//   // Refresh all caches after a successful sync
//   if (synced > 0) {
//     for (const sheet of ["Parties", "Items", "Bills", "Ledger", "Cash"]) {
//       try {
//         const data = await callNetwork("getSheet", { sheet });
//         setCache(sheet, data || []);
//       } catch {}
//     }
//   }

//   return { synced, failed };
// }

// // ============================================================
// // HELPERS
// // ============================================================

// export const generateId = (prefix = "") => prefix + Date.now().toString();
// export const todayDate  = () => new Date().toISOString().split("T")[0];

// // ── Party ─────────────────────────────────────────────────────
// export function partyToRow(p) {
//   return [p.id, p.name, p.phone, p.city, p.address || "",
//     Number(p.creditLimit || 0), Number(p.openingBalance || 0)];
// }
// export function rowToParty([id, name, phone, city, address, creditLimit, openingBalance]) {
//   return { id, name, phone, city, address,
//     creditLimit: Number(creditLimit || 0), openingBalance: Number(openingBalance || 0) };
// }

// // ── Item ──────────────────────────────────────────────────────
// export function itemToRow(i) {
//   return [i.id, i.name, i.category, i.unit,
//     Number(i.rate || 0), Number(i.reorderLevel || 0), Number(i.stock || 0)];
// }
// export function rowToItem([id, name, category, unit, rate, reorderLevel, stock]) {
//   return { id, name, category, unit,
//     rate: Number(rate || 0), reorderLevel: Number(reorderLevel || 0), stock: Number(stock || 0) };
// }

// // ── Bill ──────────────────────────────────────────────────────
// export function billToRow(b) {
//   return [b.id, b.partyId, b.partyName, b.date, b.billNo,
//     JSON.stringify(b.items || []), Number(b.total || 0), b.type, b.notes || ""];
// }
// export function rowToBill([id, partyId, partyName, date, billNo, itemsJson, total, type, notes]) {
//   return { id, partyId, partyName, date, billNo,
//     items: JSON.parse(itemsJson || "[]"), total: Number(total || 0), type, notes };
// }

// // ── Ledger ────────────────────────────────────────────────────
// export function ledgerToRow(l) {
//   return [l.id, l.partyId, l.partyName, l.date, l.type, l.ref, l.note, Number(l.amount || 0)];
// }
// export function rowToLedger([id, partyId, partyName, date, type, ref, note, amount]) {
//   return { id, partyId, partyName, date, type, ref, note, amount: Number(amount || 0) };
// }

// // ── Cash ──────────────────────────────────────────────────────
// export function cashToRow(c) {
//   return [c.id, c.date, c.type, c.ref, c.note, Number(c.amount || 0)];
// }
// export function rowToCash([id, date, type, ref, note, amount]) {
//   return { id, date, type, ref, note, amount: Number(amount || 0) };
// }


export const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyWdgkwLfHLH5keMe3cwcldEKnM8Lywf0ib2zuBwtr51WHAt28xO5X81MlIS6M46tjTnQ/exec";
// ============================================================
// OFFLINE / SYNC CONFIG
// ============================================================

const CACHE_PREFIX = "wms_cache_";
const QUEUE_KEY    = "wms_sync_queue";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── LocalStorage helpers ──────────────────────────────────────
function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Online detection ──────────────────────────────────────────
export function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

// ── Sync Queue ────────────────────────────────────────────────
function getQueue() {
  return lsGet(QUEUE_KEY) || [];
}
function saveQueue(q) {
  lsSet(QUEUE_KEY, q);
}
export function getQueueLength() {
  return getQueue().length;
}

function enqueue(action, sheet, payload) {
  const q = getQueue();
  const rowId = payload.row?.[0] ?? payload.id;
  const existing = q.findIndex(
    item => item.sheet === sheet && item.action === action &&
            (item.payload.row?.[0] === rowId || item.payload.id === rowId)
  );
  const entry = {
    qid: `${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    action, sheet, payload, timestamp: Date.now(),
  };
  if (existing !== -1) {
    q[existing] = entry;
  } else {
    q.push(entry);
  }
  saveQueue(q);
  return entry.qid;
}

function dequeueByQid(qid) {
  saveQueue(getQueue().filter(item => item.qid !== qid));
}

// ── Sheet Cache ───────────────────────────────────────────────
function getCached(sheet) {
  const entry = lsGet(CACHE_PREFIX + sheet);
  if (!entry) return null;
  if (Date.now() - entry.savedAt > CACHE_TTL_MS) return null;
  return entry.data;
}

function setCache(sheet, data) {
  lsSet(CACHE_PREFIX + sheet, { data, savedAt: Date.now() });
}

function applyQueueToCache(sheet, rows) {
  const q = getQueue();
  let result = [...rows];
  for (const item of q) {
    if (item.sheet !== sheet) continue;
    if (item.action === "appendRow") {
      const id = item.payload.row[0];
      if (!result.find(r => r[0] === id)) result.push(item.payload.row);
    } else if (item.action === "updateRow") {
      result = result.map(r => r[0] === item.payload.id ? item.payload.row : r);
    } else if (item.action === "deleteRow") {
      result = result.filter(r => r[0] !== item.payload.id);
    }
  }
  return result;
}

// ============================================================
// GENERIC API CALL (network)
// ============================================================

async function callNetwork(action, payload = {}) {
  const body = JSON.stringify({ action, ...payload });
  const url  = `${SCRIPT_URL}?payload=${encodeURIComponent(body)}`;
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const json = await response.json();
  if (json.error) throw new Error(json.error);
  return json.data;
}

// ============================================================
// READ FUNCTIONS
// ============================================================

export async function getSheet(sheet) {
  if (!isOnline()) {
    const cached = getCached(sheet);
    if (cached) return applyQueueToCache(sheet, cached);
    throw new Error(`Offline and no cached data for "${sheet}"`);
  }
  try {
    const data = await callNetwork("getSheet", { sheet });
    const rows = data || [];
    setCache(sheet, rows);
    return applyQueueToCache(sheet, rows);
  } catch (err) {
    const cached = getCached(sheet);
    if (cached) {
      console.warn(`Network error for ${sheet}, using cache:`, err.message);
      return applyQueueToCache(sheet, cached);
    }
    throw err;
  }
}

// ============================================================
// WRITE FUNCTIONS
// ============================================================

async function writeOp(action, sheet, payload) {
  const qid = enqueue(action, sheet, payload);
  if (!isOnline()) return;
  try {
    await callNetwork(action, { sheet, ...payload });
    dequeueByQid(qid);
  } catch (err) {
    console.warn(`Write failed for ${sheet}, queued for later sync:`, err.message);
  }
}

export const appendRow = (sheet, row)     => writeOp("appendRow", sheet, { row });
export const updateRow = (sheet, id, row) => writeOp("updateRow", sheet, { id, row });
export const deleteRow = (sheet, id)      => writeOp("deleteRow", sheet, { id });

// ============================================================
// SYNC ENGINE
// ============================================================

export async function syncQueue(onProgress) {
  const q = getQueue();
  if (q.length === 0) return { synced: 0, failed: 0 };
  let synced = 0, failed = 0;
  const remaining = [];
  for (const item of q) {
    try {
      const { action, sheet, payload } = item;
      await callNetwork(action, { sheet, ...payload });
      synced++;
      onProgress?.({ synced, total: q.length, item });
    } catch (err) {
      console.warn("Sync failed for queued item:", item, err.message);
      failed++;
      remaining.push(item);
    }
  }
  saveQueue(remaining);
  if (synced > 0) {
    for (const sheet of ["Parties","Items","Bills","Ledger","Cash","SharedLedgers"]) {
      try {
        const data = await callNetwork("getSheet", { sheet });
        setCache(sheet, data || []);
      } catch {}
    }
  }
  return { synced, failed };
}

// ============================================================
// HELPERS
// ============================================================

export const generateId = (prefix = "") => prefix + Date.now().toString();
export const todayDate  = () => new Date().toISOString().split("T")[0];

// ── Party ─────────────────────────────────────────────────────
export function partyToRow(p) {
  return [p.id, p.name, p.phone, p.city, p.address || "",
    Number(p.creditLimit || 0), Number(p.openingBalance || 0)];
}
export function rowToParty([id, name, phone, city, address, creditLimit, openingBalance]) {
  return { id, name, phone, city, address,
    creditLimit: Number(creditLimit || 0), openingBalance: Number(openingBalance || 0) };
}

// ── Item ──────────────────────────────────────────────────────
export function itemToRow(i) {
  return [i.id, i.name, i.category, i.unit,
    Number(i.rate || 0), Number(i.reorderLevel || 0), Number(i.stock || 0)];
}
export function rowToItem([id, name, category, unit, rate, reorderLevel, stock]) {
  return { id, name, category, unit,
    rate: Number(rate || 0), reorderLevel: Number(reorderLevel || 0), stock: Number(stock || 0) };
}

// ── Bill ──────────────────────────────────────────────────────
export function billToRow(b) {
  return [b.id, b.partyId, b.partyName, b.date, b.billNo,
    JSON.stringify(b.items || []), Number(b.total || 0), b.type, b.notes || ""];
}
export function rowToBill([id, partyId, partyName, date, billNo, itemsJson, total, type, notes]) {
  return { id, partyId, partyName, date, billNo,
    items: JSON.parse(itemsJson || "[]"), total: Number(total || 0), type, notes };
}

// ── Ledger ────────────────────────────────────────────────────
export function ledgerToRow(l) {
  return [l.id, l.partyId, l.partyName, l.date, l.type, l.ref, l.note, Number(l.amount || 0)];
}
export function rowToLedger([id, partyId, partyName, date, type, ref, note, amount]) {
  return { id, partyId, partyName, date, type, ref, note, amount: Number(amount || 0) };
}

// ── Cash ──────────────────────────────────────────────────────
export function cashToRow(c) {
  return [c.id, c.date, c.type, c.ref, c.note, Number(c.amount || 0)];
}
export function rowToCash([id, date, type, ref, note, amount]) {
  return { id, date, type, ref, note, amount: Number(amount || 0) };
}

// ── SharedLedger ──────────────────────────────────────────────
export function sharedLedgerToRow(s) {
  return [
    s.id,
    s.partyId,
    s.partyName,
    s.slug,
    s.password,
    s.status,        // "Active" | "Disabled"
    s.expiryDate || "",
    s.createdDate,
  ];
}
export function rowToSharedLedger([id, partyId, partyName, slug, password, status, expiryDate, createdDate]) {
  return { id, partyId, partyName, slug, password, status, expiryDate: expiryDate || "", createdDate };
}

// ── Public API for shared ledger reads (no queue/cache) ───────
export async function getSharedLedgerBySlug(slug) {
  return callNetwork("getSharedLedgerBySlug", { slug });
}

export async function verifySharedLedgerPassword(slug, password) {
  return callNetwork("verifySharedLedgerPassword", { slug, password });
}

export async function getSharedLedgerData(slug) {
  return callNetwork("getSharedLedgerData", { slug });
}