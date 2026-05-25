import { useState, useMemo, useEffect, useCallback } from "react";
import {
  SCRIPT_URL,
  getParties, getItems, getBills, getLedger, getCash,
  addParty, addItem, addBill, addLedger, addCash, updateItem,
  partyToRow, rowToParty,
  itemToRow,  rowToItem,
  billToRow,  rowToBill,
  ledgerToRow,rowToLedger,
  cashToRow,  rowToCash,
} from "./Googlesheets";

// ── If SCRIPT_URL is not set yet, run in offline/demo mode ──
const OFFLINE = !SCRIPT_URL || SCRIPT_URL.startsWith("PASTE");

const COLORS = {
  primary: "#1D9E75", primaryDark: "#0F6E56", accent: "#BA7517",
  danger: "#E24B4A", info: "#378ADD",
  bg: "#F8F9FA", card: "#FFFFFF", border: "#E5E7EB", text: "#1A1A1A", muted: "#6B7280",
};

// ── Demo / seed data (used when OFFLINE = true) ──────────────
const DEMO_PARTIES = [
  { id:"p1", name:"Raza Traders",      phone:"0312-1234567", city:"Karachi",    address:"", creditLimit:500000, openingBalance:120000 },
  { id:"p2", name:"Ahmed & Sons",      phone:"0321-7654321", city:"Lahore",     address:"", creditLimit:300000, openingBalance:85000  },
  { id:"p3", name:"Malik Enterprises", phone:"0333-9876543", city:"Rawalpindi", address:"", creditLimit:200000, openingBalance:45000  },
  { id:"p4", name:"Zubair Wholesale",  phone:"0345-1122334", city:"Karachi",    address:"", creditLimit:400000, openingBalance:200000 },
];
const DEMO_ITEMS = [
  { id:"i1", name:"Rice (Basmati 25kg)", category:"Grains",    unit:"Bag",    rate:4500, reorderLevel:20, stock:85 },
  { id:"i2", name:"Sugar (50kg)",        category:"Grocery",   unit:"Bag",    rate:6200, reorderLevel:15, stock:8  },
  { id:"i3", name:"Cooking Oil 5L",      category:"Oils",      unit:"Carton", rate:8800, reorderLevel:10, stock:32 },
  { id:"i4", name:"Flour (20kg)",        category:"Grains",    unit:"Bag",    rate:2100, reorderLevel:25, stock:6  },
  { id:"i5", name:"Tea (1kg)",           category:"Beverages", unit:"Box",    rate:3200, reorderLevel:12, stock:45 },
];
const DEMO_BILLS = [
  { id:"b1", partyId:"p1", partyName:"Raza Traders",      date:"2025-05-20", billNo:"INV-001", items:[{itemId:"i1",name:"Rice (Basmati 25kg)",qty:10,rate:4500,total:45000}], total:45000, type:"credit", notes:"" },
  { id:"b2", partyId:"p2", partyName:"Ahmed & Sons",      date:"2025-05-21", billNo:"INV-002", items:[{itemId:"i3",name:"Cooking Oil 5L",    qty:5, rate:8800,total:44000}], total:44000, type:"cash",   notes:"" },
  { id:"b3", partyId:"p3", partyName:"Malik Enterprises", date:"2025-05-22", billNo:"INV-003", items:[{itemId:"i2",name:"Sugar (50kg)",       qty:8, rate:6200,total:49600}], total:49600, type:"credit", notes:"" },
  { id:"b4", partyId:"p1", partyName:"Raza Traders",      date:"2025-05-23", billNo:"INV-004", items:[{itemId:"i5",name:"Tea (1kg)",           qty:15,rate:3200,total:48000}], total:48000, type:"credit", notes:"" },
];
const DEMO_LEDGER = [
  { id:"l1", partyId:"p1", partyName:"Raza Traders",      date:"2025-05-20", type:"debit",  ref:"INV-001", note:"Sale",             amount:45000  },
  { id:"l2", partyId:"p2", partyName:"Ahmed & Sons",      date:"2025-05-21", type:"credit", ref:"REC-001", note:"Payment received", amount:44000  },
  { id:"l3", partyId:"p3", partyName:"Malik Enterprises", date:"2025-05-22", type:"debit",  ref:"INV-003", note:"Sale",             amount:49600  },
  { id:"l4", partyId:"p1", partyName:"Raza Traders",      date:"2025-05-23", type:"debit",  ref:"INV-004", note:"Sale",             amount:48000  },
  { id:"l5", partyId:"p4", partyName:"Zubair Wholesale",  date:"2025-05-19", type:"credit", ref:"REC-002", note:"Partial payment",  amount:100000 },
];
const DEMO_CASH = [
  { id:"c1", date:"2025-05-20", type:"in",  ref:"REC-003", note:"Cash sale Ahmed & Sons",      amount:44000  },
  { id:"c2", date:"2025-05-21", type:"out", ref:"EXP-001", note:"Delivery expense",            amount:5000   },
  { id:"c3", date:"2025-05-22", type:"out", ref:"EXP-002", note:"Office expense",              amount:3500   },
  { id:"c4", date:"2025-05-23", type:"in",  ref:"REC-004", note:"Zubair Wholesale payment",    amount:100000 },
];

// ── Helpers ──────────────────────────────────────────────────
function fmt(n) { return "Rs " + Number(n).toLocaleString("en-PK"); }
function uid(prefix) { return prefix + Date.now(); }
function today() { return new Date().toISOString().split("T")[0]; }

