// /* ═══════════════════════════════════════════════════════════════
//    🏪 DUKANDARPRO v5.0 — with Upgraded Thermal Receipt Slip
//    ═══════════════════════════════════════════════════════════════ */

// import { useState, useRef, useEffect, useCallback, useMemo } from "react";
// import {
//   PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
// } from "recharts";

// /* ─── API shim — delegates to window.DPApi (googleSheet.js) ─── */
// const api = () => window.DPApi;
// const syncAllData   = (sp,sc,so,se,sst) => {
//   if (!api()) return Promise.resolve({ success: false });
//   return api().fetchAll().then(res => {
//     if (!res?.success) return res;
//     const d = res.data || {};
//     if (sp)  sp(Array.isArray(d.products)  ? d.products.map(mapProduct)   : []);
//     if (sc)  sc(Array.isArray(d.customers) ? d.customers.map(mapCustomer) : []);
//     if (so)  so(Array.isArray(d.orders)    ? d.orders.map(mapOrder)        : []);
//     if (se)  se(Array.isArray(d.expenses)  ? d.expenses                    : []);
//     if (sst) sst(Array.isArray(d.salesmen) ? d.salesmen                    : []);
//     return res;
//   });
// };

// /* field-name adapters */
// const mapProduct  = p => ({ ...p, buy: p.cost  ?? p.buy  ?? 0, sell: p.price ?? p.sell ?? 0 });
// const mapCustomer = c => ({ ...c, udhaar: c.pendingDues ?? c.udhaar ?? 0 });
// const mapOrder    = o => ({ ...o, createdAt: o.date ?? o.createdAt ?? '', total: Number(o.total||0), profit: Number(o.profit||0) });

// const addProduct            = (p)               => api()?.create('Products', { ...p, cost: p.buy, price: p.sell }) ?? Promise.resolve({ success: false });
// const updateProduct         = (id, p)           => api()?.update('Products', id, { ...p, cost: p.buy, price: p.sell }) ?? Promise.resolve({ success: false });
// const deleteProduct         = (id)              => api()?.remove('Products', id) ?? Promise.resolve({ success: false });
// const patchProductStock     = (id, d, r, by)    => api()?.update('Products', id, { delta: d, reason: r, by }) ?? Promise.resolve({ success: false });
// const addOrder              = (order, items)    => api()?.addOrder(order, items, null) ?? Promise.resolve({ success: false });
// const updateOrderStatus     = (id, status, ex)  => api()?.update('Orders', id, { status, ...ex }) ?? Promise.resolve({ success: false });
// const addCustomer           = (c)               => api()?.create('Customers', { ...c, pendingDues: c.udhaar ?? 0 }) ?? Promise.resolve({ success: false });
// const updateCustomer        = (id, c)           => api()?.update('Customers', id, { ...c, pendingDues: c.udhaar ?? 0 }) ?? Promise.resolve({ success: false });
// const addCustomerCreditPayment = (id, amt, due, oid) => api()?.update('Customers', id, { pendingDues: 0, creditPayment: amt, creditDueDate: due, orderId: oid }) ?? Promise.resolve({ success: false });
// const addExpense            = (e)               => api()?.create('Expenses', e) ?? Promise.resolve({ success: false });
// const addStaff              = (s)               => api()?.create('Salesmen', s) ?? Promise.resolve({ success: false });
// const updateStaff           = (id, s)           => api()?.update('Salesmen', id, s) ?? Promise.resolve({ success: false });
// const deleteStaff           = (id)              => api()?.remove('Salesmen', id) ?? Promise.resolve({ success: false });
// const isOnline              = ()                => api()?.isOnline() ?? navigator.onLine;
// const queueOfflineOperation = (action, payload) => api()?.queueOperation(action, payload) ?? Promise.resolve({ success: false, queued: true });
// const processOfflineQueue   = ()                => api()?.processQueue() ?? Promise.resolve({ success: true, processed: 0, failed: 0, remaining: 0 });
// const getPendingSyncCount   = ()                => Promise.resolve((api()?.loadQueue() ?? []).length);
// const testConnection        = ()                => api()?.testConnection() ?? Promise.resolve({ success: false, error: 'DPApi not loaded' });

// /* ── Helpers ── */
// const rs      = n => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;
// const fmtDate = s => { try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); } catch { return s || ""; } };
// const fmtTime = s => { try { return new Date(s).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
// const fmtDT   = s => `${fmtDate(s)} ${fmtTime(s)}`;
// const today   = () => new Date().toISOString();
// const daysDiff = d => { const dd = new Date(d); const n = new Date(); return Math.ceil((dd - n) / (1000*60*60*24)); };

// const loadFromStorage = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch { return fb; } };
// const saveToStorage   = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// const CATEGORIES = ["All","Grocery","Beverages","Household","Snacks","Cosmetics","Pharmacy"];

// /* ══════════════════════════════════════════════════════════
//    JPEG DOWNLOAD UTIL
//    ══════════════════════════════════════════════════════════ */
// function loadHtml2Canvas() {
//   return new Promise(resolve => {
//     if (window.html2canvas) { resolve(window.html2canvas); return; }
//     const s = document.createElement("script");
//     s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
//     s.onload = () => resolve(window.html2canvas);
//     document.head.appendChild(s);
//   });
// }

// async function downloadSlipAsJpeg(el, filename = "receipt.jpg") {
//   const h2c = await loadHtml2Canvas();
//   const canvas = await h2c(el, {
//     backgroundColor: "#ffffff",
//     scale: 4,          // high-res for crisp thermal look
//     useCORS: true,
//     logging: false,
//     width: el.offsetWidth,
//     windowWidth: el.offsetWidth,
//   });
//   const link = document.createElement("a");
//   link.download = filename;
//   link.href = canvas.toDataURL("image/jpeg", 0.97);
//   link.click();
// }

// /* ══════════════════════════════════════════════════════════
//    ▸▸ UPGRADED THERMAL RECEIPT SLIP COMPONENT (from v5.1)
//       All styles are explicit inline so html2canvas captures them.
//    ══════════════════════════════════════════════════════════ */
// const ReceiptSlip = ({
//   order,
//   shopName    = "My Store",
//   shopPhone   = "",
//   shopAddress = "",
//   onClose,
// }) => {
//   const slipRef    = useRef(null);
//   const [busy, setBusy] = useState(false);

//   if (!order) return null;

//   const handleDownload = async () => {
//     if (busy) return;
//     setBusy(true);
//     try {
//       await downloadSlipAsJpeg(slipRef.current, `Receipt-${order.id}.jpg`);
//     } catch (e) {
//       alert("Download failed: " + e.message);
//     } finally {
//       setBusy(false);
//     }
//   };

//   /* Computed totals */
//   const discAmt  = order.disc ?? order.discountAmount ?? 0;
//   const taxAmt   = order.taxAmount ?? 0;
//   const isCredit = order.status === "credit";

//   /* Inline styles — all explicit so html2canvas captures them */
//   const S = {
//     wrap: {
//       backgroundColor: "#ffffff",
//       fontFamily: "'Courier New', Courier, monospace",
//       color: "#111111",
//       width: "320px",
//       padding: "20px 16px 24px",
//       margin: "0 auto",
//     },
//     headerBlock: {
//       textAlign: "center",
//       paddingBottom: "12px",
//       marginBottom: "12px",
//       borderBottom: "2px dashed #999",
//     },
//     shopName: {
//       fontSize: "18px",
//       fontWeight: "900",
//       letterSpacing: "1px",
//       color: "#111",
//       marginBottom: "3px",
//       textTransform: "uppercase",
//     },
//     shopSub: {
//       fontSize: "11px",
//       color: "#555",
//       lineHeight: "1.6",
//     },
//     metaRow: {
//       display: "flex",
//       justifyContent: "space-between",
//       fontSize: "11px",
//       color: "#333",
//       marginBottom: "4px",
//     },
//     metaKey:   { fontWeight: "700", color: "#555" },
//     metaValue: { fontWeight: "600" },
//     invNum:    { fontWeight: "900", color: "#000" },
//     dashedDiv: { borderTop: "1px dashed #aaa", margin: "10px 0" },
//     solidDiv:  { borderTop: "1px solid #222",  margin: "10px 0" },
//     itemsHeader: {
//       display: "grid",
//       gridTemplateColumns: "1fr 32px 56px 60px",
//       gap: "0 4px",
//       fontSize: "9px",
//       fontWeight: "900",
//       color: "#555",
//       textTransform: "uppercase",
//       letterSpacing: "0.6px",
//       paddingBottom: "6px",
//       borderBottom: "1px solid #ccc",
//     },
//     itemRow: {
//       display: "grid",
//       gridTemplateColumns: "1fr 32px 56px 60px",
//       gap: "0 4px",
//       fontSize: "11px",
//       paddingTop: "6px",
//       paddingBottom: "6px",
//       borderBottom: "1px dotted #ddd",
//       alignItems: "start",
//     },
//     itemName:  { fontWeight: "700", lineHeight: "1.35", wordBreak: "break-word" },
//     itemDisc:  { fontSize: "9px", color: "#c00", marginTop: "2px" },
//     numCell:   { textAlign: "right", paddingTop: "1px" },
//     amtCell:   { textAlign: "right", fontWeight: "700", paddingTop: "1px" },
//     totalsBlock: { fontSize: "12px" },
//     totRow:    { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
//     totLabel:  { color: "#555" },
//     totVal:    { fontWeight: "700" },
//     discVal:   { fontWeight: "700", color: "#c00" },
//     grandRow: {
//       display: "flex",
//       justifyContent: "space-between",
//       borderTop: "2px solid #111",
//       marginTop: "6px",
//       paddingTop: "8px",
//       fontSize: "15px",
//       fontWeight: "900",
//     },
//     grandAmt: { color: "#000" },
//     creditBlock: {
//       marginTop: "6px",
//       padding: "8px 10px",
//       backgroundColor: "#fff3f3",
//       border: "1px dashed #e00",
//       borderRadius: "4px",
//     },
//     creditRow: { display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" },
//     creditLabel: { color: "#c00", fontWeight: "700" },
//     creditVal:   { color: "#c00", fontWeight: "900" },
//     dueNote:   { fontSize: "9px", textAlign: "right", color: "#c00", marginTop: "2px" },
//     statusWrap: { marginTop: "14px", textAlign: "center" },
//     statusBadge: (paid) => ({
//       display: "inline-block",
//       padding: "4px 20px",
//       borderRadius: "20px",
//       fontSize: "11px",
//       fontWeight: "900",
//       letterSpacing: "1px",
//       textTransform: "uppercase",
//       background: paid ? "#d1fae5" : "#fee2e2",
//       color:      paid ? "#065f46" : "#991b1b",
//       border: `1px solid ${paid ? "#6ee7b7" : "#fca5a5"}`,
//     }),
//     footerBlock: {
//       borderTop: "2px dashed #bbb",
//       marginTop: "16px",
//       paddingTop: "12px",
//       textAlign: "center",
//       fontSize: "10px",
//       color: "#888",
//       lineHeight: "1.9",
//     },
//     footerThank: { fontWeight: "800", fontSize: "11px", color: "#222", marginBottom: "2px" },
//     footerPowered: { marginTop: "8px", fontSize: "9px", color: "#ccc" },
//     barcodeWrap: { textAlign: "center", marginTop: "10px" },
//     barcodeText: { fontFamily: "'Libre Barcode 128', 'Courier New', monospace", fontSize: "28px", color: "#333", letterSpacing: "2px" },
//     barcodeNum:  { fontSize: "9px", color: "#aaa", letterSpacing: "0.5px", marginTop: "-4px" },
//   };

//   return (
//     <div
//       className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
//       style={{ fontFamily: "system-ui, sans-serif" }}
//     >
//       <div
//         style={{
//           backgroundColor: "#fff",
//           borderRadius: "20px 20px 0 0",
//           width: "100%",
//           maxWidth: "400px",
//           maxHeight: "95vh",
//           overflowY: "auto",
//           display: "flex",
//           flexDirection: "column",
//           boxShadow: "0 -8px 40px rgba(0,0,0,0.35)",
//         }}
//         className="sm:rounded-3xl"
//       >
//         {/* Action Header — NOT captured by html2canvas */}
//         <div style={{
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "space-between",
//           padding: "16px 20px",
//           borderBottom: "1px solid #f0f0f0",
//           backgroundColor: "#fff",
//           position: "sticky",
//           top: 0,
//           zIndex: 10,
//           borderRadius: "20px 20px 0 0",
//         }}>
//           <span style={{ fontWeight: "800", fontSize: "15px", color: "#111" }}>🧾 Sale Receipt</span>
//           <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//             {/* Download JPEG */}
//             <button
//               onClick={handleDownload}
//               disabled={busy}
//               style={{
//                 display: "flex",
//                 alignItems: "center",
//                 gap: "6px",
//                 padding: "9px 18px",
//                 background: busy ? "#9ca3af" : "linear-gradient(135deg, #10b981, #059669)",
//                 color: "#fff",
//                 border: "none",
//                 borderRadius: "12px",
//                 fontWeight: "800",
//                 fontSize: "13px",
//                 cursor: busy ? "not-allowed" : "pointer",
//                 boxShadow: busy ? "none" : "0 4px 12px rgba(16,185,129,0.35)",
//                 transition: "all 0.2s",
//               }}
//             >
//               {busy ? (
//                 <><span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⏳</span> Saving…</>
//               ) : (
//                 <>⬇️ Download JPEG</>
//               )}
//             </button>
//             {/* Close */}
//             <button
//               onClick={onClose}
//               style={{
//                 width: "34px",
//                 height: "34px",
//                 borderRadius: "10px",
//                 background: "#f3f4f6",
//                 border: "none",
//                 fontWeight: "700",
//                 fontSize: "14px",
//                 cursor: "pointer",
//                 color: "#6b7280",
//               }}
//             >✕</button>
//           </div>
//         </div>

//         {/* ══ THE THERMAL SLIP — captured by html2canvas ══ */}
//         <div ref={slipRef} style={S.wrap}>

//           {/* Store header */}
//           <div style={S.headerBlock}>
//             <div style={S.shopName}>🏪 {shopName}</div>
//             {shopAddress && <div style={S.shopSub}>{shopAddress}</div>}
//             {shopPhone   && <div style={S.shopSub}>📞 {shopPhone}</div>}
//             <div style={{ ...S.shopSub, marginTop: "6px", letterSpacing: "2px", fontSize: "10px", color: "#aaa" }}>
//               ━━━━━━━━━━━━━━━━━━━━━━━━━
//             </div>
//           </div>

//           {/* Invoice meta */}
//           <div style={{ marginBottom: "10px" }}>
//             {[
//               ["Invoice #",  <span style={S.invNum}>{order.id}</span>],
//               ["Date",       fmtDT(order.createdAt)],
//               ["Customer",   order.customerName || "Walk-in"],
//               ["Payment",    (order.method || order.paymentMethod || "Cash").charAt(0).toUpperCase() + (order.method || order.paymentMethod || "Cash").slice(1)],
//               ["Cashier",    order.cashier || "Owner"],
//             ].map(([k, v]) => (
//               <div key={k} style={S.metaRow}>
//                 <span style={S.metaKey}>{k}</span>
//                 <span style={S.metaValue}>{v}</span>
//               </div>
//             ))}
//           </div>

//           <div style={S.dashedDiv} />

//           {/* Items column headers */}
//           <div style={S.itemsHeader}>
//             <span>Item</span>
//             <span style={{ textAlign: "right" }}>Qty</span>
//             <span style={{ textAlign: "right" }}>Rate</span>
//             <span style={{ textAlign: "right" }}>Amt</span>
//           </div>

//           {/* Items */}
//           {(order.items || []).map((item, i) => {
//             const unitPrice = item.sell ?? item.price ?? 0;
//             const lineAmt   = item.qty * unitPrice;
//             return (
//               <div key={i} style={S.itemRow}>
//                 <div>
//                   <div style={S.itemName}>{item.name}</div>
//                   {item.disc > 0 && <div style={S.itemDisc}>Disc: {rs(item.disc)}/pc</div>}
//                 </div>
//                 <div style={S.numCell}>{item.qty}</div>
//                 <div style={S.numCell}>{rs(unitPrice)}</div>
//                 <div style={S.amtCell}>{rs(lineAmt)}</div>
//               </div>
//             );
//           })}

//           <div style={{ ...S.dashedDiv, borderTopStyle: "double", borderTopWidth: "3px", borderColor: "#999" }} />

//           {/* Totals */}
//           <div style={S.totalsBlock}>
//             <div style={S.totRow}>
//               <span style={S.totLabel}>Subtotal</span>
//               <span style={S.totVal}>{rs(order.subtotal ?? order.total)}</span>
//             </div>
//             {discAmt > 0 && (
//               <div style={S.totRow}>
//                 <span style={S.totLabel}>Discount</span>
//                 <span style={S.discVal}>− {rs(discAmt)}</span>
//               </div>
//             )}
//             {taxAmt > 0 && (
//               <div style={S.totRow}>
//                 <span style={S.totLabel}>Tax</span>
//                 <span style={S.totVal}>{rs(taxAmt)}</span>
//               </div>
//             )}
//             <div style={S.grandRow}>
//               <span>TOTAL</span>
//               <span style={S.grandAmt}>{rs(order.total)}</span>
//             </div>
//           </div>

//           {/* Credit block */}
//           {isCredit && (
//             <div style={S.creditBlock}>
//               <div style={S.creditRow}>
//                 <span style={S.creditLabel}>Paid Now</span>
//                 <span style={S.creditVal}>{rs(0)}</span>
//               </div>
//               <div style={S.creditRow}>
//                 <span style={S.creditLabel}>Balance Due</span>
//                 <span style={S.creditVal}>{rs(order.total)}</span>
//               </div>
//               {order.creditDueDate && (
//                 <div style={S.dueNote}>Due by: {fmtDate(order.creditDueDate)}</div>
//               )}
//             </div>
//           )}

//           {/* Status badge */}
//           <div style={S.statusWrap}>
//             <span style={S.statusBadge(order.status === "paid")}>
//               {order.status === "paid" ? "✅ PAID" : order.status === "credit" ? "📒 CREDIT" : order.status?.toUpperCase()}
//             </span>
//           </div>

//           {/* Barcode line */}
//           <div style={S.barcodeWrap}>
//             <div style={S.barcodeText}>||||| ||| || ||||| ||</div>
//             <div style={S.barcodeNum}>{order.id}</div>
//           </div>

//           {/* Footer */}
//           <div style={S.footerBlock}>
//             <div style={S.footerThank}>Thank you for your purchase!</div>
//             <div>Items once sold are not returnable</div>
//             <div>without this receipt within 3 days.</div>
//             <div style={S.footerPowered}>★ Powered by DukanDar Pro v5.0 ★</div>
//           </div>

//         </div>
//         {/* end thermal slip */}

//         {/* Bottom close */}
//         <div style={{
//           padding: "16px",
//           borderTop: "1px solid #f0f0f0",
//           backgroundColor: "#fff",
//           borderRadius: "0 0 20px 20px",
//         }}>
//           <button
//             onClick={onClose}
//             style={{
//               width: "100%",
//               padding: "13px",
//               borderRadius: "12px",
//               background: "#f3f4f6",
//               border: "none",
//               fontWeight: "700",
//               fontSize: "14px",
//               color: "#374151",
//               cursor: "pointer",
//             }}
//           >
//             Close & Continue
//           </button>
//         </div>
//       </div>

//       <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    SYNC STATUS
//    ══════════════════════════════════════════════════════════ */
// const SyncStatusIndicator = ({ pendingCount, isNetworkOnline, onSync, syncing }) => {
//   const [showPopup, setShowPopup] = useState(false);
//   if (pendingCount === 0 && isNetworkOnline) return null;
//   return (
//     <div className="fixed bottom-24 right-4 z-50">
//       <button onClick={() => setShowPopup(!showPopup)}
//         className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all ${pendingCount > 0 ? "bg-amber-500 hover:bg-amber-600" : isNetworkOnline ? "bg-emerald-500" : "bg-red-500"} text-white`}>
//         {syncing ? "⏳" : pendingCount > 0 ? "📤" : isNetworkOnline ? "☁️" : "📡"}
//       </button>
//       {showPopup && (
//         <div className="absolute bottom-14 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 w-64 border border-slate-200 dark:border-slate-700">
//           <div className="text-sm font-bold mb-2 text-slate-900 dark:text-white">Sync Status</div>
//           <div className="text-xs text-slate-500 mb-3">{isNetworkOnline ? "✅ Online" : "⚠️ Offline — Using Local Storage"}</div>
//           {pendingCount > 0 && <div className="text-xs text-amber-600 mb-3">{pendingCount} pending {pendingCount === 1 ? "operation" : "operations"}</div>}
//           <button onClick={onSync} disabled={syncing || !isNetworkOnline} className="w-full px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-50">
//             {syncing ? "Syncing..." : "Sync Now"}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    UI COMPONENTS
//    ══════════════════════════════════════════════════════════ */
// const Badge = ({ color, children, size = "sm" }) => {
//   const s = size === "lg" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
//   const c = { green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", blue: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", gray: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300", orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" };
//   return <span className={`inline-flex items-center ${s} rounded-full font-semibold ${c[color] || c.gray}`}>{children}</span>;
// };

// const Card = ({ children, className = "", onClick, selected = false }) => (
//   <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 transition-all ${selected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "border-slate-200 dark:border-slate-700"} ${className} ${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.98]" : ""}`}>{children}</div>
// );

// const Toast = ({ msg, type, onClose }) => {
//   useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
//   const colors = { success: "bg-emerald-500", error: "bg-red-500", info: "bg-sky-500", warning: "bg-amber-500" };
//   const icons  = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
//   return (
//     <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] ${colors[type]} text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-toast`}>
//       {icons[type]} {msg}
//     </div>
//   );
// };

// const Modal = ({ open, onClose, title, children, size = "md" }) => {
//   if (!open) return null;
//   const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
//   return (
//     <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
//       <div className={`bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl w-full ${sizes[size]} max-h-[92vh] overflow-y-auto shadow-2xl`}>
//         <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
//           <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
//           <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// };

// const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger = false, confirmText = "Confirm" }) => {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//       <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full">
//         <div className="text-3xl mb-3 text-center">{danger ? "⚠️" : "❓"}</div>
//         <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 text-center">{title}</h3>
//         <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center">{message}</p>
//         <div className="flex gap-3">
//           <Btn variant="secondary" onClick={onCancel} full>Cancel</Btn>
//           <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm} full>{confirmText}</Btn>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, helpText = "", min, max }) => (
//   <div className="mb-4">
//     {label && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
//     <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} required={required} min={min} max={max}
//       className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm font-medium" />
//     {helpText && <p className="text-xs text-slate-500 mt-1">💡 {helpText}</p>}
//   </div>
// );

// const Select = ({ label, value, onChange, options, helpText = "" }) => (
//   <div className="mb-4">
//     {label && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>}
//     <select value={value || ""} onChange={onChange}
//       className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors text-sm font-medium">
//       {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
//     </select>
//     {helpText && <p className="text-xs text-slate-500 mt-1">💡 {helpText}</p>}
//   </div>
// );

// const Btn = ({ children, onClick, variant = "primary", size = "md", className = "", disabled = false, full = false, type = "button" }) => {
//   const v = { primary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm", secondary: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300", danger: "bg-red-500 hover:bg-red-600 text-white", ghost: "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400", violet: "bg-violet-500 hover:bg-violet-600 text-white", amber: "bg-amber-500 hover:bg-amber-600 text-white" };
//   const s = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
//   return <button type={type} onClick={onClick} disabled={disabled} className={`${v[variant]} ${s[size]} font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${full ? "w-full" : ""} flex items-center justify-center gap-2 ${className}`}>{children}</button>;
// };

// const EmptyState = ({ icon, title, desc, action }) => (
//   <div className="flex flex-col items-center justify-center py-16 text-center">
//     <div className="text-5xl mb-4">{icon}</div>
//     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
//     <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{desc}</p>
//     {action}
//   </div>
// );

// const KPIGrid = ({ items }) => (
//   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//     {(items || []).map((item, i) => (
//       <Card key={i} className="p-4 text-center" onClick={item.onClick}>
//         <div className="text-2xl mb-1">{item.icon}</div>
//         <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{item.label}</div>
//         <div className="text-base font-black text-slate-900 dark:text-white leading-tight">{item.value}</div>
//         {item.change && <div className={`text-xs font-semibold mt-1 ${String(item.change).includes("+") ? "text-emerald-500" : item.change.toString().startsWith("-") ? "text-red-500" : "text-slate-400"}`}>{item.change}</div>}
//       </Card>
//     ))}
//   </div>
// );

// const TimelineItem = ({ icon, title, sub, time, color = "green" }) => {
//   const lineColor = { green:"bg-emerald-500", red:"bg-red-500", blue:"bg-sky-500", amber:"bg-amber-500", violet:"bg-violet-500" };
//   return (
//     <div className="flex gap-3">
//       <div className="flex flex-col items-center">
//         <div className={`w-8 h-8 rounded-full ${lineColor[color]||lineColor.green} flex items-center justify-center text-white text-sm flex-shrink-0`}>{icon}</div>
//         <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 mt-1 min-h-[16px]" />
//       </div>
//       <div className="pb-4 flex-1">
//         <div className="font-semibold text-slate-900 dark:text-white text-sm">{title}</div>
//         {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
//         <div className="text-xs text-slate-400 mt-0.5">{time}</div>
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    DASHBOARD
//    ══════════════════════════════════════════════════════════ */
// const Dashboard = ({ products, orders, customers, expenses, lang, setPage, setExternalCustomer, setExternalCreditModal }) => {
//   const L = lang === "ur";
//   const safeProducts   = Array.isArray(products)   ? products   : [];
//   const safeOrders     = Array.isArray(orders)     ? orders     : [];
//   const safeCustomers  = Array.isArray(customers)  ? customers  : [];

//   const todayStr   = new Date().toISOString().slice(0, 10);
//   const todayOrders     = safeOrders.filter(o => (o.createdAt||"").startsWith(todayStr));
//   const todaySales      = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
//   const todayProfit     = todayOrders.reduce((s, o) => s + (o.profit || 0), 0);
//   const thisMonthSales  = safeOrders.filter(o => (o.createdAt||"").startsWith(new Date().toISOString().slice(0,7))).reduce((s,o) => s+(o.total||0), 0);
//   const pendingUdhaar   = safeCustomers.reduce((s, c) => s+(c.udhaar||0), 0);
//   const lowStock        = safeProducts.filter(p => (p.stock||0) <= (p.minStock||p.lowStock||0));
//   const upcomingCredits = safeCustomers.filter(c => (c.udhaar||0) > 0 && c.creditDueDate && daysDiff(c.creditDueDate) <= 7);

//   const kpis = [
//     { icon:"💰", label: L?"آج کی فروخت":"Today Sales",    value: rs(todaySales),    change:"+12%",   onClick:() => setPage("orders") },
//     { icon:"📈", label: L?"مہینے کی فروخت":"Month Sales", value: rs(thisMonthSales), change:"+18%",  onClick:() => setPage("analytics") },
//     { icon:"🏦", label: L?"آج کا منافع":"Today Profit",   value: rs(todayProfit),   change:"+8%",    onClick:() => setPage("analytics") },
//     { icon:"🤝", label: L?"باقی ادھار":"Pending Credit",  value: rs(pendingUdhaar), change:`${upcomingCredits.length} due`, onClick:() => setPage("customers") },
//   ];

//   return (
//     <div className="space-y-5 pb-8">
//       <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
//         <p className="text-emerald-100 text-sm font-medium">{L?"خوش آمدید":"Welcome Back"} · {fmtDate(new Date().toISOString())}</p>
//         <h2 className="text-2xl font-black mt-1">{L?"علی جنرل اسٹور":"My Store"}</h2>
//         <div className="flex gap-6 mt-4 text-sm">
//           <div><div className="text-emerald-100 text-xs">{L?"آج کے آرڈر":"Today Orders"}</div><div className="text-2xl font-black">{todayOrders.length}</div></div>
//           <div><div className="text-emerald-100 text-xs">{L?"اسٹاک قدر":"Stock Value"}</div><div className="text-2xl font-black">{rs(safeProducts.reduce((s,p) => s+(p.stock||0)*(p.buy||0),0))}</div></div>
//           <div><div className="text-emerald-100 text-xs">{L?"ادھار واجب":"Credit Due"}</div><div className="text-2xl font-black">{upcomingCredits.length}</div></div>
//         </div>
//       </div>
//       <KPIGrid items={kpis} />
//       <div>
//         <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{L?"فوری عمل":"Quick Actions"}</h3>
//         <div className="grid grid-cols-4 gap-2">
//           {[["🛒",L?"نئی بلنگ":"New Sale","pos"],["📦",L?"اسٹاک":"Stock","inventory"],["👥",L?"گاہک":"Customers","customers"],["📊",L?"رپورٹ":"Reports","analytics"]].map(([ico,lbl,pg]) => (
//             <button key={pg} onClick={() => setPage(pg)} className="flex flex-col items-center p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 transition-all active:scale-95 gap-1">
//               <span className="text-2xl">{ico}</span>
//               <span className="text-xs font-bold text-center leading-tight">{lbl}</span>
//             </button>
//           ))}
//         </div>
//       </div>
//       {upcomingCredits.length > 0 && (
//         <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-xl p-4">
//           <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">🔔 {L?"قرض یاددہانی":"Credit Reminders"}</h3>
//           <div className="space-y-2">
//             {upcomingCredits.slice(0, 3).map(c => {
//               const diff = daysDiff(c.creditDueDate);
//               return (
//                 <div key={c.id} className="flex items-center justify-between">
//                   <div>
//                     <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">{c.name}</span>
//                     <span className="text-xs text-amber-700 dark:text-amber-300 ml-2">{diff < 0 ? `${Math.abs(diff)}d overdue` : `Due in ${diff}d`}</span>
//                   </div>
//                   <Badge color={diff < 0 ? "red" : "amber"}>{rs(c.udhaar)}</Badge>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}
//       {lowStock.length > 0 && (
//         <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4">
//           <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">⚠️ {L?"کم اسٹاک الرٹ":"Low Stock Alert"}</h3>
//           <div className="space-y-1">
//             {lowStock.slice(0, 4).map(p => (
//               <div key={p.id} className="flex items-center justify-between text-sm">
//                 <span className="text-red-900 dark:text-red-100">{p.name}</span>
//                 <Badge color="red">{p.stock} left</Badge>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//       <div>
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{L?"حالیہ فروخت":"Recent Sales"}</h3>
//           <button onClick={() => setPage("orders")} className="text-emerald-500 text-xs font-semibold">View All →</button>
//         </div>
//         <div className="space-y-2">
//           {safeOrders.slice(0, 4).map(o => (
//             <div key={o.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
//               <div className="flex items-center gap-3 flex-1">
//                 <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">🧾</div>
//                 <div>
//                   <div className="font-semibold text-slate-900 dark:text-white text-sm">{o.customerName}</div>
//                   <div className="text-xs text-slate-500">{o.id} · {fmtTime(o.createdAt)}</div>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className="font-black text-slate-900 dark:text-white text-sm">{rs(o.total)}</div>
//                 <Badge color={o.status==="paid"?"green":o.status==="credit"?"red":"amber"}>{o.status}</Badge>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    POS (uses upgraded ReceiptSlip)
//    ══════════════════════════════════════════════════════════ */
// const POS = ({ products, customers, setOrders, setProducts, setCustomers, showToast, lang, shopInfo }) => {
//   const [cart, setCart]                         = useState([]);
//   const [search, setSearch]                     = useState("");
//   const [activeCat, setActiveCat]               = useState("All");
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [payMethod, setPayMethod]               = useState("cash");
//   const [discount, setDiscount]                 = useState(0);
//   const [showCart, setShowCart]                 = useState(false);
//   const [showCustomerSearch, setShowCustomerSearch] = useState(false);
//   const [customerSearch, setCustomerSearch]     = useState("");
//   const [showConfirm, setShowConfirm]           = useState(false);
//   const [creditDueDate, setCreditDueDate]       = useState("");
//   const [isProcessing, setIsProcessing]         = useState(false);
//   const [showAddCustomer, setShowAddCustomer]   = useState(false);
//   const [newCustForm, setNewCustForm]           = useState({ name:"", phone:"", email:"", addr:"" });
//   const [savingCust, setSavingCust]             = useState(false);
//   const [receiptOrder, setReceiptOrder]         = useState(null);

//   const L              = lang === "ur";
//   const safeProducts   = Array.isArray(products)  ? products  : [];
//   const safeCustomers  = Array.isArray(customers) ? customers : [];

//   const filtered = safeProducts.filter(p =>
//     (activeCat === "All" || p.cat === p.category || p.cat === activeCat || p.category === activeCat) &&
//     (p.name?.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())))
//   );

//   const addToCart = p => {
//     if ((p.stock||0) <= 0) { showToast("Out of stock!", "error"); return; }
//     setCart(c => { const ex = c.find(i => i.pid === p.id); return ex ? c.map(i => i.pid===p.id ? {...i, qty:i.qty+1} : i) : [...c, { pid:p.id, name:p.name, buy:p.buy||p.cost||0, sell:p.sell||p.price||0, qty:1, disc:0 }]; });
//   };

//   const subtotal  = cart.reduce((s, i) => s + i.qty * i.sell, 0);
//   const totalDisc = cart.reduce((s, i) => s + i.disc * i.qty, 0) + +discount;
//   const total     = subtotal - totalDisc;
//   const profit    = cart.reduce((s, i) => s + i.qty * (i.sell - i.buy - (i.disc||0)), 0) - +discount;

//   const doCheckout = () => {
//     if (cart.length === 0) { showToast("Cart is empty!", "error"); return; }
//     if (!selectedCustomer)  { showToast("Please select a customer", "error"); return; }
//     setShowCart(false); setShowConfirm(true);
//   };

//   const saveNewCustomer = async () => {
//     if (!newCustForm.name || !newCustForm.phone) { showToast("Name & phone required", "error"); return; }
//     setSavingCust(true);
//     const nc = { ...newCustForm, id:Date.now(), udhaar:0, totalOrders:0, totalSpent:0, points:0, joined:new Date().toISOString().split("T")[0], creditDueDate:null, creditHistory:[], activityLog:[], editHistory:[] };
//     try {
//       const result = await addCustomer(nc);
//       if (result.success) { setCustomers(prev => [...prev, nc]); setSelectedCustomer(nc); showToast(`✅ ${nc.name} added!`, "success"); }
//       else { await queueOfflineOperation("addCustomer", { customer:nc }); setCustomers(prev => [...prev, nc]); setSelectedCustomer(nc); showToast("⚠️ Saved offline", "warning"); }
//     } catch { showToast("Error adding customer", "error"); }
//     setNewCustForm({ name:"", phone:"", email:"", addr:"" });
//     setShowAddCustomer(false); setShowCustomerSearch(false); setSavingCust(false);
//   };

//   const confirmCheckout = async () => {
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const inv = `INV-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random()*1000))}`;
//     const order = {
//       id: inv,
//       customerId: selectedCustomer.id, customerName: selectedCustomer.name,
//       cashier: "Ali",
//       items: cart.map(i => ({ pid:i.pid, productId:i.pid, name:i.name, qty:i.qty, buy:i.buy, sell:i.sell, price:i.sell, cost:i.buy, disc:i.disc, total:i.qty*i.sell })),
//       subtotal, disc:totalDisc, discountAmount:totalDisc, total, profit,
//       status: payMethod === "udhaar" ? "credit" : "paid",
//       method: payMethod, paymentMethod: payMethod,
//       udhaarAmt: payMethod === "udhaar" ? total : 0,
//       creditDueDate: payMethod === "udhaar" ? (creditDueDate || null) : null,
//       createdAt: today(), date: today(), notes:"",
//       timeline:[{ time:today(), evt:"Order created" }],
//       refunds:[], returnHistory:[]
//     };
//     const stockUpdates = cart.map(item => ({ id:item.pid, delta:-item.qty, reason:`Sale ${inv}`, by:"Ali" }));
//     try {
//       const result = await addOrder(order, stockUpdates);
//       if (result.success) {
//         setOrders(prev => [order, ...prev]);
//         setProducts(prev => prev.map(p => { const ci = cart.find(i => i.pid===p.id); return ci ? {...p, stock:Math.max(0,(p.stock||0)-ci.qty)} : p; }));
//         if (payMethod === "udhaar") {
//           try { await addCustomerCreditPayment(selectedCustomer.id, total, creditDueDate||selectedCustomer.creditDueDate, inv); setCustomers(prev => prev.map(c => c.id===selectedCustomer.id ? {...c, udhaar:(c.udhaar||0)+total, creditDueDate:creditDueDate||c.creditDueDate} : c)); } catch {}
//         }
//         showToast(`✅ ${inv} saved!`, "success");
//       } else if (result.queued) {
//         setOrders(prev => [order, ...prev]);
//         setProducts(prev => prev.map(p => { const ci = cart.find(i => i.pid===p.id); return ci ? {...p, stock:Math.max(0,(p.stock||0)-ci.qty)} : p; }));
//         if (payMethod === "udhaar") setCustomers(prev => prev.map(c => c.id===selectedCustomer.id ? {...c, udhaar:(c.udhaar||0)+total} : c));
//         showToast("⚠️ Offline: Order saved locally", "warning");
//       } else throw new Error(result.error || "Failed");
//     } catch (error) {
//       showToast("Error: " + error.message, "error");
//       setOrders(prev => [order, ...prev]);
//       setProducts(prev => prev.map(p => { const ci = cart.find(i => i.pid===p.id); return ci ? {...p, stock:Math.max(0,(p.stock||0)-ci.qty)} : p; }));
//     } finally {
//       setReceiptOrder(order);
//       setCart([]); setSelectedCustomer(null); setDiscount(0); setShowConfirm(false); setCreditDueDate(""); setIsProcessing(false);
//     }
//   };

//   return (
//     <div className="flex flex-col pb-24">
//       {/* Upgraded receipt slip overlay */}
//       {receiptOrder && (
//         <ReceiptSlip
//           order={receiptOrder}
//           shopName={shopInfo?.name || "My Store"}
//           shopPhone={shopInfo?.phone || ""}
//           shopAddress={shopInfo?.address || ""}
//           onClose={() => setReceiptOrder(null)}
//         />
//       )}

//       <div className="space-y-3 mb-4">
//         <button onClick={() => setShowCustomerSearch(true)} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-400 transition-colors">
//           <div className="flex items-center gap-3">
//             <span className="text-2xl">👤</span>
//             <div className="text-left">
//               <div className={`text-sm font-semibold ${selectedCustomer ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{selectedCustomer ? selectedCustomer.name : (L?"گاہک منتخب کریں":"Select Customer")}</div>
//               {selectedCustomer && <div className="text-xs text-slate-500">{selectedCustomer.phone}</div>}
//             </div>
//           </div>
//           {selectedCustomer?.udhaar > 0 && <Badge color="red">Owes {rs(selectedCustomer.udhaar)}</Badge>}
//         </button>
//         <div className="relative">
//           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
//           <input value={search} onChange={e => setSearch(e.target.value)} placeholder={L?"پروڈکٹ تلاش کریں...":"Search products..."}
//             className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none text-sm" />
//         </div>
//       </div>

//       <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
//         {CATEGORIES.map(cat => <button key={cat} onClick={() => setActiveCat(cat)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCat===cat ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{cat}</button>)}
//       </div>

//       <div className="grid grid-cols-2 gap-3 mb-8">
//         {filtered.map(p => {
//           const inCart = cart.find(i => i.pid === p.id);
//           const out    = (p.stock||0) <= 0;
//           return (
//             <button key={p.id} onClick={() => !out && addToCart(p)} disabled={out}
//               className={`relative p-4 rounded-2xl text-left border-2 transition-all ${inCart ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"} ${out ? "opacity-40" : ""}`}>
//               {inCart && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">{inCart.qty}</div>}
//               <div className="text-2xl mb-2">📦</div>
//               <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight mb-1 line-clamp-2">{p.name}</div>
//               <div className="text-emerald-600 font-black text-sm">{rs(p.sell||p.price||0)}</div>
//               <div className="text-xs text-slate-400 mt-0.5">{out ? "Out of stock" : `${p.stock} ${p.unit||"pcs"}`}</div>
//             </button>
//           );
//         })}
//       </div>

//       {cart.length > 0 && (
//         <div className="fixed bottom-20 left-4 right-4 z-50">
//           <button onClick={() => setShowCart(true)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-base shadow-2xl flex items-center justify-between px-5 active:scale-98 transition-all">
//             <div className="flex items-center gap-3">
//               <span className="bg-white text-emerald-600 w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm">{cart.reduce((s,i)=>s+i.qty,0)}</span>
//               <span>{L?"کارٹ":"Cart"}</span>
//             </div>
//             <span>{rs(total)}</span>
//           </button>
//         </div>
//       )}

//       <Modal open={showCart} onClose={() => setShowCart(false)} title={`🛒 Cart (${cart.reduce((s,i)=>s+i.qty,0)} items)`} size="lg">
//         <div className="space-y-3 mb-4">
//           {cart.map(item => (
//             <div key={item.pid} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
//               <div className="flex items-start justify-between mb-2">
//                 <div><div className="font-bold text-sm">{item.name}</div><div className="text-xs text-slate-500">{rs(item.sell)} each</div></div>
//                 <button onClick={() => setCart(c => c.filter(i => i.pid!==item.pid))} className="text-red-400">✕</button>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="flex items-center gap-1 bg-white dark:bg-slate-600 rounded-lg p-1">
//                   <button onClick={() => { if (item.qty<=1) setCart(c=>c.filter(i=>i.pid!==item.pid)); else setCart(c=>c.map(i=>i.pid===item.pid?{...i,qty:i.qty-1}:i)); }} className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-500 flex items-center justify-center font-bold">−</button>
//                   <span className="w-8 text-center font-black text-sm">{item.qty}</span>
//                   <button onClick={() => setCart(c=>c.map(i=>i.pid===item.pid?{...i,qty:i.qty+1}:i))} className="w-7 h-7 rounded-md bg-emerald-500 text-white flex items-center justify-center font-bold">+</button>
//                 </div>
//                 <div className="text-right flex-1"><div className="font-black text-sm">{rs(item.qty*item.sell)}</div><div className="text-xs text-emerald-500">+{rs(item.qty*(item.sell-item.buy))}</div></div>
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4 space-y-2 border border-slate-200 dark:border-slate-600">
//           <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Subtotal</span><span className="font-semibold">{rs(subtotal)}</span></div>
//           <div className="flex justify-between items-center text-sm"><span className="text-slate-600 dark:text-slate-400">Discount</span><input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" /></div>
//           <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between"><span className="font-bold">Total</span><span className="font-black text-xl text-emerald-600">{rs(total)}</span></div>
//         </div>
//         <div className="mb-4">
//           <div className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Payment Method</div>
//           <div className="grid grid-cols-3 gap-2">
//             {[["cash","💵","Cash"],["online","📱","Online"],["udhaar","📒","Credit"]].map(([v,ico,lbl]) => (
//               <button key={v} onClick={() => setPayMethod(v)} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${payMethod===v ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"}`}>
//                 <span className="text-xl mb-1">{ico}</span><span className="text-xs font-bold">{lbl}</span>
//               </button>
//             ))}
//           </div>
//           {payMethod === "udhaar" && <div className="mt-3"><Input label="Credit Due Date (optional)" type="date" value={creditDueDate} onChange={e=>setCreditDueDate(e.target.value)} /></div>}
//         </div>
//         <div className="flex gap-2">
//           <Btn variant="secondary" onClick={() => setShowCart(false)} full>Cancel</Btn>
//           <Btn variant="primary" onClick={doCheckout} full disabled={isProcessing}>{isProcessing?"Processing...":"✅ Complete"}</Btn>
//         </div>
//       </Modal>

//       <Modal open={showCustomerSearch} onClose={() => { setShowCustomerSearch(false); setShowAddCustomer(false); }} title={L?"گاہک منتخب کریں":"Select Customer"}>
//         {!showAddCustomer ? (
//           <>
//             <div className="mb-3"><Btn variant="violet" onClick={() => setShowAddCustomer(true)} full>➕ {L?"نیا گاہک بنائیں":"Create New Customer"}</Btn></div>
//             <div className="relative mb-3"><Input placeholder={L?"نام یا نمبر...":"Name or phone..."} value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} /></div>
//             <div className="space-y-2 max-h-80 overflow-y-auto">
//               {safeCustomers.filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone&&c.phone.includes(customerSearch))).map(c => (
//                 <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(""); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
//                   <div><div className="font-bold text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.phone}</div></div>
//                   {c.udhaar > 0 && <Badge color="red">{rs(c.udhaar)}</Badge>}
//                 </button>
//               ))}
//             </div>
//           </>
//         ) : (
//           <div>
//             <button onClick={() => setShowAddCustomer(false)} className="flex items-center gap-1 text-emerald-500 font-bold text-sm mb-4">← Back</button>
//             <Input label="Full Name *" value={newCustForm.name} onChange={e=>setNewCustForm({...newCustForm,name:e.target.value})} required />
//             <Input label="Phone *" value={newCustForm.phone} onChange={e=>setNewCustForm({...newCustForm,phone:e.target.value})} type="tel" required />
//             <Input label="Email" value={newCustForm.email} onChange={e=>setNewCustForm({...newCustForm,email:e.target.value})} type="email" />
//             <Input label="Address" value={newCustForm.addr} onChange={e=>setNewCustForm({...newCustForm,addr:e.target.value})} />
//             <div className="flex gap-2">
//               <Btn variant="secondary" onClick={() => setShowAddCustomer(false)} full>Cancel</Btn>
//               <Btn variant="primary" onClick={saveNewCustomer} disabled={savingCust} full>{savingCust?"Saving...":"✅ Save & Select"}</Btn>
//             </div>
//           </div>
//         )}
//       </Modal>

//       <ConfirmDialog open={showConfirm} title="Confirm Sale"
//         message={`Complete sale for ${selectedCustomer?.name}? Total: ${rs(total)} via ${payMethod}`}
//         onConfirm={confirmCheckout} onCancel={() => setShowConfirm(false)} confirmText="Complete Sale" />
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    INVENTORY
//    ══════════════════════════════════════════════════════════ */
// const Inventory = ({ products, setProducts, showToast, lang }) => {
//   const [search, setSearch]               = useState("");
//   const [activeCat, setActiveCat]         = useState("All");
//   const [showAdd, setShowAdd]             = useState(false);
//   const [editProduct, setEditProduct]     = useState(null);
//   const [showStockHistory, setShowStockHistory] = useState(null);
//   const [isProcessing, setIsProcessing]   = useState(false);
//   const [form, setForm]                   = useState({ name:"", nameUr:"", sku:"", cat:"Grocery", buy:"", sell:"", stock:"", minStock:"5", unit:"pcs", expiry:"", supplier:"", barcode:"" });
//   const [deleteConfirm, setDeleteConfirm] = useState(null);
//   const L            = lang === "ur";
//   const safeProducts = Array.isArray(products) ? products : [];

//   const filtered = safeProducts.filter(p => (activeCat==="All"||p.cat===activeCat||p.category===activeCat) && (p.name?.toLowerCase().includes(search.toLowerCase())||(p.sku&&p.sku.toLowerCase().includes(search.toLowerCase()))));

//   const openEdit = p => { setEditProduct(p.id); setForm({...p, buy:String(p.buy||p.cost||""), sell:String(p.sell||p.price||""), stock:String(p.stock||""), minStock:String(p.minStock||p.lowStock||"5")}); setShowAdd(true); };

//   const saveProduct = async () => {
//     if (!form.name||!form.sell) { showToast("Name & sell price required","error"); return; }
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const updated = {...form, buy:+form.buy, sell:+form.sell, cost:+form.buy, price:+form.sell, stock:+form.stock, minStock:+form.minStock, lowStock:+form.minStock, category:form.cat};
//     if (editProduct) {
//       const old = safeProducts.find(p=>p.id===editProduct);
//       const finalProduct = {...updated, id:editProduct, stockHistory:old.stockHistory||[], editHistory:[...(old.editHistory||[]),{date:today(),by:"Owner"}]};
//       try {
//         const result = await updateProduct(editProduct, finalProduct);
//         if (result.success) { setProducts(prev=>prev.map(p=>p.id===editProduct?finalProduct:p)); showToast("✅ Product updated!","success"); }
//         else { await queueOfflineOperation("updateProduct",{id:editProduct,product:finalProduct}); setProducts(prev=>prev.map(p=>p.id===editProduct?finalProduct:p)); showToast("⚠️ Saved offline","warning"); }
//       } catch(e) { showToast("Error: "+e.message,"error"); }
//     } else {
//       const newProduct = {...updated, id:Date.now(), stockHistory:[], editHistory:[]};
//       try {
//         const result = await addProduct(newProduct);
//         if (result.success) { setProducts(prev=>[...prev,newProduct]); showToast("✅ Product added!","success"); }
//         else { await queueOfflineOperation("addProduct",{product:newProduct}); setProducts(prev=>[...prev,newProduct]); showToast("⚠️ Saved offline","warning"); }
//       } catch(e) { showToast("Error: "+e.message,"error"); }
//     }
//     setShowAdd(false); setIsProcessing(false);
//   };

//   const adjustStock = async (productId, delta, reason) => {
//     const product   = safeProducts.find(p=>p.id===productId);
//     const newStock  = Math.max(0,(product.stock||0)+delta);
//     try {
//       const result = await patchProductStock(productId, delta, reason, "Owner");
//       if (result.success) { setProducts(prev=>prev.map(p=>p.id===productId?{...p,stock:newStock,stockHistory:[...(p.stockHistory||[]),{date:today(),change:delta,reason:reason||"Manual",by:"Owner"}]}:p)); showToast("✅ Stock updated!","success"); }
//       else { await queueOfflineOperation("adjustStock",{productId,delta,reason,by:"Owner"}); setProducts(prev=>prev.map(p=>p.id===productId?{...p,stock:newStock}:p)); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//   };

//   const handleDelete = async id => {
//     try { const result = await deleteProduct(id); if (result.success||result.queued) { setProducts(prev=>prev.filter(p=>p.id!==id)); showToast("✅ Deleted!","success"); } } catch(e) { showToast("Error: "+e.message,"error"); }
//     setDeleteConfirm(null);
//   };

//   const stockValue = safeProducts.reduce((s,p)=>s+((p.stock||0)*(p.buy||p.cost||0)),0);
//   const lowCount   = safeProducts.filter(p=>(p.stock||0)<=(p.minStock||p.lowStock||0)).length;

//   return (
//     <div className="space-y-4 pb-8">
//       <KPIGrid items={[
//         {icon:"📦",label:"Total SKUs",value:safeProducts.length,change:`${lowCount} low`},
//         {icon:"⚠️",label:"Low Stock",value:lowCount,change:"Check now"},
//         {icon:"💼",label:"Stock Value",value:rs(stockValue),change:null},
//         {icon:"📊",label:"Avg Margin",value:safeProducts.length>0?`${Math.round(safeProducts.reduce((s,p)=>s+(((p.sell||p.price||0)-(p.buy||p.cost||0))/(p.sell||p.price||1))*100,0)/safeProducts.length)}%`:"0%",change:null},
//       ]} />
//       <div className="flex gap-3">
//         <div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
//           <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 focus:outline-none" />
//         </div>
//         <Btn variant="primary" onClick={() => { setForm({name:"",nameUr:"",sku:"",cat:"Grocery",buy:"",sell:"",stock:"",minStock:"5",unit:"pcs",expiry:"",supplier:"",barcode:""}); setEditProduct(null); setShowAdd(true); }}>+ Add</Btn>
//       </div>
//       <div className="flex gap-2 overflow-x-auto no-scrollbar">
//         {CATEGORIES.map(cat=><button key={cat} onClick={()=>setActiveCat(cat)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCat===cat?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{cat}</button>)}
//       </div>
//       <div className="space-y-3">
//         {filtered.map(p => {
//           const sell     = p.sell||p.price||0;
//           const buy      = p.buy||p.cost||0;
//           const minStock = p.minStock||p.lowStock||0;
//           const isLow    = (p.stock||0) <= minStock;
//           const stockPct = Math.min(100,((p.stock||0)/((minStock||5)*3))*100);
//           return (
//             <Card key={p.id} className={`p-4 ${isLow?"border-amber-300 dark:border-amber-700":""}`}>
//               <div className="flex items-start justify-between mb-3">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-0.5 flex-wrap">
//                     <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
//                     {p.nameUr&&<span className="text-xs text-slate-500">{p.nameUr}</span>}
//                     {isLow&&<Badge color="amber">Low</Badge>}
//                     {p.stock===0&&<Badge color="red">Out</Badge>}
//                   </div>
//                   <div className="text-xs text-slate-500">{p.sku} · {p.cat||p.category} · {p.supplier}</div>
//                 </div>
//                 <div className="flex gap-1 flex-shrink-0">
//                   <button onClick={() => setShowStockHistory(p)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold hover:bg-slate-200">📜</button>
//                   <button onClick={() => openEdit(p)} className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200">✏️</button>
//                   <button onClick={() => setDeleteConfirm(p.id)} className="px-2 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-200">🗑️</button>
//                 </div>
//               </div>
//               <div className="grid grid-cols-4 gap-2 mb-3">
//                 {[{l:"Buy",v:rs(buy),c:""},{l:"Sell",v:rs(sell),c:"text-emerald-600 font-bold"},{l:"Stock",v:`${p.stock} ${p.unit||"pcs"}`,c:isLow?"text-amber-500 font-bold":""},{l:"Margin",v:`${sell?Math.round(((sell-buy)/sell)*100):0}%`,c:"text-violet-600"}].map(({l,v,c})=>(
//                   <div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className={`font-bold mt-0.5 text-xs ${c}`}>{v}</div></div>
//                 ))}
//               </div>
//               <div className="mb-3">
//                 <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Stock level</span><span>{p.stock||0}/{Math.max((minStock||5)*3,1)} {p.unit||"pcs"}</span></div>
//                 <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
//                   <div className={`h-full rounded-full transition-all ${isLow?"bg-amber-500":p.stock===0?"bg-red-500":"bg-emerald-500"}`} style={{width:`${stockPct}%`}} />
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <Btn variant="secondary" size="sm" onClick={() => adjustStock(p.id,-1,"Manual -1")}>−1</Btn>
//                 <Btn variant="primary" size="sm" onClick={() => adjustStock(p.id,1,"Manual +1")}>+1</Btn>
//                 <Btn variant="secondary" size="sm" onClick={() => { const qty=prompt("Add stock quantity:"); if(qty&&+qty>0) adjustStock(p.id,+qty,"Stock added"); }}>+ Add</Btn>
//                 <Btn variant="secondary" size="sm" onClick={() => { const qty=prompt("Reduce stock by:"); if(qty&&+qty>0) adjustStock(p.id,-qty,"Stock reduced"); }}>− Reduce</Btn>
//               </div>
//             </Card>
//           );
//         })}
//       </div>
//       <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editProduct?"✏️ Edit Product":"➕ Add Product"} size="lg">
//         <div className="grid grid-cols-2 gap-x-4">
//           <div className="col-span-2"><Input label="Product Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g., Basmati Rice 5kg" required /></div>
//           <div className="col-span-2"><Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})} placeholder="اردو نام" /></div>
//           <Input label="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="GR001" />
//           <Input label="Barcode" value={form.barcode||""} onChange={e=>setForm({...form,barcode:e.target.value})} placeholder="123456789" />
//           <div className="col-span-2"><Select label="Category" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} options={CATEGORIES.slice(1).map(c=>({value:c,label:c}))} /></div>
//           <Input label="Cost Price *" type="number" value={form.buy} onChange={e=>setForm({...form,buy:e.target.value})} placeholder="0" />
//           <Input label="Sell Price *" type="number" value={form.sell} onChange={e=>setForm({...form,sell:e.target.value})} placeholder="0" />
//           <Input label="Stock Qty" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} placeholder="0" />
//           <Input label="Min Stock" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} placeholder="5" />
//           <Select label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} options={["pcs","kg","l","bag","box","pkt","btl","tin","strip"].map(u=>({value:u,label:u}))} />
//           <Input label="Expiry" type="month" value={form.expiry||""} onChange={e=>setForm({...form,expiry:e.target.value})} />
//           <div className="col-span-2"><Input label="Supplier" value={form.supplier||""} onChange={e=>setForm({...form,supplier:e.target.value})} placeholder="Supplier name" /></div>
//         </div>
//         {form.buy&&form.sell&&<div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm"><span className="text-slate-600 dark:text-slate-400">Profit per unit: </span><span className="font-black text-emerald-600">{rs(+form.sell-+form.buy)} ({Math.round((+form.sell-+form.buy)/+form.sell*100)}%)</span></div>}
//         <div className="flex gap-2"><Btn variant="secondary" onClick={() => setShowAdd(false)} full>Cancel</Btn><Btn variant="primary" onClick={saveProduct} full disabled={isProcessing}>{isProcessing?"Saving...":"💾 Save Product"}</Btn></div>
//       </Modal>
//       <Modal open={!!showStockHistory} onClose={() => setShowStockHistory(null)} title={`📜 ${showStockHistory?.name} History`} size="md">
//         {showStockHistory && (
//           <div className="space-y-2 max-h-80 overflow-y-auto">
//             {(!showStockHistory.stockHistory||showStockHistory.stockHistory.length===0)?<EmptyState icon="📊" title="No history" desc="Stock changes will appear here" />:
//               [...showStockHistory.stockHistory].reverse().map((h,i)=>(
//                 <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-sm">
//                   <div><div className="font-semibold">{h.reason}</div><div className="text-xs text-slate-500">{fmtDT(h.date)} · by {h.by}</div></div>
//                   <Badge color={h.change>0?"green":"red"}>{h.change>0?"+":""}{h.change}</Badge>
//                 </div>
//               ))}
//           </div>
//         )}
//       </Modal>
//       <ConfirmDialog open={!!deleteConfirm} title="Delete Product?" message="This will permanently remove the product." danger onConfirm={() => handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} confirmText="Delete" />
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    ORDER HISTORY (uses upgraded ReceiptSlip for re-view)
//    ══════════════════════════════════════════════════════════ */
// const OrdersHistory = ({ orders, products, setOrders, setProducts, setCustomers, customers, showToast, lang }) => {
//   const [search, setSearch]             = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [expandedId, setExpandedId]     = useState(null);
//   const [showReturnModal, setShowReturnModal] = useState(null);
//   const [returnQty, setReturnQty]       = useState({});
//   const [returnReason, setReturnReason] = useState("");
//   const [dateFrom, setDateFrom]         = useState("");
//   const [dateTo, setDateTo]             = useState("");
//   const [showConfirm, setShowConfirm]   = useState(false);
//   const [viewReceipt, setViewReceipt]   = useState(null);
//   const L = lang === "ur";
//   const safeOrders    = Array.isArray(orders)    ? orders    : [];
//   const safeCustomers = Array.isArray(customers) ? customers : [];

//   const filtered = safeOrders.filter(o => {
//     const ms  = o.id?.toLowerCase().includes(search.toLowerCase())||o.customerName?.toLowerCase().includes(search.toLowerCase());
//     const mst = filterStatus==="all"||o.status===filterStatus||(filterStatus==="returned"&&o.returnHistory?.length>0);
//     const mdf = !dateFrom||o.createdAt>=dateFrom;
//     const mdt = !dateTo  ||o.createdAt<=dateTo+"T23:59";
//     return ms&&mst&&mdf&&mdt;
//   });

//   const initReturn = order => {
//     const init = {};
//     order.items.forEach(item => { init[`${order.id}-${item.pid||item.productId}`]=item.qty; });
//     setReturnQty(init); setReturnReason(""); setShowReturnModal(order.id);
//   };

//   const doReturn = async () => {
//     const order = safeOrders.find(o=>o.id===showReturnModal);
//     if (!order) return;
//     const returnedItems = order.items.map(item => ({...item, returnedQty:returnQty[`${order.id}-${item.pid||item.productId}`]||0})).filter(i=>i.returnedQty>0);
//     const refundAmt     = returnedItems.reduce((s,i)=>s+i.returnedQty*(i.sell||i.price||0),0);
//     const allReturned   = returnedItems.every(ri=>{const orig=order.items.find(i=>(i.pid||i.productId)===(ri.pid||ri.productId));return ri.returnedQty>=orig.qty;})&&returnedItems.length===order.items.length;
//     const returnRecord  = {date:today(),items:returnedItems,reason:returnReason,refundAmount:refundAmt,by:"Owner"};
//     try {
//       const result = await updateOrderStatus(order.id, allReturned?"returned":order.status, {returnRecord});
//       if (result.success) {
//         setOrders(prev=>prev.map(o=>o.id===showReturnModal?{...o,status:allReturned?"returned":o.status,returnHistory:[...(o.returnHistory||[]),returnRecord]}:o));
//         setProducts(prev=>prev.map(p=>{const ri=returnedItems.find(i=>(i.pid||i.productId)===p.id);return ri?{...p,stock:(p.stock||0)+ri.returnedQty}:p;}));
//         showToast(`✅ Return recorded! ${rs(refundAmt)} refunded`,"success");
//       } else { await queueOfflineOperation("processReturn",{orderId:showReturnModal,returnedItems,reason:returnReason,refundAmount:refundAmt}); showToast("⚠️ Return saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowReturnModal(null); setShowConfirm(false); setReturnQty({}); setReturnReason("");
//   };

//   const statusBadge = o => {
//     if (o.returnHistory?.length>0&&o.status!=="returned") return <Badge color="orange">Partial Return</Badge>;
//     const c = {paid:"green",credit:"red",returned:"amber"};
//     return <Badge color={c[o.status]||"gray"}>{o.status}</Badge>;
//   };

//   return (
//     <div className="space-y-4 pb-8">
//       {viewReceipt && <ReceiptSlip order={viewReceipt} onClose={() => setViewReceipt(null)} />}
//       <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
//         <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"آرڈر تلاش کریں...":"Search orders..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none" />
//       </div>
//       <div className="flex gap-2 overflow-x-auto no-scrollbar">
//         {[["all","All"],["paid","✅ Paid"],["credit","📒 Credit"],["returned","🔄 Returned"]].map(([v,l])=>(
//           <button key={v} onClick={() => setFilterStatus(v)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus===v?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>
//         ))}
//       </div>
//       <div className="flex gap-2">
//         <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs" />
//         <span className="text-slate-400 self-center">→</span>
//         <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs" />
//       </div>
//       <div className="text-xs text-slate-500">{filtered.length} orders · Total: {rs(filtered.reduce((s,o)=>s+(o.total||0),0))} · Profit: {rs(filtered.reduce((s,o)=>s+(o.profit||0),0))}</div>
//       <div className="space-y-3">
//         {filtered.length===0?<EmptyState icon="🧾" title="No orders found" desc="Try adjusting your filters" />:filtered.map(o=>(
//           <Card key={o.id} className="p-4">
//             <div className="flex items-start justify-between mb-2 cursor-pointer" onClick={() => setExpandedId(expandedId===o.id?null:o.id)}>
//               <div>
//                 <div className="flex items-center gap-2 mb-1 flex-wrap">
//                   <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{o.id}</span>
//                   {statusBadge(o)}<Badge color="gray">{o.method||o.paymentMethod}</Badge>
//                 </div>
//                 <div className="font-bold text-slate-900 dark:text-white">{o.customerName}</div>
//                 <div className="text-xs text-slate-500">{o.cashier} · {fmtDT(o.createdAt)}</div>
//               </div>
//               <div className="text-right">
//                 <div className="font-black text-slate-900 dark:text-white">{rs(o.total)}</div>
//                 <div className="text-xs text-emerald-500">+{rs(o.profit)}</div>
//                 <span className="text-slate-400 text-xs" style={{transform:expandedId===o.id?"rotate(180deg)":"",display:"inline-block"}}>▾</span>
//               </div>
//             </div>
//             {expandedId===o.id&&(
//               <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
//                 <div className="text-xs font-bold text-slate-500 uppercase">Items</div>
//                 {o.items?.map((item,i)=>(
//                   <div key={i} className="flex items-center justify-between text-sm py-1">
//                     <div><span className="font-semibold">{item.name}</span><span className="text-slate-400"> ×{item.qty}</span></div>
//                     <div className="text-right"><div className="font-bold">{rs(item.qty*(item.sell||item.price||0))}</div><div className="text-xs text-emerald-500">+{rs(item.qty*((item.sell||item.price||0)-(item.buy||item.cost||0)))}</div></div>
//                   </div>
//                 ))}
//                 <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm space-y-1">
//                   <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{rs(o.subtotal)}</span></div>
//                   {(o.disc||o.discountAmount||0)>0&&<div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-red-500">-{rs(o.disc??o.discountAmount)}</span></div>}
//                   <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-600 pt-1 mt-1"><span>Total</span><span>{rs(o.total)}</span></div>
//                 </div>
//                 <div className="flex gap-2">
//                   <Btn variant="secondary" size="sm" onClick={() => setViewReceipt(o)} full>🧾 View Receipt</Btn>
//                   {o.status!=="returned"&&<Btn variant="danger" size="sm" onClick={() => initReturn(o)} full>🔄 Return</Btn>}
//                 </div>
//               </div>
//             )}
//           </Card>
//         ))}
//       </div>
//       <Modal open={!!showReturnModal} onClose={() => setShowReturnModal(null)} title="🔄 Return Order Items" size="md">
//         {showReturnModal&&(
//           <div className="space-y-4">
//             <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">⚠️ Returned items will be added back to inventory.</div>
//             {safeOrders.find(o=>o.id===showReturnModal)?.items.map(item=>{
//               const pid=item.pid||item.productId;
//               const alreadyReturned=safeOrders.find(o=>o.id===showReturnModal)?.returnHistory?.reduce((s,r)=>{const ri=r.items.find(i=>(i.pid||i.productId)===pid);return s+(ri?.returnedQty||0);},[0])||0;
//               const maxReturn=item.qty-alreadyReturned;
//               return (
//                 <div key={pid} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700 space-y-2">
//                   <div className="flex items-center justify-between">
//                     <span className="font-semibold text-sm">{item.name}</span>
//                     <div className="text-right text-xs text-slate-500"><div>Ordered: {item.qty}</div>{alreadyReturned>0&&<div className="text-orange-500">Returned: {alreadyReturned}</div>}</div>
//                   </div>
//                   {maxReturn<=0?<div className="text-xs text-slate-400">Fully returned</div>:(
//                     <div className="flex items-center gap-2">
//                       <span className="text-xs text-slate-500">Return qty:</span>
//                       <input type="number" min="0" max={maxReturn} value={returnQty[`${showReturnModal}-${pid}`]??item.qty}
//                         onChange={e=>setReturnQty(q=>({...q,[`${showReturnModal}-${pid}`]:Math.min(maxReturn,Math.max(0,+e.target.value))}))}
//                         className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-600 text-sm" />
//                       <span className="text-xs text-emerald-600">= {rs((returnQty[`${showReturnModal}-${pid}`]??item.qty)*(item.sell||item.price||0))}</span>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//             <Input label="Return Reason *" value={returnReason} onChange={e=>setReturnReason(e.target.value)} placeholder="e.g., Damaged, Wrong item" required />
//             <div className="flex gap-2">
//               <Btn variant="secondary" onClick={() => setShowReturnModal(null)} full>Cancel</Btn>
//               <Btn variant="danger" onClick={() => { if (!returnReason){showToast("Return reason required","error");return;} setShowConfirm(true); }} full>✅ Confirm Return</Btn>
//             </div>
//           </div>
//         )}
//       </Modal>
//       <ConfirmDialog open={showConfirm} title="Confirm Return?" message={`Stock will be restored. Reason: ${returnReason}`} onConfirm={doReturn} onCancel={() => setShowConfirm(false)} danger confirmText="Process Return" />
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    CUSTOMERS
//    ══════════════════════════════════════════════════════════ */
// const Customers = ({ customers, setCustomers, orders, showToast, lang, externalSelected, externalCreditModal, clearExternal }) => {
//   const [search, setSearch]                     = useState("");
//   const [selected, setSelected]                 = useState(externalSelected||null);
//   const [showAdd, setShowAdd]                   = useState(false);
//   const [showEdit, setShowEdit]                 = useState(false);
//   const [showCreditModal, setShowCreditModal]   = useState(externalCreditModal||null);
//   const [creditPayment, setCreditPayment]       = useState("");
//   const [newDueDate, setNewDueDate]             = useState("");
//   const [showConfirm, setShowConfirm]           = useState(false);
//   const [showEditConfirm, setShowEditConfirm]   = useState(false);
//   const [isProcessing, setIsProcessing]         = useState(false);
//   const [form, setForm]                         = useState({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""});
//   const [activeTab, setActiveTab]               = useState("overview");
//   const L = lang === "ur";
//   const safeCustomers = Array.isArray(customers) ? customers : [];
//   const safeOrders    = Array.isArray(orders)    ? orders    : [];

//   useEffect(() => { if (externalSelected)   setSelected(externalSelected); }, [externalSelected]);
//   useEffect(() => { if (externalCreditModal) setShowCreditModal(externalCreditModal); }, [externalCreditModal]);

//   const filtered = safeCustomers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase())||(c.phone&&c.phone.includes(search)));

//   const handleCreditPayment = async customerId => {
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const payment  = +creditPayment;
//     const customer = safeCustomers.find(c=>c.id===customerId);
//     if (payment<=0||payment>customer.udhaar) { showToast("Invalid amount","error"); setIsProcessing(false); return; }
//     const newUdhaar = Math.max(0,(customer.udhaar||0)-payment);
//     try {
//       const result = await addCustomerCreditPayment(customerId,payment,newDueDate||customer.creditDueDate,"");
//       if (result.success) { setCustomers(prev=>prev.map(c=>c.id===customerId?{...c,udhaar:newUdhaar,creditDueDate:newDueDate||c.creditDueDate,creditHistory:[...(c.creditHistory||[]),{date:today(),amount:payment,type:"payment",cashier:"Owner",remaining:newUdhaar,orderId:""}]}:c)); showToast(`✅ ${rs(payment)} received!`,"success"); }
//       else { await queueOfflineOperation("addCustomerCreditPayment",{customerId,amount:payment,dueDate:newDueDate,orderId:""}); setCustomers(prev=>prev.map(c=>c.id===customerId?{...c,udhaar:newUdhaar}:c)); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowCreditModal(null); setCreditPayment(""); setNewDueDate(""); setShowConfirm(false);
//     setSelected(safeCustomers.find(c=>c.id===customerId));
//     if (clearExternal) clearExternal();
//     setIsProcessing(false);
//   };

//   const saveCustomer = async () => {
//     if (!form.name||!form.phone) { showToast("Name & phone required","error"); return; }
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const nc = {...form, id:Date.now(), udhaar:0, totalOrders:0, totalSpent:0, points:0, joined:new Date().toISOString().split("T")[0], creditDueDate:null, creditHistory:[], activityLog:[], editHistory:[]};
//     try {
//       const result = await addCustomer(nc);
//       if (result.success) { setCustomers(prev=>[...prev,nc]); showToast(`✅ ${form.name} added!`,"success"); }
//       else { await queueOfflineOperation("addCustomer",{customer:nc}); setCustomers(prev=>[...prev,nc]); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowAdd(false); setForm({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""}); setIsProcessing(false);
//   };

//   const doUpdateCustomer = async () => {
//     const old = safeCustomers.find(c=>c.id===selected.id);
//     const changes = [];
//     if (old.name!==form.name) changes.push(`Name: ${old.name} → ${form.name}`);
//     if (old.phone!==form.phone) changes.push(`Phone: ${old.phone} → ${form.phone}`);
//     const updatedCustomer = {...selected,...form,editHistory:[...(selected.editHistory||[]),{date:today(),changes,by:"Owner"}]};
//     try {
//       const result = await updateCustomer(selected.id, updatedCustomer);
//       if (result.success) { setCustomers(prev=>prev.map(c=>c.id===selected.id?updatedCustomer:c)); showToast("✅ Customer updated!","success"); }
//       else { await queueOfflineOperation("updateCustomer",{id:selected.id,customer:updatedCustomer}); setCustomers(prev=>prev.map(c=>c.id===selected.id?updatedCustomer:c)); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowEdit(false); setShowEditConfirm(false); setSelected(updatedCustomer);
//   };

//   const totalUdhaar = safeCustomers.reduce((s,c)=>s+(c.udhaar||0),0);

//   if (selected) {
//     const cust            = safeCustomers.find(c=>c.id===selected.id)||selected;
//     const customerOrders  = safeOrders.filter(o=>o.customerId===cust.id);
//     const profitFromCust  = customerOrders.reduce((s,o)=>s+(o.profit||0),0);
//     const creditDays      = cust.creditDueDate ? daysDiff(cust.creditDueDate) : null;
//     const activities      = [...(cust.activityLog||[]).map(a=>({...a,time:a.date})), ...customerOrders.map(o=>({time:o.createdAt,type:"order",desc:`${o.id} — ${rs(o.total)}`,amount:o.total}))].sort((a,b)=>new Date(b.time)-new Date(a.time));

//     return (
//       <div className="space-y-4 pb-8">
//         <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-emerald-500 font-bold text-sm">← {L?"واپس":"Back"}</button>
//         <Card className="p-5 bg-gradient-to-br from-violet-50 dark:from-violet-900/20 to-purple-50 dark:to-purple-900/20">
//           <div className="flex items-start gap-4 mb-4">
//             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">{cust.name?.[0]||"?"}</div>
//             <div className="flex-1">
//               <h2 className="font-black text-xl text-slate-900 dark:text-white">{cust.name}</h2>
//               {cust.nameUr&&<div className="text-sm text-slate-500">{cust.nameUr}</div>}
//               <div className="text-sm text-slate-600 dark:text-slate-400">📞 {cust.phone}</div>
//               {cust.email&&<div className="text-xs text-slate-500">✉️ {cust.email}</div>}
//               {cust.addr&&<div className="text-xs text-slate-500">📍 {cust.addr}</div>}
//             </div>
//             <button onClick={() => { setForm({name:cust.name,nameUr:cust.nameUr||"",phone:cust.phone,email:cust.email||"",addr:cust.addr||"",notes:cust.notes||""}); setShowEdit(true); }} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold">✏️ Edit</button>
//           </div>
//           <KPIGrid items={[{icon:"🧾",label:"Orders",value:cust.totalOrders||0},{icon:"💰",label:"Spent",value:rs(cust.totalSpent||0)},{icon:"📈",label:"Profit",value:rs(profitFromCust)},{icon:"🔄",label:"Returns",value:customerOrders.filter(o=>o.returnHistory?.length>0).length}]} />
//           {(cust.udhaar||0)>0?(
//             <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
//               <div className="flex items-center justify-between mb-2">
//                 <div><div className="text-xs text-red-600 dark:text-red-400 font-semibold">OUTSTANDING CREDIT</div><div className="text-2xl font-black text-red-600 dark:text-red-400">{rs(cust.udhaar)}</div></div>
//                 {cust.creditDueDate&&<div className="text-right"><div className={`text-xs font-bold ${creditDays!=null&&creditDays<0?"text-red-600":"text-amber-600"}`}>{creditDays!=null&&creditDays<0?`${Math.abs(creditDays)}d OVERDUE`:`Due in ${creditDays}d`}</div><div className="text-xs text-slate-500">{fmtDate(cust.creditDueDate)}</div></div>}
//               </div>
//               <Btn variant="danger" size="sm" onClick={() => setShowCreditModal(cust.id)} full>💸 Receive Payment</Btn>
//             </div>
//           ):<div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 flex items-center justify-between"><span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">✅ No Outstanding Credit</span><Badge color="green">Paid Up</Badge></div>}
//         </Card>
//         <div className="flex gap-2 overflow-x-auto no-scrollbar">
//           {[["overview","📊 Overview"],["orders","🧾 Orders"],["credit","💸 Credit"],["timeline","📅 Timeline"]].map(([k,l])=>(
//             <button key={k} onClick={() => setActiveTab(k)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab===k?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>
//           ))}
//         </div>
//         {activeTab==="orders"&&(
//           <div className="space-y-2">
//             {customerOrders.length===0?<EmptyState icon="🧾" title="No orders" desc="No purchase history" />:
//               customerOrders.map(o=>(
//                 <Card key={o.id} className="p-3">
//                   <div className="flex items-center justify-between mb-1">
//                     <div><span className="font-bold text-emerald-600 text-sm">{o.id}</span><span className="text-xs text-slate-500 ml-2">{fmtDate(o.createdAt)}</span></div>
//                     <div className="text-right"><div className="font-black text-sm">{rs(o.total)}</div><Badge color={o.status==="paid"?"green":o.status==="credit"?"red":"amber"}>{o.status}</Badge></div>
//                   </div>
//                   {o.items?.map((i,j)=><div key={j} className="text-xs text-slate-500">{i.name} ×{i.qty}</div>)}
//                 </Card>
//               ))}
//           </div>
//         )}
//         {activeTab==="credit"&&(
//           <div className="space-y-2">
//             {(!cust.creditHistory||cust.creditHistory.length===0)?<EmptyState icon="💸" title="No credit history" desc="Credit transactions will appear here" />:
//               [...cust.creditHistory].reverse().map((h,i)=>(
//                 <Card key={i} className="p-3">
//                   <div className="flex items-center justify-between">
//                     <div><div className="font-semibold text-sm">{h.type==="payment"?"💸 Payment":"📒 Credit"}</div><div className="text-xs text-slate-500">{fmtDT(h.date)}{h.orderId?` · ${h.orderId}`:""}</div>{h.remaining!=null&&<div className="text-xs text-slate-400">Remaining: {rs(h.remaining)}</div>}</div>
//                     <Badge color={h.type==="payment"?"green":"red"}>{h.type==="payment"?"+":"-"}{rs(h.amount)}</Badge>
//                   </div>
//                 </Card>
//               ))}
//           </div>
//         )}
//         {activeTab==="timeline"&&(
//           <div className="space-y-0">
//             {activities.length===0?<EmptyState icon="📅" title="No activity" desc="Customer activity will appear here" />:
//               activities.slice(0,20).map((a,i)=>{
//                 const icons={order:"🧾",credit:"📒",payment:"💸",return:"🔄",edit:"✏️"};
//                 const colors={order:"green",credit:"red",payment:"green",return:"amber",edit:"blue"};
//                 return <TimelineItem key={i} icon={icons[a.type]||"📌"} title={a.desc||a.evt||"Activity"} sub={a.type} time={fmtDT(a.time||a.date)} color={colors[a.type]||"blue"} />;
//               })}
//           </div>
//         )}
//         {activeTab==="overview"&&(
//           <KPIGrid items={[
//             {icon:"📅",label:"Last Purchase",value:customerOrders.length>0?fmtDate(customerOrders.reduce((a,b)=>a.createdAt>b.createdAt?a:b).createdAt):"Never"},
//             {icon:"💰",label:"Avg Order",value:rs(cust.totalOrders>0?(cust.totalSpent||0)/cust.totalOrders:0)},
//             {icon:"🏆",label:"Loyalty Pts",value:cust.points||0},
//             {icon:"💸",label:"Credit Taken",value:cust.creditHistory?.filter(h=>h.type==="credit").length||0},
//           ]} />
//         )}
//         <Modal open={showCreditModal!==null} onClose={() => setShowCreditModal(null)} title="💸 Receive Credit Payment" size="sm">
//           {showCreditModal&&(
//             <div className="space-y-4">
//               <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700">
//                 <div className="text-xs text-red-600 dark:text-red-400 mb-1">Total Outstanding</div>
//                 <div className="text-3xl font-black text-red-600 dark:text-red-400">{rs(cust.udhaar)}</div>
//               </div>
//               <Input label="Amount Receiving *" type="number" value={creditPayment} onChange={e=>setCreditPayment(e.target.value)} placeholder="Enter amount" required min="1" max={String(cust.udhaar)} helpText={`Max: ${rs(cust.udhaar)}`} />
//               {creditPayment&&+creditPayment>0&&(
//                 <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-700">
//                   <div className="flex justify-between text-sm"><span className="text-slate-600">Remaining:</span><span className="font-black text-emerald-600">{rs(Math.max(0,(cust.udhaar||0)-(+creditPayment)))}</span></div>
//                   {+creditPayment>=(cust.udhaar||0)&&<div className="mt-1 text-xs text-emerald-600 font-bold">✅ Full payment — account will be cleared</div>}
//                 </div>
//               )}
//               <Input label="New Due Date (optional)" type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} />
//               <div className="flex gap-2">
//                 <Btn variant="secondary" onClick={() => setShowCreditModal(null)} full>Cancel</Btn>
//                 <Btn variant="primary" onClick={() => { if (!creditPayment||+creditPayment<=0){showToast("Enter valid amount","error");return;} setShowConfirm(true); }} full disabled={!creditPayment||+creditPayment<=0||isProcessing}>✅ Record Payment</Btn>
//               </div>
//             </div>
//           )}
//         </Modal>
//         <ConfirmDialog open={showConfirm} title="Confirm Payment?" message={`Record ${rs(+creditPayment||0)} from ${cust.name}?`} onConfirm={() => handleCreditPayment(showCreditModal)} onCancel={() => setShowConfirm(false)} confirmText="Confirm" />
//         <Modal open={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit Customer">
//           <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
//           <Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})} />
//           <Input label="Phone *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" required />
//           <Input label="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} type="email" />
//           <Input label="Address" value={form.addr||""} onChange={e=>setForm({...form,addr:e.target.value})} />
//           <Input label="Notes" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} />
//           <div className="flex gap-2"><Btn variant="secondary" onClick={() => setShowEdit(false)} full>Cancel</Btn><Btn variant="primary" onClick={() => setShowEditConfirm(true)} full>💾 Save</Btn></div>
//         </Modal>
//         <ConfirmDialog open={showEditConfirm} title="Save Changes?" message="Customer details will be updated." onConfirm={doUpdateCustomer} onCancel={() => setShowEditConfirm(false)} confirmText="Save" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 pb-8">
//       <KPIGrid items={[
//         {icon:"👥",label:"Customers",value:safeCustomers.length},
//         {icon:"🤝",label:"Total Credit",value:rs(totalUdhaar)},
//         {icon:"💰",label:"Avg Spent",value:rs(safeCustomers.length>0?safeCustomers.reduce((s,c)=>s+(c.totalSpent||0),0)/safeCustomers.length:0)},
//         {icon:"⚠️",label:"Credit Due",value:safeCustomers.filter(c=>(c.udhaar||0)>0&&c.creditDueDate&&daysDiff(c.creditDueDate)<=3).length},
//       ]} />
//       <div className="flex gap-3">
//         <div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
//           <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none" />
//         </div>
//         <Btn variant="primary" onClick={() => { setForm({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""}); setShowAdd(true); }}>+ Add</Btn>
//       </div>
//       <div className="space-y-3">
//         {filtered.map(c=>{
//           const ddays=c.creditDueDate?daysDiff(c.creditDueDate):null;
//           return (
//             <Card key={c.id} className="p-4" onClick={() => setSelected(c)}>
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">{c.name?.[0]||"?"}</div>
//                 <div className="flex-1">
//                   <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
//                   <div className="text-xs text-slate-500">{c.phone} · {c.totalOrders||0} orders</div>
//                   {(c.udhaar||0)>0&&c.creditDueDate&&<div className={`text-xs font-semibold ${ddays!=null&&ddays<0?"text-red-500":"text-amber-500"}`}>{ddays!=null&&ddays<0?`${Math.abs(ddays)}d overdue`:`Due in ${ddays}d`}</div>}
//                 </div>
//                 <div className="text-right">
//                   {(c.udhaar||0)>0?<Badge color={ddays!=null&&ddays<0?"red":"amber"}>{rs(c.udhaar)}</Badge>:<Badge color="green">✅ Clear</Badge>}
//                 </div>
//               </div>
//             </Card>
//           );
//         })}
//       </div>
//       <Modal open={showAdd} onClose={() => setShowAdd(false)} title="➕ Add Customer">
//         <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
//         <Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})} placeholder="اردو نام" />
//         <Input label="Phone *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" required />
//         <Input label="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} type="email" />
//         <Input label="Address" value={form.addr||""} onChange={e=>setForm({...form,addr:e.target.value})} />
//         <Input label="Notes" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} />
//         <Btn variant="primary" onClick={saveCustomer} full disabled={isProcessing}>{isProcessing?"Saving...":"✅ Save Customer"}</Btn>
//       </Modal>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    MERCHANDISE
//    ══════════════════════════════════════════════════════════ */
// const Merchandise = ({ products, orders, lang }) => {
//   const [search, setSearch]       = useState("");
//   const [activeCat, setActiveCat] = useState("All");
//   const [sortBy, setSortBy]       = useState("revenue");
//   const [expandedId, setExpandedId] = useState(null);
//   const L = lang === "ur";
//   const safeProducts = Array.isArray(products) ? products : [];
//   const safeOrders   = Array.isArray(orders)   ? orders   : [];

//   const merchData = useMemo(() => {
//     return safeProducts.map(p => {
//       let totalSold=0, totalRevenue=0, totalCost=0, lastSold=null;
//       safeOrders.forEach(o => {
//         if (o&&Array.isArray(o.items)) {
//           o.items.forEach(i => {
//             if (i&&(i.pid||i.productId)===p.id) {
//               totalSold    += i.qty||0;
//               totalRevenue += (i.qty||0)*(i.sell||i.price||0);
//               totalCost    += (i.qty||0)*(i.buy||i.cost||0);
//               if (!lastSold||(o.createdAt&&o.createdAt>lastSold)) lastSold=o.createdAt;
//             }
//           });
//         }
//       });
//       const sell      = p.sell||p.price||0;
//       const buy       = p.buy||p.cost||0;
//       const profitAmt = totalRevenue-totalCost;
//       const margin    = totalRevenue>0?Math.round(profitAmt/totalRevenue*100):(sell&&buy?Math.round(((sell-buy)/sell)*100):0);
//       return {...p, totalSold, totalRevenue, totalCost, profitAmt, margin, lastSold};
//     });
//   }, [safeProducts, safeOrders]);

//   const filtered = merchData.filter(m=>(activeCat==="All"||m.cat===activeCat||m.category===activeCat)&&(m.name?.toLowerCase().includes(search.toLowerCase())||(m.sku&&m.sku.toLowerCase().includes(search.toLowerCase()))));
//   const sorted   = [...filtered].sort((a,b)=>sortBy==="revenue"?(b.totalRevenue||0)-(a.totalRevenue||0):sortBy==="margin"?(b.margin||0)-(a.margin||0):sortBy==="sold"?(b.totalSold||0)-(a.totalSold||0):(a.name||"").localeCompare(b.name||""));
//   const totalRevAll  = merchData.reduce((s,m)=>s+(m.totalRevenue||0),0);
//   const totalProfAll = merchData.reduce((s,m)=>s+(m.profitAmt||0),0);

//   return (
//     <div className="space-y-4 pb-8">
//       <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 text-white">
//         <h2 className="text-lg font-black mb-1">📊 {L?"سامان":"Merchandise"}</h2>
//         <div className="grid grid-cols-3 gap-3 text-sm">
//           <div><div className="text-violet-200 text-xs">Total Items</div><div className="font-black text-lg">{safeProducts.length}</div></div>
//           <div><div className="text-violet-200 text-xs">Revenue</div><div className="font-black text-lg">{rs(totalRevAll)}</div></div>
//           <div><div className="text-violet-200 text-xs">Profit</div><div className="font-black text-lg">{rs(totalProfAll)}</div></div>
//         </div>
//       </div>
//       <KPIGrid items={[
//         {icon:"📦",label:"Items Sold",value:merchData.reduce((s,m)=>s+(m.totalSold||0),0)},
//         {icon:"💰",label:"Revenue",value:rs(totalRevAll)},
//         {icon:"📈",label:"Profit",value:rs(totalProfAll)},
//         {icon:"📊",label:"Avg Margin",value:`${Math.round(totalRevAll>0?totalProfAll/totalRevAll*100:0)}%`}
//       ]} />
//       <div className="flex gap-2">
//         <div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
//           <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none" />
//         </div>
//         <Select value={sortBy} onChange={e=>setSortBy(e.target.value)} options={[{value:"revenue",label:"Revenue"},{value:"margin",label:"Margin"},{value:"sold",label:"Sold"},{value:"name",label:"A-Z"}]} />
//       </div>
//       <div className="space-y-3">
//         {sorted.map(m=>(
//           <Card key={m.id} className="p-4" onClick={() => setExpandedId(expandedId===m.id?null:m.id)}>
//             <div className="flex items-start justify-between mb-3">
//               <div className="flex-1"><div className="font-bold text-slate-900 dark:text-white">{m.name}</div><div className="text-xs text-slate-500">{m.sku} · {m.cat||m.category}</div></div>
//               <Badge color={m.margin>=20?"green":m.margin>=10?"amber":"red"}>{m.margin}% margin</Badge>
//             </div>
//             <div className="grid grid-cols-4 gap-2">
//               {[{l:"Cost",v:rs(m.buy||m.cost||0),c:""},{l:"Sell",v:rs(m.sell||m.price||0),c:"text-emerald-600 font-bold"},{l:"Sold",v:String(m.totalSold),c:""},{l:"Revenue",v:rs(m.totalRevenue),c:"text-violet-600 font-bold"}].map(({l,v,c})=>(
//                 <div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className={`font-bold mt-0.5 ${c}`}>{v}</div></div>
//               ))}
//             </div>
//             {expandedId===m.id&&(
//               <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
//                 <div className="flex justify-between"><span className="text-slate-500">Profit/unit</span><span className="font-bold text-emerald-500">{rs((m.sell||m.price||0)-(m.buy||m.cost||0))}</span></div>
//                 <div className="flex justify-between"><span className="text-slate-500">Total profit</span><span className="font-bold text-emerald-500">{rs(m.profitAmt)}</span></div>
//                 <div className="flex justify-between"><span className="text-slate-500">Stock</span><span className="font-bold">{m.stock} {m.unit}</span></div>
//                 {m.lastSold&&<div className="flex justify-between text-xs"><span className="text-slate-400">Last sold</span><span>{fmtDate(m.lastSold)}</span></div>}
//               </div>
//             )}
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    EXPENSES
//    ══════════════════════════════════════════════════════════ */
// const Expenses = ({ expenses, setExpenses, showToast, lang }) => {
//   const [showAdd, setShowAdd]         = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [form, setForm]               = useState({cat:"Rent",desc:"",amt:"",date:new Date().toISOString().slice(0,10),by:"Owner"});
//   const L = lang === "ur";
//   const safeExpenses = Array.isArray(expenses) ? expenses : [];
//   const totalExp = safeExpenses.reduce((s,e)=>s+(e.amt||e.amount||0),0);

//   const save = async () => {
//     if (!form.desc||!form.amt) { showToast("Fill all fields","error"); return; }
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const ne = {...form, id:Date.now(), amt:+form.amt, amount:+form.amt, category:form.cat, description:form.desc};
//     try {
//       const result = await addExpense(ne);
//       if (result.success) { setExpenses(prev=>[...prev,ne]); showToast("✅ Expense added!","success"); }
//       else { await queueOfflineOperation("addExpense",{expense:ne}); setExpenses(prev=>[...prev,ne]); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowAdd(false); setForm({cat:"Rent",desc:"",amt:"",date:new Date().toISOString().slice(0,10),by:"Owner"}); setIsProcessing(false);
//   };

//   return (
//     <div className="space-y-4 pb-8">
//       <Card className="p-5 bg-gradient-to-br from-red-50 dark:from-red-900/20 to-orange-50 dark:to-orange-900/20">
//         <div className="text-3xl mb-2">💸</div>
//         <div className="text-3xl font-black text-red-600 dark:text-red-400">{rs(totalExp)}</div>
//         <div className="text-sm text-slate-500">Total Expenses</div>
//       </Card>
//       <Btn variant="danger" onClick={() => setShowAdd(true)} full>➕ {L?"خرچ شامل کریں":"Add Expense"}</Btn>
//       <div className="space-y-3">
//         {safeExpenses.map(e=>(
//           <Card key={e.id} className="p-4">
//             <div className="flex items-start justify-between">
//               <div><div className="font-bold text-slate-900 dark:text-white text-sm">{e.desc||e.description}</div><div className="text-xs text-slate-500">{e.cat||e.category} · {e.date} · by {e.by}</div></div>
//               <div className="font-black text-red-500">{rs(e.amt||e.amount||0)}</div>
//             </div>
//           </Card>
//         ))}
//       </div>
//       <Modal open={showAdd} onClose={() => setShowAdd(false)} title="➕ Add Expense">
//         <Select label="Category" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} options={["Rent","Electricity","Staff","Transport","Maintenance","Misc"].map(c=>({value:c,label:c}))} />
//         <Input label="Description *" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="e.g., Monthly rent" required />
//         <Input label="Amount *" type="number" value={form.amt} onChange={e=>setForm({...form,amt:e.target.value})} placeholder="0" required />
//         <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
//         <Input label="Paid By" value={form.by} onChange={e=>setForm({...form,by:e.target.value})} placeholder="Owner" />
//         <Btn variant="danger" onClick={save} full disabled={isProcessing}>{isProcessing?"Saving...":"💾 Save"}</Btn>
//       </Modal>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    STAFF
//    ══════════════════════════════════════════════════════════ */
// const Staff = ({ staff, setStaff, showToast, lang }) => {
//   const [showAdd, setShowAdd]           = useState(false);
//   const [editStaff, setEditStaff]       = useState(null);
//   const [deleteConfirm, setDeleteConfirm] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [form, setForm]                 = useState({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"});
//   const L = lang === "ur";
//   const safeStaff = Array.isArray(staff) ? staff : [];

//   const openEdit = s => { setEditStaff(s.id); setForm({name:s.name,role:s.role||s.commissionRate,phone:s.phone||"",shift:s.shift||"9am-5pm",salary:String(s.salary||0),status:s.status||s.active?"active":"inactive"}); setShowAdd(true); };

//   const save = async () => {
//     if (!form.name||!form.salary) { showToast("Name and salary required","error"); return; }
//     if (isProcessing) return;
//     setIsProcessing(true);
//     if (editStaff) {
//       const old     = safeStaff.find(s=>s.id===editStaff);
//       const updated = {...old,...form,salary:+form.salary,active:form.status==="active"};
//       try {
//         const result = await updateStaff(editStaff, updated);
//         if (result.success) { setStaff(prev=>prev.map(s=>s.id===editStaff?updated:s)); showToast("✅ Staff updated!","success"); }
//         else { await queueOfflineOperation("updateStaff",{id:editStaff,staff:updated}); setStaff(prev=>prev.map(s=>s.id===editStaff?updated:s)); showToast("⚠️ Saved offline","warning"); }
//       } catch(e) { showToast("Error: "+e.message,"error"); }
//     } else {
//       const ns = {...form, id:Date.now(), joined:new Date().toISOString().slice(0,10), salary:+form.salary, active:form.status==="active"};
//       try {
//         const result = await addStaff(ns);
//         if (result.success) { setStaff(prev=>[...prev,ns]); showToast(`✅ ${form.name} added!`,"success"); }
//         else { await queueOfflineOperation("addStaff",{staff:ns}); setStaff(prev=>[...prev,ns]); showToast("⚠️ Saved offline","warning"); }
//       } catch(e) { showToast("Error: "+e.message,"error"); }
//     }
//     setShowAdd(false); setEditStaff(null); setForm({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"}); setIsProcessing(false);
//   };

//   const handleDelete = async id => {
//     try { const result = await deleteStaff(id); if (result.success||result.queued) { setStaff(prev=>prev.filter(s=>s.id!==id)); showToast("✅ Staff removed!","success"); } else showToast("Error deleting","error"); }
//     catch(e) { showToast("Error: "+e.message,"error"); }
//     setDeleteConfirm(null);
//   };

//   const totalSalaries = safeStaff.reduce((s,s_)=>s+(s_.salary||0),0);

//   return (
//     <div className="space-y-4 pb-8">
//       <KPIGrid items={[{icon:"👔",label:"Staff",value:safeStaff.length},{icon:"💰",label:"Salaries",value:rs(totalSalaries)},{icon:"✅",label:"Active",value:safeStaff.filter(s=>s.status==="active"||s.active).length},{icon:"📊",label:"Avg Salary",value:rs(safeStaff.length>0?totalSalaries/safeStaff.length:0)}]} />
//       <Btn variant="violet" onClick={() => { setEditStaff(null); setForm({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"}); setShowAdd(true); }} full>➕ {L?"سٹاف شامل":"Add Staff"}</Btn>
//       <div className="space-y-3">
//         {safeStaff.map(s=>(
//           <Card key={s.id} className="p-4">
//             <div className="flex items-center gap-3 mb-3">
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-lg">{s.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"ST"}</div>
//               <div className="flex-1"><div className="font-black text-slate-900 dark:text-white">{s.name}</div><div className="text-sm text-slate-500">{s.role}</div></div>
//               <Badge color={s.status==="active"||s.active?"green":"gray"}>{s.status||"active"}</Badge>
//             </div>
//             <div className="grid grid-cols-3 gap-2 mb-3">
//               {[{l:"Salary",v:rs(s.salary)},{l:"Shift",v:s.shift||"—"},{l:"Joined",v:fmtDate(s.joined)}].map(({l,v})=>(
//                 <div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className="font-bold text-xs mt-0.5 truncate">{v}</div></div>
//               ))}
//             </div>
//             <div className="flex gap-2">
//               <Btn variant="secondary" size="sm" onClick={() => openEdit(s)} full>✏️ Edit</Btn>
//               <Btn variant="danger" size="sm" onClick={() => setDeleteConfirm(s.id)} full>🗑️ Delete</Btn>
//             </div>
//           </Card>
//         ))}
//       </div>
//       <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditStaff(null); }} title={editStaff?"✏️ Edit Staff":"➕ Add Staff"}>
//         <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
//         <Select label="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} options={["Cashier","Stock Manager","Manager","Delivery"].map(r=>({value:r,label:r}))} />
//         <Input label="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" />
//         <Input label="Shift" value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} placeholder="9am-5pm" />
//         <Input label="Monthly Salary *" type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} required />
//         <Select label="Status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"},{value:"on-leave",label:"On Leave"}]} />
//         <Btn variant="violet" onClick={save} full disabled={isProcessing}>{isProcessing?"Saving...":editStaff?"💾 Update Staff":"💾 Add Employee"}</Btn>
//       </Modal>
//       <ConfirmDialog open={!!deleteConfirm} title="Delete Staff Member?" message="This will permanently remove them from the system." danger onConfirm={() => handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} confirmText="Delete" />
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    ANALYTICS
//    ══════════════════════════════════════════════════════════ */
// const Analytics = ({ orders, products, customers, expenses, lang }) => {
//   const L = lang === "ur";
//   const safeOrders    = Array.isArray(orders)    ? orders    : [];
//   const safeProducts  = Array.isArray(products)  ? products  : [];
//   const safeCustomers = Array.isArray(customers) ? customers : [];
//   const safeExpenses  = Array.isArray(expenses)  ? expenses  : [];

//   const totalRevenue  = safeOrders.reduce((s,o)=>s+(o.total||0),0);
//   const totalProfit   = safeOrders.reduce((s,o)=>s+(o.profit||0),0);
//   const totalExpenses = safeExpenses.reduce((s,e)=>s+(e.amt||e.amount||0),0);
//   const netProfit     = totalProfit-totalExpenses;
//   const profitMargin  = totalRevenue>0?Math.round(totalProfit/totalRevenue*100):0;

//   const topProducts = safeProducts.map(p=>{
//     let sold=0,rev=0;
//     safeOrders.forEach(o=>{ if(o.items&&Array.isArray(o.items)) o.items.forEach(i=>{ if((i.pid||i.productId)===p.id){sold+=i.qty||0;rev+=(i.qty||0)*(i.sell||i.price||0);} }); });
//     return {...p,sold,rev};
//   }).filter(p=>p.sold>0).sort((a,b)=>b.rev-a.rev).slice(0,5);

//   const catData = CATEGORIES.slice(1).map(cat=>{
//     let rev=0;
//     safeProducts.filter(p=>p.cat===cat||p.category===cat).forEach(p=>{ safeOrders.forEach(o=>{ if(o.items&&Array.isArray(o.items)) o.items.forEach(i=>{ if((i.pid||i.productId)===p.id) rev+=(i.qty||0)*(i.sell||i.price||0); }); }); });
//     return {name:cat,value:rev};
//   }).filter(d=>d.value>0);

//   const COLORS = ["#10b981","#8b5cf6","#f59e0b","#ef4444","#0ea5e9","#ec4899"];

//   return (
//     <div className="space-y-5 pb-8">
//       <KPIGrid items={[{icon:"💰",label:"Revenue",value:rs(totalRevenue),change:`${safeOrders.length} orders`},{icon:"📈",label:"Profit",value:rs(totalProfit),change:`${profitMargin}% margin`},{icon:"💸",label:"Expenses",value:rs(totalExpenses),change:"This month"},{icon:"🏦",label:"Net Profit",value:rs(netProfit),change:netProfit>0?"✅ Positive":"⚠️ Negative"}]} />
//       <Card className="p-4">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">🏆 Top 5 Products</h3>
//         <div className="space-y-3">
//           {topProducts.map((p,i)=>(
//             <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
//               <div className="flex items-center gap-3">
//                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-sm">{i+1}</div>
//                 <div><div className="font-bold text-sm">{p.name}</div><div className="text-xs text-slate-500">{p.sold} units</div></div>
//               </div>
//               <div className="font-black text-emerald-600">{rs(p.rev)}</div>
//             </div>
//           ))}
//           {topProducts.length===0&&<EmptyState icon="📦" title="No sales yet" desc="Complete some orders to see top products" />}
//         </div>
//       </Card>
//       {catData.length>0&&(
//         <Card className="p-4">
//           <h3 className="font-bold text-slate-800 dark:text-white mb-4">📊 Sales by Category</h3>
//           <ResponsiveContainer width="100%" height={200}>
//             <PieChart><Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
//               {catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
//             </Pie><Tooltip formatter={v=>rs(v)} /></PieChart>
//           </ResponsiveContainer>
//         </Card>
//       )}
//       <Card className="p-4">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">👥 Top Customers</h3>
//         <div className="space-y-2">
//           {safeCustomers.sort((a,b)=>(b.totalSpent||0)-(a.totalSpent||0)).slice(0,4).map((c,i)=>(
//             <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
//               <div className="flex items-center gap-2">
//                 <div className="w-7 h-7 rounded-lg bg-violet-500 text-white flex items-center justify-center font-bold text-xs">{i+1}</div>
//                 <div><div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.totalOrders||0} orders</div></div>
//               </div>
//               <div className="text-right"><div className="font-black text-violet-600">{rs(c.totalSpent||0)}</div>{(c.udhaar||0)>0&&<div className="text-xs text-red-500">Owes {rs(c.udhaar)}</div>}</div>
//             </div>
//           ))}
//         </div>
//       </Card>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    SETTINGS
//    ══════════════════════════════════════════════════════════ */
// const Settings = ({ lang, setLang, dark, setDark, showToast, shopInfo, setShopInfo }) => {
//   const L = lang === "ur";
//   const [syncPending, setSyncPending]   = useState(0);
//   const [onlineStatus, setOnlineStatus] = useState(true);
//   const [isSyncing, setIsSyncing]       = useState(false);

//   useEffect(() => {
//     const check = async () => { setSyncPending(await getPendingSyncCount()); setOnlineStatus(isOnline()); };
//     check();
//     const iv = setInterval(check, 5000);
//     return () => clearInterval(iv);
//   }, []);

//   const handleSync = async () => {
//     setIsSyncing(true);
//     const result = await processOfflineQueue();
//     if (result.success) showToast(`✅ Synced ${result.processed} items!`,"success");
//     else showToast(`⚠️ Synced ${result.processed}, ${result.failed} failed`,"warning");
//     setSyncPending(0); setIsSyncing(false);
//   };

//   return (
//     <div className="space-y-5 pb-8">
//       <Card className="p-5 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-cyan-50 dark:to-cyan-900/20">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">☁️ Cloud Sync</h3>
//         <div className="space-y-3">
//           <div className="flex items-center justify-between">
//             <div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Connection</span><span className={`text-sm font-bold ${onlineStatus?"text-emerald-500":"text-red-500"}`}>{onlineStatus?"✅ Online":"❌ Offline"}</span></div>
//             {syncPending>0&&<div className="bg-amber-100 dark:bg-amber-900/40 rounded-lg px-3 py-1"><span className="text-amber-700 dark:text-amber-300 text-xs font-bold">{syncPending} pending</span></div>}
//           </div>
//           <button onClick={async()=>{ const r=await testConnection(); showToast(r.success?r.message:r.error,r.success?"success":"error"); }} className="w-full px-4 py-2 bg-sky-500 text-white font-bold rounded-xl">🔍 Test Connection</button>
//           <button onClick={handleSync} disabled={!onlineStatus||isSyncing} className="w-full px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50">
//             {isSyncing?"🔄 Syncing...":syncPending>0?"📤 Sync Now":"🔄 Sync All Data"}
//           </button>
//         </div>
//       </Card>
//       <Card className="p-5">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">🏪 {L?"دکان کی معلومات":"Shop Information"}</h3>
//         <p className="text-xs text-slate-500 mb-3">This info appears on your printed receipts.</p>
//         <Input label="Shop Name" value={shopInfo.name} onChange={e=>setShopInfo(s=>({...s,name:e.target.value}))} />
//         <Input label="Owner Name" value={shopInfo.owner} onChange={e=>setShopInfo(s=>({...s,owner:e.target.value}))} />
//         <Input label="Contact Number" value={shopInfo.phone} onChange={e=>setShopInfo(s=>({...s,phone:e.target.value}))} type="tel" />
//         <Input label="Shop Address" value={shopInfo.address} onChange={e=>setShopInfo(s=>({...s,address:e.target.value}))} />
//         <Btn variant="primary" onClick={() => { saveToStorage("dp_shop_info",shopInfo); showToast("✅ Shop info saved!","success"); }} full>💾 Save Shop Info</Btn>
//       </Card>
//       <Card className="p-5">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">{L?"ترجیحات":"App Preferences"}</h3>
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Language</span><span className="text-xs text-slate-500">اردو / English</span></div>
//             <div className="flex gap-2">
//               {[["en","EN"],["ur","اردو"]].map(([k,l])=>(
//                 <button key={k} onClick={() => setLang(k)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang===k?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>
//               ))}
//             </div>
//           </div>
//           <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
//             <div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{L?"ڈارک موڈ":"Dark Mode"}</span><span className="text-xs text-slate-500">Night-friendly display</span></div>
//             <button onClick={() => setDark(!dark)} className={`w-14 h-7 rounded-full transition-colors relative ${dark?"bg-emerald-500":"bg-slate-300"}`}>
//               <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${dark?"left-8":"left-1"}`} />
//             </button>
//           </div>
//         </div>
//       </Card>
//       <div className="text-center py-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl">
//         <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">🏪 DukanDar Pro</div>
//         <div className="text-sm text-slate-600 dark:text-slate-400">Complete Shop Management System</div>
//         <div className="text-xs text-slate-500 mt-1">v5.0 · Upgraded Thermal Receipt Slip</div>
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    CREDIT REMINDER POPUP
//    ══════════════════════════════════════════════════════════ */
// const CreditReminderPopup = ({ customers, setPage, setSelectedCustomer, showCreditModal, onDismiss }) => {
//   const safeCustomers = Array.isArray(customers) ? customers : [];
//   const overdue       = safeCustomers.filter(c=>(c.udhaar||0)>0&&c.creditDueDate&&daysDiff(c.creditDueDate)<=3);
//   const [dismissed, setDismissed] = useState([]);
//   const visible = overdue.filter(c=>!dismissed.includes(c.id));
//   if (visible.length===0) return null;
//   return (
//     <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//       <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
//         <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20 rounded-t-3xl">
//           <div className="flex items-center gap-3"><span className="text-3xl">🔔</span><div><h2 className="text-lg font-black text-amber-900 dark:text-amber-100">Credit Reminders</h2><p className="text-xs text-amber-700 dark:text-amber-300">{visible.length} due soon</p></div></div>
//         </div>
//         <div className="p-4 space-y-3">
//           {visible.map(c=>{
//             const diff=daysDiff(c.creditDueDate); const isOverdue=diff<0;
//             return (
//               <div key={c.id} className={`p-4 rounded-xl border-2 ${isOverdue?"border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800":"border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800"}`}>
//                 <div className="flex items-start justify-between mb-2">
//                   <div><div className="font-bold text-slate-900 dark:text-white">{c.name}</div><div className="text-xs text-slate-500">{c.phone}</div></div>
//                   <Badge color={isOverdue?"red":"amber"}>{isOverdue?`${Math.abs(diff)}d overdue`:`Due in ${diff}d`}</Badge>
//                 </div>
//                 <div className="text-lg font-black text-red-600 dark:text-red-400 mb-3">{rs(c.udhaar)}</div>
//                 <div className="flex gap-2">
//                   <Btn size="sm" variant="secondary" onClick={() => setDismissed(d=>[...d,c.id])} full>Dismiss</Btn>
//                   <Btn size="sm" variant="primary" onClick={() => { setSelectedCustomer(c); showCreditModal(c.id); setDismissed(d=>[...d,c.id]); }} full>💸 Receive</Btn>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//         <div className="p-4 border-t border-slate-100 dark:border-slate-700"><Btn variant="secondary" onClick={onDismiss} full>Close All</Btn></div>
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    ROOT APP
//    ══════════════════════════════════════════════════════════ */
// export default function DukanDarPro() {
//   const [page, setPage]         = useState("home");
//   const [lang, setLang]         = useState("en");
//   const [dark, setDark]         = useState(false);
//   const [products, setProducts] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [orders, setOrders]     = useState([]);
//   const [expenses, setExpenses] = useState([]);
//   const [staff, setStaff]       = useState([]);
//   const [shopInfo, setShopInfo] = useState(loadFromStorage("dp_shop_info",{name:"My Store",owner:"",phone:"",address:""}));
//   const [toast, setToast]       = useState(null);
//   const [showReminders, setShowReminders] = useState(true);
//   const [externalCustomer, setExternalCustomer]     = useState(null);
//   const [externalCreditModal, setExternalCreditModal] = useState(null);
//   const [isLoading, setIsLoading]         = useState(true);
//   const [syncPending, setSyncPending]     = useState(0);
//   const [isNetworkOnline, setIsNetworkOnline] = useState(true);
//   const [isSyncing, setIsSyncing]         = useState(false);

//   useEffect(() => {
//     const init = async () => {
//       setIsLoading(true);
//       try {
//         const online = isOnline();
//         setIsNetworkOnline(online);
//         setProducts(loadFromStorage("dp_products_v5",[]));
//         setCustomers(loadFromStorage("dp_customers_v5",[]));
//         setOrders(loadFromStorage("dp_orders_v5",[]));
//         setExpenses(loadFromStorage("dp_expenses_v5",[]));
//         setStaff(loadFromStorage("dp_staff_v5",[]));
//         if (online) {
//           setSyncPending(await getPendingSyncCount());
//           await syncAllData(
//             d=>setProducts(Array.isArray(d)?d:[]),
//             d=>setCustomers(Array.isArray(d)?d:[]),
//             d=>setOrders(Array.isArray(d)?d:[]),
//             d=>setExpenses(Array.isArray(d)?d:[]),
//             d=>setStaff(Array.isArray(d)?d:[])
//           );
//         }
//       } catch(e) { console.error("Init error:",e); }
//       finally { setIsLoading(false); }
//     };
//     init();
//     const handleOnline = async () => {
//       setIsNetworkOnline(true); setToast({msg:"🟢 Back online! Syncing...",type:"success"}); setTimeout(()=>setToast(null),3000);
//       await processOfflineQueue();
//       await syncAllData(d=>setProducts(Array.isArray(d)?d:[]),d=>setCustomers(Array.isArray(d)?d:[]),d=>setOrders(Array.isArray(d)?d:[]),d=>setExpenses(Array.isArray(d)?d:[]),d=>setStaff(Array.isArray(d)?d:[]));
//       setSyncPending(0);
//     };
//     const handleOffline = () => { setIsNetworkOnline(false); setToast({msg:"🔴 Offline mode — saving locally",type:"warning"}); setTimeout(()=>setToast(null),3000); };
//     window.addEventListener("online",handleOnline);
//     window.addEventListener("offline",handleOffline);
//     return () => { window.removeEventListener("online",handleOnline); window.removeEventListener("offline",handleOffline); };
//   }, []);

//   useEffect(() => { saveToStorage("dp_products_v5", products);  }, [products]);
//   useEffect(() => { saveToStorage("dp_customers_v5",customers); }, [customers]);
//   useEffect(() => { saveToStorage("dp_orders_v5",   orders);    }, [orders]);
//   useEffect(() => { saveToStorage("dp_expenses_v5", expenses);  }, [expenses]);
//   useEffect(() => { saveToStorage("dp_staff_v5",    staff);     }, [staff]);
//   useEffect(() => { saveToStorage("dp_shop_info",   shopInfo);  }, [shopInfo]);

//   const showToast = useCallback((msg,type="success") => setToast({msg,type}), []);
//   const L         = lang === "ur";
//   const lowCount  = products.filter(p=>(p.stock||0)<=(p.minStock||p.lowStock||0)).length;

//   const navItems = [
//     {key:"home",    icon:"🏠", label: L?"ہوم":"Home"},
//     {key:"pos",     icon:"🛒", label: L?"بلنگ":"POS"},
//     {key:"orders",  icon:"🧾", label: L?"آرڈر":"Orders"},
//     {key:"inventory",icon:"📦",label: L?"اسٹاک":"Stock", badge:lowCount},
//     {key:"customers",icon:"👥",label: L?"گاہک":"People"},
//   ];
//   const moreItems = [
//     {key:"merchandise",icon:"📊",label: L?"سامان":"Merch"},
//     {key:"expenses",   icon:"💸",label: L?"اخراجات":"Costs"},
//     {key:"staff",      icon:"👔",label: L?"سٹاف":"Staff"},
//     {key:"analytics",  icon:"📈",label: L?"رپورٹ":"Reports"},
//     {key:"settings",   icon:"⚙️",label: L?"سیٹنگ":"Settings"},
//   ];
//   const pageTitles = {home:"Dashboard",pos:"New Sale",orders:"Orders",inventory:"Inventory",customers:"Customers",merchandise:"Merchandise",expenses:"Expenses",staff:"Staff",analytics:"Analytics",settings:"Settings"};

//   const renderPage = () => {
//     const props = {showToast, lang};
//     switch (page) {
//       case "home":        return <Dashboard products={products} orders={orders} customers={customers} expenses={expenses} {...props} setPage={setPage} setExternalCustomer={setExternalCustomer} setExternalCreditModal={setExternalCreditModal} />;
//       case "pos":         return <POS products={products} customers={customers} setOrders={setOrders} setProducts={setProducts} setCustomers={setCustomers} shopInfo={shopInfo} {...props} />;
//       case "orders":      return <OrdersHistory orders={orders} products={products} setOrders={setOrders} setProducts={setProducts} setCustomers={setCustomers} customers={customers} {...props} />;
//       case "inventory":   return <Inventory products={products} setProducts={setProducts} {...props} />;
//       case "customers":   return <Customers customers={customers} setCustomers={setCustomers} orders={orders} {...props} externalSelected={externalCustomer} externalCreditModal={externalCreditModal} clearExternal={() => { setExternalCustomer(null); setExternalCreditModal(null); }} />;
//       case "merchandise": return <Merchandise products={products} orders={orders} {...props} />;
//       case "expenses":    return <Expenses expenses={expenses} setExpenses={setExpenses} {...props} />;
//       case "staff":       return <Staff staff={staff} setStaff={setStaff} {...props} />;
//       case "analytics":   return <Analytics orders={orders} products={products} customers={customers} expenses={expenses} {...props} />;
//       case "settings":    return <Settings lang={lang} setLang={setLang} dark={dark} setDark={setDark} showToast={showToast} shopInfo={shopInfo} setShopInfo={setShopInfo} />;
//       default:            return null;
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-4xl mb-4">☁️</div>
//           <div className="text-emerald-600 font-bold text-lg">DukanDar Pro</div>
//           <div className="text-slate-500 text-sm mt-1">Syncing with Google Sheets...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={dark?"dark":""} dir={L?"rtl":"ltr"}>
//       <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-24">
//         <style>{`
//           @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap');
//           .no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
//           @keyframes toast-in{0%{transform:translate(-50%,-16px);opacity:0}60%{transform:translate(-50%,3px)}100%{transform:translate(-50%,0);opacity:1}}
//           .animate-toast{animation:toast-in .35s cubic-bezier(.34,1.56,.64,1) forwards}
//           *{font-family:${L?"'Noto Nastaliq Urdu',serif":"'Outfit',sans-serif"}}
//           .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
//         `}</style>

//         {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

//         <SyncStatusIndicator pendingCount={syncPending} isNetworkOnline={isNetworkOnline}
//           onSync={async () => {
//             setIsSyncing(true);
//             await processOfflineQueue();
//             await syncAllData(d=>setProducts(Array.isArray(d)?d:[]),d=>setCustomers(Array.isArray(d)?d:[]),d=>setOrders(Array.isArray(d)?d:[]),d=>setExpenses(Array.isArray(d)?d:[]),d=>setStaff(Array.isArray(d)?d:[]));
//             setSyncPending(0); setIsSyncing(false); showToast("✅ Sync completed!","success");
//           }}
//           syncing={isSyncing} />

//         {showReminders && page==="home" && (
//           <CreditReminderPopup customers={customers} setPage={setPage} setSelectedCustomer={setExternalCustomer}
//             showCreditModal={id => { setExternalCreditModal(id); setPage("customers"); }}
//             onDismiss={() => setShowReminders(false)} />
//         )}

//         <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
//           <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md">د</div>
//               <div><div className="font-black text-slate-900 dark:text-white text-lg">{L?"دکانDار":"DukanDar"} <span className="text-emerald-500 text-sm">Pro</span></div><div className="text-xs text-slate-500">{pageTitles[page]}</div></div>
//             </div>
//             <div className="flex items-center gap-2">
//               {!isNetworkOnline&&<div className="bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg"><span className="text-amber-700 dark:text-amber-300 text-[10px] font-bold">OFFLINE</span></div>}
//               {lowCount>0&&<button onClick={() => setPage("inventory")} className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors">⚠️ {lowCount}</button>}
//               <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg hover:bg-slate-200 transition-colors">{dark?"☀️":"🌙"}</button>
//             </div>
//           </div>
//           <div className="flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
//             {moreItems.map(n=>(
//               <button key={n.key} onClick={() => setPage(n.key)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${page===n.key?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>{n.icon} {n.label}</button>
//             ))}
//           </div>
//         </header>

//         <main className="max-w-2xl mx-auto px-4 pt-5">{renderPage()}</main>

//         <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl">
//           <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
//             {navItems.map(n=>(
//               <button key={n.key} onClick={() => setPage(n.key)} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${page===n.key?"bg-emerald-50 dark:bg-emerald-900/20":""}`}>
//                 <div className="relative">
//                   <span className="text-xl">{n.icon}</span>
//                   {(n.badge||0)>0&&<span className="absolute -top-2 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">{n.badge}</span>}
//                 </div>
//                 <span className={`text-[10px] font-bold ${page===n.key?"text-emerald-600 dark:text-emerald-400":"text-slate-400"}`}>{n.label}</span>
//                 {page===n.key&&<div className="w-1 h-1 rounded-full bg-emerald-500" />}
//               </button>
//             ))}
//           </div>
//         </nav>
//       </div>
//     </div>
//   );
// }























































// import { useState, useRef, useEffect, useCallback, useMemo } from "react";
// import {
//   PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
// } from "recharts";

// /* ─── API shim — delegates to window.DPApi (googleSheet.js) ─── */
// const api = () => window.DPApi;
// const syncAllData   = (sp,sc,so,se,sst) => {
//   if (!api()) return Promise.resolve({ success: false });
//   return api().fetchAll().then(res => {
//     if (!res?.success) return res;
//     const d = res.data || {};
//     if (sp)  sp(Array.isArray(d.products)  ? d.products.map(mapProduct)   : []);
//     if (sc)  sc(Array.isArray(d.customers) ? d.customers.map(mapCustomer) : []);
//     if (so)  so(Array.isArray(d.orders)    ? d.orders.map(mapOrder)        : []);
//     if (se)  se(Array.isArray(d.expenses)  ? d.expenses                    : []);
//     if (sst) sst(Array.isArray(d.salesmen) ? d.salesmen                    : []);
//     return res;
//   });
// };

// const mapProduct  = p => ({ ...p, buy: p.cost  ?? p.buy  ?? 0, sell: p.price ?? p.sell ?? 0 });
// const mapCustomer = c => ({ ...c, udhaar: c.pendingDues ?? c.udhaar ?? 0 });
// const mapOrder    = o => ({ ...o, createdAt: o.date ?? o.createdAt ?? '', total: Number(o.total||0), profit: Number(o.profit||0) });

// const addProduct            = (p)               => api()?.create('Products', { ...p, cost: p.buy, price: p.sell }) ?? Promise.resolve({ success: false });
// const updateProduct         = (id, p)           => api()?.update('Products', id, { ...p, cost: p.buy, price: p.sell }) ?? Promise.resolve({ success: false });
// const deleteProduct         = (id)              => api()?.remove('Products', id) ?? Promise.resolve({ success: false });
// const patchProductStock     = (id, d, r, by)    => api()?.update('Products', id, { delta: d, reason: r, by }) ?? Promise.resolve({ success: false });
// const addOrder              = (order, items)    => api()?.addOrder(order, items, null) ?? Promise.resolve({ success: false });
// const updateOrderStatus     = (id, status, ex)  => api()?.update('Orders', id, { status, ...ex }) ?? Promise.resolve({ success: false });
// const addCustomer           = (c)               => api()?.create('Customers', { ...c, pendingDues: c.udhaar ?? 0 }) ?? Promise.resolve({ success: false });
// const updateCustomer        = (id, c)           => api()?.update('Customers', id, { ...c, pendingDues: c.udhaar ?? 0 }) ?? Promise.resolve({ success: false });
// const addCustomerCreditPayment = (id, amt, due, oid) => api()?.update('Customers', id, { pendingDues: 0, creditPayment: amt, creditDueDate: due, orderId: oid }) ?? Promise.resolve({ success: false });
// const addExpense            = (e)               => api()?.create('Expenses', e) ?? Promise.resolve({ success: false });
// const addStaff              = (s)               => api()?.create('Salesmen', s) ?? Promise.resolve({ success: false });
// const updateStaff           = (id, s)           => api()?.update('Salesmen', id, s) ?? Promise.resolve({ success: false });
// const deleteStaff           = (id)              => api()?.remove('Salesmen', id) ?? Promise.resolve({ success: false });
// const isOnline              = ()                => api()?.isOnline() ?? navigator.onLine;
// const queueOfflineOperation = (action, payload) => api()?.queueOperation(action, payload) ?? Promise.resolve({ success: false, queued: true });
// const processOfflineQueue   = ()                => api()?.processQueue() ?? Promise.resolve({ success: true, processed: 0, failed: 0, remaining: 0 });
// const getPendingSyncCount   = ()                => Promise.resolve((api()?.loadQueue() ?? []).length);
// const testConnection        = ()                => api()?.testConnection() ?? Promise.resolve({ success: false, error: 'DPApi not loaded' });

// /* ── Helpers ── */
// const rs      = n => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;
// const fmtDate = s => { try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); } catch { return s || ""; } };
// const fmtTime = s => { try { return new Date(s).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
// const fmtDT   = s => `${fmtDate(s)} ${fmtTime(s)}`;
// const today   = () => new Date().toISOString();
// const daysDiff = d => { const dd = new Date(d); const n = new Date(); return Math.ceil((dd - n) / (1000*60*60*24)); };

// const loadFromStorage = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch { return fb; } };
// const saveToStorage   = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

// const CATEGORIES = ["All","Grocery","Beverages","Household","Snacks","Cosmetics","Pharmacy"];

// /* ══════════════════════════════════════════════════════════
//    JPEG RECEIPT SLIP — AUTO-RENDERS TO CANVAS ON OPEN
//    The thermal HTML is rendered off-screen, converted to JPEG
//    via html2canvas, then displayed as <img> in the modal.
//    ══════════════════════════════════════════════════════════ */

// function loadHtml2Canvas() {
//   return new Promise(resolve => {
//     if (window.html2canvas) { resolve(window.html2canvas); return; }
//     const s = document.createElement("script");
//     s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
//     s.onload = () => resolve(window.html2canvas);
//     document.head.appendChild(s);
//   });
// }

// /* Renders the hidden thermal div to a JPEG data URL */
// async function renderSlipToJpeg(el) {
//   const h2c = await loadHtml2Canvas();
//   const canvas = await h2c(el, {
//     backgroundColor: "#ffffff",
//     scale: 3,
//     useCORS: true,
//     logging: false,
//     width: el.offsetWidth,
//     windowWidth: el.offsetWidth,
//   });
//   return canvas.toDataURL("image/jpeg", 0.97);
// }

// const ReceiptSlip = ({
//   order,
//   shopName    = "My Store",
//   shopPhone   = "",
//   shopAddress = "",
//   onClose,
// }) => {
//   const hiddenRef  = useRef(null);
//   const [jpegSrc, setJpegSrc]   = useState(null); // the generated JPEG data URL
//   const [loading, setLoading]   = useState(true);
//   const [error, setError]       = useState(null);
//   const [busy, setBusy]         = useState(false);

//   if (!order) return null;

//   /* Computed totals */
//   const discAmt  = order.disc ?? order.discountAmount ?? 0;
//   const taxAmt   = order.taxAmount ?? 0;
//   const isCredit = order.status === "credit";

//   /* ── Inline styles (all explicit so html2canvas captures them) ── */
//   const S = {
//     wrap: {
//       backgroundColor: "#ffffff",
//       fontFamily: "'Courier New', Courier, monospace",
//       color: "#111111",
//       width: "320px",
//       padding: "20px 16px 24px",
//       margin: "0 auto",
//     },
//     headerBlock: {
//       textAlign: "center",
//       paddingBottom: "12px",
//       marginBottom: "12px",
//       borderBottom: "2px dashed #999",
//     },
//     shopName: {
//       fontSize: "18px",
//       fontWeight: "900",
//       letterSpacing: "1px",
//       color: "#111",
//       marginBottom: "3px",
//       textTransform: "uppercase",
//     },
//     shopSub: { fontSize: "11px", color: "#555", lineHeight: "1.6" },
//     metaRow: { display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#333", marginBottom: "4px" },
//     metaKey:   { fontWeight: "700", color: "#555" },
//     metaValue: { fontWeight: "600" },
//     invNum:    { fontWeight: "900", color: "#000" },
//     dashedDiv: { borderTop: "1px dashed #aaa", margin: "10px 0" },
//     itemsHeader: {
//       display: "grid",
//       gridTemplateColumns: "1fr 32px 56px 60px",
//       gap: "0 4px",
//       fontSize: "9px",
//       fontWeight: "900",
//       color: "#555",
//       textTransform: "uppercase",
//       letterSpacing: "0.6px",
//       paddingBottom: "6px",
//       borderBottom: "1px solid #ccc",
//     },
//     itemRow: {
//       display: "grid",
//       gridTemplateColumns: "1fr 32px 56px 60px",
//       gap: "0 4px",
//       fontSize: "11px",
//       paddingTop: "6px",
//       paddingBottom: "6px",
//       borderBottom: "1px dotted #ddd",
//       alignItems: "start",
//     },
//     itemName: { fontWeight: "700", lineHeight: "1.35", wordBreak: "break-word" },
//     itemDisc: { fontSize: "9px", color: "#c00", marginTop: "2px" },
//     numCell:  { textAlign: "right", paddingTop: "1px" },
//     amtCell:  { textAlign: "right", fontWeight: "700", paddingTop: "1px" },
//     totalsBlock: { fontSize: "12px" },
//     totRow:   { display: "flex", justifyContent: "space-between", marginBottom: "4px" },
//     totLabel: { color: "#555" },
//     totVal:   { fontWeight: "700" },
//     discVal:  { fontWeight: "700", color: "#c00" },
//     grandRow: {
//       display: "flex",
//       justifyContent: "space-between",
//       borderTop: "2px solid #111",
//       marginTop: "6px",
//       paddingTop: "8px",
//       fontSize: "15px",
//       fontWeight: "900",
//     },
//     creditBlock: {
//       marginTop: "6px",
//       padding: "8px 10px",
//       backgroundColor: "#fff3f3",
//       border: "1px dashed #e00",
//       borderRadius: "4px",
//     },
//     creditRow:   { display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "3px" },
//     creditLabel: { color: "#c00", fontWeight: "700" },
//     creditVal:   { color: "#c00", fontWeight: "900" },
//     dueNote:     { fontSize: "9px", textAlign: "right", color: "#c00", marginTop: "2px" },
//     statusWrap:  { marginTop: "14px", textAlign: "center" },
//     statusBadge: (paid) => ({
//       display: "inline-block",
//       padding: "4px 20px",
//       borderRadius: "20px",
//       fontSize: "11px",
//       fontWeight: "900",
//       letterSpacing: "1px",
//       textTransform: "uppercase",
//       background: paid ? "#d1fae5" : "#fee2e2",
//       color:      paid ? "#065f46" : "#991b1b",
//       border: `1px solid ${paid ? "#6ee7b7" : "#fca5a5"}`,
//     }),
//     footerBlock: {
//       borderTop: "2px dashed #bbb",
//       marginTop: "16px",
//       paddingTop: "12px",
//       textAlign: "center",
//       fontSize: "10px",
//       color: "#888",
//       lineHeight: "1.9",
//     },
//     footerThank:   { fontWeight: "800", fontSize: "11px", color: "#222", marginBottom: "2px" },
//     footerPowered: { marginTop: "8px", fontSize: "9px", color: "#ccc" },
//     barcodeWrap:   { textAlign: "center", marginTop: "10px" },
//     barcodeText:   { fontFamily: "'Courier New', monospace", fontSize: "24px", color: "#333", letterSpacing: "3px" },
//     barcodeNum:    { fontSize: "9px", color: "#aaa", letterSpacing: "0.5px", marginTop: "-4px" },
//   };

//   /* The hidden thermal HTML — rendered off-screen for html2canvas */
//   const ThermalSlip = (
//     <div
//       ref={hiddenRef}
//       style={{
//         position: "fixed",
//         top: "-9999px",
//         left: "-9999px",
//         zIndex: -1,
//         ...S.wrap,
//       }}
//     >
//       {/* Store header */}
//       <div style={S.headerBlock}>
//         <div style={S.shopName}>🏪 {shopName}</div>
//         {shopAddress && <div style={S.shopSub}>{shopAddress}</div>}
//         {shopPhone   && <div style={S.shopSub}>📞 {shopPhone}</div>}
//         <div style={{ ...S.shopSub, marginTop: "6px", letterSpacing: "2px", fontSize: "10px", color: "#aaa" }}>
//           ━━━━━━━━━━━━━━━━━━━━━━━━━
//         </div>
//       </div>

//       {/* Invoice meta */}
//       <div style={{ marginBottom: "10px" }}>
//         {[
//           ["Invoice #", <span key="inv" style={S.invNum}>{order.id}</span>],
//           ["Date",      fmtDT(order.createdAt)],
//           ["Customer",  order.customerName || "Walk-in"],
//           ["Payment",   (order.method || order.paymentMethod || "Cash").charAt(0).toUpperCase() + (order.method || order.paymentMethod || "Cash").slice(1)],
//           ["Cashier",   order.cashier || "Owner"],
//         ].map(([k, v]) => (
//           <div key={k} style={S.metaRow}>
//             <span style={S.metaKey}>{k}</span>
//             <span style={S.metaValue}>{v}</span>
//           </div>
//         ))}
//       </div>

//       <div style={S.dashedDiv} />

//       {/* Items column headers */}
//       <div style={S.itemsHeader}>
//         <span>Item</span>
//         <span style={{ textAlign: "right" }}>Qty</span>
//         <span style={{ textAlign: "right" }}>Rate</span>
//         <span style={{ textAlign: "right" }}>Amt</span>
//       </div>

//       {/* Items */}
//       {(order.items || []).map((item, i) => {
//         const unitPrice = item.sell ?? item.price ?? 0;
//         const lineAmt   = item.qty * unitPrice;
//         return (
//           <div key={i} style={S.itemRow}>
//             <div>
//               <div style={S.itemName}>{item.name}</div>
//               {item.disc > 0 && <div style={S.itemDisc}>Disc: {rs(item.disc)}/pc</div>}
//             </div>
//             <div style={S.numCell}>{item.qty}</div>
//             <div style={S.numCell}>{rs(unitPrice)}</div>
//             <div style={S.amtCell}>{rs(lineAmt)}</div>
//           </div>
//         );
//       })}

//       <div style={{ ...S.dashedDiv, borderTopStyle: "double", borderTopWidth: "3px", borderColor: "#999" }} />

//       {/* Totals */}
//       <div style={S.totalsBlock}>
//         <div style={S.totRow}>
//           <span style={S.totLabel}>Subtotal</span>
//           <span style={S.totVal}>{rs(order.subtotal ?? order.total)}</span>
//         </div>
//         {discAmt > 0 && (
//           <div style={S.totRow}>
//             <span style={S.totLabel}>Discount</span>
//             <span style={S.discVal}>− {rs(discAmt)}</span>
//           </div>
//         )}
//         {taxAmt > 0 && (
//           <div style={S.totRow}>
//             <span style={S.totLabel}>Tax</span>
//             <span style={S.totVal}>{rs(taxAmt)}</span>
//           </div>
//         )}
//         <div style={S.grandRow}>
//           <span>TOTAL</span>
//           <span>{rs(order.total)}</span>
//         </div>
//       </div>

//       {/* Credit block */}
//       {isCredit && (
//         <div style={S.creditBlock}>
//           <div style={S.creditRow}>
//             <span style={S.creditLabel}>Paid Now</span>
//             <span style={S.creditVal}>{rs(0)}</span>
//           </div>
//           <div style={S.creditRow}>
//             <span style={S.creditLabel}>Balance Due</span>
//             <span style={S.creditVal}>{rs(order.total)}</span>
//           </div>
//           {order.creditDueDate && (
//             <div style={S.dueNote}>Due by: {fmtDate(order.creditDueDate)}</div>
//           )}
//         </div>
//       )}

//       {/* Status badge */}
//       <div style={S.statusWrap}>
//         <span style={S.statusBadge(order.status === "paid")}>
//           {order.status === "paid" ? "PAID" : order.status === "credit" ? "CREDIT" : (order.status || "").toUpperCase()}
//         </span>
//       </div>

//       {/* Barcode */}
//       <div style={S.barcodeWrap}>
//         <div style={S.barcodeText}>||| || |||| || ||| ||</div>
//         <div style={S.barcodeNum}>{order.id}</div>
//       </div>

//       {/* Footer */}
//       <div style={S.footerBlock}>
//         <div style={S.footerThank}>Thank you for your purchase!</div>
//         <div>Items once sold are not returnable</div>
//         <div>without this receipt within 3 days.</div>
//         <div style={S.footerPowered}>★ Powered by DukanDar Pro v5.0 ★</div>
//       </div>
//     </div>
//   );

//   /* Auto-render to JPEG once the hidden ref mounts */
//   useEffect(() => {
//     let cancelled = false;
//     const render = async () => {
//       setLoading(true);
//       setError(null);
//       // Wait for fonts/layout
//       await new Promise(r => setTimeout(r, 300));
//       if (cancelled || !hiddenRef.current) return;
//       try {
//         const dataUrl = await renderSlipToJpeg(hiddenRef.current);
//         if (!cancelled) setJpegSrc(dataUrl);
//       } catch (e) {
//         if (!cancelled) setError("Could not render receipt: " + e.message);
//       } finally {
//         if (!cancelled) setLoading(false);
//       }
//     };
//     render();
//     return () => { cancelled = true; };
//   }, [order?.id]);

//   const handleDownload = () => {
//     if (!jpegSrc || busy) return;
//     setBusy(true);
//     try {
//       const link = document.createElement("a");
//       link.download = `Receipt-${order.id}.jpg`;
//       link.href = jpegSrc;
//       link.click();
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <>
//       {/* Hidden thermal div for html2canvas — NOT visible to user */}
//       {ThermalSlip}

//       {/* Modal showing the JPEG image */}
//       <div
//         className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
//         style={{ fontFamily: "system-ui, sans-serif" }}
//       >
//         <div
//           style={{
//             backgroundColor: "#fff",
//             borderRadius: "20px 20px 0 0",
//             width: "100%",
//             maxWidth: "400px",
//             maxHeight: "95vh",
//             overflowY: "auto",
//             display: "flex",
//             flexDirection: "column",
//             boxShadow: "0 -8px 40px rgba(0,0,0,0.35)",
//           }}
//           className="sm:rounded-3xl"
//         >
//           {/* Action header */}
//           <div style={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             padding: "16px 20px",
//             borderBottom: "1px solid #f0f0f0",
//             backgroundColor: "#fff",
//             position: "sticky",
//             top: 0,
//             zIndex: 10,
//             borderRadius: "20px 20px 0 0",
//           }}>
//             <span style={{ fontWeight: "800", fontSize: "15px", color: "#111" }}>🧾 Sale Receipt</span>
//             <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
//               <button
//                 onClick={handleDownload}
//                 disabled={busy || loading || !!error || !jpegSrc}
//                 style={{
//                   display: "flex",
//                   alignItems: "center",
//                   gap: "6px",
//                   padding: "9px 18px",
//                   background: (loading || !jpegSrc) ? "#9ca3af" : "linear-gradient(135deg, #10b981, #059669)",
//                   color: "#fff",
//                   border: "none",
//                   borderRadius: "12px",
//                   fontWeight: "800",
//                   fontSize: "13px",
//                   cursor: (busy || loading || !!error || !jpegSrc) ? "not-allowed" : "pointer",
//                   boxShadow: "0 4px 12px rgba(16,185,129,0.35)",
//                   transition: "all 0.2s",
//                 }}
//               >
//                 {loading ? "⏳ Generating..." : busy ? "⏳ Saving…" : "⬇️ Download JPEG"}
//               </button>
//               <button
//                 onClick={onClose}
//                 style={{
//                   width: "34px",
//                   height: "34px",
//                   borderRadius: "10px",
//                   background: "#f3f4f6",
//                   border: "none",
//                   fontWeight: "700",
//                   fontSize: "14px",
//                   cursor: "pointer",
//                   color: "#6b7280",
//                 }}
//               >✕</button>
//             </div>
//           </div>

//           {/* JPEG preview area */}
//           <div style={{ padding: "16px", flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "300px", backgroundColor: "#f9fafb" }}>
//             {loading && (
//               <div style={{ textAlign: "center", color: "#6b7280" }}>
//                 <div style={{ fontSize: "32px", marginBottom: "12px" }}>🖨️</div>
//                 <div style={{ fontWeight: "700", fontSize: "14px" }}>Generating Receipt...</div>
//                 <div style={{ fontSize: "12px", marginTop: "4px", color: "#9ca3af" }}>Converting to JPEG image</div>
//               </div>
//             )}
//             {error && (
//               <div style={{ textAlign: "center", color: "#ef4444", padding: "20px" }}>
//                 <div style={{ fontSize: "32px", marginBottom: "8px" }}>❌</div>
//                 <div style={{ fontWeight: "700", fontSize: "13px" }}>{error}</div>
//               </div>
//             )}
//             {jpegSrc && !loading && (
//               <div style={{ width: "100%", textAlign: "center" }}>
//                 {/* The actual JPEG image of the receipt */}
//                 <img
//                   src={jpegSrc}
//                   alt={`Receipt ${order.id}`}
//                   style={{
//                     maxWidth: "100%",
//                     borderRadius: "12px",
//                     boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
//                     border: "1px solid #e5e7eb",
//                     display: "block",
//                     margin: "0 auto",
//                   }}
//                 />
//                 <div style={{ marginTop: "10px", fontSize: "11px", color: "#9ca3af" }}>
//                   📷 JPEG receipt ready · Tap Download to save
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Bottom close */}
//           <div style={{
//             padding: "16px",
//             borderTop: "1px solid #f0f0f0",
//             backgroundColor: "#fff",
//             borderRadius: "0 0 20px 20px",
//           }}>
//             <button
//               onClick={onClose}
//               style={{
//                 width: "100%",
//                 padding: "13px",
//                 borderRadius: "12px",
//                 background: "#f3f4f6",
//                 border: "none",
//                 fontWeight: "700",
//                 fontSize: "14px",
//                 color: "#374151",
//                 cursor: "pointer",
//               }}
//             >
//               Close & Continue
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    SYNC STATUS
//    ══════════════════════════════════════════════════════════ */
// const SyncStatusIndicator = ({ pendingCount, isNetworkOnline, onSync, syncing }) => {
//   const [showPopup, setShowPopup] = useState(false);
//   if (pendingCount === 0 && isNetworkOnline) return null;
//   return (
//     <div className="fixed bottom-24 right-4 z-50">
//       <button onClick={() => setShowPopup(!showPopup)}
//         className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all ${pendingCount > 0 ? "bg-amber-500 hover:bg-amber-600" : isNetworkOnline ? "bg-emerald-500" : "bg-red-500"} text-white`}>
//         {syncing ? "⏳" : pendingCount > 0 ? "📤" : isNetworkOnline ? "☁️" : "📡"}
//       </button>
//       {showPopup && (
//         <div className="absolute bottom-14 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 w-64 border border-slate-200 dark:border-slate-700">
//           <div className="text-sm font-bold mb-2 text-slate-900 dark:text-white">Sync Status</div>
//           <div className="text-xs text-slate-500 mb-3">{isNetworkOnline ? "✅ Online" : "⚠️ Offline — Using Local Storage"}</div>
//           {pendingCount > 0 && <div className="text-xs text-amber-600 mb-3">{pendingCount} pending {pendingCount === 1 ? "operation" : "operations"}</div>}
//           <button onClick={onSync} disabled={syncing || !isNetworkOnline} className="w-full px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-50">
//             {syncing ? "Syncing..." : "Sync Now"}
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    UI COMPONENTS
//    ══════════════════════════════════════════════════════════ */
// const Badge = ({ color, children, size = "sm" }) => {
//   const s = size === "lg" ? "px-3 py-1 text-sm" : "px-2.5 py-0.5 text-xs";
//   const c = { green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", red: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", blue: "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", violet: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", gray: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300", orange: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" };
//   return <span className={`inline-flex items-center ${s} rounded-full font-semibold ${c[color] || c.gray}`}>{children}</span>;
// };

// const Card = ({ children, className = "", onClick, selected = false }) => (
//   <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 transition-all ${selected ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10" : "border-slate-200 dark:border-slate-700"} ${className} ${onClick ? "cursor-pointer hover:shadow-md active:scale-[0.98]" : ""}`}>{children}</div>
// );

// const Toast = ({ msg, type, onClose }) => {
//   useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
//   const colors = { success: "bg-emerald-500", error: "bg-red-500", info: "bg-sky-500", warning: "bg-amber-500" };
//   const icons  = { success: "✅", error: "❌", warning: "⚠️", info: "ℹ️" };
//   return (
//     <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] ${colors[type]} text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-toast`}>
//       {icons[type]} {msg}
//     </div>
//   );
// };

// const Modal = ({ open, onClose, title, children, size = "md" }) => {
//   if (!open) return null;
//   const sizes = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" };
//   return (
//     <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={e => e.target === e.currentTarget && onClose()}>
//       <div className={`bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl w-full ${sizes[size]} max-h-[92vh] overflow-y-auto shadow-2xl`}>
//         <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
//           <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
//           <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
//         </div>
//         <div className="p-5">{children}</div>
//       </div>
//     </div>
//   );
// };

// const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger = false, confirmText = "Confirm" }) => {
//   if (!open) return null;
//   return (
//     <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//       <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full">
//         <div className="text-3xl mb-3 text-center">{danger ? "⚠️" : "❓"}</div>
//         <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 text-center">{title}</h3>
//         <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center">{message}</p>
//         <div className="flex gap-3">
//           <Btn variant="secondary" onClick={onCancel} full>Cancel</Btn>
//           <Btn variant={danger ? "danger" : "primary"} onClick={onConfirm} full>{confirmText}</Btn>
//         </div>
//       </div>
//     </div>
//   );
// };

// const Input = ({ label, value, onChange, type = "text", placeholder = "", required = false, helpText = "", min, max }) => (
//   <div className="mb-4">
//     {label && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}{required && <span className="text-red-500 ml-1">*</span>}</label>}
//     <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} required={required} min={min} max={max}
//       className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm font-medium" />
//     {helpText && <p className="text-xs text-slate-500 mt-1">💡 {helpText}</p>}
//   </div>
// );

// const Select = ({ label, value, onChange, options, helpText = "" }) => (
//   <div className="mb-4">
//     {label && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>}
//     <select value={value || ""} onChange={onChange}
//       className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors text-sm font-medium">
//       {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
//     </select>
//     {helpText && <p className="text-xs text-slate-500 mt-1">💡 {helpText}</p>}
//   </div>
// );

// const Btn = ({ children, onClick, variant = "primary", size = "md", className = "", disabled = false, full = false, type = "button" }) => {
//   const v = { primary: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm", secondary: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300", danger: "bg-red-500 hover:bg-red-600 text-white", ghost: "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400", violet: "bg-violet-500 hover:bg-violet-600 text-white", amber: "bg-amber-500 hover:bg-amber-600 text-white" };
//   const s = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
//   return <button type={type} onClick={onClick} disabled={disabled} className={`${v[variant]} ${s[size]} font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${full ? "w-full" : ""} flex items-center justify-center gap-2 ${className}`}>{children}</button>;
// };

// const EmptyState = ({ icon, title, desc, action }) => (
//   <div className="flex flex-col items-center justify-center py-16 text-center">
//     <div className="text-5xl mb-4">{icon}</div>
//     <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
//     <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{desc}</p>
//     {action}
//   </div>
// );

// const KPIGrid = ({ items }) => (
//   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
//     {(items || []).map((item, i) => (
//       <Card key={i} className="p-4 text-center" onClick={item.onClick}>
//         <div className="text-2xl mb-1">{item.icon}</div>
//         <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{item.label}</div>
//         <div className="text-base font-black text-slate-900 dark:text-white leading-tight">{item.value}</div>
//         {item.change && <div className={`text-xs font-semibold mt-1 ${String(item.change).includes("+") ? "text-emerald-500" : item.change.toString().startsWith("-") ? "text-red-500" : "text-slate-400"}`}>{item.change}</div>}
//       </Card>
//     ))}
//   </div>
// );

// const TimelineItem = ({ icon, title, sub, time, color = "green" }) => {
//   const lineColor = { green:"bg-emerald-500", red:"bg-red-500", blue:"bg-sky-500", amber:"bg-amber-500", violet:"bg-violet-500" };
//   return (
//     <div className="flex gap-3">
//       <div className="flex flex-col items-center">
//         <div className={`w-8 h-8 rounded-full ${lineColor[color]||lineColor.green} flex items-center justify-center text-white text-sm flex-shrink-0`}>{icon}</div>
//         <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 mt-1 min-h-[16px]" />
//       </div>
//       <div className="pb-4 flex-1">
//         <div className="font-semibold text-slate-900 dark:text-white text-sm">{title}</div>
//         {sub && <div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
//         <div className="text-xs text-slate-400 mt-0.5">{time}</div>
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    DASHBOARD
//    ══════════════════════════════════════════════════════════ */
// const Dashboard = ({ products, orders, customers, expenses, lang, setPage, setExternalCustomer, setExternalCreditModal }) => {
//   const L = lang === "ur";
//   const safeProducts   = Array.isArray(products)   ? products   : [];
//   const safeOrders     = Array.isArray(orders)     ? orders     : [];
//   const safeCustomers  = Array.isArray(customers)  ? customers  : [];

//   const todayStr   = new Date().toISOString().slice(0, 10);
//   const todayOrders     = safeOrders.filter(o => (o.createdAt||"").startsWith(todayStr));
//   const todaySales      = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
//   const todayProfit     = todayOrders.reduce((s, o) => s + (o.profit || 0), 0);
//   const thisMonthSales  = safeOrders.filter(o => (o.createdAt||"").startsWith(new Date().toISOString().slice(0,7))).reduce((s,o) => s+(o.total||0), 0);
//   const pendingUdhaar   = safeCustomers.reduce((s, c) => s+(c.udhaar||0), 0);
//   const lowStock        = safeProducts.filter(p => (p.stock||0) <= (p.minStock||p.lowStock||0));
//   const upcomingCredits = safeCustomers.filter(c => (c.udhaar||0) > 0 && c.creditDueDate && daysDiff(c.creditDueDate) <= 7);

//   const kpis = [
//     { icon:"💰", label: L?"آج کی فروخت":"Today Sales",    value: rs(todaySales),    change:"+12%",   onClick:() => setPage("orders") },
//     { icon:"📈", label: L?"مہینے کی فروخت":"Month Sales", value: rs(thisMonthSales), change:"+18%",  onClick:() => setPage("analytics") },
//     { icon:"🏦", label: L?"آج کا منافع":"Today Profit",   value: rs(todayProfit),   change:"+8%",    onClick:() => setPage("analytics") },
//     { icon:"🤝", label: L?"باقی ادھار":"Pending Credit",  value: rs(pendingUdhaar), change:`${upcomingCredits.length} due`, onClick:() => setPage("customers") },
//   ];

//   return (
//     <div className="space-y-5 pb-8">
//       <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
//         <p className="text-emerald-100 text-sm font-medium">{L?"خوش آمدید":"Welcome Back"} · {fmtDate(new Date().toISOString())}</p>
//         <h2 className="text-2xl font-black mt-1">{L?"علی جنرل اسٹور":"My Store"}</h2>
//         <div className="flex gap-6 mt-4 text-sm">
//           <div><div className="text-emerald-100 text-xs">{L?"آج کے آرڈر":"Today Orders"}</div><div className="text-2xl font-black">{todayOrders.length}</div></div>
//           <div><div className="text-emerald-100 text-xs">{L?"اسٹاک قدر":"Stock Value"}</div><div className="text-2xl font-black">{rs(safeProducts.reduce((s,p) => s+(p.stock||0)*(p.buy||0),0))}</div></div>
//           <div><div className="text-emerald-100 text-xs">{L?"ادھار واجب":"Credit Due"}</div><div className="text-2xl font-black">{upcomingCredits.length}</div></div>
//         </div>
//       </div>
//       <KPIGrid items={kpis} />
//       <div>
//         <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{L?"فوری عمل":"Quick Actions"}</h3>
//         <div className="grid grid-cols-4 gap-2">
//           {[["🛒",L?"نئی بلنگ":"New Sale","pos"],["📦",L?"اسٹاک":"Stock","inventory"],["👥",L?"گاہک":"Customers","customers"],["📊",L?"رپورٹ":"Reports","analytics"]].map(([ico,lbl,pg]) => (
//             <button key={pg} onClick={() => setPage(pg)} className="flex flex-col items-center p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 transition-all active:scale-95 gap-1">
//               <span className="text-2xl">{ico}</span>
//               <span className="text-xs font-bold text-center leading-tight">{lbl}</span>
//             </button>
//           ))}
//         </div>
//       </div>
//       {upcomingCredits.length > 0 && (
//         <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-xl p-4">
//           <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">🔔 {L?"قرض یاددہانی":"Credit Reminders"}</h3>
//           <div className="space-y-2">
//             {upcomingCredits.slice(0, 3).map(c => {
//               const diff = daysDiff(c.creditDueDate);
//               return (
//                 <div key={c.id} className="flex items-center justify-between">
//                   <div>
//                     <span className="text-sm font-semibold text-amber-900 dark:text-amber-100">{c.name}</span>
//                     <span className="text-xs text-amber-700 dark:text-amber-300 ml-2">{diff < 0 ? `${Math.abs(diff)}d overdue` : `Due in ${diff}d`}</span>
//                   </div>
//                   <Badge color={diff < 0 ? "red" : "amber"}>{rs(c.udhaar)}</Badge>
//                 </div>
//               );
//             })}
//           </div>
//         </div>
//       )}
//       {lowStock.length > 0 && (
//         <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4">
//           <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">⚠️ {L?"کم اسٹاک الرٹ":"Low Stock Alert"}</h3>
//           <div className="space-y-1">
//             {lowStock.slice(0, 4).map(p => (
//               <div key={p.id} className="flex items-center justify-between text-sm">
//                 <span className="text-red-900 dark:text-red-100">{p.name}</span>
//                 <Badge color="red">{p.stock} left</Badge>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}
//       <div>
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{L?"حالیہ فروخت":"Recent Sales"}</h3>
//           <button onClick={() => setPage("orders")} className="text-emerald-500 text-xs font-semibold">View All →</button>
//         </div>
//         <div className="space-y-2">
//           {safeOrders.slice(0, 4).map(o => (
//             <div key={o.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
//               <div className="flex items-center gap-3 flex-1">
//                 <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">🧾</div>
//                 <div>
//                   <div className="font-semibold text-slate-900 dark:text-white text-sm">{o.customerName}</div>
//                   <div className="text-xs text-slate-500">{o.id} · {fmtTime(o.createdAt)}</div>
//                 </div>
//               </div>
//               <div className="text-right">
//                 <div className="font-black text-slate-900 dark:text-white text-sm">{rs(o.total)}</div>
//                 <Badge color={o.status==="paid"?"green":o.status==="credit"?"red":"amber"}>{o.status}</Badge>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    POS
//    ══════════════════════════════════════════════════════════ */
// const POS = ({ products, customers, setOrders, setProducts, setCustomers, showToast, lang, shopInfo }) => {
//   const [cart, setCart]                         = useState([]);
//   const [search, setSearch]                     = useState("");
//   const [activeCat, setActiveCat]               = useState("All");
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [payMethod, setPayMethod]               = useState("cash");
//   const [discount, setDiscount]                 = useState(0);
//   const [showCart, setShowCart]                 = useState(false);
//   const [showCustomerSearch, setShowCustomerSearch] = useState(false);
//   const [customerSearch, setCustomerSearch]     = useState("");
//   const [showConfirm, setShowConfirm]           = useState(false);
//   const [creditDueDate, setCreditDueDate]       = useState("");
//   const [isProcessing, setIsProcessing]         = useState(false);
//   const [showAddCustomer, setShowAddCustomer]   = useState(false);
//   const [newCustForm, setNewCustForm]           = useState({ name:"", phone:"", email:"", addr:"" });
//   const [savingCust, setSavingCust]             = useState(false);
//   const [receiptOrder, setReceiptOrder]         = useState(null);

//   const L              = lang === "ur";
//   const safeProducts   = Array.isArray(products)  ? products  : [];
//   const safeCustomers  = Array.isArray(customers) ? customers : [];

//   const filtered = safeProducts.filter(p =>
//     (activeCat === "All" || p.cat === p.category || p.cat === activeCat || p.category === activeCat) &&
//     (p.name?.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())))
//   );

//   const addToCart = p => {
//     if ((p.stock||0) <= 0) { showToast("Out of stock!", "error"); return; }
//     setCart(c => { const ex = c.find(i => i.pid === p.id); return ex ? c.map(i => i.pid===p.id ? {...i, qty:i.qty+1} : i) : [...c, { pid:p.id, name:p.name, buy:p.buy||p.cost||0, sell:p.sell||p.price||0, qty:1, disc:0 }]; });
//   };

//   const subtotal  = cart.reduce((s, i) => s + i.qty * i.sell, 0);
//   const totalDisc = cart.reduce((s, i) => s + i.disc * i.qty, 0) + +discount;
//   const total     = subtotal - totalDisc;
//   const profit    = cart.reduce((s, i) => s + i.qty * (i.sell - i.buy - (i.disc||0)), 0) - +discount;

//   const doCheckout = () => {
//     if (cart.length === 0) { showToast("Cart is empty!", "error"); return; }
//     if (!selectedCustomer)  { showToast("Please select a customer", "error"); return; }
//     setShowCart(false); setShowConfirm(true);
//   };

//   const saveNewCustomer = async () => {
//     if (!newCustForm.name || !newCustForm.phone) { showToast("Name & phone required", "error"); return; }
//     setSavingCust(true);
//     const nc = { ...newCustForm, id:Date.now(), udhaar:0, totalOrders:0, totalSpent:0, points:0, joined:new Date().toISOString().split("T")[0], creditDueDate:null, creditHistory:[], activityLog:[], editHistory:[] };
//     try {
//       const result = await addCustomer(nc);
//       if (result.success) { setCustomers(prev => [...prev, nc]); setSelectedCustomer(nc); showToast(`✅ ${nc.name} added!`, "success"); }
//       else { await queueOfflineOperation("addCustomer", { customer:nc }); setCustomers(prev => [...prev, nc]); setSelectedCustomer(nc); showToast("⚠️ Saved offline", "warning"); }
//     } catch { showToast("Error adding customer", "error"); }
//     setNewCustForm({ name:"", phone:"", email:"", addr:"" });
//     setShowAddCustomer(false); setShowCustomerSearch(false); setSavingCust(false);
//   };

//   const confirmCheckout = async () => {
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const inv = `INV-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random()*1000))}`;
//     const order = {
//       id: inv,
//       customerId: selectedCustomer.id, customerName: selectedCustomer.name,
//       cashier: "Ali",
//       items: cart.map(i => ({ pid:i.pid, productId:i.pid, name:i.name, qty:i.qty, buy:i.buy, sell:i.sell, price:i.sell, cost:i.buy, disc:i.disc, total:i.qty*i.sell })),
//       subtotal, disc:totalDisc, discountAmount:totalDisc, total, profit,
//       status: payMethod === "udhaar" ? "credit" : "paid",
//       method: payMethod, paymentMethod: payMethod,
//       udhaarAmt: payMethod === "udhaar" ? total : 0,
//       creditDueDate: payMethod === "udhaar" ? (creditDueDate || null) : null,
//       createdAt: today(), date: today(), notes:"",
//       timeline:[{ time:today(), evt:"Order created" }],
//       refunds:[], returnHistory:[]
//     };
//     const stockUpdates = cart.map(item => ({ id:item.pid, delta:-item.qty, reason:`Sale ${inv}`, by:"Ali" }));
//     try {
//       const result = await addOrder(order, stockUpdates);
//       if (result.success) {
//         setOrders(prev => [order, ...prev]);
//         setProducts(prev => prev.map(p => { const ci = cart.find(i => i.pid===p.id); return ci ? {...p, stock:Math.max(0,(p.stock||0)-ci.qty)} : p; }));
//         if (payMethod === "udhaar") {
//           try { await addCustomerCreditPayment(selectedCustomer.id, total, creditDueDate||selectedCustomer.creditDueDate, inv); setCustomers(prev => prev.map(c => c.id===selectedCustomer.id ? {...c, udhaar:(c.udhaar||0)+total, creditDueDate:creditDueDate||c.creditDueDate} : c)); } catch {}
//         }
//         showToast(`✅ ${inv} saved!`, "success");
//       } else if (result.queued) {
//         setOrders(prev => [order, ...prev]);
//         setProducts(prev => prev.map(p => { const ci = cart.find(i => i.pid===p.id); return ci ? {...p, stock:Math.max(0,(p.stock||0)-ci.qty)} : p; }));
//         if (payMethod === "udhaar") setCustomers(prev => prev.map(c => c.id===selectedCustomer.id ? {...c, udhaar:(c.udhaar||0)+total} : c));
//         showToast("⚠️ Offline: Order saved locally", "warning");
//       } else throw new Error(result.error || "Failed");
//     } catch (error) {
//       showToast("Error: " + error.message, "error");
//       setOrders(prev => [order, ...prev]);
//       setProducts(prev => prev.map(p => { const ci = cart.find(i => i.pid===p.id); return ci ? {...p, stock:Math.max(0,(p.stock||0)-ci.qty)} : p; }));
//     } finally {
//       setReceiptOrder(order);
//       setCart([]); setSelectedCustomer(null); setDiscount(0); setShowConfirm(false); setCreditDueDate(""); setIsProcessing(false);
//     }
//   };

//   return (
//     <div className="flex flex-col pb-24">
//       {receiptOrder && (
//         <ReceiptSlip
//           order={receiptOrder}
//           shopName={shopInfo?.name || "My Store"}
//           shopPhone={shopInfo?.phone || ""}
//           shopAddress={shopInfo?.address || ""}
//           onClose={() => setReceiptOrder(null)}
//         />
//       )}

//       <div className="space-y-3 mb-4">
//         <button onClick={() => setShowCustomerSearch(true)} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-400 transition-colors">
//           <div className="flex items-center gap-3">
//             <span className="text-2xl">👤</span>
//             <div className="text-left">
//               <div className={`text-sm font-semibold ${selectedCustomer ? "text-slate-900 dark:text-white" : "text-slate-400"}`}>{selectedCustomer ? selectedCustomer.name : (L?"گاہک منتخب کریں":"Select Customer")}</div>
//               {selectedCustomer && <div className="text-xs text-slate-500">{selectedCustomer.phone}</div>}
//             </div>
//           </div>
//           {selectedCustomer?.udhaar > 0 && <Badge color="red">Owes {rs(selectedCustomer.udhaar)}</Badge>}
//         </button>
//         <div className="relative">
//           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
//           <input value={search} onChange={e => setSearch(e.target.value)} placeholder={L?"پروڈکٹ تلاش کریں...":"Search products..."}
//             className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none text-sm" />
//         </div>
//       </div>

//       <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
//         {CATEGORIES.map(cat => <button key={cat} onClick={() => setActiveCat(cat)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCat===cat ? "bg-emerald-500 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{cat}</button>)}
//       </div>

//       <div className="grid grid-cols-2 gap-3 mb-8">
//         {filtered.map(p => {
//           const inCart = cart.find(i => i.pid === p.id);
//           const out    = (p.stock||0) <= 0;
//           return (
//             <button key={p.id} onClick={() => !out && addToCart(p)} disabled={out}
//               className={`relative p-4 rounded-2xl text-left border-2 transition-all ${inCart ? "border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"} ${out ? "opacity-40" : ""}`}>
//               {inCart && <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">{inCart.qty}</div>}
//               <div className="text-2xl mb-2">📦</div>
//               <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight mb-1 line-clamp-2">{p.name}</div>
//               <div className="text-emerald-600 font-black text-sm">{rs(p.sell||p.price||0)}</div>
//               <div className="text-xs text-slate-400 mt-0.5">{out ? "Out of stock" : `${p.stock} ${p.unit||"pcs"}`}</div>
//             </button>
//           );
//         })}
//       </div>

//       {cart.length > 0 && (
//         <div className="fixed bottom-20 left-4 right-4 z-50">
//           <button onClick={() => setShowCart(true)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-base shadow-2xl flex items-center justify-between px-5 active:scale-98 transition-all">
//             <div className="flex items-center gap-3">
//               <span className="bg-white text-emerald-600 w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm">{cart.reduce((s,i)=>s+i.qty,0)}</span>
//               <span>{L?"کارٹ":"Cart"}</span>
//             </div>
//             <span>{rs(total)}</span>
//           </button>
//         </div>
//       )}

//       <Modal open={showCart} onClose={() => setShowCart(false)} title={`🛒 Cart (${cart.reduce((s,i)=>s+i.qty,0)} items)`} size="lg">
//         <div className="space-y-3 mb-4">
//           {cart.map(item => (
//             <div key={item.pid} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
//               <div className="flex items-start justify-between mb-2">
//                 <div><div className="font-bold text-sm">{item.name}</div><div className="text-xs text-slate-500">{rs(item.sell)} each</div></div>
//                 <button onClick={() => setCart(c => c.filter(i => i.pid!==item.pid))} className="text-red-400">✕</button>
//               </div>
//               <div className="flex items-center gap-2">
//                 <div className="flex items-center gap-1 bg-white dark:bg-slate-600 rounded-lg p-1">
//                   <button onClick={() => { if (item.qty<=1) setCart(c=>c.filter(i=>i.pid!==item.pid)); else setCart(c=>c.map(i=>i.pid===item.pid?{...i,qty:i.qty-1}:i)); }} className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-500 flex items-center justify-center font-bold">−</button>
//                   <span className="w-8 text-center font-black text-sm">{item.qty}</span>
//                   <button onClick={() => setCart(c=>c.map(i=>i.pid===item.pid?{...i,qty:i.qty+1}:i))} className="w-7 h-7 rounded-md bg-emerald-500 text-white flex items-center justify-center font-bold">+</button>
//                 </div>
//                 <div className="text-right flex-1"><div className="font-black text-sm">{rs(item.qty*item.sell)}</div><div className="text-xs text-emerald-500">+{rs(item.qty*(item.sell-item.buy))}</div></div>
//               </div>
//             </div>
//           ))}
//         </div>
//         <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4 space-y-2 border border-slate-200 dark:border-slate-600">
//           <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Subtotal</span><span className="font-semibold">{rs(subtotal)}</span></div>
//           <div className="flex justify-between items-center text-sm"><span className="text-slate-600 dark:text-slate-400">Discount</span><input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm" /></div>
//           <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between"><span className="font-bold">Total</span><span className="font-black text-xl text-emerald-600">{rs(total)}</span></div>
//         </div>
//         <div className="mb-4">
//           <div className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Payment Method</div>
//           <div className="grid grid-cols-3 gap-2">
//             {[["cash","💵","Cash"],["online","📱","Online"],["udhaar","📒","Credit"]].map(([v,ico,lbl]) => (
//               <button key={v} onClick={() => setPayMethod(v)} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${payMethod===v ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30" : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"}`}>
//                 <span className="text-xl mb-1">{ico}</span><span className="text-xs font-bold">{lbl}</span>
//               </button>
//             ))}
//           </div>
//           {payMethod === "udhaar" && <div className="mt-3"><Input label="Credit Due Date (optional)" type="date" value={creditDueDate} onChange={e=>setCreditDueDate(e.target.value)} /></div>}
//         </div>
//         <div className="flex gap-2">
//           <Btn variant="secondary" onClick={() => setShowCart(false)} full>Cancel</Btn>
//           <Btn variant="primary" onClick={doCheckout} full disabled={isProcessing}>{isProcessing?"Processing...":"✅ Complete"}</Btn>
//         </div>
//       </Modal>

//       <Modal open={showCustomerSearch} onClose={() => { setShowCustomerSearch(false); setShowAddCustomer(false); }} title={L?"گاہک منتخب کریں":"Select Customer"}>
//         {!showAddCustomer ? (
//           <>
//             <div className="mb-3"><Btn variant="violet" onClick={() => setShowAddCustomer(true)} full>➕ {L?"نیا گاہک بنائیں":"Create New Customer"}</Btn></div>
//             <div className="relative mb-3"><Input placeholder={L?"نام یا نمبر...":"Name or phone..."} value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)} /></div>
//             <div className="space-y-2 max-h-80 overflow-y-auto">
//               {safeCustomers.filter(c => c.name?.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone&&c.phone.includes(customerSearch))).map(c => (
//                 <button key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); setCustomerSearch(""); }} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
//                   <div><div className="font-bold text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.phone}</div></div>
//                   {c.udhaar > 0 && <Badge color="red">{rs(c.udhaar)}</Badge>}
//                 </button>
//               ))}
//             </div>
//           </>
//         ) : (
//           <div>
//             <button onClick={() => setShowAddCustomer(false)} className="flex items-center gap-1 text-emerald-500 font-bold text-sm mb-4">← Back</button>
//             <Input label="Full Name *" value={newCustForm.name} onChange={e=>setNewCustForm({...newCustForm,name:e.target.value})} required />
//             <Input label="Phone *" value={newCustForm.phone} onChange={e=>setNewCustForm({...newCustForm,phone:e.target.value})} type="tel" required />
//             <Input label="Email" value={newCustForm.email} onChange={e=>setNewCustForm({...newCustForm,email:e.target.value})} type="email" />
//             <Input label="Address" value={newCustForm.addr} onChange={e=>setNewCustForm({...newCustForm,addr:e.target.value})} />
//             <div className="flex gap-2">
//               <Btn variant="secondary" onClick={() => setShowAddCustomer(false)} full>Cancel</Btn>
//               <Btn variant="primary" onClick={saveNewCustomer} disabled={savingCust} full>{savingCust?"Saving...":"✅ Save & Select"}</Btn>
//             </div>
//           </div>
//         )}
//       </Modal>

//       <ConfirmDialog open={showConfirm} title="Confirm Sale"
//         message={`Complete sale for ${selectedCustomer?.name}? Total: ${rs(total)} via ${payMethod}`}
//         onConfirm={confirmCheckout} onCancel={() => setShowConfirm(false)} confirmText="Complete Sale" />
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    INVENTORY
//    ══════════════════════════════════════════════════════════ */
// const Inventory = ({ products, setProducts, showToast, lang }) => {
//   const [search, setSearch]               = useState("");
//   const [activeCat, setActiveCat]         = useState("All");
//   const [showAdd, setShowAdd]             = useState(false);
//   const [editProduct, setEditProduct]     = useState(null);
//   const [showStockHistory, setShowStockHistory] = useState(null);
//   const [isProcessing, setIsProcessing]   = useState(false);
//   const [form, setForm]                   = useState({ name:"", nameUr:"", sku:"", cat:"Grocery", buy:"", sell:"", stock:"", minStock:"5", unit:"pcs", expiry:"", supplier:"", barcode:"" });
//   const [deleteConfirm, setDeleteConfirm] = useState(null);
//   const L            = lang === "ur";
//   const safeProducts = Array.isArray(products) ? products : [];

//   const filtered = safeProducts.filter(p => (activeCat==="All"||p.cat===activeCat||p.category===activeCat) && (p.name?.toLowerCase().includes(search.toLowerCase())||(p.sku&&p.sku.toLowerCase().includes(search.toLowerCase()))));

//   const openEdit = p => { setEditProduct(p.id); setForm({...p, buy:String(p.buy||p.cost||""), sell:String(p.sell||p.price||""), stock:String(p.stock||""), minStock:String(p.minStock||p.lowStock||"5")}); setShowAdd(true); };

//   const saveProduct = async () => {
//     if (!form.name||!form.sell) { showToast("Name & sell price required","error"); return; }
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const updated = {...form, buy:+form.buy, sell:+form.sell, cost:+form.buy, price:+form.sell, stock:+form.stock, minStock:+form.minStock, lowStock:+form.minStock, category:form.cat};
//     if (editProduct) {
//       const old = safeProducts.find(p=>p.id===editProduct);
//       const finalProduct = {...updated, id:editProduct, stockHistory:old.stockHistory||[], editHistory:[...(old.editHistory||[]),{date:today(),by:"Owner"}]};
//       try {
//         const result = await updateProduct(editProduct, finalProduct);
//         if (result.success) { setProducts(prev=>prev.map(p=>p.id===editProduct?finalProduct:p)); showToast("✅ Product updated!","success"); }
//         else { await queueOfflineOperation("updateProduct",{id:editProduct,product:finalProduct}); setProducts(prev=>prev.map(p=>p.id===editProduct?finalProduct:p)); showToast("⚠️ Saved offline","warning"); }
//       } catch(e) { showToast("Error: "+e.message,"error"); }
//     } else {
//       const newProduct = {...updated, id:Date.now(), stockHistory:[], editHistory:[]};
//       try {
//         const result = await addProduct(newProduct);
//         if (result.success) { setProducts(prev=>[...prev,newProduct]); showToast("✅ Product added!","success"); }
//         else { await queueOfflineOperation("addProduct",{product:newProduct}); setProducts(prev=>[...prev,newProduct]); showToast("⚠️ Saved offline","warning"); }
//       } catch(e) { showToast("Error: "+e.message,"error"); }
//     }
//     setShowAdd(false); setIsProcessing(false);
//   };

//   const adjustStock = async (productId, delta, reason) => {
//     const product   = safeProducts.find(p=>p.id===productId);
//     const newStock  = Math.max(0,(product.stock||0)+delta);
//     try {
//       const result = await patchProductStock(productId, delta, reason, "Owner");
//       if (result.success) { setProducts(prev=>prev.map(p=>p.id===productId?{...p,stock:newStock,stockHistory:[...(p.stockHistory||[]),{date:today(),change:delta,reason:reason||"Manual",by:"Owner"}]}:p)); showToast("✅ Stock updated!","success"); }
//       else { await queueOfflineOperation("adjustStock",{productId,delta,reason,by:"Owner"}); setProducts(prev=>prev.map(p=>p.id===productId?{...p,stock:newStock}:p)); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//   };

//   const handleDelete = async id => {
//     try { const result = await deleteProduct(id); if (result.success||result.queued) { setProducts(prev=>prev.filter(p=>p.id!==id)); showToast("✅ Deleted!","success"); } } catch(e) { showToast("Error: "+e.message,"error"); }
//     setDeleteConfirm(null);
//   };

//   const stockValue = safeProducts.reduce((s,p)=>s+((p.stock||0)*(p.buy||p.cost||0)),0);
//   const lowCount   = safeProducts.filter(p=>(p.stock||0)<=(p.minStock||p.lowStock||0)).length;

//   return (
//     <div className="space-y-4 pb-8">
//       <KPIGrid items={[
//         {icon:"📦",label:"Total SKUs",value:safeProducts.length,change:`${lowCount} low`},
//         {icon:"⚠️",label:"Low Stock",value:lowCount,change:"Check now"},
//         {icon:"💼",label:"Stock Value",value:rs(stockValue),change:null},
//         {icon:"📊",label:"Avg Margin",value:safeProducts.length>0?`${Math.round(safeProducts.reduce((s,p)=>s+(((p.sell||p.price||0)-(p.buy||p.cost||0))/(p.sell||p.price||1))*100,0)/safeProducts.length)}%`:"0%",change:null},
//       ]} />
//       <div className="flex gap-3">
//         <div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
//           <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 focus:outline-none" />
//         </div>
//         <Btn variant="primary" onClick={() => { setForm({name:"",nameUr:"",sku:"",cat:"Grocery",buy:"",sell:"",stock:"",minStock:"5",unit:"pcs",expiry:"",supplier:"",barcode:""}); setEditProduct(null); setShowAdd(true); }}>+ Add</Btn>
//       </div>
//       <div className="flex gap-2 overflow-x-auto no-scrollbar">
//         {CATEGORIES.map(cat=><button key={cat} onClick={()=>setActiveCat(cat)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCat===cat?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{cat}</button>)}
//       </div>
//       <div className="space-y-3">
//         {filtered.map(p => {
//           const sell     = p.sell||p.price||0;
//           const buy      = p.buy||p.cost||0;
//           const minStock = p.minStock||p.lowStock||0;
//           const isLow    = (p.stock||0) <= minStock;
//           const stockPct = Math.min(100,((p.stock||0)/((minStock||5)*3))*100);
//           return (
//             <Card key={p.id} className={`p-4 ${isLow?"border-amber-300 dark:border-amber-700":""}`}>
//               <div className="flex items-start justify-between mb-3">
//                 <div className="flex-1">
//                   <div className="flex items-center gap-2 mb-0.5 flex-wrap">
//                     <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
//                     {p.nameUr&&<span className="text-xs text-slate-500">{p.nameUr}</span>}
//                     {isLow&&<Badge color="amber">Low</Badge>}
//                     {p.stock===0&&<Badge color="red">Out</Badge>}
//                   </div>
//                   <div className="text-xs text-slate-500">{p.sku} · {p.cat||p.category} · {p.supplier}</div>
//                 </div>
//                 <div className="flex gap-1 flex-shrink-0">
//                   <button onClick={() => setShowStockHistory(p)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold hover:bg-slate-200">📜</button>
//                   <button onClick={() => openEdit(p)} className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200">✏️</button>
//                   <button onClick={() => setDeleteConfirm(p.id)} className="px-2 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-200">🗑️</button>
//                 </div>
//               </div>
//               <div className="grid grid-cols-4 gap-2 mb-3">
//                 {[{l:"Buy",v:rs(buy),c:""},{l:"Sell",v:rs(sell),c:"text-emerald-600 font-bold"},{l:"Stock",v:`${p.stock} ${p.unit||"pcs"}`,c:isLow?"text-amber-500 font-bold":""},{l:"Margin",v:`${sell?Math.round(((sell-buy)/sell)*100):0}%`,c:"text-violet-600"}].map(({l,v,c})=>(
//                   <div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className={`font-bold mt-0.5 text-xs ${c}`}>{v}</div></div>
//                 ))}
//               </div>
//               <div className="mb-3">
//                 <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Stock level</span><span>{p.stock||0}/{Math.max((minStock||5)*3,1)} {p.unit||"pcs"}</span></div>
//                 <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
//                   <div className={`h-full rounded-full transition-all ${isLow?"bg-amber-500":p.stock===0?"bg-red-500":"bg-emerald-500"}`} style={{width:`${stockPct}%`}} />
//                 </div>
//               </div>
//               <div className="flex gap-2">
//                 <Btn variant="secondary" size="sm" onClick={() => adjustStock(p.id,-1,"Manual -1")}>−1</Btn>
//                 <Btn variant="primary" size="sm" onClick={() => adjustStock(p.id,1,"Manual +1")}>+1</Btn>
//                 <Btn variant="secondary" size="sm" onClick={() => { const qty=prompt("Add stock quantity:"); if(qty&&+qty>0) adjustStock(p.id,+qty,"Stock added"); }}>+ Add</Btn>
//                 <Btn variant="secondary" size="sm" onClick={() => { const qty=prompt("Reduce stock by:"); if(qty&&+qty>0) adjustStock(p.id,-qty,"Stock reduced"); }}>− Reduce</Btn>
//               </div>
//             </Card>
//           );
//         })}
//       </div>
//       <Modal open={showAdd} onClose={() => setShowAdd(false)} title={editProduct?"✏️ Edit Product":"➕ Add Product"} size="lg">
//         <div className="grid grid-cols-2 gap-x-4">
//           <div className="col-span-2"><Input label="Product Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g., Basmati Rice 5kg" required /></div>
//           <div className="col-span-2"><Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})} placeholder="اردو نام" /></div>
//           <Input label="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="GR001" />
//           <Input label="Barcode" value={form.barcode||""} onChange={e=>setForm({...form,barcode:e.target.value})} placeholder="123456789" />
//           <div className="col-span-2"><Select label="Category" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} options={CATEGORIES.slice(1).map(c=>({value:c,label:c}))} /></div>
//           <Input label="Cost Price *" type="number" value={form.buy} onChange={e=>setForm({...form,buy:e.target.value})} placeholder="0" />
//           <Input label="Sell Price *" type="number" value={form.sell} onChange={e=>setForm({...form,sell:e.target.value})} placeholder="0" />
//           <Input label="Stock Qty" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} placeholder="0" />
//           <Input label="Min Stock" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} placeholder="5" />
//           <Select label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} options={["pcs","kg","l","bag","box","pkt","btl","tin","strip"].map(u=>({value:u,label:u}))} />
//           <Input label="Expiry" type="month" value={form.expiry||""} onChange={e=>setForm({...form,expiry:e.target.value})} />
//           <div className="col-span-2"><Input label="Supplier" value={form.supplier||""} onChange={e=>setForm({...form,supplier:e.target.value})} placeholder="Supplier name" /></div>
//         </div>
//         {form.buy&&form.sell&&<div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm"><span className="text-slate-600 dark:text-slate-400">Profit per unit: </span><span className="font-black text-emerald-600">{rs(+form.sell-+form.buy)} ({Math.round((+form.sell-+form.buy)/+form.sell*100)}%)</span></div>}
//         <div className="flex gap-2"><Btn variant="secondary" onClick={() => setShowAdd(false)} full>Cancel</Btn><Btn variant="primary" onClick={saveProduct} full disabled={isProcessing}>{isProcessing?"Saving...":"💾 Save Product"}</Btn></div>
//       </Modal>
//       <Modal open={!!showStockHistory} onClose={() => setShowStockHistory(null)} title={`📜 ${showStockHistory?.name} History`} size="md">
//         {showStockHistory && (
//           <div className="space-y-2 max-h-80 overflow-y-auto">
//             {(!showStockHistory.stockHistory||showStockHistory.stockHistory.length===0)?<EmptyState icon="📊" title="No history" desc="Stock changes will appear here" />:
//               [...showStockHistory.stockHistory].reverse().map((h,i)=>(
//                 <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-sm">
//                   <div><div className="font-semibold">{h.reason}</div><div className="text-xs text-slate-500">{fmtDT(h.date)} · by {h.by}</div></div>
//                   <Badge color={h.change>0?"green":"red"}>{h.change>0?"+":""}{h.change}</Badge>
//                 </div>
//               ))}
//           </div>
//         )}
//       </Modal>
//       <ConfirmDialog open={!!deleteConfirm} title="Delete Product?" message="This will permanently remove the product." danger onConfirm={() => handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} confirmText="Delete" />
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    ORDER HISTORY
//    ══════════════════════════════════════════════════════════ */
// const OrdersHistory = ({ orders, products, setOrders, setProducts, setCustomers, customers, showToast, lang }) => {
//   const [search, setSearch]             = useState("");
//   const [filterStatus, setFilterStatus] = useState("all");
//   const [expandedId, setExpandedId]     = useState(null);
//   const [showReturnModal, setShowReturnModal] = useState(null);
//   const [returnQty, setReturnQty]       = useState({});
//   const [returnReason, setReturnReason] = useState("");
//   const [dateFrom, setDateFrom]         = useState("");
//   const [dateTo, setDateTo]             = useState("");
//   const [showConfirm, setShowConfirm]   = useState(false);
//   const [viewReceipt, setViewReceipt]   = useState(null);
//   const L = lang === "ur";
//   const safeOrders    = Array.isArray(orders)    ? orders    : [];
//   const safeCustomers = Array.isArray(customers) ? customers : [];

//   const filtered = safeOrders.filter(o => {
//     const ms  = o.id?.toLowerCase().includes(search.toLowerCase())||o.customerName?.toLowerCase().includes(search.toLowerCase());
//     const mst = filterStatus==="all"||o.status===filterStatus||(filterStatus==="returned"&&o.returnHistory?.length>0);
//     const mdf = !dateFrom||o.createdAt>=dateFrom;
//     const mdt = !dateTo  ||o.createdAt<=dateTo+"T23:59";
//     return ms&&mst&&mdf&&mdt;
//   });

//   const initReturn = order => {
//     const init = {};
//     order.items.forEach(item => { init[`${order.id}-${item.pid||item.productId}`]=item.qty; });
//     setReturnQty(init); setReturnReason(""); setShowReturnModal(order.id);
//   };

//   const doReturn = async () => {
//     const order = safeOrders.find(o=>o.id===showReturnModal);
//     if (!order) return;
//     const returnedItems = order.items.map(item => ({...item, returnedQty:returnQty[`${order.id}-${item.pid||item.productId}`]||0})).filter(i=>i.returnedQty>0);
//     const refundAmt     = returnedItems.reduce((s,i)=>s+i.returnedQty*(i.sell||i.price||0),0);
//     const allReturned   = returnedItems.every(ri=>{const orig=order.items.find(i=>(i.pid||i.productId)===(ri.pid||ri.productId));return ri.returnedQty>=orig.qty;})&&returnedItems.length===order.items.length;
//     const returnRecord  = {date:today(),items:returnedItems,reason:returnReason,refundAmount:refundAmt,by:"Owner"};
//     try {
//       const result = await updateOrderStatus(order.id, allReturned?"returned":order.status, {returnRecord});
//       if (result.success) {
//         setOrders(prev=>prev.map(o=>o.id===showReturnModal?{...o,status:allReturned?"returned":o.status,returnHistory:[...(o.returnHistory||[]),returnRecord]}:o));
//         setProducts(prev=>prev.map(p=>{const ri=returnedItems.find(i=>(i.pid||i.productId)===p.id);return ri?{...p,stock:(p.stock||0)+ri.returnedQty}:p;}));
//         showToast(`✅ Return recorded! ${rs(refundAmt)} refunded`,"success");
//       } else { await queueOfflineOperation("processReturn",{orderId:showReturnModal,returnedItems,reason:returnReason,refundAmount:refundAmt}); showToast("⚠️ Return saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowReturnModal(null); setShowConfirm(false); setReturnQty({}); setReturnReason("");
//   };

//   const statusBadge = o => {
//     if (o.returnHistory?.length>0&&o.status!=="returned") return <Badge color="orange">Partial Return</Badge>;
//     const c = {paid:"green",credit:"red",returned:"amber"};
//     return <Badge color={c[o.status]||"gray"}>{o.status}</Badge>;
//   };

//   return (
//     <div className="space-y-4 pb-8">
//       {viewReceipt && <ReceiptSlip order={viewReceipt} onClose={() => setViewReceipt(null)} />}
//       <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
//         <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"آرڈر تلاش کریں...":"Search orders..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none" />
//       </div>
//       <div className="flex gap-2 overflow-x-auto no-scrollbar">
//         {[["all","All"],["paid","✅ Paid"],["credit","📒 Credit"],["returned","🔄 Returned"]].map(([v,l])=>(
//           <button key={v} onClick={() => setFilterStatus(v)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus===v?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>
//         ))}
//       </div>
//       <div className="flex gap-2">
//         <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs" />
//         <span className="text-slate-400 self-center">→</span>
//         <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs" />
//       </div>
//       <div className="text-xs text-slate-500">{filtered.length} orders · Total: {rs(filtered.reduce((s,o)=>s+(o.total||0),0))} · Profit: {rs(filtered.reduce((s,o)=>s+(o.profit||0),0))}</div>
//       <div className="space-y-3">
//         {filtered.length===0?<EmptyState icon="🧾" title="No orders found" desc="Try adjusting your filters" />:filtered.map(o=>(
//           <Card key={o.id} className="p-4">
//             <div className="flex items-start justify-between mb-2 cursor-pointer" onClick={() => setExpandedId(expandedId===o.id?null:o.id)}>
//               <div>
//                 <div className="flex items-center gap-2 mb-1 flex-wrap">
//                   <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{o.id}</span>
//                   {statusBadge(o)}<Badge color="gray">{o.method||o.paymentMethod}</Badge>
//                 </div>
//                 <div className="font-bold text-slate-900 dark:text-white">{o.customerName}</div>
//                 <div className="text-xs text-slate-500">{o.cashier} · {fmtDT(o.createdAt)}</div>
//               </div>
//               <div className="text-right">
//                 <div className="font-black text-slate-900 dark:text-white">{rs(o.total)}</div>
//                 <div className="text-xs text-emerald-500">+{rs(o.profit)}</div>
//                 <span className="text-slate-400 text-xs" style={{transform:expandedId===o.id?"rotate(180deg)":"",display:"inline-block"}}>▾</span>
//               </div>
//             </div>
//             {expandedId===o.id&&(
//               <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
//                 <div className="text-xs font-bold text-slate-500 uppercase">Items</div>
//                 {o.items?.map((item,i)=>(
//                   <div key={i} className="flex items-center justify-between text-sm py-1">
//                     <div><span className="font-semibold">{item.name}</span><span className="text-slate-400"> ×{item.qty}</span></div>
//                     <div className="text-right"><div className="font-bold">{rs(item.qty*(item.sell||item.price||0))}</div><div className="text-xs text-emerald-500">+{rs(item.qty*((item.sell||item.price||0)-(item.buy||item.cost||0)))}</div></div>
//                   </div>
//                 ))}
//                 <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm space-y-1">
//                   <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{rs(o.subtotal)}</span></div>
//                   {(o.disc||o.discountAmount||0)>0&&<div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-red-500">-{rs(o.disc??o.discountAmount)}</span></div>}
//                   <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-600 pt-1 mt-1"><span>Total</span><span>{rs(o.total)}</span></div>
//                 </div>
//                 <div className="flex gap-2">
//                   <Btn variant="secondary" size="sm" onClick={() => setViewReceipt(o)} full>🧾 View Receipt</Btn>
//                   {o.status!=="returned"&&<Btn variant="danger" size="sm" onClick={() => initReturn(o)} full>🔄 Return</Btn>}
//                 </div>
//               </div>
//             )}
//           </Card>
//         ))}
//       </div>
//       <Modal open={!!showReturnModal} onClose={() => setShowReturnModal(null)} title="🔄 Return Order Items" size="md">
//         {showReturnModal&&(
//           <div className="space-y-4">
//             <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">⚠️ Returned items will be added back to inventory.</div>
//             {safeOrders.find(o=>o.id===showReturnModal)?.items.map(item=>{
//               const pid=item.pid||item.productId;
//               const alreadyReturned=safeOrders.find(o=>o.id===showReturnModal)?.returnHistory?.reduce((s,r)=>{const ri=r.items.find(i=>(i.pid||i.productId)===pid);return s+(ri?.returnedQty||0);},[0])||0;
//               const maxReturn=item.qty-alreadyReturned;
//               return (
//                 <div key={pid} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700 space-y-2">
//                   <div className="flex items-center justify-between">
//                     <span className="font-semibold text-sm">{item.name}</span>
//                     <div className="text-right text-xs text-slate-500"><div>Ordered: {item.qty}</div>{alreadyReturned>0&&<div className="text-orange-500">Returned: {alreadyReturned}</div>}</div>
//                   </div>
//                   {maxReturn<=0?<div className="text-xs text-slate-400">Fully returned</div>:(
//                     <div className="flex items-center gap-2">
//                       <span className="text-xs text-slate-500">Return qty:</span>
//                       <input type="number" min="0" max={maxReturn} value={returnQty[`${showReturnModal}-${pid}`]??item.qty}
//                         onChange={e=>setReturnQty(q=>({...q,[`${showReturnModal}-${pid}`]:Math.min(maxReturn,Math.max(0,+e.target.value))}))}
//                         className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-600 text-sm" />
//                       <span className="text-xs text-emerald-600">= {rs((returnQty[`${showReturnModal}-${pid}`]??item.qty)*(item.sell||item.price||0))}</span>
//                     </div>
//                   )}
//                 </div>
//               );
//             })}
//             <Input label="Return Reason *" value={returnReason} onChange={e=>setReturnReason(e.target.value)} placeholder="e.g., Damaged, Wrong item" required />
//             <div className="flex gap-2">
//               <Btn variant="secondary" onClick={() => setShowReturnModal(null)} full>Cancel</Btn>
//               <Btn variant="danger" onClick={() => { if (!returnReason){showToast("Return reason required","error");return;} setShowConfirm(true); }} full>✅ Confirm Return</Btn>
//             </div>
//           </div>
//         )}
//       </Modal>
//       <ConfirmDialog open={showConfirm} title="Confirm Return?" message={`Stock will be restored. Reason: ${returnReason}`} onConfirm={doReturn} onCancel={() => setShowConfirm(false)} danger confirmText="Process Return" />
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    CUSTOMERS
//    ══════════════════════════════════════════════════════════ */
// const Customers = ({ customers, setCustomers, orders, showToast, lang, externalSelected, externalCreditModal, clearExternal }) => {
//   const [search, setSearch]                     = useState("");
//   const [selected, setSelected]                 = useState(externalSelected||null);
//   const [showAdd, setShowAdd]                   = useState(false);
//   const [showEdit, setShowEdit]                 = useState(false);
//   const [showCreditModal, setShowCreditModal]   = useState(externalCreditModal||null);
//   const [creditPayment, setCreditPayment]       = useState("");
//   const [newDueDate, setNewDueDate]             = useState("");
//   const [showConfirm, setShowConfirm]           = useState(false);
//   const [showEditConfirm, setShowEditConfirm]   = useState(false);
//   const [isProcessing, setIsProcessing]         = useState(false);
//   const [form, setForm]                         = useState({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""});
//   const [activeTab, setActiveTab]               = useState("overview");
//   const L = lang === "ur";
//   const safeCustomers = Array.isArray(customers) ? customers : [];
//   const safeOrders    = Array.isArray(orders)    ? orders    : [];

//   useEffect(() => { if (externalSelected)   setSelected(externalSelected); }, [externalSelected]);
//   useEffect(() => { if (externalCreditModal) setShowCreditModal(externalCreditModal); }, [externalCreditModal]);

//   const filtered = safeCustomers.filter(c => c.name?.toLowerCase().includes(search.toLowerCase())||(c.phone&&c.phone.includes(search)));

//   const handleCreditPayment = async customerId => {
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const payment  = +creditPayment;
//     const customer = safeCustomers.find(c=>c.id===customerId);
//     if (payment<=0||payment>customer.udhaar) { showToast("Invalid amount","error"); setIsProcessing(false); return; }
//     const newUdhaar = Math.max(0,(customer.udhaar||0)-payment);
//     try {
//       const result = await addCustomerCreditPayment(customerId,payment,newDueDate||customer.creditDueDate,"");
//       if (result.success) { setCustomers(prev=>prev.map(c=>c.id===customerId?{...c,udhaar:newUdhaar,creditDueDate:newDueDate||c.creditDueDate,creditHistory:[...(c.creditHistory||[]),{date:today(),amount:payment,type:"payment",cashier:"Owner",remaining:newUdhaar,orderId:""}]}:c)); showToast(`✅ ${rs(payment)} received!`,"success"); }
//       else { await queueOfflineOperation("addCustomerCreditPayment",{customerId,amount:payment,dueDate:newDueDate,orderId:""}); setCustomers(prev=>prev.map(c=>c.id===customerId?{...c,udhaar:newUdhaar}:c)); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowCreditModal(null); setCreditPayment(""); setNewDueDate(""); setShowConfirm(false);
//     setSelected(safeCustomers.find(c=>c.id===customerId));
//     if (clearExternal) clearExternal();
//     setIsProcessing(false);
//   };

//   const saveCustomer = async () => {
//     if (!form.name||!form.phone) { showToast("Name & phone required","error"); return; }
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const nc = {...form, id:Date.now(), udhaar:0, totalOrders:0, totalSpent:0, points:0, joined:new Date().toISOString().split("T")[0], creditDueDate:null, creditHistory:[], activityLog:[], editHistory:[]};
//     try {
//       const result = await addCustomer(nc);
//       if (result.success) { setCustomers(prev=>[...prev,nc]); showToast(`✅ ${form.name} added!`,"success"); }
//       else { await queueOfflineOperation("addCustomer",{customer:nc}); setCustomers(prev=>[...prev,nc]); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowAdd(false); setForm({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""}); setIsProcessing(false);
//   };

//   const doUpdateCustomer = async () => {
//     const old = safeCustomers.find(c=>c.id===selected.id);
//     const changes = [];
//     if (old.name!==form.name) changes.push(`Name: ${old.name} → ${form.name}`);
//     if (old.phone!==form.phone) changes.push(`Phone: ${old.phone} → ${form.phone}`);
//     const updatedCustomer = {...selected,...form,editHistory:[...(selected.editHistory||[]),{date:today(),changes,by:"Owner"}]};
//     try {
//       const result = await updateCustomer(selected.id, updatedCustomer);
//       if (result.success) { setCustomers(prev=>prev.map(c=>c.id===selected.id?updatedCustomer:c)); showToast("✅ Customer updated!","success"); }
//       else { await queueOfflineOperation("updateCustomer",{id:selected.id,customer:updatedCustomer}); setCustomers(prev=>prev.map(c=>c.id===selected.id?updatedCustomer:c)); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowEdit(false); setShowEditConfirm(false); setSelected(updatedCustomer);
//   };

//   const totalUdhaar = safeCustomers.reduce((s,c)=>s+(c.udhaar||0),0);

//   if (selected) {
//     const cust            = safeCustomers.find(c=>c.id===selected.id)||selected;
//     const customerOrders  = safeOrders.filter(o=>o.customerId===cust.id);
//     const profitFromCust  = customerOrders.reduce((s,o)=>s+(o.profit||0),0);
//     const creditDays      = cust.creditDueDate ? daysDiff(cust.creditDueDate) : null;
//     const activities      = [...(cust.activityLog||[]).map(a=>({...a,time:a.date})), ...customerOrders.map(o=>({time:o.createdAt,type:"order",desc:`${o.id} — ${rs(o.total)}`,amount:o.total}))].sort((a,b)=>new Date(b.time)-new Date(a.time));

//     return (
//       <div className="space-y-4 pb-8">
//         <button onClick={() => setSelected(null)} className="flex items-center gap-2 text-emerald-500 font-bold text-sm">← {L?"واپس":"Back"}</button>
//         <Card className="p-5 bg-gradient-to-br from-violet-50 dark:from-violet-900/20 to-purple-50 dark:to-purple-900/20">
//           <div className="flex items-start gap-4 mb-4">
//             <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">{cust.name?.[0]||"?"}</div>
//             <div className="flex-1">
//               <h2 className="font-black text-xl text-slate-900 dark:text-white">{cust.name}</h2>
//               {cust.nameUr&&<div className="text-sm text-slate-500">{cust.nameUr}</div>}
//               <div className="text-sm text-slate-600 dark:text-slate-400">📞 {cust.phone}</div>
//               {cust.email&&<div className="text-xs text-slate-500">✉️ {cust.email}</div>}
//               {cust.addr&&<div className="text-xs text-slate-500">📍 {cust.addr}</div>}
//             </div>
//             <button onClick={() => { setForm({name:cust.name,nameUr:cust.nameUr||"",phone:cust.phone,email:cust.email||"",addr:cust.addr||"",notes:cust.notes||""}); setShowEdit(true); }} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold">✏️ Edit</button>
//           </div>
//           <KPIGrid items={[{icon:"🧾",label:"Orders",value:cust.totalOrders||0},{icon:"💰",label:"Spent",value:rs(cust.totalSpent||0)},{icon:"📈",label:"Profit",value:rs(profitFromCust)},{icon:"🔄",label:"Returns",value:customerOrders.filter(o=>o.returnHistory?.length>0).length}]} />
//           {(cust.udhaar||0)>0?(
//             <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
//               <div className="flex items-center justify-between mb-2">
//                 <div><div className="text-xs text-red-600 dark:text-red-400 font-semibold">OUTSTANDING CREDIT</div><div className="text-2xl font-black text-red-600 dark:text-red-400">{rs(cust.udhaar)}</div></div>
//                 {cust.creditDueDate&&<div className="text-right"><div className={`text-xs font-bold ${creditDays!=null&&creditDays<0?"text-red-600":"text-amber-600"}`}>{creditDays!=null&&creditDays<0?`${Math.abs(creditDays)}d OVERDUE`:`Due in ${creditDays}d`}</div><div className="text-xs text-slate-500">{fmtDate(cust.creditDueDate)}</div></div>}
//               </div>
//               <Btn variant="danger" size="sm" onClick={() => setShowCreditModal(cust.id)} full>💸 Receive Payment</Btn>
//             </div>
//           ):<div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 flex items-center justify-between"><span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">✅ No Outstanding Credit</span><Badge color="green">Paid Up</Badge></div>}
//         </Card>
//         <div className="flex gap-2 overflow-x-auto no-scrollbar">
//           {[["overview","📊 Overview"],["orders","🧾 Orders"],["credit","💸 Credit"],["timeline","📅 Timeline"]].map(([k,l])=>(
//             <button key={k} onClick={() => setActiveTab(k)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab===k?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>
//           ))}
//         </div>
//         {activeTab==="orders"&&(
//           <div className="space-y-2">
//             {customerOrders.length===0?<EmptyState icon="🧾" title="No orders" desc="No purchase history" />:
//               customerOrders.map(o=>(
//                 <Card key={o.id} className="p-3">
//                   <div className="flex items-center justify-between mb-1">
//                     <div><span className="font-bold text-emerald-600 text-sm">{o.id}</span><span className="text-xs text-slate-500 ml-2">{fmtDate(o.createdAt)}</span></div>
//                     <div className="text-right"><div className="font-black text-sm">{rs(o.total)}</div><Badge color={o.status==="paid"?"green":o.status==="credit"?"red":"amber"}>{o.status}</Badge></div>
//                   </div>
//                   {o.items?.map((i,j)=><div key={j} className="text-xs text-slate-500">{i.name} ×{i.qty}</div>)}
//                 </Card>
//               ))}
//           </div>
//         )}
//         {activeTab==="credit"&&(
//           <div className="space-y-2">
//             {(!cust.creditHistory||cust.creditHistory.length===0)?<EmptyState icon="💸" title="No credit history" desc="Credit transactions will appear here" />:
//               [...cust.creditHistory].reverse().map((h,i)=>(
//                 <Card key={i} className="p-3">
//                   <div className="flex items-center justify-between">
//                     <div><div className="font-semibold text-sm">{h.type==="payment"?"💸 Payment":"📒 Credit"}</div><div className="text-xs text-slate-500">{fmtDT(h.date)}{h.orderId?` · ${h.orderId}`:""}</div>{h.remaining!=null&&<div className="text-xs text-slate-400">Remaining: {rs(h.remaining)}</div>}</div>
//                     <Badge color={h.type==="payment"?"green":"red"}>{h.type==="payment"?"+":"-"}{rs(h.amount)}</Badge>
//                   </div>
//                 </Card>
//               ))}
//           </div>
//         )}
//         {activeTab==="timeline"&&(
//           <div className="space-y-0">
//             {activities.length===0?<EmptyState icon="📅" title="No activity" desc="Customer activity will appear here" />:
//               activities.slice(0,20).map((a,i)=>{
//                 const icons={order:"🧾",credit:"📒",payment:"💸",return:"🔄",edit:"✏️"};
//                 const colors={order:"green",credit:"red",payment:"green",return:"amber",edit:"blue"};
//                 return <TimelineItem key={i} icon={icons[a.type]||"📌"} title={a.desc||a.evt||"Activity"} sub={a.type} time={fmtDT(a.time||a.date)} color={colors[a.type]||"blue"} />;
//               })}
//           </div>
//         )}
//         {activeTab==="overview"&&(
//           <KPIGrid items={[
//             {icon:"📅",label:"Last Purchase",value:customerOrders.length>0?fmtDate(customerOrders.reduce((a,b)=>a.createdAt>b.createdAt?a:b).createdAt):"Never"},
//             {icon:"💰",label:"Avg Order",value:rs(cust.totalOrders>0?(cust.totalSpent||0)/cust.totalOrders:0)},
//             {icon:"🏆",label:"Loyalty Pts",value:cust.points||0},
//             {icon:"💸",label:"Credit Taken",value:cust.creditHistory?.filter(h=>h.type==="credit").length||0},
//           ]} />
//         )}
//         <Modal open={showCreditModal!==null} onClose={() => setShowCreditModal(null)} title="💸 Receive Credit Payment" size="sm">
//           {showCreditModal&&(
//             <div className="space-y-4">
//               <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700">
//                 <div className="text-xs text-red-600 dark:text-red-400 mb-1">Total Outstanding</div>
//                 <div className="text-3xl font-black text-red-600 dark:text-red-400">{rs(cust.udhaar)}</div>
//               </div>
//               <Input label="Amount Receiving *" type="number" value={creditPayment} onChange={e=>setCreditPayment(e.target.value)} placeholder="Enter amount" required min="1" max={String(cust.udhaar)} helpText={`Max: ${rs(cust.udhaar)}`} />
//               {creditPayment&&+creditPayment>0&&(
//                 <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-700">
//                   <div className="flex justify-between text-sm"><span className="text-slate-600">Remaining:</span><span className="font-black text-emerald-600">{rs(Math.max(0,(cust.udhaar||0)-(+creditPayment)))}</span></div>
//                   {+creditPayment>=(cust.udhaar||0)&&<div className="mt-1 text-xs text-emerald-600 font-bold">✅ Full payment — account will be cleared</div>}
//                 </div>
//               )}
//               <Input label="New Due Date (optional)" type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)} />
//               <div className="flex gap-2">
//                 <Btn variant="secondary" onClick={() => setShowCreditModal(null)} full>Cancel</Btn>
//                 <Btn variant="primary" onClick={() => { if (!creditPayment||+creditPayment<=0){showToast("Enter valid amount","error");return;} setShowConfirm(true); }} full disabled={!creditPayment||+creditPayment<=0||isProcessing}>✅ Record Payment</Btn>
//               </div>
//             </div>
//           )}
//         </Modal>
//         <ConfirmDialog open={showConfirm} title="Confirm Payment?" message={`Record ${rs(+creditPayment||0)} from ${cust.name}?`} onConfirm={() => handleCreditPayment(showCreditModal)} onCancel={() => setShowConfirm(false)} confirmText="Confirm" />
//         <Modal open={showEdit} onClose={() => setShowEdit(false)} title="✏️ Edit Customer">
//           <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
//           <Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})} />
//           <Input label="Phone *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" required />
//           <Input label="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} type="email" />
//           <Input label="Address" value={form.addr||""} onChange={e=>setForm({...form,addr:e.target.value})} />
//           <Input label="Notes" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} />
//           <div className="flex gap-2"><Btn variant="secondary" onClick={() => setShowEdit(false)} full>Cancel</Btn><Btn variant="primary" onClick={() => setShowEditConfirm(true)} full>💾 Save</Btn></div>
//         </Modal>
//         <ConfirmDialog open={showEditConfirm} title="Save Changes?" message="Customer details will be updated." onConfirm={doUpdateCustomer} onCancel={() => setShowEditConfirm(false)} confirmText="Save" />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-4 pb-8">
//       <KPIGrid items={[
//         {icon:"👥",label:"Customers",value:safeCustomers.length},
//         {icon:"🤝",label:"Total Credit",value:rs(totalUdhaar)},
//         {icon:"💰",label:"Avg Spent",value:rs(safeCustomers.length>0?safeCustomers.reduce((s,c)=>s+(c.totalSpent||0),0)/safeCustomers.length:0)},
//         {icon:"⚠️",label:"Credit Due",value:safeCustomers.filter(c=>(c.udhaar||0)>0&&c.creditDueDate&&daysDiff(c.creditDueDate)<=3).length},
//       ]} />
//       <div className="flex gap-3">
//         <div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span>
//           <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none" />
//         </div>
//         <Btn variant="primary" onClick={() => { setForm({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""}); setShowAdd(true); }}>+ Add</Btn>
//       </div>
//       <div className="space-y-3">
//         {filtered.map(c=>{
//           const ddays=c.creditDueDate?daysDiff(c.creditDueDate):null;
//           return (
//             <Card key={c.id} className="p-4" onClick={() => setSelected(c)}>
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">{c.name?.[0]||"?"}</div>
//                 <div className="flex-1">
//                   <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
//                   <div className="text-xs text-slate-500">{c.phone} · {c.totalOrders||0} orders</div>
//                   {(c.udhaar||0)>0&&c.creditDueDate&&<div className={`text-xs font-semibold ${ddays!=null&&ddays<0?"text-red-500":"text-amber-500"}`}>{ddays!=null&&ddays<0?`${Math.abs(ddays)}d overdue`:`Due in ${ddays}d`}</div>}
//                 </div>
//                 <div className="text-right">
//                   {(c.udhaar||0)>0?<Badge color={ddays!=null&&ddays<0?"red":"amber"}>{rs(c.udhaar)}</Badge>:<Badge color="green">✅ Clear</Badge>}
//                 </div>
//               </div>
//             </Card>
//           );
//         })}
//       </div>
//       <Modal open={showAdd} onClose={() => setShowAdd(false)} title="➕ Add Customer">
//         <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
//         <Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})} placeholder="اردو نام" />
//         <Input label="Phone *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" required />
//         <Input label="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} type="email" />
//         <Input label="Address" value={form.addr||""} onChange={e=>setForm({...form,addr:e.target.value})} />
//         <Input label="Notes" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})} />
//         <Btn variant="primary" onClick={saveCustomer} full disabled={isProcessing}>{isProcessing?"Saving...":"✅ Save Customer"}</Btn>
//       </Modal>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    MERCHANDISE
//    ══════════════════════════════════════════════════════════ */
// const Merchandise = ({ products, orders, lang }) => {
//   const [search, setSearch]       = useState("");
//   const [activeCat, setActiveCat] = useState("All");
//   const [sortBy, setSortBy]       = useState("revenue");
//   const [expandedId, setExpandedId] = useState(null);
//   const L = lang === "ur";
//   const safeProducts = Array.isArray(products) ? products : [];
//   const safeOrders   = Array.isArray(orders)   ? orders   : [];

//   const merchData = useMemo(() => {
//     return safeProducts.map(p => {
//       let totalSold=0, totalRevenue=0, totalCost=0, lastSold=null;
//       safeOrders.forEach(o => {
//         if (o&&Array.isArray(o.items)) {
//           o.items.forEach(i => {
//             if (i&&(i.pid||i.productId)===p.id) {
//               totalSold    += i.qty||0;
//               totalRevenue += (i.qty||0)*(i.sell||i.price||0);
//               totalCost    += (i.qty||0)*(i.buy||i.cost||0);
//               if (!lastSold||(o.createdAt&&o.createdAt>lastSold)) lastSold=o.createdAt;
//             }
//           });
//         }
//       });
//       const sell      = p.sell||p.price||0;
//       const buy       = p.buy||p.cost||0;
//       const profitAmt = totalRevenue-totalCost;
//       const margin    = totalRevenue>0?Math.round(profitAmt/totalRevenue*100):(sell&&buy?Math.round(((sell-buy)/sell)*100):0);
//       return {...p, totalSold, totalRevenue, totalCost, profitAmt, margin, lastSold};
//     });
//   }, [safeProducts, safeOrders]);

//   const filtered = merchData.filter(m=>(activeCat==="All"||m.cat===activeCat||m.category===activeCat)&&(m.name?.toLowerCase().includes(search.toLowerCase())||(m.sku&&m.sku.toLowerCase().includes(search.toLowerCase()))));
//   const sorted   = [...filtered].sort((a,b)=>sortBy==="revenue"?(b.totalRevenue||0)-(a.totalRevenue||0):sortBy==="margin"?(b.margin||0)-(a.margin||0):sortBy==="sold"?(b.totalSold||0)-(a.totalSold||0):(a.name||"").localeCompare(b.name||""));
//   const totalRevAll  = merchData.reduce((s,m)=>s+(m.totalRevenue||0),0);
//   const totalProfAll = merchData.reduce((s,m)=>s+(m.profitAmt||0),0);

//   return (
//     <div className="space-y-4 pb-8">
//       <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 text-white">
//         <h2 className="text-lg font-black mb-1">📊 {L?"سامان":"Merchandise"}</h2>
//         <div className="grid grid-cols-3 gap-3 text-sm">
//           <div><div className="text-violet-200 text-xs">Total Items</div><div className="font-black text-lg">{safeProducts.length}</div></div>
//           <div><div className="text-violet-200 text-xs">Revenue</div><div className="font-black text-lg">{rs(totalRevAll)}</div></div>
//           <div><div className="text-violet-200 text-xs">Profit</div><div className="font-black text-lg">{rs(totalProfAll)}</div></div>
//         </div>
//       </div>
//       <KPIGrid items={[
//         {icon:"📦",label:"Items Sold",value:merchData.reduce((s,m)=>s+(m.totalSold||0),0)},
//         {icon:"💰",label:"Revenue",value:rs(totalRevAll)},
//         {icon:"📈",label:"Profit",value:rs(totalProfAll)},
//         {icon:"📊",label:"Avg Margin",value:`${Math.round(totalRevAll>0?totalProfAll/totalRevAll*100:0)}%`}
//       ]} />
//       <div className="flex gap-2">
//         <div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
//           <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none" />
//         </div>
//         <Select value={sortBy} onChange={e=>setSortBy(e.target.value)} options={[{value:"revenue",label:"Revenue"},{value:"margin",label:"Margin"},{value:"sold",label:"Sold"},{value:"name",label:"A-Z"}]} />
//       </div>
//       <div className="space-y-3">
//         {sorted.map(m=>(
//           <Card key={m.id} className="p-4" onClick={() => setExpandedId(expandedId===m.id?null:m.id)}>
//             <div className="flex items-start justify-between mb-3">
//               <div className="flex-1"><div className="font-bold text-slate-900 dark:text-white">{m.name}</div><div className="text-xs text-slate-500">{m.sku} · {m.cat||m.category}</div></div>
//               <Badge color={m.margin>=20?"green":m.margin>=10?"amber":"red"}>{m.margin}% margin</Badge>
//             </div>
//             <div className="grid grid-cols-4 gap-2">
//               {[{l:"Cost",v:rs(m.buy||m.cost||0),c:""},{l:"Sell",v:rs(m.sell||m.price||0),c:"text-emerald-600 font-bold"},{l:"Sold",v:String(m.totalSold),c:""},{l:"Revenue",v:rs(m.totalRevenue),c:"text-violet-600 font-bold"}].map(({l,v,c})=>(
//                 <div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className={`font-bold mt-0.5 ${c}`}>{v}</div></div>
//               ))}
//             </div>
//             {expandedId===m.id&&(
//               <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm">
//                 <div className="flex justify-between"><span className="text-slate-500">Profit/unit</span><span className="font-bold text-emerald-500">{rs((m.sell||m.price||0)-(m.buy||m.cost||0))}</span></div>
//                 <div className="flex justify-between"><span className="text-slate-500">Total profit</span><span className="font-bold text-emerald-500">{rs(m.profitAmt)}</span></div>
//                 <div className="flex justify-between"><span className="text-slate-500">Stock</span><span className="font-bold">{m.stock} {m.unit}</span></div>
//                 {m.lastSold&&<div className="flex justify-between text-xs"><span className="text-slate-400">Last sold</span><span>{fmtDate(m.lastSold)}</span></div>}
//               </div>
//             )}
//           </Card>
//         ))}
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    EXPENSES
//    ══════════════════════════════════════════════════════════ */
// const Expenses = ({ expenses, setExpenses, showToast, lang }) => {
//   const [showAdd, setShowAdd]         = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [form, setForm]               = useState({cat:"Rent",desc:"",amt:"",date:new Date().toISOString().slice(0,10),by:"Owner"});
//   const L = lang === "ur";
//   const safeExpenses = Array.isArray(expenses) ? expenses : [];
//   const totalExp = safeExpenses.reduce((s,e)=>s+(e.amt||e.amount||0),0);

//   const save = async () => {
//     if (!form.desc||!form.amt) { showToast("Fill all fields","error"); return; }
//     if (isProcessing) return;
//     setIsProcessing(true);
//     const ne = {...form, id:Date.now(), amt:+form.amt, amount:+form.amt, category:form.cat, description:form.desc};
//     try {
//       const result = await addExpense(ne);
//       if (result.success) { setExpenses(prev=>[...prev,ne]); showToast("✅ Expense added!","success"); }
//       else { await queueOfflineOperation("addExpense",{expense:ne}); setExpenses(prev=>[...prev,ne]); showToast("⚠️ Saved offline","warning"); }
//     } catch(e) { showToast("Error: "+e.message,"error"); }
//     setShowAdd(false); setForm({cat:"Rent",desc:"",amt:"",date:new Date().toISOString().slice(0,10),by:"Owner"}); setIsProcessing(false);
//   };

//   return (
//     <div className="space-y-4 pb-8">
//       <Card className="p-5 bg-gradient-to-br from-red-50 dark:from-red-900/20 to-orange-50 dark:to-orange-900/20">
//         <div className="text-3xl mb-2">💸</div>
//         <div className="text-3xl font-black text-red-600 dark:text-red-400">{rs(totalExp)}</div>
//         <div className="text-sm text-slate-500">Total Expenses</div>
//       </Card>
//       <Btn variant="danger" onClick={() => setShowAdd(true)} full>➕ {L?"خرچ شامل کریں":"Add Expense"}</Btn>
//       <div className="space-y-3">
//         {safeExpenses.map(e=>(
//           <Card key={e.id} className="p-4">
//             <div className="flex items-start justify-between">
//               <div><div className="font-bold text-slate-900 dark:text-white text-sm">{e.desc||e.description}</div><div className="text-xs text-slate-500">{e.cat||e.category} · {e.date} · by {e.by}</div></div>
//               <div className="font-black text-red-500">{rs(e.amt||e.amount||0)}</div>
//             </div>
//           </Card>
//         ))}
//       </div>
//       <Modal open={showAdd} onClose={() => setShowAdd(false)} title="➕ Add Expense">
//         <Select label="Category" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} options={["Rent","Electricity","Staff","Transport","Maintenance","Misc"].map(c=>({value:c,label:c}))} />
//         <Input label="Description *" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="e.g., Monthly rent" required />
//         <Input label="Amount *" type="number" value={form.amt} onChange={e=>setForm({...form,amt:e.target.value})} placeholder="0" required />
//         <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
//         <Input label="Paid By" value={form.by} onChange={e=>setForm({...form,by:e.target.value})} placeholder="Owner" />
//         <Btn variant="danger" onClick={save} full disabled={isProcessing}>{isProcessing?"Saving...":"💾 Save"}</Btn>
//       </Modal>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    STAFF
//    ══════════════════════════════════════════════════════════ */
// const Staff = ({ staff, setStaff, showToast, lang }) => {
//   const [showAdd, setShowAdd]           = useState(false);
//   const [editStaff, setEditStaff]       = useState(null);
//   const [deleteConfirm, setDeleteConfirm] = useState(null);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [form, setForm]                 = useState({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"});
//   const L = lang === "ur";
//   const safeStaff = Array.isArray(staff) ? staff : [];

//   const openEdit = s => { setEditStaff(s.id); setForm({name:s.name,role:s.role||s.commissionRate,phone:s.phone||"",shift:s.shift||"9am-5pm",salary:String(s.salary||0),status:s.status||s.active?"active":"inactive"}); setShowAdd(true); };

//   const save = async () => {
//     if (!form.name||!form.salary) { showToast("Name and salary required","error"); return; }
//     if (isProcessing) return;
//     setIsProcessing(true);
//     if (editStaff) {
//       const old     = safeStaff.find(s=>s.id===editStaff);
//       const updated = {...old,...form,salary:+form.salary,active:form.status==="active"};
//       try {
//         const result = await updateStaff(editStaff, updated);
//         if (result.success) { setStaff(prev=>prev.map(s=>s.id===editStaff?updated:s)); showToast("✅ Staff updated!","success"); }
//         else { await queueOfflineOperation("updateStaff",{id:editStaff,staff:updated}); setStaff(prev=>prev.map(s=>s.id===editStaff?updated:s)); showToast("⚠️ Saved offline","warning"); }
//       } catch(e) { showToast("Error: "+e.message,"error"); }
//     } else {
//       const ns = {...form, id:Date.now(), joined:new Date().toISOString().slice(0,10), salary:+form.salary, active:form.status==="active"};
//       try {
//         const result = await addStaff(ns);
//         if (result.success) { setStaff(prev=>[...prev,ns]); showToast(`✅ ${form.name} added!`,"success"); }
//         else { await queueOfflineOperation("addStaff",{staff:ns}); setStaff(prev=>[...prev,ns]); showToast("⚠️ Saved offline","warning"); }
//       } catch(e) { showToast("Error: "+e.message,"error"); }
//     }
//     setShowAdd(false); setEditStaff(null); setForm({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"}); setIsProcessing(false);
//   };

//   const handleDelete = async id => {
//     try { const result = await deleteStaff(id); if (result.success||result.queued) { setStaff(prev=>prev.filter(s=>s.id!==id)); showToast("✅ Staff removed!","success"); } else showToast("Error deleting","error"); }
//     catch(e) { showToast("Error: "+e.message,"error"); }
//     setDeleteConfirm(null);
//   };

//   const totalSalaries = safeStaff.reduce((s,s_)=>s+(s_.salary||0),0);

//   return (
//     <div className="space-y-4 pb-8">
//       <KPIGrid items={[{icon:"👔",label:"Staff",value:safeStaff.length},{icon:"💰",label:"Salaries",value:rs(totalSalaries)},{icon:"✅",label:"Active",value:safeStaff.filter(s=>s.status==="active"||s.active).length},{icon:"📊",label:"Avg Salary",value:rs(safeStaff.length>0?totalSalaries/safeStaff.length:0)}]} />
//       <Btn variant="violet" onClick={() => { setEditStaff(null); setForm({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"}); setShowAdd(true); }} full>➕ {L?"سٹاف شامل":"Add Staff"}</Btn>
//       <div className="space-y-3">
//         {safeStaff.map(s=>(
//           <Card key={s.id} className="p-4">
//             <div className="flex items-center gap-3 mb-3">
//               <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-lg">{s.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"ST"}</div>
//               <div className="flex-1"><div className="font-black text-slate-900 dark:text-white">{s.name}</div><div className="text-sm text-slate-500">{s.role}</div></div>
//               <Badge color={s.status==="active"||s.active?"green":"gray"}>{s.status||"active"}</Badge>
//             </div>
//             <div className="grid grid-cols-3 gap-2 mb-3">
//               {[{l:"Salary",v:rs(s.salary)},{l:"Shift",v:s.shift||"—"},{l:"Joined",v:fmtDate(s.joined)}].map(({l,v})=>(
//                 <div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className="font-bold text-xs mt-0.5 truncate">{v}</div></div>
//               ))}
//             </div>
//             <div className="flex gap-2">
//               <Btn variant="secondary" size="sm" onClick={() => openEdit(s)} full>✏️ Edit</Btn>
//               <Btn variant="danger" size="sm" onClick={() => setDeleteConfirm(s.id)} full>🗑️ Delete</Btn>
//             </div>
//           </Card>
//         ))}
//       </div>
//       <Modal open={showAdd} onClose={() => { setShowAdd(false); setEditStaff(null); }} title={editStaff?"✏️ Edit Staff":"➕ Add Staff"}>
//         <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
//         <Select label="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} options={["Cashier","Stock Manager","Manager","Delivery"].map(r=>({value:r,label:r}))} />
//         <Input label="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" />
//         <Input label="Shift" value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} placeholder="9am-5pm" />
//         <Input label="Monthly Salary *" type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} required />
//         <Select label="Status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"},{value:"on-leave",label:"On Leave"}]} />
//         <Btn variant="violet" onClick={save} full disabled={isProcessing}>{isProcessing?"Saving...":editStaff?"💾 Update Staff":"💾 Add Employee"}</Btn>
//       </Modal>
//       <ConfirmDialog open={!!deleteConfirm} title="Delete Staff Member?" message="This will permanently remove them from the system." danger onConfirm={() => handleDelete(deleteConfirm)} onCancel={() => setDeleteConfirm(null)} confirmText="Delete" />
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    ANALYTICS
//    ══════════════════════════════════════════════════════════ */
// const Analytics = ({ orders, products, customers, expenses, lang }) => {
//   const L = lang === "ur";
//   const safeOrders    = Array.isArray(orders)    ? orders    : [];
//   const safeProducts  = Array.isArray(products)  ? products  : [];
//   const safeCustomers = Array.isArray(customers) ? customers : [];
//   const safeExpenses  = Array.isArray(expenses)  ? expenses  : [];

//   const totalRevenue  = safeOrders.reduce((s,o)=>s+(o.total||0),0);
//   const totalProfit   = safeOrders.reduce((s,o)=>s+(o.profit||0),0);
//   const totalExpenses = safeExpenses.reduce((s,e)=>s+(e.amt||e.amount||0),0);
//   const netProfit     = totalProfit-totalExpenses;
//   const profitMargin  = totalRevenue>0?Math.round(totalProfit/totalRevenue*100):0;

//   const topProducts = safeProducts.map(p=>{
//     let sold=0,rev=0;
//     safeOrders.forEach(o=>{ if(o.items&&Array.isArray(o.items)) o.items.forEach(i=>{ if((i.pid||i.productId)===p.id){sold+=i.qty||0;rev+=(i.qty||0)*(i.sell||i.price||0);} }); });
//     return {...p,sold,rev};
//   }).filter(p=>p.sold>0).sort((a,b)=>b.rev-a.rev).slice(0,5);

//   const catData = CATEGORIES.slice(1).map(cat=>{
//     let rev=0;
//     safeProducts.filter(p=>p.cat===cat||p.category===cat).forEach(p=>{ safeOrders.forEach(o=>{ if(o.items&&Array.isArray(o.items)) o.items.forEach(i=>{ if((i.pid||i.productId)===p.id) rev+=(i.qty||0)*(i.sell||i.price||0); }); }); });
//     return {name:cat,value:rev};
//   }).filter(d=>d.value>0);

//   const COLORS = ["#10b981","#8b5cf6","#f59e0b","#ef4444","#0ea5e9","#ec4899"];

//   return (
//     <div className="space-y-5 pb-8">
//       <KPIGrid items={[{icon:"💰",label:"Revenue",value:rs(totalRevenue),change:`${safeOrders.length} orders`},{icon:"📈",label:"Profit",value:rs(totalProfit),change:`${profitMargin}% margin`},{icon:"💸",label:"Expenses",value:rs(totalExpenses),change:"This month"},{icon:"🏦",label:"Net Profit",value:rs(netProfit),change:netProfit>0?"✅ Positive":"⚠️ Negative"}]} />
//       <Card className="p-4">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">🏆 Top 5 Products</h3>
//         <div className="space-y-3">
//           {topProducts.map((p,i)=>(
//             <div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
//               <div className="flex items-center gap-3">
//                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-sm">{i+1}</div>
//                 <div><div className="font-bold text-sm">{p.name}</div><div className="text-xs text-slate-500">{p.sold} units</div></div>
//               </div>
//               <div className="font-black text-emerald-600">{rs(p.rev)}</div>
//             </div>
//           ))}
//           {topProducts.length===0&&<EmptyState icon="📦" title="No sales yet" desc="Complete some orders to see top products" />}
//         </div>
//       </Card>
//       {catData.length>0&&(
//         <Card className="p-4">
//           <h3 className="font-bold text-slate-800 dark:text-white mb-4">📊 Sales by Category</h3>
//           <ResponsiveContainer width="100%" height={200}>
//             <PieChart><Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>
//               {catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
//             </Pie><Tooltip formatter={v=>rs(v)} /></PieChart>
//           </ResponsiveContainer>
//         </Card>
//       )}
//       <Card className="p-4">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">👥 Top Customers</h3>
//         <div className="space-y-2">
//           {safeCustomers.sort((a,b)=>(b.totalSpent||0)-(a.totalSpent||0)).slice(0,4).map((c,i)=>(
//             <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
//               <div className="flex items-center gap-2">
//                 <div className="w-7 h-7 rounded-lg bg-violet-500 text-white flex items-center justify-center font-bold text-xs">{i+1}</div>
//                 <div><div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.totalOrders||0} orders</div></div>
//               </div>
//               <div className="text-right"><div className="font-black text-violet-600">{rs(c.totalSpent||0)}</div>{(c.udhaar||0)>0&&<div className="text-xs text-red-500">Owes {rs(c.udhaar)}</div>}</div>
//             </div>
//           ))}
//         </div>
//       </Card>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    SETTINGS
//    ══════════════════════════════════════════════════════════ */
// const Settings = ({ lang, setLang, dark, setDark, showToast, shopInfo, setShopInfo }) => {
//   const L = lang === "ur";
//   const [syncPending, setSyncPending]   = useState(0);
//   const [onlineStatus, setOnlineStatus] = useState(true);
//   const [isSyncing, setIsSyncing]       = useState(false);

//   useEffect(() => {
//     const check = async () => { setSyncPending(await getPendingSyncCount()); setOnlineStatus(isOnline()); };
//     check();
//     const iv = setInterval(check, 5000);
//     return () => clearInterval(iv);
//   }, []);

//   const handleSync = async () => {
//     setIsSyncing(true);
//     const result = await processOfflineQueue();
//     if (result.success) showToast(`✅ Synced ${result.processed} items!`,"success");
//     else showToast(`⚠️ Synced ${result.processed}, ${result.failed} failed`,"warning");
//     setSyncPending(0); setIsSyncing(false);
//   };

//   return (
//     <div className="space-y-5 pb-8">
//       <Card className="p-5 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-cyan-50 dark:to-cyan-900/20">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">☁️ Cloud Sync</h3>
//         <div className="space-y-3">
//           <div className="flex items-center justify-between">
//             <div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Connection</span><span className={`text-sm font-bold ${onlineStatus?"text-emerald-500":"text-red-500"}`}>{onlineStatus?"✅ Online":"❌ Offline"}</span></div>
//             {syncPending>0&&<div className="bg-amber-100 dark:bg-amber-900/40 rounded-lg px-3 py-1"><span className="text-amber-700 dark:text-amber-300 text-xs font-bold">{syncPending} pending</span></div>}
//           </div>
//           <button onClick={async()=>{ const r=await testConnection(); showToast(r.success?r.message:r.error,r.success?"success":"error"); }} className="w-full px-4 py-2 bg-sky-500 text-white font-bold rounded-xl">🔍 Test Connection</button>
//           <button onClick={handleSync} disabled={!onlineStatus||isSyncing} className="w-full px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50">
//             {isSyncing?"🔄 Syncing...":syncPending>0?"📤 Sync Now":"🔄 Sync All Data"}
//           </button>
//         </div>
//       </Card>
//       <Card className="p-5">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">🏪 {L?"دکان کی معلومات":"Shop Information"}</h3>
//         <p className="text-xs text-slate-500 mb-3">This info appears on your printed receipts.</p>
//         <Input label="Shop Name" value={shopInfo.name} onChange={e=>setShopInfo(s=>({...s,name:e.target.value}))} />
//         <Input label="Owner Name" value={shopInfo.owner} onChange={e=>setShopInfo(s=>({...s,owner:e.target.value}))} />
//         <Input label="Contact Number" value={shopInfo.phone} onChange={e=>setShopInfo(s=>({...s,phone:e.target.value}))} type="tel" />
//         <Input label="Shop Address" value={shopInfo.address} onChange={e=>setShopInfo(s=>({...s,address:e.target.value}))} />
//         <Btn variant="primary" onClick={() => { saveToStorage("dp_shop_info",shopInfo); showToast("✅ Shop info saved!","success"); }} full>💾 Save Shop Info</Btn>
//       </Card>
//       <Card className="p-5">
//         <h3 className="font-bold text-slate-800 dark:text-white mb-4">{L?"ترجیحات":"App Preferences"}</h3>
//         <div className="space-y-4">
//           <div className="flex items-center justify-between">
//             <div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Language</span><span className="text-xs text-slate-500">اردو / English</span></div>
//             <div className="flex gap-2">
//               {[["en","EN"],["ur","اردو"]].map(([k,l])=>(
//                 <button key={k} onClick={() => setLang(k)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang===k?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>
//               ))}
//             </div>
//           </div>
//           <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
//             <div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{L?"ڈارک موڈ":"Dark Mode"}</span><span className="text-xs text-slate-500">Night-friendly display</span></div>
//             <button onClick={() => setDark(!dark)} className={`w-14 h-7 rounded-full transition-colors relative ${dark?"bg-emerald-500":"bg-slate-300"}`}>
//               <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${dark?"left-8":"left-1"}`} />
//             </button>
//           </div>
//         </div>
//       </Card>
//       <div className="text-center py-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl">
//         <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">🏪 DukanDar Pro</div>
//         <div className="text-sm text-slate-600 dark:text-slate-400">Complete Shop Management System</div>
//         <div className="text-xs text-slate-500 mt-1">v5.0 · JPEG Receipt Generation</div>
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    CREDIT REMINDER POPUP
//    ══════════════════════════════════════════════════════════ */
// const CreditReminderPopup = ({ customers, setPage, setSelectedCustomer, showCreditModal, onDismiss }) => {
//   const safeCustomers = Array.isArray(customers) ? customers : [];
//   const overdue       = safeCustomers.filter(c=>(c.udhaar||0)>0&&c.creditDueDate&&daysDiff(c.creditDueDate)<=3);
//   const [dismissed, setDismissed] = useState([]);
//   const visible = overdue.filter(c=>!dismissed.includes(c.id));
//   if (visible.length===0) return null;
//   return (
//     <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
//       <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
//         <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20 rounded-t-3xl">
//           <div className="flex items-center gap-3"><span className="text-3xl">🔔</span><div><h2 className="text-lg font-black text-amber-900 dark:text-amber-100">Credit Reminders</h2><p className="text-xs text-amber-700 dark:text-amber-300">{visible.length} due soon</p></div></div>
//         </div>
//         <div className="p-4 space-y-3">
//           {visible.map(c=>{
//             const diff=daysDiff(c.creditDueDate); const isOverdue=diff<0;
//             return (
//               <div key={c.id} className={`p-4 rounded-xl border-2 ${isOverdue?"border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800":"border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800"}`}>
//                 <div className="flex items-start justify-between mb-2">
//                   <div><div className="font-bold text-slate-900 dark:text-white">{c.name}</div><div className="text-xs text-slate-500">{c.phone}</div></div>
//                   <Badge color={isOverdue?"red":"amber"}>{isOverdue?`${Math.abs(diff)}d overdue`:`Due in ${diff}d`}</Badge>
//                 </div>
//                 <div className="text-lg font-black text-red-600 dark:text-red-400 mb-3">{rs(c.udhaar)}</div>
//                 <div className="flex gap-2">
//                   <Btn size="sm" variant="secondary" onClick={() => setDismissed(d=>[...d,c.id])} full>Dismiss</Btn>
//                   <Btn size="sm" variant="primary" onClick={() => { setSelectedCustomer(c); showCreditModal(c.id); setDismissed(d=>[...d,c.id]); }} full>💸 Receive</Btn>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//         <div className="p-4 border-t border-slate-100 dark:border-slate-700"><Btn variant="secondary" onClick={onDismiss} full>Close All</Btn></div>
//       </div>
//     </div>
//   );
// };

// /* ══════════════════════════════════════════════════════════
//    ROOT APP
//    ══════════════════════════════════════════════════════════ */
// export default function DukanDarPro() {
//   const [page, setPage]         = useState("home");
//   const [lang, setLang]         = useState("en");
//   const [dark, setDark]         = useState(false);
//   const [products, setProducts] = useState([]);
//   const [customers, setCustomers] = useState([]);
//   const [orders, setOrders]     = useState([]);
//   const [expenses, setExpenses] = useState([]);
//   const [staff, setStaff]       = useState([]);
//   const [shopInfo, setShopInfo] = useState(loadFromStorage("dp_shop_info",{name:"My Store",owner:"",phone:"",address:""}));
//   const [toast, setToast]       = useState(null);
//   const [showReminders, setShowReminders] = useState(true);
//   const [externalCustomer, setExternalCustomer]     = useState(null);
//   const [externalCreditModal, setExternalCreditModal] = useState(null);
//   const [isLoading, setIsLoading]         = useState(true);
//   const [syncPending, setSyncPending]     = useState(0);
//   const [isNetworkOnline, setIsNetworkOnline] = useState(true);
//   const [isSyncing, setIsSyncing]         = useState(false);

//   useEffect(() => {
//     const init = async () => {
//       setIsLoading(true);
//       try {
//         const online = isOnline();
//         setIsNetworkOnline(online);
//         setProducts(loadFromStorage("dp_products_v5",[]));
//         setCustomers(loadFromStorage("dp_customers_v5",[]));
//         setOrders(loadFromStorage("dp_orders_v5",[]));
//         setExpenses(loadFromStorage("dp_expenses_v5",[]));
//         setStaff(loadFromStorage("dp_staff_v5",[]));
//         if (online) {
//           setSyncPending(await getPendingSyncCount());
//           await syncAllData(
//             d=>setProducts(Array.isArray(d)?d:[]),
//             d=>setCustomers(Array.isArray(d)?d:[]),
//             d=>setOrders(Array.isArray(d)?d:[]),
//             d=>setExpenses(Array.isArray(d)?d:[]),
//             d=>setStaff(Array.isArray(d)?d:[])
//           );
//         }
//       } catch(e) { console.error("Init error:",e); }
//       finally { setIsLoading(false); }
//     };
//     init();
//     const handleOnline = async () => {
//       setIsNetworkOnline(true); setToast({msg:"🟢 Back online! Syncing...",type:"success"}); setTimeout(()=>setToast(null),3000);
//       await processOfflineQueue();
//       await syncAllData(d=>setProducts(Array.isArray(d)?d:[]),d=>setCustomers(Array.isArray(d)?d:[]),d=>setOrders(Array.isArray(d)?d:[]),d=>setExpenses(Array.isArray(d)?d:[]),d=>setStaff(Array.isArray(d)?d:[]));
//       setSyncPending(0);
//     };
//     const handleOffline = () => { setIsNetworkOnline(false); setToast({msg:"🔴 Offline mode — saving locally",type:"warning"}); setTimeout(()=>setToast(null),3000); };
//     window.addEventListener("online",handleOnline);
//     window.addEventListener("offline",handleOffline);
//     return () => { window.removeEventListener("online",handleOnline); window.removeEventListener("offline",handleOffline); };
//   }, []);

//   useEffect(() => { saveToStorage("dp_products_v5", products);  }, [products]);
//   useEffect(() => { saveToStorage("dp_customers_v5",customers); }, [customers]);
//   useEffect(() => { saveToStorage("dp_orders_v5",   orders);    }, [orders]);
//   useEffect(() => { saveToStorage("dp_expenses_v5", expenses);  }, [expenses]);
//   useEffect(() => { saveToStorage("dp_staff_v5",    staff);     }, [staff]);
//   useEffect(() => { saveToStorage("dp_shop_info",   shopInfo);  }, [shopInfo]);

//   const showToast = useCallback((msg,type="success") => setToast({msg,type}), []);
//   const L         = lang === "ur";
//   const lowCount  = products.filter(p=>(p.stock||0)<=(p.minStock||p.lowStock||0)).length;

//   const navItems = [
//     {key:"home",    icon:"🏠", label: L?"ہوم":"Home"},
//     {key:"pos",     icon:"🛒", label: L?"بلنگ":"POS"},
//     {key:"orders",  icon:"🧾", label: L?"آرڈر":"Orders"},
//     {key:"inventory",icon:"📦",label: L?"اسٹاک":"Stock", badge:lowCount},
//     {key:"customers",icon:"👥",label: L?"گاہک":"People"},
//   ];
//   const moreItems = [
//     {key:"merchandise",icon:"📊",label: L?"سامان":"Merch"},
//     {key:"expenses",   icon:"💸",label: L?"اخراجات":"Costs"},
//     {key:"staff",      icon:"👔",label: L?"سٹاف":"Staff"},
//     {key:"analytics",  icon:"📈",label: L?"رپورٹ":"Reports"},
//     {key:"settings",   icon:"⚙️",label: L?"سیٹنگ":"Settings"},
//   ];
//   const pageTitles = {home:"Dashboard",pos:"New Sale",orders:"Orders",inventory:"Inventory",customers:"Customers",merchandise:"Merchandise",expenses:"Expenses",staff:"Staff",analytics:"Analytics",settings:"Settings"};

//   const renderPage = () => {
//     const props = {showToast, lang};
//     switch (page) {
//       case "home":        return <Dashboard products={products} orders={orders} customers={customers} expenses={expenses} {...props} setPage={setPage} setExternalCustomer={setExternalCustomer} setExternalCreditModal={setExternalCreditModal} />;
//       case "pos":         return <POS products={products} customers={customers} setOrders={setOrders} setProducts={setProducts} setCustomers={setCustomers} shopInfo={shopInfo} {...props} />;
//       case "orders":      return <OrdersHistory orders={orders} products={products} setOrders={setOrders} setProducts={setProducts} setCustomers={setCustomers} customers={customers} {...props} />;
//       case "inventory":   return <Inventory products={products} setProducts={setProducts} {...props} />;
//       case "customers":   return <Customers customers={customers} setCustomers={setCustomers} orders={orders} {...props} externalSelected={externalCustomer} externalCreditModal={externalCreditModal} clearExternal={() => { setExternalCustomer(null); setExternalCreditModal(null); }} />;
//       case "merchandise": return <Merchandise products={products} orders={orders} {...props} />;
//       case "expenses":    return <Expenses expenses={expenses} setExpenses={setExpenses} {...props} />;
//       case "staff":       return <Staff staff={staff} setStaff={setStaff} {...props} />;
//       case "analytics":   return <Analytics orders={orders} products={products} customers={customers} expenses={expenses} {...props} />;
//       case "settings":    return <Settings lang={lang} setLang={setLang} dark={dark} setDark={setDark} showToast={showToast} shopInfo={shopInfo} setShopInfo={setShopInfo} />;
//       default:            return null;
//     }
//   };

//   if (isLoading) {
//     return (
//       <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
//         <div className="text-center">
//           <div className="text-4xl mb-4">☁️</div>
//           <div className="text-emerald-600 font-bold text-lg">DukanDar Pro</div>
//           <div className="text-slate-500 text-sm mt-1">Syncing with Google Sheets...</div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className={dark?"dark":""} dir={L?"rtl":"ltr"}>
//       <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-24">
//         <style>{`
//           @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap');
//           .no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
//           @keyframes toast-in{0%{transform:translate(-50%,-16px);opacity:0}60%{transform:translate(-50%,3px)}100%{transform:translate(-50%,0);opacity:1}}
//           .animate-toast{animation:toast-in .35s cubic-bezier(.34,1.56,.64,1) forwards}
//           *{font-family:${L?"'Noto Nastaliq Urdu',serif":"'Outfit',sans-serif"}}
//           .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
//         `}</style>

//         {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

//         <SyncStatusIndicator pendingCount={syncPending} isNetworkOnline={isNetworkOnline}
//           onSync={async () => {
//             setIsSyncing(true);
//             await processOfflineQueue();
//             await syncAllData(d=>setProducts(Array.isArray(d)?d:[]),d=>setCustomers(Array.isArray(d)?d:[]),d=>setOrders(Array.isArray(d)?d:[]),d=>setExpenses(Array.isArray(d)?d:[]),d=>setStaff(Array.isArray(d)?d:[]));
//             setSyncPending(0); setIsSyncing(false); showToast("✅ Sync completed!","success");
//           }}
//           syncing={isSyncing} />

//         {showReminders && page==="home" && (
//           <CreditReminderPopup customers={customers} setPage={setPage} setSelectedCustomer={setExternalCustomer}
//             showCreditModal={id => { setExternalCreditModal(id); setPage("customers"); }}
//             onDismiss={() => setShowReminders(false)} />
//         )}

//         <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
//           <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md">د</div>
//               <div><div className="font-black text-slate-900 dark:text-white text-lg">{L?"دکانDار":"DukanDar"} <span className="text-emerald-500 text-sm">Pro</span></div><div className="text-xs text-slate-500">{pageTitles[page]}</div></div>
//             </div>
//             <div className="flex items-center gap-2">
//               {!isNetworkOnline&&<div className="bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg"><span className="text-amber-700 dark:text-amber-300 text-[10px] font-bold">OFFLINE</span></div>}
//               {lowCount>0&&<button onClick={() => setPage("inventory")} className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors">⚠️ {lowCount}</button>}
//               <button onClick={() => setDark(!dark)} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg hover:bg-slate-200 transition-colors">{dark?"☀️":"🌙"}</button>
//             </div>
//           </div>
//           <div className="flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
//             {moreItems.map(n=>(
//               <button key={n.key} onClick={() => setPage(n.key)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${page===n.key?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>{n.icon} {n.label}</button>
//             ))}
//           </div>
//         </header>

//         <main className="max-w-2xl mx-auto px-4 pt-5">{renderPage()}</main>

//         <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl">
//           <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
//             {navItems.map(n=>(
//               <button key={n.key} onClick={() => setPage(n.key)} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${page===n.key?"bg-emerald-50 dark:bg-emerald-900/20":""}`}>
//                 <div className="relative">
//                   <span className="text-xl">{n.icon}</span>
//                   {(n.badge||0)>0&&<span className="absolute -top-2 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">{n.badge}</span>}
//                 </div>
//                 <span className={`text-[10px] font-bold ${page===n.key?"text-emerald-600 dark:text-emerald-400":"text-slate-400"}`}>{n.label}</span>
//                 {page===n.key&&<div className="w-1 h-1 rounded-full bg-emerald-500" />}
//               </button>
//             ))}
//           </div>
//         </nav>
//       </div>
//     </div>
//   );
// }
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

/* ─── API shim ─── */
const api = () => window.DPApi;
const syncAllData = (sp,sc,so,se,sst) => {
  if (!api()) return Promise.resolve({ success: false });
  return api().fetchAll().then(res => {
    if (!res?.success) return res;
    const d = res.data || {};
    if (sp)  sp(Array.isArray(d.products)  ? d.products.map(mapProduct)   : []);
    if (sc)  sc(Array.isArray(d.customers) ? d.customers.map(mapCustomer) : []);
    if (so)  so(Array.isArray(d.orders)    ? d.orders.map(mapOrder)       : []);
    if (se)  se(Array.isArray(d.expenses)  ? d.expenses                   : []);
    if (sst) sst(Array.isArray(d.salesmen) ? d.salesmen                   : []);
    return res;
  });
};
const mapProduct  = p => ({ ...p, buy: p.cost  ?? p.buy  ?? 0, sell: p.price ?? p.sell ?? 0 });
const mapCustomer = c => ({ ...c, udhaar: c.pendingDues ?? c.udhaar ?? 0 });
const mapOrder    = o => ({ ...o, createdAt: o.date ?? o.createdAt ?? '', total: Number(o.total||0), profit: Number(o.profit||0) });

const addProduct            = (p)            => api()?.create('Products', { ...p, cost: p.buy, price: p.sell }) ?? Promise.resolve({ success: false });
const updateProduct         = (id, p)        => api()?.update('Products', id, { ...p, cost: p.buy, price: p.sell }) ?? Promise.resolve({ success: false });
const deleteProduct         = (id)           => api()?.remove('Products', id) ?? Promise.resolve({ success: false });
const patchProductStock     = (id, d, r, by) => api()?.update('Products', id, { delta: d, reason: r, by }) ?? Promise.resolve({ success: false });
const addOrder              = (order, items) => api()?.addOrder(order, items, null) ?? Promise.resolve({ success: false });
const updateOrderStatus     = (id, status, ex) => api()?.update('Orders', id, { status, ...ex }) ?? Promise.resolve({ success: false });
const deleteOrder           = (id)           => api()?.remove('Orders', id) ?? Promise.resolve({ success: false });
const addCustomer           = (c)            => api()?.create('Customers', { ...c, pendingDues: c.udhaar ?? 0 }) ?? Promise.resolve({ success: false });
const updateCustomer        = (id, c)        => api()?.update('Customers', id, { ...c, pendingDues: c.udhaar ?? 0 }) ?? Promise.resolve({ success: false });
const deleteCustomer        = (id)           => api()?.remove('Customers', id) ?? Promise.resolve({ success: false });
const addCustomerCreditPayment = (id, amt, due, oid) => api()?.update('Customers', id, { pendingDues: 0, creditPayment: amt, creditDueDate: due, orderId: oid }) ?? Promise.resolve({ success: false });
const addExpense            = (e)            => api()?.create('Expenses', e) ?? Promise.resolve({ success: false });
const updateExpense         = (id, e)        => api()?.update('Expenses', id, e) ?? Promise.resolve({ success: false });
const deleteExpense         = (id)           => api()?.remove('Expenses', id) ?? Promise.resolve({ success: false });
const addStaff              = (s)            => api()?.create('Salesmen', s) ?? Promise.resolve({ success: false });
const updateStaff           = (id, s)        => api()?.update('Salesmen', id, s) ?? Promise.resolve({ success: false });
const deleteStaff           = (id)           => api()?.remove('Salesmen', id) ?? Promise.resolve({ success: false });
const isOnline              = ()             => api()?.isOnline() ?? navigator.onLine;
const queueOfflineOperation = (action, payload) => api()?.queueOperation(action, payload) ?? Promise.resolve({ success: false, queued: true });
const processOfflineQueue   = ()             => api()?.processQueue() ?? Promise.resolve({ success: true, processed: 0, failed: 0, remaining: 0 });
const getPendingSyncCount   = ()             => Promise.resolve((api()?.loadQueue() ?? []).length);
const testConnection        = ()             => api()?.testConnection() ?? Promise.resolve({ success: false, error: 'DPApi not loaded' });

/* ── Helpers ── */
const rs      = n => `Rs. ${Number(n || 0).toLocaleString("en-PK")}`;
const fmtDate = s => { try { return new Date(s).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }); } catch { return s || ""; } };
const fmtTime = s => { try { return new Date(s).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }); } catch { return ""; } };
const fmtDT   = s => `${fmtDate(s)} ${fmtTime(s)}`;
const today   = () => new Date().toISOString();
const daysDiff = d => { const dd = new Date(d); const n = new Date(); return Math.ceil((dd - n) / (1000*60*60*24)); };
const loadFromStorage = (k, fb) => { try { return JSON.parse(localStorage.getItem(k)) || fb; } catch { return fb; } };
const saveToStorage   = (k, v)  => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

const CATEGORIES = ["All","Grocery","Beverages","Household","Snacks","Cosmetics","Pharmacy"];

/* ══ RECEIPT SLIP (JPEG) ══ */
function loadHtml2Canvas() {
  return new Promise(resolve => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js";
    s.onload = () => resolve(window.html2canvas);
    document.head.appendChild(s);
  });
}
async function renderSlipToJpeg(el) {
  const h2c = await loadHtml2Canvas();
  const canvas = await h2c(el, { backgroundColor: "#ffffff", scale: 3, useCORS: true, logging: false, width: el.offsetWidth, windowWidth: el.offsetWidth });
  return canvas.toDataURL("image/jpeg", 0.97);
}

const ReceiptSlip = ({ order, shopName="My Store", shopPhone="", shopAddress="", onClose }) => {
  const hiddenRef = useRef(null);
  const [jpegSrc, setJpegSrc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [busy, setBusy]       = useState(false);
  if (!order) return null;

  const discAmt  = order.disc ?? order.discountAmount ?? 0;
  const isCredit = order.status === "credit";
  const S = {
    wrap:        { backgroundColor:"#ffffff", fontFamily:"'Courier New',monospace", color:"#111", width:"320px", padding:"20px 16px 24px", margin:"0 auto" },
    headerBlock: { textAlign:"center", paddingBottom:"12px", marginBottom:"12px", borderBottom:"2px dashed #999" },
    shopName:    { fontSize:"18px", fontWeight:"900", letterSpacing:"1px", color:"#111", marginBottom:"3px", textTransform:"uppercase" },
    shopSub:     { fontSize:"11px", color:"#555", lineHeight:"1.6" },
    metaRow:     { display:"flex", justifyContent:"space-between", fontSize:"11px", color:"#333", marginBottom:"4px" },
    metaKey:     { fontWeight:"700", color:"#555" },
    metaValue:   { fontWeight:"600" },
    invNum:      { fontWeight:"900", color:"#000" },
    dashedDiv:   { borderTop:"1px dashed #aaa", margin:"10px 0" },
    itemsHeader: { display:"grid", gridTemplateColumns:"1fr 32px 56px 60px", gap:"0 4px", fontSize:"9px", fontWeight:"900", color:"#555", textTransform:"uppercase", letterSpacing:"0.6px", paddingBottom:"6px", borderBottom:"1px solid #ccc" },
    itemRow:     { display:"grid", gridTemplateColumns:"1fr 32px 56px 60px", gap:"0 4px", fontSize:"11px", paddingTop:"6px", paddingBottom:"6px", borderBottom:"1px dotted #ddd", alignItems:"start" },
    itemName:    { fontWeight:"700", lineHeight:"1.35", wordBreak:"break-word" },
    numCell:     { textAlign:"right", paddingTop:"1px" },
    amtCell:     { textAlign:"right", fontWeight:"700", paddingTop:"1px" },
    totRow:      { display:"flex", justifyContent:"space-between", marginBottom:"4px", fontSize:"12px" },
    totLabel:    { color:"#555" },
    totVal:      { fontWeight:"700" },
    discVal:     { fontWeight:"700", color:"#c00" },
    grandRow:    { display:"flex", justifyContent:"space-between", borderTop:"2px solid #111", marginTop:"6px", paddingTop:"8px", fontSize:"15px", fontWeight:"900" },
    creditBlock: { marginTop:"6px", padding:"8px 10px", backgroundColor:"#fff3f3", border:"1px dashed #e00", borderRadius:"4px" },
    creditRow:   { display:"flex", justifyContent:"space-between", fontSize:"12px", marginBottom:"3px" },
    creditLabel: { color:"#c00", fontWeight:"700" },
    creditVal:   { color:"#c00", fontWeight:"900" },
    statusWrap:  { marginTop:"14px", textAlign:"center" },
    statusBadge: (paid) => ({ display:"inline-block", padding:"4px 20px", borderRadius:"20px", fontSize:"11px", fontWeight:"900", letterSpacing:"1px", textTransform:"uppercase", background: paid?"#d1fae5":"#fee2e2", color: paid?"#065f46":"#991b1b", border:`1px solid ${paid?"#6ee7b7":"#fca5a5"}` }),
    footerBlock: { borderTop:"2px dashed #bbb", marginTop:"16px", paddingTop:"12px", textAlign:"center", fontSize:"10px", color:"#888", lineHeight:"1.9" },
    barcodeWrap: { textAlign:"center", marginTop:"10px" },
    barcodeText: { fontFamily:"'Courier New',monospace", fontSize:"24px", color:"#333", letterSpacing:"3px" },
    barcodeNum:  { fontSize:"9px", color:"#aaa", letterSpacing:"0.5px" },
  };

  const ThermalSlip = (
    <div ref={hiddenRef} style={{ position:"fixed", top:"-9999px", left:"-9999px", zIndex:-1, ...S.wrap }}>
      <div style={S.headerBlock}>
        <div style={S.shopName}>🏪 {shopName}</div>
        {shopAddress && <div style={S.shopSub}>{shopAddress}</div>}
        {shopPhone   && <div style={S.shopSub}>📞 {shopPhone}</div>}
      </div>
      <div style={{ marginBottom:"10px" }}>
        {[["Invoice #",<span key="i" style={S.invNum}>{order.id}</span>],["Date",fmtDT(order.createdAt)],["Customer",order.customerName||"Walk-in"],["Payment",(order.method||"Cash").charAt(0).toUpperCase()+(order.method||"Cash").slice(1)],["Cashier",order.cashier||"Owner"]].map(([k,v])=>(
          <div key={k} style={S.metaRow}><span style={S.metaKey}>{k}</span><span style={S.metaValue}>{v}</span></div>
        ))}
      </div>
      <div style={S.dashedDiv}/>
      <div style={S.itemsHeader}><span>Item</span><span style={{textAlign:"right"}}>Qty</span><span style={{textAlign:"right"}}>Rate</span><span style={{textAlign:"right"}}>Amt</span></div>
      {(order.items||[]).map((item,i)=>{
        const up = item.sell??item.price??0;
        return (
          <div key={i} style={S.itemRow}>
            <div><div style={S.itemName}>{item.name}</div></div>
            <div style={S.numCell}>{item.qty}</div>
            <div style={S.numCell}>{rs(up)}</div>
            <div style={S.amtCell}>{rs(item.qty*up)}</div>
          </div>
        );
      })}
      <div style={{...S.dashedDiv, borderTopStyle:"double", borderTopWidth:"3px", borderColor:"#999"}}/>
      <div>
        <div style={S.totRow}><span style={S.totLabel}>Subtotal</span><span style={S.totVal}>{rs(order.subtotal??order.total)}</span></div>
        {discAmt>0 && <div style={S.totRow}><span style={S.totLabel}>Discount</span><span style={S.discVal}>− {rs(discAmt)}</span></div>}
        <div style={S.grandRow}><span>TOTAL</span><span>{rs(order.total)}</span></div>
      </div>
      {isCredit && <div style={S.creditBlock}><div style={S.creditRow}><span style={S.creditLabel}>Balance Due</span><span style={S.creditVal}>{rs(order.total)}</span></div></div>}
      <div style={S.statusWrap}><span style={S.statusBadge(order.status==="paid")}>{order.status==="paid"?"PAID":order.status==="credit"?"CREDIT":(order.status||"").toUpperCase()}</span></div>
      <div style={S.barcodeWrap}><div style={S.barcodeText}>||| || |||| || ||| ||</div><div style={S.barcodeNum}>{order.id}</div></div>
      <div style={S.footerBlock}><div style={{fontWeight:"800",fontSize:"11px",color:"#222"}}>Thank you for your purchase!</div><div>Items once sold are not returnable without receipt within 3 days.</div><div style={{marginTop:"8px",fontSize:"9px",color:"#ccc"}}>★ Powered by DukanDar Pro v5.1 ★</div></div>
    </div>
  );

  useEffect(() => {
    let cancelled = false;
    const render = async () => {
      setLoading(true); setError(null);
      await new Promise(r => setTimeout(r, 300));
      if (cancelled || !hiddenRef.current) return;
      try { const dataUrl = await renderSlipToJpeg(hiddenRef.current); if (!cancelled) setJpegSrc(dataUrl); }
      catch (e) { if (!cancelled) setError("Could not render: " + e.message); }
      finally { if (!cancelled) setLoading(false); }
    };
    render();
    return () => { cancelled = true; };
  }, [order?.id]);

  return (
    <>
      {ThermalSlip}
      <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
        <div style={{ backgroundColor:"#fff", borderRadius:"20px 20px 0 0", width:"100%", maxWidth:"400px", maxHeight:"95vh", overflowY:"auto", display:"flex", flexDirection:"column", boxShadow:"0 -8px 40px rgba(0,0,0,0.35)" }} className="sm:rounded-3xl">
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", borderBottom:"1px solid #f0f0f0", backgroundColor:"#fff", position:"sticky", top:0, zIndex:10, borderRadius:"20px 20px 0 0" }}>
            <span style={{ fontWeight:"800", fontSize:"15px", color:"#111" }}>🧾 Sale Receipt</span>
            <div style={{ display:"flex", gap:"10px", alignItems:"center" }}>
              <button onClick={() => { if (!jpegSrc||busy) return; setBusy(true); try { const a=document.createElement("a"); a.download=`Receipt-${order.id}.jpg`; a.href=jpegSrc; a.click(); } finally { setBusy(false); } }} disabled={busy||loading||!!error||!jpegSrc} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"9px 18px", background:(loading||!jpegSrc)?"#9ca3af":"linear-gradient(135deg,#10b981,#059669)", color:"#fff", border:"none", borderRadius:"12px", fontWeight:"800", fontSize:"13px", cursor:(busy||loading||!!error||!jpegSrc)?"not-allowed":"pointer" }}>
                {loading?"⏳ Generating...":busy?"⏳ Saving…":"⬇️ Download JPEG"}
              </button>
              <button onClick={onClose} style={{ width:"34px", height:"34px", borderRadius:"10px", background:"#f3f4f6", border:"none", fontWeight:"700", fontSize:"14px", cursor:"pointer", color:"#6b7280" }}>✕</button>
            </div>
          </div>
          <div style={{ padding:"16px", flex:1, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"300px", backgroundColor:"#f9fafb" }}>
            {loading && <div style={{ textAlign:"center", color:"#6b7280" }}><div style={{ fontSize:"32px", marginBottom:"12px" }}>🖨️</div><div style={{ fontWeight:"700", fontSize:"14px" }}>Generating Receipt...</div></div>}
            {error   && <div style={{ textAlign:"center", color:"#ef4444" }}><div style={{ fontSize:"32px" }}>❌</div><div style={{ fontWeight:"700", fontSize:"13px" }}>{error}</div></div>}
            {jpegSrc && !loading && <div style={{ width:"100%", textAlign:"center" }}><img src={jpegSrc} alt={`Receipt ${order.id}`} style={{ maxWidth:"100%", borderRadius:"12px", boxShadow:"0 4px 24px rgba(0,0,0,0.15)", border:"1px solid #e5e7eb", display:"block", margin:"0 auto" }}/><div style={{ marginTop:"10px", fontSize:"11px", color:"#9ca3af" }}>📷 JPEG ready · Tap Download to save</div></div>}
          </div>
          <div style={{ padding:"16px", borderTop:"1px solid #f0f0f0", backgroundColor:"#fff", borderRadius:"0 0 20px 20px" }}>
            <button onClick={onClose} style={{ width:"100%", padding:"13px", borderRadius:"12px", background:"#f3f4f6", border:"none", fontWeight:"700", fontSize:"14px", color:"#374151", cursor:"pointer" }}>Close & Continue</button>
          </div>
        </div>
      </div>
    </>
  );
};

/* ══ SYNC STATUS ══ */
const SyncStatusIndicator = ({ pendingCount, isNetworkOnline, onSync, syncing }) => {
  const [showPopup, setShowPopup] = useState(false);
  if (pendingCount === 0 && isNetworkOnline) return null;
  return (
    <div className="fixed bottom-24 right-4 z-50">
      <button onClick={() => setShowPopup(!showPopup)} className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-xl transition-all ${pendingCount>0?"bg-amber-500":isNetworkOnline?"bg-emerald-500":"bg-red-500"} text-white`}>
        {syncing?"⏳":pendingCount>0?"📤":isNetworkOnline?"☁️":"📡"}
      </button>
      {showPopup && (
        <div className="absolute bottom-14 right-0 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-4 w-64 border border-slate-200 dark:border-slate-700">
          <div className="text-sm font-bold mb-2 text-slate-900 dark:text-white">Sync Status</div>
          <div className="text-xs text-slate-500 mb-3">{isNetworkOnline?"✅ Online":"⚠️ Offline"}</div>
          {pendingCount>0 && <div className="text-xs text-amber-600 mb-3">{pendingCount} pending</div>}
          <button onClick={onSync} disabled={syncing||!isNetworkOnline} className="w-full px-3 py-2 bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-50">{syncing?"Syncing...":"Sync Now"}</button>
        </div>
      )}
    </div>
  );
};

/* ══ UI COMPONENTS ══ */
const Badge = ({ color, children, size="sm" }) => {
  const s = size==="lg"?"px-3 py-1 text-sm":"px-2.5 py-0.5 text-xs";
  const c = { green:"bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", red:"bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300", amber:"bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", blue:"bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300", violet:"bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", gray:"bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300", orange:"bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300" };
  return <span className={`inline-flex items-center ${s} rounded-full font-semibold ${c[color]||c.gray}`}>{children}</span>;
};
const Card = ({ children, className="", onClick, selected=false }) => (
  <div onClick={onClick} className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm border-2 transition-all ${selected?"border-emerald-500 bg-emerald-50 dark:bg-emerald-900/10":"border-slate-200 dark:border-slate-700"} ${className} ${onClick?"cursor-pointer hover:shadow-md active:scale-[0.98]":""}`}>{children}</div>
);
const Toast = ({ msg, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, []);
  const colors = { success:"bg-emerald-500", error:"bg-red-500", info:"bg-sky-500", warning:"bg-amber-500" };
  const icons  = { success:"✅", error:"❌", warning:"⚠️", info:"ℹ️" };
  return <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[300] ${colors[type]} text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm flex items-center gap-2 animate-toast`}>{icons[type]} {msg}</div>;
};
const Modal = ({ open, onClose, title, children, size="md" }) => {
  if (!open) return null;
  const sizes = { sm:"max-w-sm", md:"max-w-lg", lg:"max-w-2xl", xl:"max-w-4xl" };
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl w-full ${sizes[size]} max-h-[92vh] overflow-y-auto shadow-2xl`}>
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-lg font-black text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
const ConfirmDialog = ({ open, title, message, onConfirm, onCancel, danger=false, confirmText="Confirm" }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-6 max-w-sm w-full">
        <div className="text-3xl mb-3 text-center">{danger?"⚠️":"❓"}</div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2 text-center">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 text-center">{message}</p>
        <div className="flex gap-3">
          <Btn variant="secondary" onClick={onCancel} full>Cancel</Btn>
          <Btn variant={danger?"danger":"primary"} onClick={onConfirm} full>{confirmText}</Btn>
        </div>
      </div>
    </div>
  );
};
const Input = ({ label, value, onChange, type="text", placeholder="", required=false, helpText="", min, max }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}{required&&<span className="text-red-500 ml-1">*</span>}</label>}
    <input type={type} value={value||""} onChange={onChange} placeholder={placeholder} required={required} min={min} max={max} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none transition-colors text-sm font-medium" />
    {helpText && <p className="text-xs text-slate-500 mt-1">💡 {helpText}</p>}
  </div>
);
const Select = ({ label, value, onChange, options, helpText="" }) => (
  <div className="mb-4">
    {label && <label className="block text-sm font-semibold text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>}
    <select value={value||""} onChange={onChange} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none transition-colors text-sm font-medium">
      {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {helpText && <p className="text-xs text-slate-500 mt-1">💡 {helpText}</p>}
  </div>
);
const Btn = ({ children, onClick, variant="primary", size="md", className="", disabled=false, full=false, type="button" }) => {
  const v = { primary:"bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm", secondary:"bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300", danger:"bg-red-500 hover:bg-red-600 text-white", ghost:"hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400", violet:"bg-violet-500 hover:bg-violet-600 text-white", amber:"bg-amber-500 hover:bg-amber-600 text-white" };
  const s = { sm:"px-3 py-1.5 text-xs", md:"px-4 py-2.5 text-sm", lg:"px-6 py-3.5 text-base" };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${v[variant]} ${s[size]} font-semibold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${full?"w-full":""} flex items-center justify-center gap-2 ${className}`}>{children}</button>;
};
const EmptyState = ({ icon, title, desc, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{title}</h3>
    <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{desc}</p>
    {action}
  </div>
);
const KPIGrid = ({ items }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {(items||[]).map((item,i)=>(
      <Card key={i} className="p-4 text-center" onClick={item.onClick}>
        <div className="text-2xl mb-1">{item.icon}</div>
        <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{item.label}</div>
        <div className="text-base font-black text-slate-900 dark:text-white leading-tight">{item.value}</div>
        {item.change&&<div className={`text-xs font-semibold mt-1 ${String(item.change).includes("+")?"text-emerald-500":item.change.toString().startsWith("-")?"text-red-500":"text-slate-400"}`}>{item.change}</div>}
      </Card>
    ))}
  </div>
);
const TimelineItem = ({ icon, title, sub, time, color="green" }) => {
  const lc = { green:"bg-emerald-500", red:"bg-red-500", blue:"bg-sky-500", amber:"bg-amber-500", violet:"bg-violet-500" };
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full ${lc[color]||lc.green} flex items-center justify-center text-white text-sm flex-shrink-0`}>{icon}</div>
        <div className="w-0.5 bg-slate-200 dark:bg-slate-700 flex-1 mt-1 min-h-[16px]"/>
      </div>
      <div className="pb-4 flex-1">
        <div className="font-semibold text-slate-900 dark:text-white text-sm">{title}</div>
        {sub&&<div className="text-xs text-slate-500 mt-0.5">{sub}</div>}
        <div className="text-xs text-slate-400 mt-0.5">{time}</div>
      </div>
    </div>
  );
};

/* ══ DASHBOARD ══ */
const Dashboard = ({ products, orders, customers, expenses, lang, setPage, setExternalCustomer, setExternalCreditModal }) => {
  const L = lang==="ur";
  const safeP=Array.isArray(products)?products:[], safeO=Array.isArray(orders)?orders:[], safeC=Array.isArray(customers)?customers:[];
  const todayStr=new Date().toISOString().slice(0,10);
  const todayOrders=safeO.filter(o=>(o.createdAt||"").startsWith(todayStr));
  const todaySales=todayOrders.reduce((s,o)=>s+(o.total||0),0);
  const todayProfit=todayOrders.reduce((s,o)=>s+(o.profit||0),0);
  const thisMonthSales=safeO.filter(o=>(o.createdAt||"").startsWith(new Date().toISOString().slice(0,7))).reduce((s,o)=>s+(o.total||0),0);
  const pendingUdhaar=safeC.reduce((s,c)=>s+(c.udhaar||0),0);
  const lowStock=safeP.filter(p=>(p.stock||0)<=(p.minStock||p.lowStock||0));
  const upcomingCredits=safeC.filter(c=>(c.udhaar||0)>0&&c.creditDueDate&&daysDiff(c.creditDueDate)<=7);
  const kpis=[
    {icon:"💰",label:L?"آج کی فروخت":"Today Sales",value:rs(todaySales),change:"+12%",onClick:()=>setPage("orders")},
    {icon:"📈",label:L?"مہینے کی فروخت":"Month Sales",value:rs(thisMonthSales),change:"+18%",onClick:()=>setPage("analytics")},
    {icon:"🏦",label:L?"آج کا منافع":"Today Profit",value:rs(todayProfit),change:"+8%",onClick:()=>setPage("analytics")},
    {icon:"🤝",label:L?"باقی ادھار":"Pending Credit",value:rs(pendingUdhaar),change:`${upcomingCredits.length} due`,onClick:()=>setPage("customers")},
  ];
  return (
    <div className="space-y-5 pb-8">
      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-emerald-100 text-sm font-medium">{L?"خوش آمدید":"Welcome Back"} · {fmtDate(new Date().toISOString())}</p>
        <h2 className="text-2xl font-black mt-1">{L?"علی جنرل اسٹور":"My Store"}</h2>
        <div className="flex gap-6 mt-4 text-sm">
          <div><div className="text-emerald-100 text-xs">{L?"آج کے آرڈر":"Today Orders"}</div><div className="text-2xl font-black">{todayOrders.length}</div></div>
          <div><div className="text-emerald-100 text-xs">{L?"اسٹاک قدر":"Stock Value"}</div><div className="text-2xl font-black">{rs(safeP.reduce((s,p)=>s+(p.stock||0)*(p.buy||0),0))}</div></div>
          <div><div className="text-emerald-100 text-xs">{L?"ادھار واجب":"Credit Due"}</div><div className="text-2xl font-black">{upcomingCredits.length}</div></div>
        </div>
      </div>
      <KPIGrid items={kpis}/>
      <div>
        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">{L?"فوری عمل":"Quick Actions"}</h3>
        <div className="grid grid-cols-4 gap-2">
          {[["🛒",L?"نئی بلنگ":"New Sale","pos"],["📦",L?"اسٹاک":"Stock","inventory"],["👥",L?"گاہک":"Customers","customers"],["📊",L?"رپورٹ":"Reports","analytics"]].map(([ico,lbl,pg])=>(
            <button key={pg} onClick={()=>setPage(pg)} className="flex flex-col items-center p-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-400 transition-all active:scale-95 gap-1">
              <span className="text-2xl">{ico}</span><span className="text-xs font-bold text-center leading-tight">{lbl}</span>
            </button>
          ))}
        </div>
      </div>
      {upcomingCredits.length>0&&(
        <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-xl p-4">
          <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-2">🔔 {L?"قرض یاددہانی":"Credit Reminders"}</h3>
          <div className="space-y-2">
            {upcomingCredits.slice(0,3).map(c=>{const diff=daysDiff(c.creditDueDate);return(
              <div key={c.id} className="flex items-center justify-between">
                <div><span className="text-sm font-semibold text-amber-900 dark:text-amber-100">{c.name}</span><span className="text-xs text-amber-700 dark:text-amber-300 ml-2">{diff<0?`${Math.abs(diff)}d overdue`:`Due in ${diff}d`}</span></div>
                <Badge color={diff<0?"red":"amber"}>{rs(c.udhaar)}</Badge>
              </div>
            );})}
          </div>
        </div>
      )}
      {lowStock.length>0&&(
        <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-xl p-4">
          <h3 className="font-bold text-red-900 dark:text-red-100 mb-2">⚠️ {L?"کم اسٹاک الرٹ":"Low Stock Alert"}</h3>
          <div className="space-y-1">{lowStock.slice(0,4).map(p=><div key={p.id} className="flex items-center justify-between text-sm"><span className="text-red-900 dark:text-red-100">{p.name}</span><Badge color="red">{p.stock} left</Badge></div>)}</div>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{L?"حالیہ فروخت":"Recent Sales"}</h3>
          <button onClick={()=>setPage("orders")} className="text-emerald-500 text-xs font-semibold">View All →</button>
        </div>
        <div className="space-y-2">
          {safeO.slice(0,4).map(o=>(
            <div key={o.id} className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">🧾</div>
                <div><div className="font-semibold text-slate-900 dark:text-white text-sm">{o.customerName}</div><div className="text-xs text-slate-500">{o.id} · {fmtTime(o.createdAt)}</div></div>
              </div>
              <div className="text-right"><div className="font-black text-slate-900 dark:text-white text-sm">{rs(o.total)}</div><Badge color={o.status==="paid"?"green":o.status==="credit"?"red":"amber"}>{o.status}</Badge></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ══ POS ══ */
const POS = ({ products, customers, setOrders, setProducts, setCustomers, showToast, lang, shopInfo }) => {
  const [cart,setCart]=useState([]);
  const [search,setSearch]=useState("");
  const [activeCat,setActiveCat]=useState("All");
  const [selectedCustomer,setSelectedCustomer]=useState(null);
  const [payMethod,setPayMethod]=useState("cash");
  const [discount,setDiscount]=useState(0);
  const [showCart,setShowCart]=useState(false);
  const [showCustomerSearch,setShowCustomerSearch]=useState(false);
  const [customerSearch,setCustomerSearch]=useState("");
  const [showConfirm,setShowConfirm]=useState(false);
  const [creditDueDate,setCreditDueDate]=useState("");
  const [isProcessing,setIsProcessing]=useState(false);
  const [showAddCustomer,setShowAddCustomer]=useState(false);
  const [newCustForm,setNewCustForm]=useState({name:"",phone:"",email:"",addr:""});
  const [savingCust,setSavingCust]=useState(false);
  const [receiptOrder,setReceiptOrder]=useState(null);
  const L=lang==="ur";
  const safeP=Array.isArray(products)?products:[];
  const safeC=Array.isArray(customers)?customers:[];
  const filtered=safeP.filter(p=>(activeCat==="All"||p.cat===activeCat||p.category===activeCat)&&(p.name?.toLowerCase().includes(search.toLowerCase())||(p.sku&&p.sku.toLowerCase().includes(search.toLowerCase()))));
  const addToCart=p=>{if((p.stock||0)<=0){showToast("Out of stock!","error");return;}setCart(c=>{const ex=c.find(i=>i.pid===p.id);return ex?c.map(i=>i.pid===p.id?{...i,qty:i.qty+1}:i):[...c,{pid:p.id,name:p.name,buy:p.buy||p.cost||0,sell:p.sell||p.price||0,qty:1,disc:0}];});};
  const subtotal=cart.reduce((s,i)=>s+i.qty*i.sell,0);
  const totalDisc=cart.reduce((s,i)=>s+i.disc*i.qty,0)+(+discount);
  const total=subtotal-totalDisc;
  const profit=cart.reduce((s,i)=>s+i.qty*(i.sell-i.buy-(i.disc||0)),0)-(+discount);
  const doCheckout=()=>{if(cart.length===0){showToast("Cart is empty!","error");return;}if(!selectedCustomer){showToast("Please select a customer","error");return;}setShowCart(false);setShowConfirm(true);};
  const saveNewCustomer=async()=>{
    if(!newCustForm.name||!newCustForm.phone){showToast("Name & phone required","error");return;}
    setSavingCust(true);
    const nc={...newCustForm,id:Date.now(),udhaar:0,totalOrders:0,totalSpent:0,points:0,joined:new Date().toISOString().split("T")[0],creditDueDate:null,creditHistory:[],activityLog:[],editHistory:[]};
    try{const r=await addCustomer(nc);if(r.success){setCustomers(p=>[...p,nc]);setSelectedCustomer(nc);showToast(`✅ ${nc.name} added!`,"success");}else{await queueOfflineOperation("addCustomer",{customer:nc});setCustomers(p=>[...p,nc]);setSelectedCustomer(nc);showToast("⚠️ Saved offline","warning");}}catch{showToast("Error adding customer","error");}
    setNewCustForm({name:"",phone:"",email:"",addr:""});setShowAddCustomer(false);setShowCustomerSearch(false);setSavingCust(false);
  };
  const confirmCheckout=async()=>{
    if(isProcessing)return;setIsProcessing(true);
    const inv=`INV-${String(Date.now()).slice(-6)}-${String(Math.floor(Math.random()*1000))}`;
    const order={id:inv,customerId:selectedCustomer.id,customerName:selectedCustomer.name,cashier:"Ali",items:cart.map(i=>({pid:i.pid,productId:i.pid,name:i.name,qty:i.qty,buy:i.buy,sell:i.sell,price:i.sell,cost:i.buy,disc:i.disc,total:i.qty*i.sell})),subtotal,disc:totalDisc,discountAmount:totalDisc,total,profit,status:payMethod==="udhaar"?"credit":"paid",method:payMethod,paymentMethod:payMethod,udhaarAmt:payMethod==="udhaar"?total:0,creditDueDate:payMethod==="udhaar"?(creditDueDate||null):null,createdAt:today(),date:today(),notes:"",timeline:[{time:today(),evt:"Order created"}],refunds:[],returnHistory:[]};
    const stockUpdates=cart.map(item=>({id:item.pid,delta:-item.qty,reason:`Sale ${inv}`,by:"Ali"}));
    try{
      const r=await addOrder(order,stockUpdates);
      if(r.success){setOrders(p=>[order,...p]);setProducts(p=>p.map(pr=>{const ci=cart.find(i=>i.pid===pr.id);return ci?{...pr,stock:Math.max(0,(pr.stock||0)-ci.qty)}:pr;}));if(payMethod==="udhaar"){try{await addCustomerCreditPayment(selectedCustomer.id,total,creditDueDate||selectedCustomer.creditDueDate,inv);setCustomers(p=>p.map(c=>c.id===selectedCustomer.id?{...c,udhaar:(c.udhaar||0)+total,creditDueDate:creditDueDate||c.creditDueDate}:c));}catch{}}showToast(`✅ ${inv} saved!`,"success");}
      else if(r.queued){setOrders(p=>[order,...p]);setProducts(p=>p.map(pr=>{const ci=cart.find(i=>i.pid===pr.id);return ci?{...pr,stock:Math.max(0,(pr.stock||0)-ci.qty)}:pr;}));if(payMethod==="udhaar")setCustomers(p=>p.map(c=>c.id===selectedCustomer.id?{...c,udhaar:(c.udhaar||0)+total}:c));showToast("⚠️ Offline: Order saved locally","warning");}
      else throw new Error(r.error||"Failed");
    }catch(err){showToast("Error: "+err.message,"error");setOrders(p=>[order,...p]);setProducts(p=>p.map(pr=>{const ci=cart.find(i=>i.pid===pr.id);return ci?{...pr,stock:Math.max(0,(pr.stock||0)-ci.qty)}:pr;}));}
    finally{setReceiptOrder(order);setCart([]);setSelectedCustomer(null);setDiscount(0);setShowConfirm(false);setCreditDueDate("");setIsProcessing(false);}
  };
  return (
    <div className="flex flex-col pb-24">
      {receiptOrder&&<ReceiptSlip order={receiptOrder} shopName={shopInfo?.name||"My Store"} shopPhone={shopInfo?.phone||""} shopAddress={shopInfo?.address||""} onClose={()=>setReceiptOrder(null)}/>}
      <div className="space-y-3 mb-4">
        <button onClick={()=>setShowCustomerSearch(true)} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-emerald-400 transition-colors">
          <div className="flex items-center gap-3"><span className="text-2xl">👤</span><div className="text-left"><div className={`text-sm font-semibold ${selectedCustomer?"text-slate-900 dark:text-white":"text-slate-400"}`}>{selectedCustomer?selectedCustomer.name:(L?"گاہک منتخب کریں":"Select Customer")}</div>{selectedCustomer&&<div className="text-xs text-slate-500">{selectedCustomer.phone}</div>}</div></div>
          {selectedCustomer?.udhaar>0&&<Badge color="red">Owes {rs(selectedCustomer.udhaar)}</Badge>}
        </button>
        <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"پروڈکٹ تلاش کریں...":"Search products..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none text-sm"/></div>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">{CATEGORIES.map(cat=><button key={cat} onClick={()=>setActiveCat(cat)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCat===cat?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{cat}</button>)}</div>
      <div className="grid grid-cols-2 gap-3 mb-8">
        {filtered.map(p=>{const inCart=cart.find(i=>i.pid===p.id);const out=(p.stock||0)<=0;return(
          <button key={p.id} onClick={()=>!out&&addToCart(p)} disabled={out} className={`relative p-4 rounded-2xl text-left border-2 transition-all ${inCart?"border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20":"border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"} ${out?"opacity-40":""}`}>
            {inCart&&<div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">{inCart.qty}</div>}
            <div className="text-2xl mb-2">📦</div>
            <div className="font-bold text-slate-900 dark:text-white text-xs leading-tight mb-1 line-clamp-2">{p.name}</div>
            <div className="text-emerald-600 font-black text-sm">{rs(p.sell||p.price||0)}</div>
            <div className="text-xs text-slate-400 mt-0.5">{out?"Out of stock":`${p.stock} ${p.unit||"pcs"}`}</div>
          </button>
        );})}
      </div>
      {cart.length>0&&(
        <div className="fixed bottom-20 left-4 right-4 z-50">
          <button onClick={()=>setShowCart(true)} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black text-base shadow-2xl flex items-center justify-between px-5 active:scale-98 transition-all">
            <div className="flex items-center gap-3"><span className="bg-white text-emerald-600 w-7 h-7 rounded-lg flex items-center justify-center font-black text-sm">{cart.reduce((s,i)=>s+i.qty,0)}</span><span>{L?"کارٹ":"Cart"}</span></div>
            <span>{rs(total)}</span>
          </button>
        </div>
      )}
      <Modal open={showCart} onClose={()=>setShowCart(false)} title={`🛒 Cart (${cart.reduce((s,i)=>s+i.qty,0)} items)`} size="lg">
        <div className="space-y-3 mb-4">
          {cart.map(item=>(
            <div key={item.pid} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
              <div className="flex items-start justify-between mb-2"><div><div className="font-bold text-sm">{item.name}</div><div className="text-xs text-slate-500">{rs(item.sell)} each</div></div><button onClick={()=>setCart(c=>c.filter(i=>i.pid!==item.pid))} className="text-red-400">✕</button></div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-600 rounded-lg p-1">
                  <button onClick={()=>{if(item.qty<=1)setCart(c=>c.filter(i=>i.pid!==item.pid));else setCart(c=>c.map(i=>i.pid===item.pid?{...i,qty:i.qty-1}:i));}} className="w-7 h-7 rounded-md bg-slate-100 dark:bg-slate-500 flex items-center justify-center font-bold">−</button>
                  <span className="w-8 text-center font-black text-sm">{item.qty}</span>
                  <button onClick={()=>setCart(c=>c.map(i=>i.pid===item.pid?{...i,qty:i.qty+1}:i))} className="w-7 h-7 rounded-md bg-emerald-500 text-white flex items-center justify-center font-bold">+</button>
                </div>
                <div className="text-right flex-1"><div className="font-black text-sm">{rs(item.qty*item.sell)}</div><div className="text-xs text-emerald-500">+{rs(item.qty*(item.sell-item.buy))}</div></div>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 mb-4 space-y-2 border border-slate-200 dark:border-slate-600">
          <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Subtotal</span><span className="font-semibold">{rs(subtotal)}</span></div>
          <div className="flex justify-between items-center text-sm"><span className="text-slate-600 dark:text-slate-400">Discount</span><input type="number" value={discount} onChange={e=>setDiscount(e.target.value)} className="w-24 text-right px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"/></div>
          <div className="border-t border-slate-200 dark:border-slate-600 pt-2 flex justify-between"><span className="font-bold">Total</span><span className="font-black text-xl text-emerald-600">{rs(total)}</span></div>
        </div>
        <div className="mb-4">
          <div className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-3">Payment Method</div>
          <div className="grid grid-cols-3 gap-2">
            {[["cash","💵","Cash"],["online","📱","Online"],["udhaar","📒","Credit"]].map(([v,ico,lbl])=>(
              <button key={v} onClick={()=>setPayMethod(v)} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all ${payMethod===v?"border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30":"border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"}`}>
                <span className="text-xl mb-1">{ico}</span><span className="text-xs font-bold">{lbl}</span>
              </button>
            ))}
          </div>
          {payMethod==="udhaar"&&<div className="mt-3"><Input label="Credit Due Date (optional)" type="date" value={creditDueDate} onChange={e=>setCreditDueDate(e.target.value)}/></div>}
        </div>
        <div className="flex gap-2"><Btn variant="secondary" onClick={()=>setShowCart(false)} full>Cancel</Btn><Btn variant="primary" onClick={doCheckout} full disabled={isProcessing}>{isProcessing?"Processing...":"✅ Complete"}</Btn></div>
      </Modal>
      <Modal open={showCustomerSearch} onClose={()=>{setShowCustomerSearch(false);setShowAddCustomer(false);}} title={L?"گاہک منتخب کریں":"Select Customer"}>
        {!showAddCustomer?(
          <><div className="mb-3"><Btn variant="violet" onClick={()=>setShowAddCustomer(true)} full>➕ {L?"نیا گاہک بنائیں":"Create New Customer"}</Btn></div>
          <div className="relative mb-3"><Input placeholder={L?"نام یا نمبر...":"Name or phone..."} value={customerSearch} onChange={e=>setCustomerSearch(e.target.value)}/></div>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {safeC.filter(c=>c.name?.toLowerCase().includes(customerSearch.toLowerCase())||(c.phone&&c.phone.includes(customerSearch))).map(c=>(
              <button key={c.id} onClick={()=>{setSelectedCustomer(c);setShowCustomerSearch(false);setCustomerSearch("");}} className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                <div><div className="font-bold text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.phone}</div></div>
                {c.udhaar>0&&<Badge color="red">{rs(c.udhaar)}</Badge>}
              </button>
            ))}
          </div></>
        ):(
          <div>
            <button onClick={()=>setShowAddCustomer(false)} className="flex items-center gap-1 text-emerald-500 font-bold text-sm mb-4">← Back</button>
            <Input label="Full Name *" value={newCustForm.name} onChange={e=>setNewCustForm({...newCustForm,name:e.target.value})} required/>
            <Input label="Phone *" value={newCustForm.phone} onChange={e=>setNewCustForm({...newCustForm,phone:e.target.value})} type="tel" required/>
            <Input label="Email" value={newCustForm.email} onChange={e=>setNewCustForm({...newCustForm,email:e.target.value})} type="email"/>
            <Input label="Address" value={newCustForm.addr} onChange={e=>setNewCustForm({...newCustForm,addr:e.target.value})}/>
            <div className="flex gap-2"><Btn variant="secondary" onClick={()=>setShowAddCustomer(false)} full>Cancel</Btn><Btn variant="primary" onClick={saveNewCustomer} disabled={savingCust} full>{savingCust?"Saving...":"✅ Save & Select"}</Btn></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={showConfirm} title="Confirm Sale" message={`Complete sale for ${selectedCustomer?.name}? Total: ${rs(total)} via ${payMethod}`} onConfirm={confirmCheckout} onCancel={()=>setShowConfirm(false)} confirmText="Complete Sale"/>
    </div>
  );
};

/* ══ INVENTORY ══ */
const Inventory = ({ products, setProducts, showToast, lang }) => {
  const [search,setSearch]=useState("");
  const [activeCat,setActiveCat]=useState("All");
  const [showAdd,setShowAdd]=useState(false);
  const [editProduct,setEditProduct]=useState(null);
  const [showStockHistory,setShowStockHistory]=useState(null);
  const [isProcessing,setIsProcessing]=useState(false);
  const [form,setForm]=useState({name:"",nameUr:"",sku:"",cat:"Grocery",buy:"",sell:"",stock:"",minStock:"5",unit:"pcs",expiry:"",supplier:"",barcode:""});
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const L=lang==="ur";
  const safeP=Array.isArray(products)?products:[];
  const filtered=safeP.filter(p=>(activeCat==="All"||p.cat===activeCat||p.category===activeCat)&&(p.name?.toLowerCase().includes(search.toLowerCase())||(p.sku&&p.sku.toLowerCase().includes(search.toLowerCase()))));
  const openEdit=p=>{setEditProduct(p.id);setForm({...p,buy:String(p.buy||p.cost||""),sell:String(p.sell||p.price||""),stock:String(p.stock||""),minStock:String(p.minStock||p.lowStock||"5")});setShowAdd(true);};
  const saveProduct=async()=>{
    if(!form.name||!form.sell){showToast("Name & sell price required","error");return;}
    if(isProcessing)return;setIsProcessing(true);
    const updated={...form,buy:+form.buy,sell:+form.sell,cost:+form.buy,price:+form.sell,stock:+form.stock,minStock:+form.minStock,lowStock:+form.minStock,category:form.cat};
    if(editProduct){
      const old=safeP.find(p=>p.id===editProduct);
      const fp={...updated,id:editProduct,stockHistory:old.stockHistory||[],editHistory:[...(old.editHistory||[]),{date:today(),by:"Owner"}]};
      try{const r=await updateProduct(editProduct,fp);if(r.success){setProducts(p=>p.map(pr=>pr.id===editProduct?fp:pr));showToast("✅ Updated!","success");}else{await queueOfflineOperation("updateProduct",{id:editProduct,product:fp});setProducts(p=>p.map(pr=>pr.id===editProduct?fp:pr));showToast("⚠️ Saved offline","warning");}}catch(e){showToast("Error: "+e.message,"error");}
    }else{
      const np={...updated,id:Date.now(),stockHistory:[],editHistory:[]};
      try{const r=await addProduct(np);if(r.success){setProducts(p=>[...p,np]);showToast("✅ Product added!","success");}else{await queueOfflineOperation("addProduct",{product:np});setProducts(p=>[...p,np]);showToast("⚠️ Saved offline","warning");}}catch(e){showToast("Error: "+e.message,"error");}
    }
    setShowAdd(false);setIsProcessing(false);
  };
  const adjustStock=async(productId,delta,reason)=>{
    const product=safeP.find(p=>p.id===productId);
    const newStock=Math.max(0,(product.stock||0)+delta);
    try{const r=await patchProductStock(productId,delta,reason,"Owner");if(r.success){setProducts(p=>p.map(pr=>pr.id===productId?{...pr,stock:newStock,stockHistory:[...(pr.stockHistory||[]),{date:today(),change:delta,reason:reason||"Manual",by:"Owner"}]}:pr));showToast("✅ Stock updated!","success");}else{await queueOfflineOperation("adjustStock",{productId,delta,reason,by:"Owner"});setProducts(p=>p.map(pr=>pr.id===productId?{...pr,stock:newStock}:pr));showToast("⚠️ Saved offline","warning");}}catch(e){showToast("Error: "+e.message,"error");}
  };
  const handleDelete=async id=>{
    try{const r=await deleteProduct(id);if(r.success||r.queued){setProducts(p=>p.filter(pr=>pr.id!==id));showToast("✅ Deleted!","success");}}catch(e){showToast("Error: "+e.message,"error");}
    setDeleteConfirm(null);
  };
  const stockValue=safeP.reduce((s,p)=>s+((p.stock||0)*(p.buy||p.cost||0)),0);
  const lowCount=safeP.filter(p=>(p.stock||0)<=(p.minStock||p.lowStock||0)).length;
  return (
    <div className="space-y-4 pb-8">
      <KPIGrid items={[{icon:"📦",label:"Total SKUs",value:safeP.length,change:`${lowCount} low`},{icon:"⚠️",label:"Low Stock",value:lowCount,change:"Check now"},{icon:"💼",label:"Stock Value",value:rs(stockValue)},{icon:"📊",label:"Avg Margin",value:safeP.length>0?`${Math.round(safeP.reduce((s,p)=>s+(((p.sell||p.price||0)-(p.buy||p.cost||0))/(p.sell||p.price||1))*100,0)/safeP.length)}%`:"0%"}]}/>
      <div className="flex gap-3">
        <div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:border-emerald-500 focus:outline-none"/></div>
        <Btn variant="primary" onClick={()=>{setForm({name:"",nameUr:"",sku:"",cat:"Grocery",buy:"",sell:"",stock:"",minStock:"5",unit:"pcs",expiry:"",supplier:"",barcode:""});setEditProduct(null);setShowAdd(true);}}>+ Add</Btn>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">{CATEGORIES.map(cat=><button key={cat} onClick={()=>setActiveCat(cat)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeCat===cat?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{cat}</button>)}</div>
      <div className="space-y-3">
        {filtered.map(p=>{
          const sell=p.sell||p.price||0,buy=p.buy||p.cost||0,minStock=p.minStock||p.lowStock||0,isLow=(p.stock||0)<=minStock,stockPct=Math.min(100,((p.stock||0)/((minStock||5)*3))*100);
          return (
            <Card key={p.id} className={`p-4 ${isLow?"border-amber-300 dark:border-amber-700":""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap"><span className="font-bold text-slate-900 dark:text-white">{p.name}</span>{p.nameUr&&<span className="text-xs text-slate-500">{p.nameUr}</span>}{isLow&&<Badge color="amber">Low</Badge>}{p.stock===0&&<Badge color="red">Out</Badge>}</div>
                  <div className="text-xs text-slate-500">{p.sku} · {p.cat||p.category} · {p.supplier}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={()=>setShowStockHistory(p)} className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-xs font-bold hover:bg-slate-200">📜</button>
                  <button onClick={()=>openEdit(p)} className="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-200">✏️ Edit</button>
                  <button onClick={()=>setDeleteConfirm(p.id)} className="px-2 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-200">🗑️</button>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[{l:"Buy",v:rs(buy),c:""},{l:"Sell",v:rs(sell),c:"text-emerald-600 font-bold"},{l:"Stock",v:`${p.stock} ${p.unit||"pcs"}`,c:isLow?"text-amber-500 font-bold":""},{l:"Margin",v:`${sell?Math.round(((sell-buy)/sell)*100):0}%`,c:"text-violet-600"}].map(({l,v,c})=>(
                  <div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className={`font-bold mt-0.5 text-xs ${c}`}>{v}</div></div>
                ))}
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-[10px] text-slate-500 mb-1"><span>Stock level</span><span>{p.stock||0}/{Math.max((minStock||5)*3,1)} {p.unit||"pcs"}</span></div>
                <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden"><div className={`h-full rounded-full transition-all ${isLow?"bg-amber-500":p.stock===0?"bg-red-500":"bg-emerald-500"}`} style={{width:`${stockPct}%`}}/></div>
              </div>
              <div className="flex gap-2">
                <Btn variant="secondary" size="sm" onClick={()=>adjustStock(p.id,-1,"Manual -1")}>−1</Btn>
                <Btn variant="primary" size="sm" onClick={()=>adjustStock(p.id,1,"Manual +1")}>+1</Btn>
                <Btn variant="secondary" size="sm" onClick={()=>{const qty=prompt("Add stock quantity:");if(qty&&+qty>0)adjustStock(p.id,+qty,"Stock added");}}>+ Add</Btn>
                <Btn variant="secondary" size="sm" onClick={()=>{const qty=prompt("Reduce stock by:");if(qty&&+qty>0)adjustStock(p.id,-qty,"Stock reduced");}}>− Reduce</Btn>
              </div>
            </Card>
          );
        })}
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title={editProduct?"✏️ Edit Product":"➕ Add Product"} size="lg">
        <div className="grid grid-cols-2 gap-x-4">
          <div className="col-span-2"><Input label="Product Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g., Basmati Rice 5kg" required/></div>
          <div className="col-span-2"><Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})} placeholder="اردو نام"/></div>
          <Input label="SKU" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="GR001"/>
          <Input label="Barcode" value={form.barcode||""} onChange={e=>setForm({...form,barcode:e.target.value})} placeholder="123456789"/>
          <div className="col-span-2"><Select label="Category" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} options={CATEGORIES.slice(1).map(c=>({value:c,label:c}))}/></div>
          <Input label="Cost Price *" type="number" value={form.buy} onChange={e=>setForm({...form,buy:e.target.value})} placeholder="0"/>
          <Input label="Sell Price *" type="number" value={form.sell} onChange={e=>setForm({...form,sell:e.target.value})} placeholder="0"/>
          <Input label="Stock Qty" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})} placeholder="0"/>
          <Input label="Min Stock" type="number" value={form.minStock} onChange={e=>setForm({...form,minStock:e.target.value})} placeholder="5"/>
          <Select label="Unit" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} options={["pcs","kg","l","bag","box","pkt","btl","tin","strip"].map(u=>({value:u,label:u}))}/>
          <Input label="Expiry" type="month" value={form.expiry||""} onChange={e=>setForm({...form,expiry:e.target.value})}/>
          <div className="col-span-2"><Input label="Supplier" value={form.supplier||""} onChange={e=>setForm({...form,supplier:e.target.value})} placeholder="Supplier name"/></div>
        </div>
        {form.buy&&form.sell&&<div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-sm"><span className="text-slate-600 dark:text-slate-400">Profit per unit: </span><span className="font-black text-emerald-600">{rs(+form.sell-+form.buy)} ({Math.round((+form.sell-+form.buy)/+form.sell*100)}%)</span></div>}
        <div className="flex gap-2"><Btn variant="secondary" onClick={()=>setShowAdd(false)} full>Cancel</Btn><Btn variant="primary" onClick={saveProduct} full disabled={isProcessing}>{isProcessing?"Saving...":"💾 Save Product"}</Btn></div>
      </Modal>
      <Modal open={!!showStockHistory} onClose={()=>setShowStockHistory(null)} title={`📜 ${showStockHistory?.name} History`} size="md">
        {showStockHistory&&<div className="space-y-2 max-h-80 overflow-y-auto">
          {(!showStockHistory.stockHistory||showStockHistory.stockHistory.length===0)?<EmptyState icon="📊" title="No history" desc="Stock changes will appear here"/>:
            [...showStockHistory.stockHistory].reverse().map((h,i)=>(
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-sm">
                <div><div className="font-semibold">{h.reason}</div><div className="text-xs text-slate-500">{fmtDT(h.date)} · by {h.by}</div></div>
                <Badge color={h.change>0?"green":"red"}>{h.change>0?"+":""}{h.change}</Badge>
              </div>
            ))}
        </div>}
      </Modal>
      <ConfirmDialog open={!!deleteConfirm} title="Delete Product?" message="This will permanently remove the product." danger onConfirm={()=>handleDelete(deleteConfirm)} onCancel={()=>setDeleteConfirm(null)} confirmText="Delete"/>
    </div>
  );
};

/* ══ ORDERS HISTORY — with Edit Status + Delete ══ */
const OrdersHistory = ({ orders, products, setOrders, setProducts, setCustomers, customers, showToast, lang }) => {
  const [search,setSearch]=useState("");
  const [filterStatus,setFilterStatus]=useState("all");
  const [expandedId,setExpandedId]=useState(null);
  const [showReturnModal,setShowReturnModal]=useState(null);
  const [returnQty,setReturnQty]=useState({});
  const [returnReason,setReturnReason]=useState("");
  const [dateFrom,setDateFrom]=useState("");
  const [dateTo,setDateTo]=useState("");
  const [showConfirm,setShowConfirm]=useState(false);
  const [viewReceipt,setViewReceipt]=useState(null);
  /* edit order state */
  const [editOrder,setEditOrder]=useState(null);
  const [editForm,setEditForm]=useState({status:"paid",notes:"",creditDueDate:""});
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const L=lang==="ur";
  const safeO=Array.isArray(orders)?orders:[];

  const filtered=safeO.filter(o=>{
    const ms=o.id?.toLowerCase().includes(search.toLowerCase())||o.customerName?.toLowerCase().includes(search.toLowerCase());
    const mst=filterStatus==="all"||o.status===filterStatus||(filterStatus==="returned"&&o.returnHistory?.length>0);
    const mdf=!dateFrom||o.createdAt>=dateFrom;
    const mdt=!dateTo||o.createdAt<=dateTo+"T23:59";
    return ms&&mst&&mdf&&mdt;
  });

  const openEdit=o=>{setEditOrder(o);setEditForm({status:o.status||"paid",notes:o.notes||"",creditDueDate:o.creditDueDate||""});};
  const saveEditOrder=async()=>{
    if(!editOrder)return;
    const updated={...editOrder,...editForm};
    try{
      const r=await updateOrderStatus(editOrder.id,editForm.status,{notes:editForm.notes,creditDueDate:editForm.creditDueDate});
      if(r.success||!r.error){setOrders(p=>p.map(o=>o.id===editOrder.id?updated:o));showToast("✅ Order updated!","success");}
      else{await queueOfflineOperation("updateOrder",{id:editOrder.id,data:editForm});setOrders(p=>p.map(o=>o.id===editOrder.id?updated:o));showToast("⚠️ Saved offline","warning");}
    }catch(e){showToast("Error: "+e.message,"error");}
    setEditOrder(null);
  };
  const handleDeleteOrder=async id=>{
    try{
      const r=await deleteOrder(id);
      if(r.success||r.queued){setOrders(p=>p.filter(o=>o.id!==id));showToast("✅ Order deleted!","success");}
      else{setOrders(p=>p.filter(o=>o.id!==id));showToast("⚠️ Deleted locally","warning");}
    }catch(e){setOrders(p=>p.filter(o=>o.id!==id));showToast("Deleted locally","info");}
    setDeleteConfirm(null);
  };

  const initReturn=order=>{const init={};order.items.forEach(item=>{init[`${order.id}-${item.pid||item.productId}`]=item.qty;});setReturnQty(init);setReturnReason("");setShowReturnModal(order.id);};
  const doReturn=async()=>{
    const order=safeO.find(o=>o.id===showReturnModal);if(!order)return;
    const returnedItems=order.items.map(item=>({...item,returnedQty:returnQty[`${order.id}-${item.pid||item.productId}`]||0})).filter(i=>i.returnedQty>0);
    const refundAmt=returnedItems.reduce((s,i)=>s+i.returnedQty*(i.sell||i.price||0),0);
    const allReturned=returnedItems.every(ri=>{const orig=order.items.find(i=>(i.pid||i.productId)===(ri.pid||ri.productId));return ri.returnedQty>=orig.qty;})&&returnedItems.length===order.items.length;
    const returnRecord={date:today(),items:returnedItems,reason:returnReason,refundAmount:refundAmt,by:"Owner"};
    try{
      const r=await updateOrderStatus(order.id,allReturned?"returned":order.status,{returnRecord});
      if(r.success){setOrders(p=>p.map(o=>o.id===showReturnModal?{...o,status:allReturned?"returned":o.status,returnHistory:[...(o.returnHistory||[]),returnRecord]}:o));setProducts(p=>p.map(pr=>{const ri=returnedItems.find(i=>(i.pid||i.productId)===pr.id);return ri?{...pr,stock:(pr.stock||0)+ri.returnedQty}:pr;}));showToast(`✅ Return recorded! ${rs(refundAmt)} refunded`,"success");}
      else{await queueOfflineOperation("processReturn",{orderId:showReturnModal,returnedItems,reason:returnReason,refundAmount:refundAmt});showToast("⚠️ Return saved offline","warning");}
    }catch(e){showToast("Error: "+e.message,"error");}
    setShowReturnModal(null);setShowConfirm(false);setReturnQty({});setReturnReason("");
  };
  const statusBadge=o=>{if(o.returnHistory?.length>0&&o.status!=="returned")return<Badge color="orange">Partial Return</Badge>;const c={paid:"green",credit:"red",returned:"amber"};return<Badge color={c[o.status]||"gray"}>{o.status}</Badge>;};

  return (
    <div className="space-y-4 pb-8">
      {viewReceipt&&<ReceiptSlip order={viewReceipt} onClose={()=>setViewReceipt(null)}/>}
      <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"آرڈر تلاش کریں...":"Search orders..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none"/></div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {[["all","All"],["paid","✅ Paid"],["credit","📒 Credit"],["returned","🔄 Returned"]].map(([v,l])=>(
          <button key={v} onClick={()=>setFilterStatus(v)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus===v?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="date" value={dateFrom} onChange={e=>setDateFrom(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"/>
        <span className="text-slate-400 self-center">→</span>
        <input type="date" value={dateTo} onChange={e=>setDateTo(e.target.value)} className="flex-1 px-3 py-2 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-xs"/>
      </div>
      <div className="text-xs text-slate-500">{filtered.length} orders · Total: {rs(filtered.reduce((s,o)=>s+(o.total||0),0))} · Profit: {rs(filtered.reduce((s,o)=>s+(o.profit||0),0))}</div>
      <div className="space-y-3">
        {filtered.length===0?<EmptyState icon="🧾" title="No orders found" desc="Try adjusting your filters"/>:filtered.map(o=>(
          <Card key={o.id} className="p-4">
            <div className="flex items-start justify-between mb-2 cursor-pointer" onClick={()=>setExpandedId(expandedId===o.id?null:o.id)}>
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">{o.id}</span>
                  {statusBadge(o)}<Badge color="gray">{o.method||o.paymentMethod}</Badge>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">{o.customerName}</div>
                <div className="text-xs text-slate-500">{o.cashier} · {fmtDT(o.createdAt)}</div>
              </div>
              <div className="text-right">
                <div className="font-black text-slate-900 dark:text-white">{rs(o.total)}</div>
                <div className="text-xs text-emerald-500">+{rs(o.profit)}</div>
                <span className="text-slate-400 text-xs" style={{transform:expandedId===o.id?"rotate(180deg)":"",display:"inline-block"}}>▾</span>
              </div>
            </div>
            {expandedId===o.id&&(
              <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3">
                <div className="text-xs font-bold text-slate-500 uppercase">Items</div>
                {o.items?.map((item,i)=>(
                  <div key={i} className="flex items-center justify-between text-sm py-1">
                    <div><span className="font-semibold">{item.name}</span><span className="text-slate-400"> ×{item.qty}</span></div>
                    <div className="text-right"><div className="font-bold">{rs(item.qty*(item.sell||item.price||0))}</div><div className="text-xs text-emerald-500">+{rs(item.qty*((item.sell||item.price||0)-(item.buy||item.cost||0)))}</div></div>
                  </div>
                ))}
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{rs(o.subtotal)}</span></div>
                  {(o.disc||o.discountAmount||0)>0&&<div className="flex justify-between"><span className="text-slate-500">Discount</span><span className="text-red-500">-{rs(o.disc??o.discountAmount)}</span></div>}
                  <div className="flex justify-between font-bold border-t border-slate-200 dark:border-slate-600 pt-1 mt-1"><span>Total</span><span>{rs(o.total)}</span></div>
                </div>
                {o.notes&&<div className="text-xs text-slate-500 italic">📝 {o.notes}</div>}
                {/* ── Action buttons ── */}
                <div className="grid grid-cols-2 gap-2">
                  <Btn variant="secondary" size="sm" onClick={()=>setViewReceipt(o)} full>🧾 Receipt</Btn>
                  <Btn variant="primary" size="sm" onClick={()=>openEdit(o)} full>✏️ Edit</Btn>
                  {o.status!=="returned"&&<Btn variant="amber" size="sm" onClick={()=>initReturn(o)} full>🔄 Return</Btn>}
                  <Btn variant="danger" size="sm" onClick={()=>setDeleteConfirm(o.id)} full>🗑️ Delete</Btn>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Edit Order Modal */}
      <Modal open={!!editOrder} onClose={()=>setEditOrder(null)} title="✏️ Edit Order" size="sm">
        {editOrder&&(
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-sm">
              <div className="font-bold text-emerald-600">{editOrder.id}</div>
              <div className="text-slate-500">{editOrder.customerName} · {rs(editOrder.total)}</div>
            </div>
            <Select label="Status" value={editForm.status} onChange={e=>setEditForm({...editForm,status:e.target.value})} options={[{value:"paid",label:"✅ Paid"},{value:"credit",label:"📒 Credit"},{value:"returned",label:"🔄 Returned"}]}/>
            {editForm.status==="credit"&&<Input label="Credit Due Date" type="date" value={editForm.creditDueDate} onChange={e=>setEditForm({...editForm,creditDueDate:e.target.value})}/>}
            <Input label="Notes" value={editForm.notes} onChange={e=>setEditForm({...editForm,notes:e.target.value})} placeholder="Optional note..."/>
            <div className="flex gap-2"><Btn variant="secondary" onClick={()=>setEditOrder(null)} full>Cancel</Btn><Btn variant="primary" onClick={saveEditOrder} full>💾 Save Changes</Btn></div>
          </div>
        )}
      </Modal>

      {/* Return Modal */}
      <Modal open={!!showReturnModal} onClose={()=>setShowReturnModal(null)} title="🔄 Return Order Items" size="md">
        {showReturnModal&&(
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm text-red-700 dark:text-red-300">⚠️ Returned items will be added back to inventory.</div>
            {safeO.find(o=>o.id===showReturnModal)?.items.map(item=>{
              const pid=item.pid||item.productId;
              const alreadyReturned=safeO.find(o=>o.id===showReturnModal)?.returnHistory?.reduce((s,r)=>{const ri=r.items.find(i=>(i.pid||i.productId)===pid);return s+(ri?.returnedQty||0);},[0])||0;
              const maxReturn=item.qty-alreadyReturned;
              return(
                <div key={pid} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700 space-y-2">
                  <div className="flex items-center justify-between"><span className="font-semibold text-sm">{item.name}</span><div className="text-right text-xs text-slate-500"><div>Ordered: {item.qty}</div>{alreadyReturned>0&&<div className="text-orange-500">Returned: {alreadyReturned}</div>}</div></div>
                  {maxReturn<=0?<div className="text-xs text-slate-400">Fully returned</div>:(
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">Return qty:</span>
                      <input type="number" min="0" max={maxReturn} value={returnQty[`${showReturnModal}-${pid}`]??item.qty} onChange={e=>setReturnQty(q=>({...q,[`${showReturnModal}-${pid}`]:Math.min(maxReturn,Math.max(0,+e.target.value))}))} className="w-20 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-600 text-sm"/>
                      <span className="text-xs text-emerald-600">= {rs((returnQty[`${showReturnModal}-${pid}`]??item.qty)*(item.sell||item.price||0))}</span>
                    </div>
                  )}
                </div>
              );
            })}
            <Input label="Return Reason *" value={returnReason} onChange={e=>setReturnReason(e.target.value)} placeholder="e.g., Damaged, Wrong item" required/>
            <div className="flex gap-2"><Btn variant="secondary" onClick={()=>setShowReturnModal(null)} full>Cancel</Btn><Btn variant="danger" onClick={()=>{if(!returnReason){showToast("Return reason required","error");return;}setShowConfirm(true);}} full>✅ Confirm Return</Btn></div>
          </div>
        )}
      </Modal>
      <ConfirmDialog open={showConfirm} title="Confirm Return?" message={`Stock will be restored. Reason: ${returnReason}`} onConfirm={doReturn} onCancel={()=>setShowConfirm(false)} danger confirmText="Process Return"/>
      <ConfirmDialog open={!!deleteConfirm} title="Delete Order?" message="This will permanently remove the order record." danger onConfirm={()=>handleDeleteOrder(deleteConfirm)} onCancel={()=>setDeleteConfirm(null)} confirmText="Delete Order"/>
    </div>
  );
};

/* ══ CUSTOMERS ══ */
const Customers = ({ customers, setCustomers, orders, showToast, lang, externalSelected, externalCreditModal, clearExternal }) => {
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState(externalSelected||null);
  const [showAdd,setShowAdd]=useState(false);
  const [showEdit,setShowEdit]=useState(false);
  const [showCreditModal,setShowCreditModal]=useState(externalCreditModal||null);
  const [creditPayment,setCreditPayment]=useState("");
  const [newDueDate,setNewDueDate]=useState("");
  const [showConfirm,setShowConfirm]=useState(false);
  const [showEditConfirm,setShowEditConfirm]=useState(false);
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [isProcessing,setIsProcessing]=useState(false);
  const [form,setForm]=useState({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""});
  const [activeTab,setActiveTab]=useState("overview");
  const L=lang==="ur";
  const safeC=Array.isArray(customers)?customers:[];
  const safeO=Array.isArray(orders)?orders:[];

  useEffect(()=>{if(externalSelected)setSelected(externalSelected);},[externalSelected]);
  useEffect(()=>{if(externalCreditModal)setShowCreditModal(externalCreditModal);},[externalCreditModal]);

  const filtered=safeC.filter(c=>c.name?.toLowerCase().includes(search.toLowerCase())||(c.phone&&c.phone.includes(search)));

  const handleCreditPayment=async customerId=>{
    if(isProcessing)return;setIsProcessing(true);
    const payment=+creditPayment;
    const customer=safeC.find(c=>c.id===customerId);
    if(payment<=0||payment>customer.udhaar){showToast("Invalid amount","error");setIsProcessing(false);return;}
    const newUdhaar=Math.max(0,(customer.udhaar||0)-payment);
    try{
      const r=await addCustomerCreditPayment(customerId,payment,newDueDate||customer.creditDueDate,"");
      if(r.success){setCustomers(p=>p.map(c=>c.id===customerId?{...c,udhaar:newUdhaar,creditDueDate:newDueDate||c.creditDueDate,creditHistory:[...(c.creditHistory||[]),{date:today(),amount:payment,type:"payment",cashier:"Owner",remaining:newUdhaar,orderId:""}]}:c));showToast(`✅ ${rs(payment)} received!`,"success");}
      else{await queueOfflineOperation("addCustomerCreditPayment",{customerId,amount:payment,dueDate:newDueDate,orderId:""});setCustomers(p=>p.map(c=>c.id===customerId?{...c,udhaar:newUdhaar}:c));showToast("⚠️ Saved offline","warning");}
    }catch(e){showToast("Error: "+e.message,"error");}
    setShowCreditModal(null);setCreditPayment("");setNewDueDate("");setShowConfirm(false);setSelected(safeC.find(c=>c.id===customerId));if(clearExternal)clearExternal();setIsProcessing(false);
  };

  const saveCustomer=async()=>{
    if(!form.name||!form.phone){showToast("Name & phone required","error");return;}
    if(isProcessing)return;setIsProcessing(true);
    const nc={...form,id:Date.now(),udhaar:0,totalOrders:0,totalSpent:0,points:0,joined:new Date().toISOString().split("T")[0],creditDueDate:null,creditHistory:[],activityLog:[],editHistory:[]};
    try{const r=await addCustomer(nc);if(r.success){setCustomers(p=>[...p,nc]);showToast(`✅ ${form.name} added!`,"success");}else{await queueOfflineOperation("addCustomer",{customer:nc});setCustomers(p=>[...p,nc]);showToast("⚠️ Saved offline","warning");}}catch(e){showToast("Error: "+e.message,"error");}
    setShowAdd(false);setForm({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""});setIsProcessing(false);
  };

  const doUpdateCustomer=async()=>{
    const old=safeC.find(c=>c.id===selected.id);
    const changes=[];
    if(old.name!==form.name)changes.push(`Name: ${old.name} → ${form.name}`);
    if(old.phone!==form.phone)changes.push(`Phone: ${old.phone} → ${form.phone}`);
    const updatedCustomer={...selected,...form,editHistory:[...(selected.editHistory||[]),{date:today(),changes,by:"Owner"}]};
    try{
      const r=await updateCustomer(selected.id,updatedCustomer);
      if(r.success){setCustomers(p=>p.map(c=>c.id===selected.id?updatedCustomer:c));showToast("✅ Customer updated!","success");}
      else{await queueOfflineOperation("updateCustomer",{id:selected.id,customer:updatedCustomer});setCustomers(p=>p.map(c=>c.id===selected.id?updatedCustomer:c));showToast("⚠️ Saved offline","warning");}
    }catch(e){showToast("Error: "+e.message,"error");}
    setShowEdit(false);setShowEditConfirm(false);setSelected(updatedCustomer);
  };

  const handleDeleteCustomer=async id=>{
    try{const r=await deleteCustomer(id);if(r.success||r.queued){setCustomers(p=>p.filter(c=>c.id!==id));showToast("✅ Customer deleted!","success");}else{setCustomers(p=>p.filter(c=>c.id!==id));showToast("⚠️ Deleted locally","warning");}}catch{setCustomers(p=>p.filter(c=>c.id!==id));showToast("Deleted locally","info");}
    setDeleteConfirm(null);setSelected(null);
  };

  const totalUdhaar=safeC.reduce((s,c)=>s+(c.udhaar||0),0);

  if(selected){
    const cust=safeC.find(c=>c.id===selected.id)||selected;
    const customerOrders=safeO.filter(o=>o.customerId===cust.id);
    const profitFromCust=customerOrders.reduce((s,o)=>s+(o.profit||0),0);
    const creditDays=cust.creditDueDate?daysDiff(cust.creditDueDate):null;
    const activities=[...(cust.activityLog||[]).map(a=>({...a,time:a.date})),...customerOrders.map(o=>({time:o.createdAt,type:"order",desc:`${o.id} — ${rs(o.total)}`,amount:o.total}))].sort((a,b)=>new Date(b.time)-new Date(a.time));
    return (
      <div className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <button onClick={()=>setSelected(null)} className="flex items-center gap-2 text-emerald-500 font-bold text-sm">← {L?"واپس":"Back"}</button>
          <button onClick={()=>setDeleteConfirm(cust.id)} className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold hover:bg-red-200">🗑️ Delete Customer</button>
        </div>
        <Card className="p-5 bg-gradient-to-br from-violet-50 dark:from-violet-900/20 to-purple-50 dark:to-purple-900/20">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-2xl flex-shrink-0">{cust.name?.[0]||"?"}</div>
            <div className="flex-1">
              <h2 className="font-black text-xl text-slate-900 dark:text-white">{cust.name}</h2>
              {cust.nameUr&&<div className="text-sm text-slate-500">{cust.nameUr}</div>}
              <div className="text-sm text-slate-600 dark:text-slate-400">📞 {cust.phone}</div>
              {cust.email&&<div className="text-xs text-slate-500">✉️ {cust.email}</div>}
              {cust.addr&&<div className="text-xs text-slate-500">📍 {cust.addr}</div>}
            </div>
            <button onClick={()=>{setForm({name:cust.name,nameUr:cust.nameUr||"",phone:cust.phone,email:cust.email||"",addr:cust.addr||"",notes:cust.notes||""});setShowEdit(true);}} className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold">✏️ Edit</button>
          </div>
          <KPIGrid items={[{icon:"🧾",label:"Orders",value:cust.totalOrders||0},{icon:"💰",label:"Spent",value:rs(cust.totalSpent||0)},{icon:"📈",label:"Profit",value:rs(profitFromCust)},{icon:"🔄",label:"Returns",value:customerOrders.filter(o=>o.returnHistory?.length>0).length}]}/>
          {(cust.udhaar||0)>0?(
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center justify-between mb-2">
                <div><div className="text-xs text-red-600 dark:text-red-400 font-semibold">OUTSTANDING CREDIT</div><div className="text-2xl font-black text-red-600 dark:text-red-400">{rs(cust.udhaar)}</div></div>
                {cust.creditDueDate&&<div className="text-right"><div className={`text-xs font-bold ${creditDays!=null&&creditDays<0?"text-red-600":"text-amber-600"}`}>{creditDays!=null&&creditDays<0?`${Math.abs(creditDays)}d OVERDUE`:`Due in ${creditDays}d`}</div><div className="text-xs text-slate-500">{fmtDate(cust.creditDueDate)}</div></div>}
              </div>
              <Btn variant="danger" size="sm" onClick={()=>setShowCreditModal(cust.id)} full>💸 Receive Payment</Btn>
            </div>
          ):<div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-700 flex items-center justify-between"><span className="text-emerald-700 dark:text-emerald-300 font-semibold text-sm">✅ No Outstanding Credit</span><Badge color="green">Paid Up</Badge></div>}
        </Card>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[["overview","📊 Overview"],["orders","🧾 Orders"],["credit","💸 Credit"],["timeline","📅 Timeline"]].map(([k,l])=>(
            <button key={k} onClick={()=>setActiveTab(k)} className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab===k?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>
          ))}
        </div>
        {activeTab==="orders"&&<div className="space-y-2">{customerOrders.length===0?<EmptyState icon="🧾" title="No orders" desc="No purchase history"/>:customerOrders.map(o=><Card key={o.id} className="p-3"><div className="flex items-center justify-between mb-1"><div><span className="font-bold text-emerald-600 text-sm">{o.id}</span><span className="text-xs text-slate-500 ml-2">{fmtDate(o.createdAt)}</span></div><div className="text-right"><div className="font-black text-sm">{rs(o.total)}</div><Badge color={o.status==="paid"?"green":o.status==="credit"?"red":"amber"}>{o.status}</Badge></div></div>{o.items?.map((i,j)=><div key={j} className="text-xs text-slate-500">{i.name} ×{i.qty}</div>)}</Card>)}</div>}
        {activeTab==="credit"&&<div className="space-y-2">{(!cust.creditHistory||cust.creditHistory.length===0)?<EmptyState icon="💸" title="No credit history" desc="Credit transactions will appear here"/>:[...cust.creditHistory].reverse().map((h,i)=><Card key={i} className="p-3"><div className="flex items-center justify-between"><div><div className="font-semibold text-sm">{h.type==="payment"?"💸 Payment":"📒 Credit"}</div><div className="text-xs text-slate-500">{fmtDT(h.date)}{h.orderId?` · ${h.orderId}`:""}</div>{h.remaining!=null&&<div className="text-xs text-slate-400">Remaining: {rs(h.remaining)}</div>}</div><Badge color={h.type==="payment"?"green":"red"}>{h.type==="payment"?"+":"-"}{rs(h.amount)}</Badge></div></Card>)}</div>}
        {activeTab==="timeline"&&<div className="space-y-0">{activities.length===0?<EmptyState icon="📅" title="No activity" desc="Customer activity will appear here"/>:activities.slice(0,20).map((a,i)=>{const icons={order:"🧾",credit:"📒",payment:"💸",return:"🔄",edit:"✏️"};const colors={order:"green",credit:"red",payment:"green",return:"amber",edit:"blue"};return<TimelineItem key={i} icon={icons[a.type]||"📌"} title={a.desc||a.evt||"Activity"} sub={a.type} time={fmtDT(a.time||a.date)} color={colors[a.type]||"blue"}/>;})}</div>}
        {activeTab==="overview"&&<KPIGrid items={[{icon:"📅",label:"Last Purchase",value:customerOrders.length>0?fmtDate(customerOrders.reduce((a,b)=>a.createdAt>b.createdAt?a:b).createdAt):"Never"},{icon:"💰",label:"Avg Order",value:rs(cust.totalOrders>0?(cust.totalSpent||0)/cust.totalOrders:0)},{icon:"🏆",label:"Loyalty Pts",value:cust.points||0},{icon:"💸",label:"Credit Taken",value:cust.creditHistory?.filter(h=>h.type==="credit").length||0}]}/>}
        <Modal open={showCreditModal!==null} onClose={()=>setShowCreditModal(null)} title="💸 Receive Credit Payment" size="sm">
          {showCreditModal&&<div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-700"><div className="text-xs text-red-600 dark:text-red-400 mb-1">Total Outstanding</div><div className="text-3xl font-black text-red-600 dark:text-red-400">{rs(cust.udhaar)}</div></div>
            <Input label="Amount Receiving *" type="number" value={creditPayment} onChange={e=>setCreditPayment(e.target.value)} placeholder="Enter amount" required min="1" max={String(cust.udhaar)} helpText={`Max: ${rs(cust.udhaar)}`}/>
            {creditPayment&&+creditPayment>0&&<div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-200 dark:border-emerald-700"><div className="flex justify-between text-sm"><span className="text-slate-600">Remaining:</span><span className="font-black text-emerald-600">{rs(Math.max(0,(cust.udhaar||0)-(+creditPayment)))}</span></div>{+creditPayment>=(cust.udhaar||0)&&<div className="mt-1 text-xs text-emerald-600 font-bold">✅ Full payment — account will be cleared</div>}</div>}
            <Input label="New Due Date (optional)" type="date" value={newDueDate} onChange={e=>setNewDueDate(e.target.value)}/>
            <div className="flex gap-2"><Btn variant="secondary" onClick={()=>setShowCreditModal(null)} full>Cancel</Btn><Btn variant="primary" onClick={()=>{if(!creditPayment||+creditPayment<=0){showToast("Enter valid amount","error");return;}setShowConfirm(true);}} full disabled={!creditPayment||+creditPayment<=0||isProcessing}>✅ Record Payment</Btn></div>
          </div>}
        </Modal>
        <ConfirmDialog open={showConfirm} title="Confirm Payment?" message={`Record ${rs(+creditPayment||0)} from ${cust.name}?`} onConfirm={()=>handleCreditPayment(showCreditModal)} onCancel={()=>setShowConfirm(false)} confirmText="Confirm"/>
        <Modal open={showEdit} onClose={()=>setShowEdit(false)} title="✏️ Edit Customer">
          <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
          <Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})}/>
          <Input label="Phone *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" required/>
          <Input label="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} type="email"/>
          <Input label="Address" value={form.addr||""} onChange={e=>setForm({...form,addr:e.target.value})}/>
          <Input label="Notes" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/>
          <div className="flex gap-2"><Btn variant="secondary" onClick={()=>setShowEdit(false)} full>Cancel</Btn><Btn variant="primary" onClick={()=>setShowEditConfirm(true)} full>💾 Save</Btn></div>
        </Modal>
        <ConfirmDialog open={showEditConfirm} title="Save Changes?" message="Customer details will be updated." onConfirm={doUpdateCustomer} onCancel={()=>setShowEditConfirm(false)} confirmText="Save"/>
        <ConfirmDialog open={!!deleteConfirm} title="Delete Customer?" message={`Remove ${cust.name} permanently? This cannot be undone.`} danger onConfirm={()=>handleDeleteCustomer(deleteConfirm)} onCancel={()=>setDeleteConfirm(null)} confirmText="Delete"/>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      <KPIGrid items={[{icon:"👥",label:"Customers",value:safeC.length},{icon:"🤝",label:"Total Credit",value:rs(totalUdhaar)},{icon:"💰",label:"Avg Spent",value:rs(safeC.length>0?safeC.reduce((s,c)=>s+(c.totalSpent||0),0)/safeC.length:0)},{icon:"⚠️",label:"Credit Due",value:safeC.filter(c=>(c.udhaar||0)>0&&c.creditDueDate&&daysDiff(c.creditDueDate)<=3).length}]}/>
      <div className="flex gap-3">
        <div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none"/></div>
        <Btn variant="primary" onClick={()=>{setForm({name:"",nameUr:"",phone:"",email:"",addr:"",notes:""});setShowAdd(true);}}>+ Add</Btn>
      </div>
      <div className="space-y-3">
        {filtered.map(c=>{
          const ddays=c.creditDueDate?daysDiff(c.creditDueDate):null;
          return(
            <Card key={c.id} className="p-4">
              <div className="flex items-center gap-3" onClick={()=>setSelected(c)}>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-lg flex-shrink-0">{c.name?.[0]||"?"}</div>
                <div className="flex-1 cursor-pointer">
                  <div className="font-bold text-slate-900 dark:text-white">{c.name}</div>
                  <div className="text-xs text-slate-500">{c.phone} · {c.totalOrders||0} orders</div>
                  {(c.udhaar||0)>0&&c.creditDueDate&&<div className={`text-xs font-semibold ${ddays!=null&&ddays<0?"text-red-500":"text-amber-500"}`}>{ddays!=null&&ddays<0?`${Math.abs(ddays)}d overdue`:`Due in ${ddays}d`}</div>}
                </div>
                <div className="text-right flex items-center gap-2">
                  {(c.udhaar||0)>0?<Badge color={ddays!=null&&ddays<0?"red":"amber"}>{rs(c.udhaar)}</Badge>:<Badge color="green">✅ Clear</Badge>}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
      <Modal open={showAdd} onClose={()=>setShowAdd(false)} title="➕ Add Customer">
        <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
        <Input label="Urdu Name" value={form.nameUr||""} onChange={e=>setForm({...form,nameUr:e.target.value})} placeholder="اردو نام"/>
        <Input label="Phone *" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel" required/>
        <Input label="Email" value={form.email||""} onChange={e=>setForm({...form,email:e.target.value})} type="email"/>
        <Input label="Address" value={form.addr||""} onChange={e=>setForm({...form,addr:e.target.value})}/>
        <Input label="Notes" value={form.notes||""} onChange={e=>setForm({...form,notes:e.target.value})}/>
        <Btn variant="primary" onClick={saveCustomer} full disabled={isProcessing}>{isProcessing?"Saving...":"✅ Save Customer"}</Btn>
      </Modal>
    </div>
  );
};

/* ══ MERCHANDISE ══ */
const Merchandise = ({ products, orders, lang }) => {
  const [search,setSearch]=useState("");
  const [activeCat,setActiveCat]=useState("All");
  const [sortBy,setSortBy]=useState("revenue");
  const [expandedId,setExpandedId]=useState(null);
  const L=lang==="ur";
  const safeP=Array.isArray(products)?products:[], safeO=Array.isArray(orders)?orders:[];
  const merchData=useMemo(()=>safeP.map(p=>{let totalSold=0,totalRevenue=0,totalCost=0,lastSold=null;safeO.forEach(o=>{if(o&&Array.isArray(o.items))o.items.forEach(i=>{if(i&&(i.pid||i.productId)===p.id){totalSold+=i.qty||0;totalRevenue+=(i.qty||0)*(i.sell||i.price||0);totalCost+=(i.qty||0)*(i.buy||i.cost||0);if(!lastSold||(o.createdAt&&o.createdAt>lastSold))lastSold=o.createdAt;}});});const sell=p.sell||p.price||0,buy=p.buy||p.cost||0,profitAmt=totalRevenue-totalCost,margin=totalRevenue>0?Math.round(profitAmt/totalRevenue*100):(sell&&buy?Math.round(((sell-buy)/sell)*100):0);return{...p,totalSold,totalRevenue,totalCost,profitAmt,margin,lastSold};}),[safeP,safeO]);
  const filtered=merchData.filter(m=>(activeCat==="All"||m.cat===activeCat||m.category===activeCat)&&(m.name?.toLowerCase().includes(search.toLowerCase())||(m.sku&&m.sku.toLowerCase().includes(search.toLowerCase()))));
  const sorted=[...filtered].sort((a,b)=>sortBy==="revenue"?(b.totalRevenue||0)-(a.totalRevenue||0):sortBy==="margin"?(b.margin||0)-(a.margin||0):sortBy==="sold"?(b.totalSold||0)-(a.totalSold||0):(a.name||"").localeCompare(b.name||""));
  const totalRevAll=merchData.reduce((s,m)=>s+(m.totalRevenue||0),0),totalProfAll=merchData.reduce((s,m)=>s+(m.profitAmt||0),0);
  return (
    <div className="space-y-4 pb-8">
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-5 text-white"><h2 className="text-lg font-black mb-1">📊 {L?"سامان":"Merchandise"}</h2><div className="grid grid-cols-3 gap-3 text-sm"><div><div className="text-violet-200 text-xs">Total Items</div><div className="font-black text-lg">{safeP.length}</div></div><div><div className="text-violet-200 text-xs">Revenue</div><div className="font-black text-lg">{rs(totalRevAll)}</div></div><div><div className="text-violet-200 text-xs">Profit</div><div className="font-black text-lg">{rs(totalProfAll)}</div></div></div></div>
      <KPIGrid items={[{icon:"📦",label:"Items Sold",value:merchData.reduce((s,m)=>s+(m.totalSold||0),0)},{icon:"💰",label:"Revenue",value:rs(totalRevAll)},{icon:"📈",label:"Profit",value:rs(totalProfAll)},{icon:"📊",label:"Avg Margin",value:`${Math.round(totalRevAll>0?totalProfAll/totalRevAll*100:0)}%`}]}/>
      <div className="flex gap-2"><div className="flex-1 relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder={L?"تلاش کریں...":"Search..."} className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:border-emerald-500 focus:outline-none"/></div><Select value={sortBy} onChange={e=>setSortBy(e.target.value)} options={[{value:"revenue",label:"Revenue"},{value:"margin",label:"Margin"},{value:"sold",label:"Sold"},{value:"name",label:"A-Z"}]}/></div>
      <div className="space-y-3">{sorted.map(m=><Card key={m.id} className="p-4" onClick={()=>setExpandedId(expandedId===m.id?null:m.id)}><div className="flex items-start justify-between mb-3"><div className="flex-1"><div className="font-bold text-slate-900 dark:text-white">{m.name}</div><div className="text-xs text-slate-500">{m.sku} · {m.cat||m.category}</div></div><Badge color={m.margin>=20?"green":m.margin>=10?"amber":"red"}>{m.margin}% margin</Badge></div><div className="grid grid-cols-4 gap-2">{[{l:"Cost",v:rs(m.buy||m.cost||0),c:""},{l:"Sell",v:rs(m.sell||m.price||0),c:"text-emerald-600 font-bold"},{l:"Sold",v:String(m.totalSold),c:""},{l:"Revenue",v:rs(m.totalRevenue),c:"text-violet-600 font-bold"}].map(({l,v,c})=><div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className={`font-bold mt-0.5 ${c}`}>{v}</div></div>)}</div>{expandedId===m.id&&<div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-2 text-sm"><div className="flex justify-between"><span className="text-slate-500">Profit/unit</span><span className="font-bold text-emerald-500">{rs((m.sell||m.price||0)-(m.buy||m.cost||0))}</span></div><div className="flex justify-between"><span className="text-slate-500">Total profit</span><span className="font-bold text-emerald-500">{rs(m.profitAmt)}</span></div><div className="flex justify-between"><span className="text-slate-500">Stock</span><span className="font-bold">{m.stock} {m.unit}</span></div>{m.lastSold&&<div className="flex justify-between text-xs"><span className="text-slate-400">Last sold</span><span>{fmtDate(m.lastSold)}</span></div>}</div>}</Card>)}</div>
    </div>
  );
};

/* ══ EXPENSES — with Edit + Delete ══ */
const Expenses = ({ expenses, setExpenses, showToast, lang }) => {
  const [showAdd,setShowAdd]=useState(false);
  const [editExpense,setEditExpense]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [isProcessing,setIsProcessing]=useState(false);
  const [form,setForm]=useState({cat:"Rent",desc:"",amt:"",date:new Date().toISOString().slice(0,10),by:"Owner"});
  const L=lang==="ur";
  const safeE=Array.isArray(expenses)?expenses:[];
  const totalExp=safeE.reduce((s,e)=>s+(e.amt||e.amount||0),0);

  const openEdit=e=>{setEditExpense(e.id);setForm({cat:e.cat||e.category||"Rent",desc:e.desc||e.description||"",amt:String(e.amt||e.amount||""),date:e.date||new Date().toISOString().slice(0,10),by:e.by||"Owner"});setShowAdd(true);};

  const save=async()=>{
    if(!form.desc||!form.amt){showToast("Fill all fields","error");return;}
    if(isProcessing)return;setIsProcessing(true);
    if(editExpense){
      const updated={...safeE.find(e=>e.id===editExpense),...form,amt:+form.amt,amount:+form.amt,category:form.cat,description:form.desc};
      try{const r=await updateExpense(editExpense,updated);if(r.success){setExpenses(p=>p.map(e=>e.id===editExpense?updated:e));showToast("✅ Expense updated!","success");}else{await queueOfflineOperation("updateExpense",{id:editExpense,expense:updated});setExpenses(p=>p.map(e=>e.id===editExpense?updated:e));showToast("⚠️ Saved offline","warning");}}catch(e){showToast("Error: "+e.message,"error");}
    }else{
      const ne={...form,id:Date.now(),amt:+form.amt,amount:+form.amt,category:form.cat,description:form.desc};
      try{const r=await addExpense(ne);if(r.success){setExpenses(p=>[...p,ne]);showToast("✅ Expense added!","success");}else{await queueOfflineOperation("addExpense",{expense:ne});setExpenses(p=>[...p,ne]);showToast("⚠️ Saved offline","warning");}}catch(e){showToast("Error: "+e.message,"error");}
    }
    setShowAdd(false);setEditExpense(null);setForm({cat:"Rent",desc:"",amt:"",date:new Date().toISOString().slice(0,10),by:"Owner"});setIsProcessing(false);
  };

  const handleDelete=async id=>{
    try{const r=await deleteExpense(id);if(r.success||r.queued){setExpenses(p=>p.filter(e=>e.id!==id));showToast("✅ Deleted!","success");}else{setExpenses(p=>p.filter(e=>e.id!==id));showToast("⚠️ Deleted locally","warning");}}catch{setExpenses(p=>p.filter(e=>e.id!==id));showToast("Deleted locally","info");}
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-4 pb-8">
      <Card className="p-5 bg-gradient-to-br from-red-50 dark:from-red-900/20 to-orange-50 dark:to-orange-900/20"><div className="text-3xl mb-2">💸</div><div className="text-3xl font-black text-red-600 dark:text-red-400">{rs(totalExp)}</div><div className="text-sm text-slate-500">Total Expenses · {safeE.length} records</div></Card>
      <Btn variant="danger" onClick={()=>{setEditExpense(null);setForm({cat:"Rent",desc:"",amt:"",date:new Date().toISOString().slice(0,10),by:"Owner"});setShowAdd(true);}} full>➕ {L?"خرچ شامل کریں":"Add Expense"}</Btn>
      <div className="space-y-3">
        {safeE.length===0&&<EmptyState icon="💸" title="No expenses yet" desc="Add your first expense record"/>}
        {[...safeE].reverse().map(e=>(
          <Card key={e.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-bold text-slate-900 dark:text-white text-sm">{e.desc||e.description}</div>
                <div className="text-xs text-slate-500 mt-0.5">{e.cat||e.category} · {e.date} · by {e.by}</div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="font-black text-red-500 text-sm">{rs(e.amt||e.amount||0)}</div>
                <button onClick={()=>openEdit(e)} className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 text-xs font-bold hover:bg-emerald-200">✏️</button>
                <button onClick={()=>setDeleteConfirm(e.id)} className="px-2 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold hover:bg-red-200">🗑️</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setEditExpense(null);}} title={editExpense?"✏️ Edit Expense":"➕ Add Expense"}>
        <Select label="Category" value={form.cat} onChange={e=>setForm({...form,cat:e.target.value})} options={["Rent","Electricity","Staff","Transport","Maintenance","Misc"].map(c=>({value:c,label:c}))}/>
        <Input label="Description *" value={form.desc} onChange={e=>setForm({...form,desc:e.target.value})} placeholder="e.g., Monthly rent" required/>
        <Input label="Amount *" type="number" value={form.amt} onChange={e=>setForm({...form,amt:e.target.value})} placeholder="0" required/>
        <Input label="Date" type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/>
        <Input label="Paid By" value={form.by} onChange={e=>setForm({...form,by:e.target.value})} placeholder="Owner"/>
        <div className="flex gap-2"><Btn variant="secondary" onClick={()=>{setShowAdd(false);setEditExpense(null);}} full>Cancel</Btn><Btn variant="danger" onClick={save} full disabled={isProcessing}>{isProcessing?"Saving...":editExpense?"💾 Update":"💾 Save"}</Btn></div>
      </Modal>
      <ConfirmDialog open={!!deleteConfirm} title="Delete Expense?" message="This expense record will be permanently removed." danger onConfirm={()=>handleDelete(deleteConfirm)} onCancel={()=>setDeleteConfirm(null)} confirmText="Delete"/>
    </div>
  );
};

/* ══ STAFF ══ */
const Staff = ({ staff, setStaff, showToast, lang }) => {
  const [showAdd,setShowAdd]=useState(false);
  const [editStaff,setEditStaff]=useState(null);
  const [deleteConfirm,setDeleteConfirm]=useState(null);
  const [isProcessing,setIsProcessing]=useState(false);
  const [form,setForm]=useState({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"});
  const L=lang==="ur";
  const safeS=Array.isArray(staff)?staff:[];
  const openEdit=s=>{setEditStaff(s.id);setForm({name:s.name,role:s.role||"Cashier",phone:s.phone||"",shift:s.shift||"9am-5pm",salary:String(s.salary||0),status:s.status||"active"});setShowAdd(true);};
  const save=async()=>{
    if(!form.name||!form.salary){showToast("Name and salary required","error");return;}
    if(isProcessing)return;setIsProcessing(true);
    if(editStaff){
      const old=safeS.find(s=>s.id===editStaff);
      const updated={...old,...form,salary:+form.salary,active:form.status==="active"};
      try{const r=await updateStaff(editStaff,updated);if(r.success){setStaff(p=>p.map(s=>s.id===editStaff?updated:s));showToast("✅ Staff updated!","success");}else{await queueOfflineOperation("updateStaff",{id:editStaff,staff:updated});setStaff(p=>p.map(s=>s.id===editStaff?updated:s));showToast("⚠️ Saved offline","warning");}}catch(e){showToast("Error: "+e.message,"error");}
    }else{
      const ns={...form,id:Date.now(),joined:new Date().toISOString().slice(0,10),salary:+form.salary,active:form.status==="active"};
      try{const r=await addStaff(ns);if(r.success){setStaff(p=>[...p,ns]);showToast(`✅ ${form.name} added!`,"success");}else{await queueOfflineOperation("addStaff",{staff:ns});setStaff(p=>[...p,ns]);showToast("⚠️ Saved offline","warning");}}catch(e){showToast("Error: "+e.message,"error");}
    }
    setShowAdd(false);setEditStaff(null);setForm({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"});setIsProcessing(false);
  };
  const handleDelete=async id=>{
    try{const r=await deleteStaff(id);if(r.success||r.queued){setStaff(p=>p.filter(s=>s.id!==id));showToast("✅ Staff removed!","success");}else{setStaff(p=>p.filter(s=>s.id!==id));showToast("⚠️ Removed locally","warning");}}catch(e){showToast("Error: "+e.message,"error");}
    setDeleteConfirm(null);
  };
  const totalSalaries=safeS.reduce((s,s_)=>s+(s_.salary||0),0);
  return (
    <div className="space-y-4 pb-8">
      <KPIGrid items={[{icon:"👔",label:"Staff",value:safeS.length},{icon:"💰",label:"Salaries",value:rs(totalSalaries)},{icon:"✅",label:"Active",value:safeS.filter(s=>s.status==="active"||s.active).length},{icon:"📊",label:"Avg Salary",value:rs(safeS.length>0?totalSalaries/safeS.length:0)}]}/>
      <Btn variant="violet" onClick={()=>{setEditStaff(null);setForm({name:"",role:"Cashier",phone:"",shift:"9am-5pm",salary:"",status:"active"});setShowAdd(true);}} full>➕ {L?"سٹاف شامل":"Add Staff"}</Btn>
      <div className="space-y-3">
        {safeS.map(s=>(
          <Card key={s.id} className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white font-black text-lg">{s.name?.split(" ").map(n=>n[0]).join("").slice(0,2)||"ST"}</div>
              <div className="flex-1"><div className="font-black text-slate-900 dark:text-white">{s.name}</div><div className="text-sm text-slate-500">{s.role}</div></div>
              <Badge color={s.status==="active"||s.active?"green":"gray"}>{s.status||"active"}</Badge>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[{l:"Salary",v:rs(s.salary)},{l:"Shift",v:s.shift||"—"},{l:"Joined",v:fmtDate(s.joined)}].map(({l,v})=>(
                <div key={l} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-2 text-center text-xs"><div className="text-slate-400 text-[10px]">{l}</div><div className="font-bold text-xs mt-0.5 truncate">{v}</div></div>
              ))}
            </div>
            <div className="flex gap-2">
              <Btn variant="secondary" size="sm" onClick={()=>openEdit(s)} full>✏️ Edit</Btn>
              <Btn variant="danger" size="sm" onClick={()=>setDeleteConfirm(s.id)} full>🗑️ Delete</Btn>
            </div>
          </Card>
        ))}
      </div>
      <Modal open={showAdd} onClose={()=>{setShowAdd(false);setEditStaff(null);}} title={editStaff?"✏️ Edit Staff":"➕ Add Staff"}>
        <Input label="Full Name *" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>
        <Select label="Role" value={form.role} onChange={e=>setForm({...form,role:e.target.value})} options={["Cashier","Stock Manager","Manager","Delivery"].map(r=>({value:r,label:r}))}/>
        <Input label="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} type="tel"/>
        <Input label="Shift" value={form.shift} onChange={e=>setForm({...form,shift:e.target.value})} placeholder="9am-5pm"/>
        <Input label="Monthly Salary *" type="number" value={form.salary} onChange={e=>setForm({...form,salary:e.target.value})} required/>
        <Select label="Status" value={form.status} onChange={e=>setForm({...form,status:e.target.value})} options={[{value:"active",label:"Active"},{value:"inactive",label:"Inactive"},{value:"on-leave",label:"On Leave"}]}/>
        <Btn variant="violet" onClick={save} full disabled={isProcessing}>{isProcessing?"Saving...":editStaff?"💾 Update Staff":"💾 Add Employee"}</Btn>
      </Modal>
      <ConfirmDialog open={!!deleteConfirm} title="Delete Staff Member?" message="This will permanently remove them from the system." danger onConfirm={()=>handleDelete(deleteConfirm)} onCancel={()=>setDeleteConfirm(null)} confirmText="Delete"/>
    </div>
  );
};

/* ══ ANALYTICS ══ */
const Analytics = ({ orders, products, customers, expenses, lang }) => {
  const safeO=Array.isArray(orders)?orders:[], safeP=Array.isArray(products)?products:[], safeC=Array.isArray(customers)?customers:[], safeE=Array.isArray(expenses)?expenses:[];
  const totalRevenue=safeO.reduce((s,o)=>s+(o.total||0),0), totalProfit=safeO.reduce((s,o)=>s+(o.profit||0),0), totalExpenses=safeE.reduce((s,e)=>s+(e.amt||e.amount||0),0);
  const netProfit=totalProfit-totalExpenses, profitMargin=totalRevenue>0?Math.round(totalProfit/totalRevenue*100):0;
  const topProducts=safeP.map(p=>{let sold=0,rev=0;safeO.forEach(o=>{if(o.items&&Array.isArray(o.items))o.items.forEach(i=>{if((i.pid||i.productId)===p.id){sold+=i.qty||0;rev+=(i.qty||0)*(i.sell||i.price||0);}});});return{...p,sold,rev};}).filter(p=>p.sold>0).sort((a,b)=>b.rev-a.rev).slice(0,5);
  const catData=CATEGORIES.slice(1).map(cat=>{let rev=0;safeP.filter(p=>p.cat===cat||p.category===cat).forEach(p=>{safeO.forEach(o=>{if(o.items&&Array.isArray(o.items))o.items.forEach(i=>{if((i.pid||i.productId)===p.id)rev+=(i.qty||0)*(i.sell||i.price||0);});});});return{name:cat,value:rev};}).filter(d=>d.value>0);
  const COLORS=["#10b981","#8b5cf6","#f59e0b","#ef4444","#0ea5e9","#ec4899"];
  return (
    <div className="space-y-5 pb-8">
      <KPIGrid items={[{icon:"💰",label:"Revenue",value:rs(totalRevenue),change:`${safeO.length} orders`},{icon:"📈",label:"Profit",value:rs(totalProfit),change:`${profitMargin}% margin`},{icon:"💸",label:"Expenses",value:rs(totalExpenses)},{icon:"🏦",label:"Net Profit",value:rs(netProfit),change:netProfit>0?"✅ Positive":"⚠️ Negative"}]}/>
      <Card className="p-4">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">🏆 Top 5 Products</h3>
        <div className="space-y-3">{topProducts.map((p,i)=><div key={p.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 text-white flex items-center justify-center font-bold text-sm">{i+1}</div><div><div className="font-bold text-sm">{p.name}</div><div className="text-xs text-slate-500">{p.sold} units</div></div></div><div className="font-black text-emerald-600">{rs(p.rev)}</div></div>)}{topProducts.length===0&&<EmptyState icon="📦" title="No sales yet" desc="Complete some orders to see top products"/>}</div>
      </Card>
      {catData.length>0&&<Card className="p-4"><h3 className="font-bold text-slate-800 dark:text-white mb-4">📊 Sales by Category</h3><ResponsiveContainer width="100%" height={200}><PieChart><Pie data={catData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`}>{catData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip formatter={v=>rs(v)}/></PieChart></ResponsiveContainer></Card>}
      <Card className="p-4"><h3 className="font-bold text-slate-800 dark:text-white mb-4">👥 Top Customers</h3><div className="space-y-2">{safeC.sort((a,b)=>(b.totalSpent||0)-(a.totalSpent||0)).slice(0,4).map((c,i)=><div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-violet-500 text-white flex items-center justify-center font-bold text-xs">{i+1}</div><div><div className="font-semibold text-sm">{c.name}</div><div className="text-xs text-slate-500">{c.totalOrders||0} orders</div></div></div><div className="text-right"><div className="font-black text-violet-600">{rs(c.totalSpent||0)}</div>{(c.udhaar||0)>0&&<div className="text-xs text-red-500">Owes {rs(c.udhaar)}</div>}</div></div>)}</div></Card>
    </div>
  );
};

/* ══ SETTINGS ══ */
const Settings = ({ lang, setLang, dark, setDark, showToast, shopInfo, setShopInfo }) => {
  const L=lang==="ur";
  const [syncPending,setSyncPending]=useState(0);
  const [onlineStatus,setOnlineStatus]=useState(true);
  const [isSyncing,setIsSyncing]=useState(false);
  useEffect(()=>{const check=async()=>{setSyncPending(await getPendingSyncCount());setOnlineStatus(isOnline());};check();const iv=setInterval(check,5000);return()=>clearInterval(iv);},[]);
  const handleSync=async()=>{setIsSyncing(true);const r=await processOfflineQueue();if(r.success)showToast(`✅ Synced ${r.processed} items!`,"success");else showToast(`⚠️ Synced ${r.processed}, ${r.failed} failed`,"warning");setSyncPending(0);setIsSyncing(false);};
  return (
    <div className="space-y-5 pb-8">
      <Card className="p-5 bg-gradient-to-br from-blue-50 dark:from-blue-900/20 to-cyan-50 dark:to-cyan-900/20">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">☁️ Cloud Sync</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Connection</span><span className={`text-sm font-bold ${onlineStatus?"text-emerald-500":"text-red-500"}`}>{onlineStatus?"✅ Online":"❌ Offline"}</span></div>{syncPending>0&&<div className="bg-amber-100 dark:bg-amber-900/40 rounded-lg px-3 py-1"><span className="text-amber-700 dark:text-amber-300 text-xs font-bold">{syncPending} pending</span></div>}</div>
          <button onClick={async()=>{const r=await testConnection();showToast(r.success?r.message:r.error,r.success?"success":"error");}} className="w-full px-4 py-2 bg-sky-500 text-white font-bold rounded-xl">🔍 Test Connection</button>
          <button onClick={handleSync} disabled={!onlineStatus||isSyncing} className="w-full px-4 py-3 bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50">{isSyncing?"🔄 Syncing...":syncPending>0?"📤 Sync Now":"🔄 Sync All Data"}</button>
        </div>
      </Card>
      <Card className="p-5">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">🏪 {L?"دکان کی معلومات":"Shop Information"}</h3>
        <p className="text-xs text-slate-500 mb-3">This info appears on your printed receipts.</p>
        <Input label="Shop Name" value={shopInfo.name} onChange={e=>setShopInfo(s=>({...s,name:e.target.value}))}/>
        <Input label="Owner Name" value={shopInfo.owner} onChange={e=>setShopInfo(s=>({...s,owner:e.target.value}))}/>
        <Input label="Contact Number" value={shopInfo.phone} onChange={e=>setShopInfo(s=>({...s,phone:e.target.value}))} type="tel"/>
        <Input label="Shop Address" value={shopInfo.address} onChange={e=>setShopInfo(s=>({...s,address:e.target.value}))}/>
        <Btn variant="primary" onClick={()=>{saveToStorage("dp_shop_info",shopInfo);showToast("✅ Shop info saved!","success");}} full>💾 Save Shop Info</Btn>
      </Card>
      <Card className="p-5">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4">{L?"ترجیحات":"App Preferences"}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between"><div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Language</span><span className="text-xs text-slate-500">اردو / English</span></div><div className="flex gap-2">{[["en","EN"],["ur","اردو"]].map(([k,l])=><button key={k} onClick={()=>setLang(k)} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${lang===k?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600"}`}>{l}</button>)}</div></div>
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700"><div><span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">{L?"ڈارک موڈ":"Dark Mode"}</span><span className="text-xs text-slate-500">Night-friendly display</span></div><button onClick={()=>setDark(!dark)} className={`w-14 h-7 rounded-full transition-colors relative ${dark?"bg-emerald-500":"bg-slate-300"}`}><div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-all ${dark?"left-8":"left-1"}`}/></button></div>
        </div>
      </Card>
      <div className="text-center py-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl">
        <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mb-1">🏪 DukanDar Pro</div>
        <div className="text-sm text-slate-600 dark:text-slate-400">Complete Shop Management System</div>
        <div className="text-xs text-slate-500 mt-1">v5.1 · Full CRUD on all data</div>
      </div>
    </div>
  );
};

/* ══ CREDIT REMINDER POPUP ══ */
const CreditReminderPopup = ({ customers, setPage, setSelectedCustomer, showCreditModal, onDismiss }) => {
  const safeC=Array.isArray(customers)?customers:[];
  const overdue=safeC.filter(c=>(c.udhaar||0)>0&&c.creditDueDate&&daysDiff(c.creditDueDate)<=3);
  const [dismissed,setDismissed]=useState([]);
  const visible=overdue.filter(c=>!dismissed.includes(c.id));
  if(visible.length===0)return null;
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20 rounded-t-3xl"><div className="flex items-center gap-3"><span className="text-3xl">🔔</span><div><h2 className="text-lg font-black text-amber-900 dark:text-amber-100">Credit Reminders</h2><p className="text-xs text-amber-700 dark:text-amber-300">{visible.length} due soon</p></div></div></div>
        <div className="p-4 space-y-3">
          {visible.map(c=>{const diff=daysDiff(c.creditDueDate);const isOverdue=diff<0;return(
            <div key={c.id} className={`p-4 rounded-xl border-2 ${isOverdue?"border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800":"border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-800"}`}>
              <div className="flex items-start justify-between mb-2"><div><div className="font-bold text-slate-900 dark:text-white">{c.name}</div><div className="text-xs text-slate-500">{c.phone}</div></div><Badge color={isOverdue?"red":"amber"}>{isOverdue?`${Math.abs(diff)}d overdue`:`Due in ${diff}d`}</Badge></div>
              <div className="text-lg font-black text-red-600 dark:text-red-400 mb-3">{rs(c.udhaar)}</div>
              <div className="flex gap-2"><Btn size="sm" variant="secondary" onClick={()=>setDismissed(d=>[...d,c.id])} full>Dismiss</Btn><Btn size="sm" variant="primary" onClick={()=>{setSelectedCustomer(c);showCreditModal(c.id);setDismissed(d=>[...d,c.id]);}} full>💸 Receive</Btn></div>
            </div>
          );})}
        </div>
        <div className="p-4 border-t border-slate-100 dark:border-slate-700"><Btn variant="secondary" onClick={onDismiss} full>Close All</Btn></div>
      </div>
    </div>
  );
};

/* ══ ROOT APP ══ */
export default function DukanDarPro() {
  const [page,setPage]=useState("home");
  const [lang,setLang]=useState("en");
  const [dark,setDark]=useState(false);
  const [products,setProducts]=useState([]);
  const [customers,setCustomers]=useState([]);
  const [orders,setOrders]=useState([]);
  const [expenses,setExpenses]=useState([]);
  const [staff,setStaff]=useState([]);
  const [shopInfo,setShopInfo]=useState(loadFromStorage("dp_shop_info",{name:"My Store",owner:"",phone:"",address:""}));
  const [toast,setToast]=useState(null);
  const [showReminders,setShowReminders]=useState(true);
  const [externalCustomer,setExternalCustomer]=useState(null);
  const [externalCreditModal,setExternalCreditModal]=useState(null);
  const [isLoading,setIsLoading]=useState(true);
  const [syncPending,setSyncPending]=useState(0);
  const [isNetworkOnline,setIsNetworkOnline]=useState(true);
  const [isSyncing,setIsSyncing]=useState(false);

  useEffect(()=>{
    const init=async()=>{
      setIsLoading(true);
      try{
        const online=isOnline();setIsNetworkOnline(online);
        setProducts(loadFromStorage("dp_products_v5",[]));setCustomers(loadFromStorage("dp_customers_v5",[]));setOrders(loadFromStorage("dp_orders_v5",[]));setExpenses(loadFromStorage("dp_expenses_v5",[]));setStaff(loadFromStorage("dp_staff_v5",[]));
        if(online){setSyncPending(await getPendingSyncCount());await syncAllData(d=>setProducts(Array.isArray(d)?d:[]),d=>setCustomers(Array.isArray(d)?d:[]),d=>setOrders(Array.isArray(d)?d:[]),d=>setExpenses(Array.isArray(d)?d:[]),d=>setStaff(Array.isArray(d)?d:[]));}
      }catch(e){console.error("Init error:",e);}finally{setIsLoading(false);}
    };
    init();
    const handleOnline=async()=>{setIsNetworkOnline(true);setToast({msg:"🟢 Back online! Syncing...",type:"success"});setTimeout(()=>setToast(null),3000);await processOfflineQueue();await syncAllData(d=>setProducts(Array.isArray(d)?d:[]),d=>setCustomers(Array.isArray(d)?d:[]),d=>setOrders(Array.isArray(d)?d:[]),d=>setExpenses(Array.isArray(d)?d:[]),d=>setStaff(Array.isArray(d)?d:[]));setSyncPending(0);};
    const handleOffline=()=>{setIsNetworkOnline(false);setToast({msg:"🔴 Offline mode — saving locally",type:"warning"});setTimeout(()=>setToast(null),3000);};
    window.addEventListener("online",handleOnline);window.addEventListener("offline",handleOffline);
    return()=>{window.removeEventListener("online",handleOnline);window.removeEventListener("offline",handleOffline);};
  },[]);

  useEffect(()=>{saveToStorage("dp_products_v5",products);},[products]);
  useEffect(()=>{saveToStorage("dp_customers_v5",customers);},[customers]);
  useEffect(()=>{saveToStorage("dp_orders_v5",orders);},[orders]);
  useEffect(()=>{saveToStorage("dp_expenses_v5",expenses);},[expenses]);
  useEffect(()=>{saveToStorage("dp_staff_v5",staff);},[staff]);
  useEffect(()=>{saveToStorage("dp_shop_info",shopInfo);},[shopInfo]);

  const showToast=useCallback((msg,type="success")=>setToast({msg,type}),[]);
  const L=lang==="ur";
  const lowCount=products.filter(p=>(p.stock||0)<=(p.minStock||p.lowStock||0)).length;

  const navItems=[{key:"home",icon:"🏠",label:L?"ہوم":"Home"},{key:"pos",icon:"🛒",label:L?"بلنگ":"POS"},{key:"orders",icon:"🧾",label:L?"آرڈر":"Orders"},{key:"inventory",icon:"📦",label:L?"اسٹاک":"Stock",badge:lowCount},{key:"customers",icon:"👥",label:L?"گاہک":"People"}];
  const moreItems=[{key:"merchandise",icon:"📊",label:L?"سامان":"Merch"},{key:"expenses",icon:"💸",label:L?"اخراجات":"Costs"},{key:"staff",icon:"👔",label:L?"سٹاف":"Staff"},{key:"analytics",icon:"📈",label:L?"رپورٹ":"Reports"},{key:"settings",icon:"⚙️",label:L?"سیٹنگ":"Settings"}];
  const pageTitles={home:"Dashboard",pos:"New Sale",orders:"Orders",inventory:"Inventory",customers:"Customers",merchandise:"Merchandise",expenses:"Expenses",staff:"Staff",analytics:"Analytics",settings:"Settings"};

  const renderPage=()=>{
    const props={showToast,lang};
    switch(page){
      case "home":        return <Dashboard products={products} orders={orders} customers={customers} expenses={expenses} {...props} setPage={setPage} setExternalCustomer={setExternalCustomer} setExternalCreditModal={setExternalCreditModal}/>;
      case "pos":         return <POS products={products} customers={customers} setOrders={setOrders} setProducts={setProducts} setCustomers={setCustomers} shopInfo={shopInfo} {...props}/>;
      case "orders":      return <OrdersHistory orders={orders} products={products} setOrders={setOrders} setProducts={setProducts} setCustomers={setCustomers} customers={customers} {...props}/>;
      case "inventory":   return <Inventory products={products} setProducts={setProducts} {...props}/>;
      case "customers":   return <Customers customers={customers} setCustomers={setCustomers} orders={orders} {...props} externalSelected={externalCustomer} externalCreditModal={externalCreditModal} clearExternal={()=>{setExternalCustomer(null);setExternalCreditModal(null);}}/>;
      case "merchandise": return <Merchandise products={products} orders={orders} {...props}/>;
      case "expenses":    return <Expenses expenses={expenses} setExpenses={setExpenses} {...props}/>;
      case "staff":       return <Staff staff={staff} setStaff={setStaff} {...props}/>;
      case "analytics":   return <Analytics orders={orders} products={products} customers={customers} expenses={expenses} {...props}/>;
      case "settings":    return <Settings lang={lang} setLang={setLang} dark={dark} setDark={setDark} showToast={showToast} shopInfo={shopInfo} setShopInfo={setShopInfo}/>;
      default: return null;
    }
  };

  if(isLoading){return <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-4">☁️</div><div className="text-emerald-600 font-bold text-lg">DukanDar Pro</div><div className="text-slate-500 text-sm mt-1">Loading...</div></div></div>;}

  return (
    <div className={dark?"dark":""} dir={L?"rtl":"ltr"}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 pb-24">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap');
          .no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
          @keyframes toast-in{0%{transform:translate(-50%,-16px);opacity:0}60%{transform:translate(-50%,3px)}100%{transform:translate(-50%,0);opacity:1}}
          .animate-toast{animation:toast-in .35s cubic-bezier(.34,1.56,.64,1) forwards}
          *{font-family:${L?"'Noto Nastaliq Urdu',serif":"'Outfit',sans-serif"}}
          .line-clamp-2{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
        `}</style>

        {toast&&<Toast msg={toast.msg} type={toast.type} onClose={()=>setToast(null)}/>}
        <SyncStatusIndicator pendingCount={syncPending} isNetworkOnline={isNetworkOnline} onSync={async()=>{setIsSyncing(true);await processOfflineQueue();await syncAllData(d=>setProducts(Array.isArray(d)?d:[]),d=>setCustomers(Array.isArray(d)?d:[]),d=>setOrders(Array.isArray(d)?d:[]),d=>setExpenses(Array.isArray(d)?d:[]),d=>setStaff(Array.isArray(d)?d:[]));setSyncPending(0);setIsSyncing(false);showToast("✅ Sync completed!","success");}} syncing={isSyncing}/>

        {showReminders&&page==="home"&&<CreditReminderPopup customers={customers} setPage={setPage} setSelectedCustomer={setExternalCustomer} showCreditModal={id=>{setExternalCreditModal(id);setPage("customers");}} onDismiss={()=>setShowReminders(false)}/>}

        <header className="sticky top-0 z-40 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between px-4 py-4 max-w-2xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-black text-lg shadow-md">د</div>
              <div><div className="font-black text-slate-900 dark:text-white text-lg">{L?"دکانDار":"DukanDar"} <span className="text-emerald-500 text-sm">Pro</span></div><div className="text-xs text-slate-500">{pageTitles[page]}</div></div>
            </div>
            <div className="flex items-center gap-2">
              {!isNetworkOnline&&<div className="bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-lg"><span className="text-amber-700 dark:text-amber-300 text-[10px] font-bold">OFFLINE</span></div>}
              {lowCount>0&&<button onClick={()=>setPage("inventory")} className="flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-amber-200 transition-colors">⚠️ {lowCount}</button>}
              <button onClick={()=>setDark(!dark)} className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-lg hover:bg-slate-200 transition-colors">{dark?"☀️":"🌙"}</button>
            </div>
          </div>
          <div className="flex gap-1 px-3 pb-2 overflow-x-auto no-scrollbar max-w-2xl mx-auto">
            {moreItems.map(n=><button key={n.key} onClick={()=>setPage(n.key)} className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${page===n.key?"bg-emerald-500 text-white":"bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400"}`}>{n.icon} {n.label}</button>)}
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 pt-5">{renderPage()}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-2xl">
          <div className="flex items-center justify-around px-2 py-3 max-w-2xl mx-auto">
            {navItems.map(n=>(
              <button key={n.key} onClick={()=>setPage(n.key)} className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${page===n.key?"bg-emerald-50 dark:bg-emerald-900/20":""}`}>
                <div className="relative"><span className="text-xl">{n.icon}</span>{(n.badge||0)>0&&<span className="absolute -top-2 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center">{n.badge}</span>}</div>
                <span className={`text-[10px] font-bold ${page===n.key?"text-emerald-600 dark:text-emerald-400":"text-slate-400"}`}>{n.label}</span>
                {page===n.key&&<div className="w-1 h-1 rounded-full bg-emerald-500"/>}
              </button>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}