// ── UI primitives ─────────────────────────────────────────────
function Badge({ children, color = "green" }) {
  const map = {
    green: ["#EAF3DE","#3B6D11"], red:  ["#FCEBEB","#A32D2D"],
    amber: ["#FAEEDA","#854F0B"], blue: ["#E6F1FB","#185FA5"], gray: ["#F1EFE8","#5F5E5A"],
  };
  const [bg, text] = map[color] || map.green;
  return <span style={{background:bg,color:text,fontSize:11,fontWeight:600,padding:"2px 8px",borderRadius:20,display:"inline-block"}}>{children}</span>;
}

function Card({ children, style={} }) {
  return <div style={{background:COLORS.card,borderRadius:12,border:`1px solid ${COLORS.border}`,padding:"1.25rem",...style}}>{children}</div>;
}

function StatCard({ label, value, icon, color=COLORS.primary, sub }) {
  return (
    <div style={{background:COLORS.card,borderRadius:12,border:`1px solid ${COLORS.border}`,padding:"1rem 1.25rem",display:"flex",flexDirection:"column",gap:6}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <span style={{fontSize:12,color:COLORS.muted,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.05em"}}>{label}</span>
        <span style={{fontSize:22}}>{icon}</span>
      </div>
      <div style={{fontSize:22,fontWeight:700,color:COLORS.text}}>{value}</div>
      {sub && <div style={{fontSize:12,color:COLORS.muted}}>{sub}</div>}
    </div>
  );
}

function SectionHeader({ title, action }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
      <h2 style={{fontSize:18,fontWeight:700,color:COLORS.text,margin:0,fontFamily:"Georgia,serif"}}>{title}</h2>
      {action}
    </div>
  );
}

function Btn({ children, onClick, variant="primary", size="md", style={}, disabled=false }) {
  const base = {border:"none",borderRadius:8,cursor:disabled?"not-allowed":"pointer",fontWeight:600,
    fontSize:size==="sm"?12:14,padding:size==="sm"?"5px 12px":"9px 18px",
    display:"inline-flex",alignItems:"center",gap:6,opacity:disabled?0.6:1};
  const variants = {
    primary:   {background:COLORS.primary,  color:"#fff"},
    secondary: {background:"#F1F5F9",color:COLORS.text,border:`1px solid ${COLORS.border}`},
    danger:    {background:COLORS.danger,   color:"#fff"},
    ghost:     {background:"transparent",   color:COLORS.primary,border:`1px solid ${COLORS.primary}`},
  };
  return <button onClick={disabled?undefined:onClick} style={{...base,...variants[variant],...style}}>{children}</button>;
}

function Input({ label, value, onChange, type="text", placeholder, style={} }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {label && <label style={{fontSize:12,fontWeight:600,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</label>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        style={{border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"8px 12px",fontSize:14,color:COLORS.text,outline:"none",background:"#fff",...style}} />
    </div>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:4}}>
      {label && <label style={{fontSize:12,fontWeight:600,color:COLORS.muted,textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</label>}
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{border:`1px solid ${COLORS.border}`,borderRadius:8,padding:"8px 12px",fontSize:14,color:COLORS.text,background:"#fff",outline:"none"}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Table({ columns, data, emptyMsg="No records found" }) {
  return (
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr style={{borderBottom:`2px solid ${COLORS.border}`}}>
            {columns.map(c=>(
              <th key={c.key} style={{padding:"10px 12px",textAlign:c.right?"right":"left",color:COLORS.muted,fontWeight:600,fontSize:11,textTransform:"uppercase",letterSpacing:"0.05em",whiteSpace:"nowrap"}}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length===0
            ? <tr><td colSpan={columns.length} style={{padding:32,textAlign:"center",color:COLORS.muted}}>{emptyMsg}</td></tr>
            : data.map((row,i)=>(
              <tr key={i} style={{borderBottom:`1px solid ${COLORS.border}`,background:i%2===0?"#fff":"#FAFAFA"}}>
                {columns.map(c=>(
                  <td key={c.key} style={{padding:"10px 12px",color:c.color||COLORS.text,textAlign:c.right?"right":"left",fontWeight:c.bold?600:400,whiteSpace:c.noWrap?"nowrap":"normal"}}>
                    {c.render ? c.render(row[c.key],row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

function Modal({ title, onClose, children, width=560 }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#fff",borderRadius:16,width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1.25rem 1.5rem",borderBottom:`1px solid ${COLORS.border}`}}>
          <h3 style={{margin:0,fontSize:17,fontWeight:700,fontFamily:"Georgia,serif"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:22,cursor:"pointer",color:COLORS.muted,lineHeight:1}}>×</button>
        </div>
        <div style={{padding:"1.5rem"}}>{children}</div>
      </div>
    </div>
  );
}

// ── Sync status banner ────────────────────────────────────────
function SyncBanner({ status }) {
  if (!status) return null;
  const map = {
    loading: ["#E6F1FB","#185FA5","⏳ Loading from Google Sheets…"],
    saving:  ["#FAEEDA","#854F0B","💾 Saving to Google Sheets…"],
    saved:   ["#EAF3DE","#3B6D11","✅ Saved to Google Sheets"],
    error:   ["#FCEBEB","#A32D2D","❌ Sheet error — check SCRIPT_URL"],
    offline: ["#F1EFE8","#5F5E5A","📴 Demo mode — Google Sheets not connected"],
  };
  const [bg,color,msg] = map[status]||map.offline;
  return (
    <div style={{background:bg,color,fontSize:12,fontWeight:600,padding:"6px 16px",textAlign:"center",borderBottom:`1px solid ${COLORS.border}`}}>
      {msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SCREENS
// ══════════════════════════════════════════════════════════════

function DashboardScreen({ bills, cash, items, parties, ledger }) {
  const todayStr  = today();
  const todaySales = bills.filter(b=>b.date===todayStr).reduce((s,b)=>s+b.total,0);
  const todayCash  = cash.filter(c=>c.date===todayStr&&c.type==="in").reduce((s,c)=>s+c.amount,0);
  const outstanding = parties.reduce((s,p)=>s+p.openingBalance,0);
  const totalStock  = items.reduce((s,i)=>s+i.stock,0);
  const lowStock    = items.filter(i=>i.stock<=i.reorderLevel);
  const top5        = [...parties].sort((a,b)=>b.openingBalance-a.openingBalance).slice(0,5);

  return (
    <div>
      <div style={{marginBottom:24}}>
        <h1 style={{fontSize:24,fontWeight:800,color:COLORS.text,margin:0,fontFamily:"Georgia,serif"}}>Dashboard</h1>
        <p style={{color:COLORS.muted,fontSize:13,margin:"4px 0 0"}}>{todayStr} — Wholesale Control Panel</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:24}}>
        <StatCard label="Today's Sales"  value={fmt(todaySales)}  icon="🧾" color={COLORS.primary} sub="Today's bills" />
        <StatCard label="Cash Collected" value={fmt(todayCash)}   icon="💵" color={COLORS.accent}  sub="Today" />
        <StatCard label="Outstanding"    value={fmt(outstanding)} icon="⏳" color={COLORS.danger}  sub={`${parties.length} parties`} />
        <StatCard label="Stock Items"    value={totalStock+" units"} icon="📦" color={COLORS.info} sub={`${lowStock.length} low stock`} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:24}}>
        <Card>
          <SectionHeader title="Top Debtors" />
          {top5.map((p,i)=>(
            <div key={p.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<top5.length-1?`1px solid ${COLORS.border}`:"none"}}>
              <div><div style={{fontWeight:600,fontSize:13}}>{p.name}</div><div style={{fontSize:11,color:COLORS.muted}}>{p.city}</div></div>
              <span style={{fontWeight:700,color:COLORS.danger,fontSize:13}}>{fmt(p.openingBalance)}</span>
            </div>
          ))}
        </Card>
        <Card>
          <SectionHeader title="Low Stock Alerts" />
          {lowStock.length===0
            ? <p style={{color:COLORS.muted,fontSize:13,textAlign:"center",padding:16}}>✅ All stock levels OK</p>
            : lowStock.map((item,i)=>(
              <div key={item.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:i<lowStock.length-1?`1px solid ${COLORS.border}`:"none"}}>
                <div><div style={{fontWeight:600,fontSize:13}}>{item.name}</div><div style={{fontSize:11,color:COLORS.muted}}>Reorder at {item.reorderLevel}</div></div>
                <Badge color="red">Only {item.stock} left</Badge>
              </div>
            ))
          }
        </Card>
      </div>
      <Card>
        <SectionHeader title="Recent Bills" />
        <Table columns={[
          {key:"billNo",   label:"Bill #"},
          {key:"partyName",label:"Party"},
          {key:"date",     label:"Date"},
          {key:"type",     label:"Type",   render:v=><Badge color={v==="cash"?"green":"amber"}>{v==="cash"?"Cash":"Credit"}</Badge>},
          {key:"total",    label:"Amount", right:true, bold:true, render:v=>fmt(v)},
        ]} data={[...bills].reverse().slice(0,5)} />
      </Card>
    </div>
  );
}

function BillingScreen({ bills, setBills, parties, items, setItems, setLedger, setCash, setSyncStatus }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState("");
  const blankForm = () => ({ partyId:"", date:today(), billNo:`INV-${String(bills.length+1).padStart(3,"0")}`, type:"credit", notes:"", lines:[{itemId:"",qty:1,rate:0}] });
  const [form, setForm] = useState(blankForm);

  const filtered = bills.filter(b=>b.partyName.toLowerCase().includes(search.toLowerCase())||b.billNo.includes(search));

  function addLine() { setForm(f=>({...f,lines:[...f.lines,{itemId:"",qty:1,rate:0}]})); }
  function updateLine(i,field,val) {
    setForm(f=>{
      const lines=[...f.lines]; lines[i]={...lines[i],[field]:val};
      if(field==="itemId"){const item=items.find(it=>it.id===val); if(item) lines[i].rate=item.rate;}
      return {...f,lines};
    });
  }

  async function saveBill() {
    if(!form.partyId||form.lines.some(l=>!l.itemId)) return alert("Fill all fields");
    setSaving(true); setSyncStatus("saving");
    try {
      const party = parties.find(p=>p.id===form.partyId);
      const billItems = form.lines.map(l=>{
        const item=items.find(it=>it.id===l.itemId);
        return {itemId:l.itemId,name:item.name,qty:Number(l.qty),rate:Number(l.rate),total:Number(l.qty)*Number(l.rate)};
      });
      const total  = billItems.reduce((s,i)=>s+i.total,0);
      const newBill = {id:uid("b"),partyId:form.partyId,partyName:party.name,date:form.date,billNo:form.billNo,items:billItems,total,type:form.type,notes:form.notes};

      if(!OFFLINE) await addBill(billToRow(newBill));
      setBills(prev=>[...prev,newBill]);

      if(form.type==="credit") {
        const entry={id:uid("l"),partyId:form.partyId,partyName:party.name,date:form.date,type:"debit",ref:form.billNo,note:"Sale",amount:total};
        if(!OFFLINE) await addLedger(ledgerToRow(entry));
        setLedger(prev=>[...prev,entry]);
      } else {
        const entry={id:uid("c"),date:form.date,type:"in",ref:form.billNo,note:`Cash sale - ${party.name}`,amount:total};
        if(!OFFLINE) await addCash(cashToRow(entry));
        setCash(prev=>[...prev,entry]);
      }

      // update stock
      for(const line of billItems) {
        const item = items.find(it=>it.id===line.itemId);
        if(item) {
          const updated={...item,stock:item.stock-line.qty};
          if(!OFFLINE) await updateItem(item.id,itemToRow(updated));
          setItems(prev=>prev.map(it=>it.id===item.id?updated:it));
        }
      }

      setSyncStatus("saved"); setTimeout(()=>setSyncStatus(null),2500);
      setShowForm(false); setForm(blankForm());
    } catch(err) { setSyncStatus("error"); console.error(err); }
    setSaving(false);
  }

  return (
    <div>
      <SectionHeader title="Billing" action={<Btn onClick={()=>setShowForm(true)}>+ New Bill</Btn>} />
      <div style={{marginBottom:16}}><Input value={search} onChange={setSearch} placeholder="Search by party or bill number…" /></div>
      <Card>
        <Table columns={[
          {key:"billNo",   label:"Bill #", bold:true},
          {key:"partyName",label:"Party"},
          {key:"date",     label:"Date",   noWrap:true},
          {key:"items",    label:"Items",  render:v=>v.length+" item(s)"},
          {key:"type",     label:"Type",   render:v=><Badge color={v==="cash"?"green":"amber"}>{v==="cash"?"Cash":"Credit"}</Badge>},
          {key:"total",    label:"Total",  right:true, bold:true, render:v=>fmt(v)},
        ]} data={[...filtered].reverse()} />
      </Card>

      {showForm && (
        <Modal title="New Bill" onClose={()=>setShowForm(false)} width={640}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <Select label="Party" value={form.partyId} onChange={v=>setForm(f=>({...f,partyId:v}))}
              options={[{value:"",label:"-- Select Party --"},...parties.map(p=>({value:p.id,label:p.name}))]} />
            <Input label="Bill No"  value={form.billNo} onChange={v=>setForm(f=>({...f,billNo:v}))} />
            <Input label="Date"     type="date" value={form.date}  onChange={v=>setForm(f=>({...f,date:v}))} />
            <Select label="Sale Type" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))}
              options={[{value:"credit",label:"Credit"},{value:"cash",label:"Cash"}]} />
          </div>
          <div style={{background:"#F8F9FA",borderRadius:8,padding:12,marginBottom:16}}>
            <div style={{fontSize:12,fontWeight:700,color:COLORS.muted,marginBottom:10,textTransform:"uppercase"}}>Items</div>
            {form.lines.map((line,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:8,marginBottom:8,alignItems:"end"}}>
                <Select label={i===0?"Item":""} value={line.itemId} onChange={v=>updateLine(i,"itemId",v)}
                  options={[{value:"",label:"-- Item --"},...items.map(it=>({value:it.id,label:it.name}))]} />
                <Input label={i===0?"Qty":""}  type="number" value={line.qty}  onChange={v=>updateLine(i,"qty",v)} />
                <Input label={i===0?"Rate":""} type="number" value={line.rate} onChange={v=>updateLine(i,"rate",v)} />
                <div style={{paddingBottom:2}}>
                  {i===0&&<div style={{fontSize:12,color:COLORS.muted,marginBottom:4}}>Total</div>}
                  <div style={{fontWeight:700,fontSize:13,paddingTop:8}}>{fmt(line.qty*line.rate)}</div>
                </div>
              </div>
            ))}
            <Btn variant="ghost" size="sm" onClick={addLine}>+ Add Line</Btn>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderTop:`1px solid ${COLORS.border}`,marginBottom:12}}>
            <span style={{fontWeight:600}}>Grand Total</span>
            <span style={{fontWeight:800,fontSize:18,color:COLORS.primary}}>{fmt(form.lines.reduce((s,l)=>s+l.qty*l.rate,0))}</span>
          </div>
          <Input label="Notes" value={form.notes} onChange={v=>setForm(f=>({...f,notes:v}))} placeholder="Optional note…" />
          <div style={{display:"flex",gap:8,marginTop:16,justifyContent:"flex-end"}}>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
            <Btn onClick={saveBill} disabled={saving}>{saving?"Saving…":"Save Bill"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LedgerScreen({ ledger, setLedger, parties, setSyncStatus }) {
  const [selectedParty, setSelectedParty] = useState("all");
  const [showPayment,   setShowPayment]   = useState(false);
  const [saving, setSaving]               = useState(false);
  const [payForm, setPayForm] = useState({partyId:"",date:today(),ref:"",note:"Payment received",amount:""});

  const filtered = selectedParty==="all" ? ledger : ledger.filter(l=>l.partyId===selectedParty);

  const partyBalance = (partyId) => {
    const entries = ledger.filter(l=>l.partyId===partyId);
    const party   = parties.find(p=>p.id===partyId);
    const opening = party ? party.openingBalance : 0;
    return opening + entries.reduce((s,e)=>e.type==="debit"?s+e.amount:s-e.amount,0);
  };

  async function savePayment() {
    if(!payForm.partyId||!payForm.amount) return alert("Fill all required fields");
    setSaving(true); setSyncStatus("saving");
    try {
      const party = parties.find(p=>p.id===payForm.partyId);
      const entry = {id:uid("l"),partyId:payForm.partyId,partyName:party.name,
        date:payForm.date,type:"credit",ref:payForm.ref||uid("REC"),note:payForm.note,amount:Number(payForm.amount)};
      if(!OFFLINE) await addLedger(ledgerToRow(entry));
      setLedger(prev=>[...prev,entry]);
      setSyncStatus("saved"); setTimeout(()=>setSyncStatus(null),2500);
      setShowPayment(false);
    } catch(err) { setSyncStatus("error"); console.error(err); }
    setSaving(false);
  }

  const withRunning = useMemo(()=>{
    return filtered.map((entry,_,arr)=>{
      const party   = parties.find(p=>p.id===entry.partyId);
      const opening = party ? party.openingBalance : 0;
      const partyEntries = arr.filter(e=>e.partyId===entry.partyId);
      const idx     = partyEntries.indexOf(entry);
      const running = opening + partyEntries.slice(0,idx+1).reduce((s,e)=>e.type==="debit"?s+e.amount:s-e.amount,0);
      return {...entry,running};
    });
  },[filtered,parties]);

  return (
    <div>
      <SectionHeader title="Party Ledger" action={<Btn onClick={()=>setShowPayment(true)}>+ Record Payment</Btn>} />
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,marginBottom:20}}>
        {parties.map(p=>(
          <div key={p.id} onClick={()=>setSelectedParty(p.id===selectedParty?"all":p.id)}
            style={{background:selectedParty===p.id?COLORS.primary:COLORS.card,borderRadius:10,border:`1px solid ${selectedParty===p.id?COLORS.primary:COLORS.border}`,padding:"10px 14px",cursor:"pointer"}}>
            <div style={{fontWeight:600,fontSize:13,color:selectedParty===p.id?"#fff":COLORS.text}}>{p.name}</div>
            <div style={{fontSize:12,color:selectedParty===p.id?"rgba(255,255,255,0.8)":COLORS.danger,fontWeight:700,marginTop:2}}>{fmt(partyBalance(p.id))}</div>
          </div>
        ))}
      </div>
      <Card>
        <Table columns={[
          {key:"date",      label:"Date",      noWrap:true},
          {key:"partyName", label:"Party"},
          {key:"ref",       label:"Reference"},
          {key:"note",      label:"Note"},
          {key:"type",      label:"Type",      render:v=><Badge color={v==="debit"?"red":"green"}>{v==="debit"?"Dr":"Cr"}</Badge>},
          {key:"amount",    label:"Amount",    right:true, render:(v,row)=><span style={{color:row.type==="debit"?COLORS.danger:COLORS.primary,fontWeight:700}}>{fmt(v)}</span>},
          {key:"running",   label:"Balance",   right:true, bold:true, render:v=>fmt(v)},
        ]} data={withRunning} />
      </Card>

      {showPayment&&(
        <Modal title="Record Payment" onClose={()=>setShowPayment(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Select label="Party" value={payForm.partyId} onChange={v=>setPayForm(f=>({...f,partyId:v}))}
              options={[{value:"",label:"-- Select Party --"},...parties.map(p=>({value:p.id,label:p.name}))]} />
            <Input label="Date"         type="date"   value={payForm.date}   onChange={v=>setPayForm(f=>({...f,date:v}))} />
            <Input label="Reference No" value={payForm.ref}    onChange={v=>setPayForm(f=>({...f,ref:v}))}    placeholder="e.g. REC-005" />
            <Input label="Note"         value={payForm.note}   onChange={v=>setPayForm(f=>({...f,note:v}))} />
            <Input label="Amount (Rs)"  type="number" value={payForm.amount} onChange={v=>setPayForm(f=>({...f,amount:v}))} placeholder="0" />
            <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:8}}>
              <Btn variant="secondary" onClick={()=>setShowPayment(false)}>Cancel</Btn>
              <Btn onClick={savePayment} disabled={saving}>{saving?"Saving…":"Save Payment"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CashBookScreen({ cash, setCash, setSyncStatus }) {
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({date:today(),type:"in",ref:"",note:"",amount:""});

  const totalIn  = cash.filter(c=>c.type==="in" ).reduce((s,c)=>s+c.amount,0);
  const totalOut = cash.filter(c=>c.type==="out").reduce((s,c)=>s+c.amount,0);
  const balance  = 50000 + totalIn - totalOut;

  async function save() {
    if(!form.amount) return alert("Enter amount");
    setSaving(true); setSyncStatus("saving");
    try {
      const entry={id:uid("c"),...form,amount:Number(form.amount)};
      if(!OFFLINE) await addCash(cashToRow(entry));
      setCash(prev=>[...prev,entry]);
      setSyncStatus("saved"); setTimeout(()=>setSyncStatus(null),2500);
      setShowForm(false); setForm({date:today(),type:"in",ref:"",note:"",amount:""});
    } catch(err) { setSyncStatus("error"); console.error(err); }
    setSaving(false);
  }

  return (
    <div>
      <SectionHeader title="Cash Book" action={<Btn onClick={()=>setShowForm(true)}>+ Add Entry</Btn>} />
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        <StatCard label="Total Cash In"  value={fmt(totalIn)}  icon="⬇️" color={COLORS.primary} />
        <StatCard label="Total Cash Out" value={fmt(totalOut)} icon="⬆️" color={COLORS.danger} />
        <StatCard label="Cash Balance"   value={fmt(balance)}  icon="💰" color={COLORS.accent}  sub="Opening Rs 50,000" />
      </div>
      <Card>
        <Table columns={[
          {key:"date", label:"Date",        noWrap:true},
          {key:"ref",  label:"Reference"},
          {key:"note", label:"Description"},
          {key:"type", label:"Type",        render:v=><Badge color={v==="in"?"green":"red"}>{v==="in"?"Cash In":"Cash Out"}</Badge>},
          {key:"amount",label:"Amount",     right:true, bold:true, render:(v,row)=><span style={{color:row.type==="in"?COLORS.primary:COLORS.danger,fontWeight:700}}>{fmt(v)}</span>},
        ]} data={[...cash].reverse()} />
      </Card>

      {showForm&&(
        <Modal title="Add Cash Entry" onClose={()=>setShowForm(false)}>
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Select label="Type" value={form.type} onChange={v=>setForm(f=>({...f,type:v}))}
              options={[{value:"in",label:"Cash In"},{value:"out",label:"Cash Out"}]} />
            <Input label="Date"        type="date"   value={form.date}   onChange={v=>setForm(f=>({...f,date:v}))} />
            <Input label="Reference"   value={form.ref}    onChange={v=>setForm(f=>({...f,ref:v}))}    placeholder="e.g. EXP-003" />
            <Input label="Description" value={form.note}   onChange={v=>setForm(f=>({...f,note:v}))}   placeholder="e.g. Delivery expense" />
            <Input label="Amount (Rs)" type="number" value={form.amount} onChange={v=>setForm(f=>({...f,amount:v}))} />
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
              <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save"}</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StockScreen({ items, setItems, setSyncStatus }) {
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({name:"",category:"",unit:"Bag",rate:"",reorderLevel:10,stock:0});

  async function save() {
    if(!form.name) return alert("Enter item name");
    setSaving(true); setSyncStatus("saving");
    try {
      const item={id:uid("i"),...form,rate:Number(form.rate),reorderLevel:Number(form.reorderLevel),stock:Number(form.stock)};
      if(!OFFLINE) await addItem(itemToRow(item));
      setItems(prev=>[...prev,item]);
      setSyncStatus("saved"); setTimeout(()=>setSyncStatus(null),2500);
      setShowForm(false);
    } catch(err) { setSyncStatus("error"); console.error(err); }
    setSaving(false);
  }

  return (
    <div>
      <SectionHeader title="Stock Management" action={<Btn onClick={()=>setShowForm(true)}>+ Add Item</Btn>} />
      <Card>
        <Table columns={[
          {key:"name",        label:"Item Name",  bold:true},
          {key:"category",    label:"Category"},
          {key:"unit",        label:"Unit"},
          {key:"stock",       label:"In Stock",   right:true, render:(v,row)=><span style={{color:v<=row.reorderLevel?COLORS.danger:COLORS.primary,fontWeight:700}}>{v}</span>},
          {key:"reorderLevel",label:"Reorder At", right:true},
          {key:"rate",        label:"Rate",       right:true, render:v=>fmt(v)},
          {key:"status",      label:"Status",     render:(_,row)=>row.stock<=row.reorderLevel?<Badge color="red">Low Stock</Badge>:<Badge color="green">OK</Badge>},
        ]} data={items} />
      </Card>

      {showForm&&(
        <Modal title="Add Stock Item" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Item Name"     value={form.name}         onChange={v=>setForm(f=>({...f,name:v}))}         style={{gridColumn:"1/-1"}} />
            <Input label="Category"      value={form.category}     onChange={v=>setForm(f=>({...f,category:v}))} />
            <Select label="Unit"         value={form.unit}         onChange={v=>setForm(f=>({...f,unit:v}))}
              options={["Bag","Carton","Box","Piece","Kg","Litre"].map(u=>({value:u,label:u}))} />
            <Input label="Rate (Rs)"     type="number" value={form.rate}        onChange={v=>setForm(f=>({...f,rate:v}))} />
            <Input label="Reorder Level" type="number" value={form.reorderLevel}onChange={v=>setForm(f=>({...f,reorderLevel:v}))} />
            <Input label="Opening Stock" type="number" value={form.stock}       onChange={v=>setForm(f=>({...f,stock:v}))} />
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Item"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ReportsScreen({ bills, cash, ledger, parties }) {
  const [filter,setFilter]=useState("month");
  const salesTotal  = bills.reduce((s,b)=>s+b.total,0);
  const cashSales   = bills.filter(b=>b.type==="cash").reduce((s,b)=>s+b.total,0);
  const creditSales = bills.filter(b=>b.type==="credit").reduce((s,b)=>s+b.total,0);
  const cashIn      = cash.filter(c=>c.type==="in" ).reduce((s,c)=>s+c.amount,0);
  const cashOut     = cash.filter(c=>c.type==="out").reduce((s,c)=>s+c.amount,0);
  const partySummary = parties.map(p=>{
    const entries = ledger.filter(l=>l.partyId===p.id);
    const debit   = entries.filter(e=>e.type==="debit" ).reduce((s,e)=>s+e.amount,0);
    const credit  = entries.filter(e=>e.type==="credit").reduce((s,e)=>s+e.amount,0);
    return {name:p.name,city:p.city,debit,credit,balance:p.openingBalance+debit-credit};
  });
  return (
    <div>
      <SectionHeader title="Reports" action={
        <div style={{display:"flex",gap:6}}>
          {["today","week","month"].map(f=>(
            <Btn key={f} variant={filter===f?"primary":"secondary"} size="sm" onClick={()=>setFilter(f)}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </Btn>
          ))}
        </div>
      } />
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:24}}>
        <StatCard label="Total Sales"  value={fmt(salesTotal)}      icon="📊" color={COLORS.primary} />
        <StatCard label="Cash Sales"   value={fmt(cashSales)}       icon="💵" color={COLORS.accent} />
        <StatCard label="Credit Sales" value={fmt(creditSales)}     icon="📋" color={COLORS.info} />
        <StatCard label="Net Cash Flow"value={fmt(cashIn-cashOut)}  icon="🔄" color={COLORS.primary} />
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <Card>
          <SectionHeader title="Sales Summary" />
          {[
            {label:"Total Bills",   value:bills.length},
            {label:"Total Sales",   value:fmt(salesTotal)},
            {label:"Cash Sales",    value:fmt(cashSales)},
            {label:"Credit Sales",  value:fmt(creditSales)},
            {label:"Avg Bill Value",value:bills.length?fmt(Math.round(salesTotal/bills.length)):"—"},
          ].map((row,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`}}>
              <span style={{fontSize:13,color:COLORS.muted}}>{row.label}</span>
              <span style={{fontSize:13,fontWeight:700}}>{row.value}</span>
            </div>
          ))}
        </Card>
        <Card>
          <SectionHeader title="Cash Flow" />
          {[
            {label:"Opening Balance",value:fmt(50000)},
            {label:"Total Cash In",  value:fmt(cashIn),          color:COLORS.primary},
            {label:"Total Cash Out", value:fmt(cashOut),         color:COLORS.danger},
            {label:"Net Cash",       value:fmt(cashIn-cashOut),  color:COLORS.info},
            {label:"Closing Balance",value:fmt(50000+cashIn-cashOut),color:COLORS.accent},
          ].map((row,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${COLORS.border}`}}>
              <span style={{fontSize:13,color:COLORS.muted}}>{row.label}</span>
              <span style={{fontSize:13,fontWeight:700,color:row.color||COLORS.text}}>{row.value}</span>
            </div>
          ))}
        </Card>
      </div>
      <Card>
        <SectionHeader title="Party Outstanding Summary" />
        <Table columns={[
          {key:"name",   label:"Party",       bold:true},
          {key:"city",   label:"City"},
          {key:"debit",  label:"Total Debit", right:true, render:v=>fmt(v)},
          {key:"credit", label:"Total Credit",right:true, render:v=>fmt(v)},
          {key:"balance",label:"Net Balance", right:true, bold:true, render:v=><span style={{color:v>0?COLORS.danger:COLORS.primary}}>{fmt(v)}</span>},
        ]} data={partySummary} />
      </Card>
    </div>
  );
}

function PartyMasterScreen({ parties, setParties, setSyncStatus }) {
  const [showForm, setShowForm] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({name:"",phone:"",city:"",address:"",creditLimit:"",openingBalance:"0"});

  async function save() {
    if(!form.name) return alert("Enter party name");
    setSaving(true); setSyncStatus("saving");
    try {
      const party={id:uid("p"),...form,creditLimit:Number(form.creditLimit),openingBalance:Number(form.openingBalance)};
      if(!OFFLINE) await addParty(partyToRow(party));
      setParties(prev=>[...prev,party]);
      setSyncStatus("saved"); setTimeout(()=>setSyncStatus(null),2500);
      setShowForm(false); setForm({name:"",phone:"",city:"",address:"",creditLimit:"",openingBalance:"0"});
    } catch(err) { setSyncStatus("error"); console.error(err); }
    setSaving(false);
  }

  return (
    <div>
      <SectionHeader title="Party Master" action={<Btn onClick={()=>setShowForm(true)}>+ Add Party</Btn>} />
      <Card>
        <Table columns={[
          {key:"name",           label:"Party Name",    bold:true},
          {key:"phone",          label:"Phone"},
          {key:"city",           label:"City"},
          {key:"creditLimit",    label:"Credit Limit",  right:true, render:v=>fmt(v)},
          {key:"openingBalance", label:"Opening Balance",right:true, render:v=>fmt(v)},
        ]} data={parties} />
      </Card>
      {showForm&&(
        <Modal title="Add Party" onClose={()=>setShowForm(false)}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
            <Input label="Party Name"         value={form.name}           onChange={v=>setForm(f=>({...f,name:v}))}           style={{gridColumn:"1/-1"}} />
            <Input label="Phone"              value={form.phone}          onChange={v=>setForm(f=>({...f,phone:v}))} />
            <Input label="City"               value={form.city}           onChange={v=>setForm(f=>({...f,city:v}))} />
            <Input label="Credit Limit (Rs)"  type="number" value={form.creditLimit}    onChange={v=>setForm(f=>({...f,creditLimit:v}))} />
            <Input label="Opening Balance (Rs)"type="number" value={form.openingBalance}onChange={v=>setForm(f=>({...f,openingBalance:v}))} />
          </div>
          <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16}}>
            <Btn variant="secondary" onClick={()=>setShowForm(false)}>Cancel</Btn>
            <Btn onClick={save} disabled={saving}>{saving?"Saving…":"Save Party"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  ROOT APP
// ══════════════════════════════════════════════════════════════
const NAV = [
  {id:"dashboard",label:"Dashboard",  icon:"🏠"},
  {id:"billing",  label:"Billing",    icon:"🧾"},
  {id:"ledger",   label:"Party Ledger",icon:"📒"},
  {id:"cashbook", label:"Cash Book",  icon:"💵"},
  {id:"stock",    label:"Stock",      icon:"📦"},
  {id:"reports",  label:"Reports",    icon:"📊"},
  {id:"parties",  label:"Party Master",icon:"👥"},
];

export default function App() {
  const [screen, setScreen]     = useState("dashboard");
  const [sideOpen, setSideOpen] = useState(true);
  const [syncStatus, setSyncStatus] = useState(OFFLINE ? "offline" : "loading");

  const [parties, setParties] = useState([]);
  const [items,   setItems]   = useState([]);
  const [bills,   setBills]   = useState([]);
  const [ledger,  setLedger]  = useState([]);
  const [cash,    setCash]    = useState([]);

  // ── Load all data on mount ──────────────────────────────────
  const loadAll = useCallback(async () => {
    if(OFFLINE) {
      setParties(DEMO_PARTIES); setItems(DEMO_ITEMS);
      setBills(DEMO_BILLS);     setLedger(DEMO_LEDGER); setCash(DEMO_CASH);
      setSyncStatus("offline"); return;
    }
    setSyncStatus("loading");
    try {
      const [p,i,b,l,c] = await Promise.all([getParties(),getItems(),getBills(),getLedger(),getCash()]);
      setParties(p.map(rowToParty));
      setItems  (i.map(rowToItem));
      setBills  (b.map(rowToBill));
      setLedger (l.map(rowToLedger));
      setCash   (c.map(rowToCash));
      setSyncStatus(null);
    } catch(err) {
      console.error("Load error:", err);
      // fallback to demo data so UI is usable
      setParties(DEMO_PARTIES); setItems(DEMO_ITEMS);
      setBills(DEMO_BILLS);     setLedger(DEMO_LEDGER); setCash(DEMO_CASH);
      setSyncStatus("error");
    }
  }, []);

  useEffect(()=>{ loadAll(); },[loadAll]);

  const sharedProps = { setSyncStatus };

  const screens = {
    dashboard: <DashboardScreen bills={bills} ledger={ledger} cash={cash} items={items} parties={parties} />,
    billing:   <BillingScreen   bills={bills} setBills={setBills} parties={parties} items={items} setItems={setItems} setLedger={setLedger} setCash={setCash} {...sharedProps} />,
    ledger:    <LedgerScreen    ledger={ledger} setLedger={setLedger} parties={parties} {...sharedProps} />,
    cashbook:  <CashBookScreen  cash={cash} setCash={setCash} {...sharedProps} />,
    stock:     <StockScreen     items={items} setItems={setItems} {...sharedProps} />,
    reports:   <ReportsScreen   bills={bills} cash={cash} ledger={ledger} parties={parties} />,
    parties:   <PartyMasterScreen parties={parties} setParties={setParties} {...sharedProps} />,
  };

  return (
    <div style={{display:"flex",minHeight:"100vh",background:COLORS.bg,fontFamily:"'Segoe UI',system-ui,sans-serif"}}>
      {/* Sidebar */}
      <div style={{width:sideOpen?220:60,background:"#0F6E56",transition:"width 0.2s",display:"flex",flexDirection:"column",flexShrink:0,position:"sticky",top:0,height:"100vh",overflowX:"hidden"}}>
        <div style={{padding:sideOpen?"20px 16px 16px":"20px 8px 16px",borderBottom:"1px solid rgba(255,255,255,0.1)"}}>
          {sideOpen
            ? <div>
                <div style={{color:"#fff",fontWeight:800,fontSize:15,fontFamily:"Georgia,serif",whiteSpace:"nowrap"}}>Wholesale</div>
                <div style={{color:"rgba(255,255,255,0.6)",fontSize:11,whiteSpace:"nowrap"}}>Management System</div>
              </div>
            : <div style={{color:"#fff",fontSize:18,textAlign:"center"}}>📦</div>
          }
        </div>
        <nav style={{flex:1,padding:"8px 0"}}>
          {NAV.map(item=>(
            <button key={item.id} onClick={()=>setScreen(item.id)}
              style={{display:"flex",alignItems:"center",gap:12,width:"100%",border:"none",cursor:"pointer",
                padding:sideOpen?"10px 16px":"10px 0",justifyContent:sideOpen?"flex-start":"center",
                background:screen===item.id?"rgba(255,255,255,0.15)":"transparent",
                color:screen===item.id?"#fff":"rgba(255,255,255,0.65)",
                borderLeft:screen===item.id?"3px solid #9FE1CB":"3px solid transparent",
                fontWeight:screen===item.id?600:400,fontSize:13}}>
              <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
              {sideOpen&&<span style={{whiteSpace:"nowrap",overflow:"hidden"}}>{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={()=>setSideOpen(v=>!v)}
          style={{background:"rgba(255,255,255,0.1)",border:"none",color:"#fff",padding:"12px",cursor:"pointer",fontSize:16,width:"100%"}}>
          {sideOpen?"◀":"▶"}
        </button>
      </div>

      {/* Content */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        <SyncBanner status={syncStatus} />
        <div style={{flex:1,padding:"24px 28px",overflowY:"auto"}}>
          {screens[screen]}
        </div>
      </div>
    </div>
  );
}