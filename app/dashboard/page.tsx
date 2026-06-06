'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Rental, ExtensionRequest, Collection } from '@/lib/supabase';

const COMPANY = 'Sams Construction Services LTD';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sams-construction-rental.vercel.app';

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
}
function fmtDate(s: string) {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

// ── BADGES ──────────────────────────────────────────────────────────────────
function PayBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    paid:    { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', label: 'Paid' },
    unpaid:  { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Unpaid' },
    partial: { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'Partial' },
  };
  const s = c[status] || { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: status };
  return <span style={{ display:'inline-flex',alignItems:'center',gap:5,background:s.bg,color:s.text,padding:'2px 8px',borderRadius:20,fontSize:11,fontWeight:600,fontFamily:'IBM Plex Mono,monospace' }}><span style={{ width:6,height:6,borderRadius:'50%',background:s.dot,display:'inline-block' }}/>{s.label}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string; label: string }> = {
    active:    { bg: '#EFF6FF', text: '#1D4ED8', label: 'Active' },
    overdue:   { bg: '#FEF2F2', text: '#B91C1C', label: 'Overdue' },
    completed: { bg: '#F9FAFB', text: '#6B7280', label: 'Completed' },
  };
  const s = c[status] || { bg: '#F9FAFB', text: '#6B7280', label: status };
  return <span style={{ display:'inline-flex',alignItems:'center',background:s.bg,color:s.text,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600,fontFamily:'IBM Plex Mono,monospace' }}>{s.label}</span>;
}

function DriverBadge({ status }: { status: string }) {
  const c: Record<string, { bg: string; text: string; label: string }> = {
    assigned:    { bg: '#F3F4F6', text: '#6B7280',  label: '📋 Assigned' },
    on_the_way:  { bg: '#EFF6FF', text: '#1D4ED8',  label: '🚛 En Route' },
    picked_up:   { bg: '#FFFBEB', text: '#92400E',  label: '📦 Picked Up' },
    delivered:   { bg: '#ECFDF5', text: '#065F46',  label: '✅ Delivered' },
  };
  const s = c[status] || { bg: '#F3F4F6', text: '#6B7280', label: status };
  return <span style={{ display:'inline-flex',alignItems:'center',background:s.bg,color:s.text,padding:'2px 8px',borderRadius:4,fontSize:11,fontWeight:600 }}>{s.label}</span>;
}

// ── NEW RENTAL FORM ──────────────────────────────────────────────────────────
function NewRentalForm({ onSaved, onClose }: { onSaved: () => void; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [assets, setAssets] = useState<{ name: string; category: string }[]>([]);
  const [form, setForm] = useState({
    client_name:'', client_phone:'', client_email:'', client_address:'',
    asset:'', assigned_driver:'', start_date:'', start_time:'08:00',
    duration_days:'', price:'', payment_status:'unpaid', payment_method:'', notes:'',
  });

  useEffect(() => {
    supabase.from('assets').select('name,category').order('category').then(({ data }) => {
      if (data) setAssets(data);
    });
  }, []);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const dueDate = () => {
    if (!form.start_date || !form.duration_days) return '';
    const d = new Date(form.start_date);
    d.setDate(d.getDate() + parseInt(form.duration_days));
    return d.toISOString().slice(0, 10);
  };

  const handleSave = async () => {
    if (!form.client_name || !form.asset || !form.start_date || !form.duration_days || !form.price) {
      alert('Please fill in all required fields.'); return;
    }
    setSaving(true);
    const due = dueDate();
    const { error } = await supabase.from('rentals').insert({
      client_name: form.client_name, client_phone: form.client_phone,
      client_email: form.client_email, client_address: form.client_address,
      asset: form.asset, category: assets.find(a => a.name === form.asset)?.category || 'Machine',
      assigned_driver: form.assigned_driver, start_date: form.start_date,
      start_time: form.start_time, due_date: due,
      duration_days: parseInt(form.duration_days), price: parseFloat(form.price),
      payment_status: form.payment_status, payment_method: form.payment_method,
      rental_status: 'active', driver_status: 'assigned', notes: form.notes,
    });
    setSaving(false);
    if (error) { alert('Error saving: ' + error.message); return; }
    onSaved();
  };

  const inp: React.CSSProperties = { width:'100%',background:'#FAFAFA',border:'1px solid #E5E7EB',borderRadius:8,padding:'10px 12px',fontSize:14,color:'#111827',outline:'none',boxSizing:'border-box' };
  const lbl: React.CSSProperties = { fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9CA3AF',display:'block',marginBottom:6,fontFamily:'IBM Plex Mono,monospace' };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'#fff',borderRadius:14,width:'100%',maxWidth:620,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
        <div style={{ padding:'20px 24px',borderBottom:'1px solid #F3F4F6',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0,background:'#fff',zIndex:1 }}>
          <div>
            <h2 style={{ fontSize:17,fontWeight:700 }}>New Rental</h2>
            <p style={{ fontSize:12,color:'#9CA3AF',marginTop:2 }}>Step {step} of 4</p>
          </div>
          <button onClick={onClose} style={{ width:30,height:30,borderRadius:'50%',border:'1px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontSize:16,color:'#6B7280' }}>×</button>
        </div>

        {/* Step indicators */}
        <div style={{ display:'flex',padding:'16px 24px',gap:8,borderBottom:'1px solid #F3F4F6' }}>
          {['Client','Asset','Dates','Payment'].map((l, i) => (
            <div key={l} style={{ flex:1,textAlign:'center',padding:'6px 4px',borderRadius:6,fontSize:12,fontWeight:step===i+1?700:400,background:step===i+1?'#EFF6FF':step>i+1?'#ECFDF5':'#F9FAFB',color:step===i+1?'#1D4ED8':step>i+1?'#065F46':'#9CA3AF',cursor:'pointer' }} onClick={() => setStep(i+1)}>
              {step > i+1 ? '✓ ' : ''}{l}
            </div>
          ))}
        </div>

        <div style={{ padding:'24px' }}>
          {step === 1 && (
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <h3 style={{ fontSize:15,fontWeight:700 }}>Client Information</h3>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[['client_name','Client Name *','Stallion Construction'],['client_phone','Phone','(646) 000-0000'],['client_email','Email','billing@company.com'],['client_address','Address','459 Underhill Ave, Bronx']].map(([k,l,p]) => (
                  <div key={k}><label style={lbl}>{l}</label><input style={inp} placeholder={p} value={(form as any)[k]} onChange={e => set(k, e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')} /></div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <h3 style={{ fontSize:15,fontWeight:700 }}>Equipment & Driver</h3>
              <div><label style={lbl}>Equipment *</label>
                <select style={{ ...inp,cursor:'pointer' }} value={form.asset} onChange={e => set('asset', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')}>
                  <option value="">Select equipment...</option>
                  <optgroup label="── Machines">{assets.filter(a=>a.category==='Machine').map(a=><option key={a.name}>{a.name}</option>)}</optgroup>
                  <optgroup label="── Tools">{assets.filter(a=>a.category==='Tool').map(a=><option key={a.name}>{a.name}</option>)}</optgroup>
                </select>
              </div>
              <div><label style={lbl}>Assigned Driver *</label>
                <select style={{ ...inp,cursor:'pointer' }} value={form.assigned_driver} onChange={e => set('assigned_driver', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')}>
                  <option value="">Select driver...</option>
                  {['Sams','Samu','Jose Luis'].map(d=><option key={d}>{d}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <h3 style={{ fontSize:15,fontWeight:700 }}>Rental Timeframe</h3>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div><label style={lbl}>Start Date *</label><input type="date" style={inp} value={form.start_date} onChange={e => set('start_date', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')} /></div>
                <div><label style={lbl}>Start Time</label><input type="time" style={inp} value={form.start_time} onChange={e => set('start_time', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')} /></div>
                <div><label style={lbl}>Duration (days) *</label><input type="number" min="1" style={inp} placeholder="3" value={form.duration_days} onChange={e => set('duration_days', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')} /></div>
                <div><label style={lbl}>Due Date (auto)</label><div style={{ ...inp,background:'#F9FAFB',color:dueDate()?'#111827':'#9CA3AF',fontFamily:'IBM Plex Mono,monospace',fontSize:13 }}>{dueDate() || 'Fill in above'}</div></div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              <h3 style={{ fontSize:15,fontWeight:700 }}>Payment & Notes</h3>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div><label style={lbl}>Price ($) *</label><input type="number" style={inp} placeholder="4500" value={form.price} onChange={e => set('price', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')} /></div>
                <div><label style={lbl}>Payment Status</label>
                  <select style={{ ...inp,cursor:'pointer' }} value={form.payment_status} onChange={e => set('payment_status', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')}>
                    <option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option>
                  </select>
                </div>
                <div><label style={lbl}>Payment Method</label>
                  <select style={{ ...inp,cursor:'pointer' }} value={form.payment_method} onChange={e => set('payment_method', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')}>
                    <option value="">Select...</option>
                    {['Cash','Check','Zelle','Venmo','Card (terminal)','Bank Transfer'].map(m=><option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Notes</label><textarea style={{ ...inp,minHeight:70,resize:'vertical' }} placeholder="RENT CAT 320 - 3 DAYS, DELIVERY..." value={form.notes} onChange={e => set('notes', e.target.value)} onFocus={e => (e.target.style.borderColor='#2563EB')} onBlur={e => (e.target.style.borderColor='#E5E7EB')} /></div>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding:'16px 24px',borderTop:'1px solid #F3F4F6',display:'flex',justifyContent:'space-between',alignItems:'center' }}>
          <button onClick={() => setStep(s => Math.max(1,s-1))} disabled={step===1} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,cursor:step===1?'not-allowed':'pointer',border:'1px solid #E5E7EB',background:'#fff',color:step===1?'#D1D5DB':'#374151' }}>← Back</button>
          <span style={{ fontSize:11,color:'#9CA3AF',fontFamily:'IBM Plex Mono,monospace' }}>{step}/4</span>
          {step < 4
            ? <button onClick={() => setStep(s => Math.min(4,s+1))} style={{ padding:'9px 18px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:'#2563EB',color:'#fff' }}>Continue →</button>
            : <button onClick={handleSave} disabled={saving} style={{ padding:'9px 20px',borderRadius:8,fontSize:13,fontWeight:600,cursor:saving?'not-allowed':'pointer',border:'none',background:saving?'#9CA3AF':'#111827',color:'#fff' }}>{saving?'Saving...':'Save Rental'}</button>
          }
        </div>
      </div>
    </div>
  );
}

// ── CLIENT PANEL ─────────────────────────────────────────────────────────────
function ClientPanel({ client, rentals, onClose }: { client: string; rentals: Rental[]; onClose: () => void }) {
  const history = rentals.filter(r => r.client_name === client);
  const totalPaid = history.filter(r => r.payment_status==='paid').reduce((s,r)=>s+r.price,0);
  const totalOwed = history.filter(r => r.payment_status!=='paid').reduce((s,r)=>s+r.price,0);
  const r0 = history[0];

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.25)',zIndex:200,backdropFilter:'blur(2px)' }}/>
      <div style={{ position:'fixed',top:0,right:0,bottom:0,width:460,background:'#fff',zIndex:201,boxShadow:'-8px 0 40px rgba(0,0,0,0.12)',overflowY:'auto' }}>
        <div style={{ padding:'20px 24px',borderBottom:'1px solid #F3F4F6',position:'sticky',top:0,background:'#fff',zIndex:1 }}>
          <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
            <div>
              <p style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#9CA3AF',fontFamily:'IBM Plex Mono,monospace',marginBottom:4 }}>Client Profile</p>
              <h2 style={{ fontSize:18,fontWeight:700 }}>{client}</h2>
            </div>
            <button onClick={onClose} style={{ width:28,height:28,borderRadius:'50%',border:'1px solid #E5E7EB',background:'#F9FAFB',cursor:'pointer',fontSize:15,color:'#6B7280' }}>×</button>
          </div>
          {r0 && (
            <div style={{ display:'flex',gap:8,marginTop:12 }}>
              <a href={`tel:${r0.client_phone?.replace(/\D/g,'')}`} style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,fontSize:12,fontWeight:600,background:'#EFF6FF',color:'#1D4ED8',textDecoration:'none',border:'1px solid #BFDBFE' }}>📞 Call</a>
              <a href={`mailto:${r0.client_email}`} style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:7,fontSize:12,fontWeight:600,background:'#F9FAFB',color:'#374151',textDecoration:'none',border:'1px solid #E5E7EB' }}>✉ Email</a>
            </div>
          )}
        </div>
        <div style={{ padding:'18px 24px',display:'flex',flexDirection:'column',gap:16 }}>
          {r0 && (
            <div style={{ background:'#F9FAFB',borderRadius:10,padding:'14px 16px',display:'flex',flexDirection:'column',gap:8 }}>
              {[['Phone',r0.client_phone],['Email',r0.client_email],['Address',r0.client_address]].map(([l,v])=>(
                <div key={l} style={{ display:'flex',gap:10 }}><span style={{ fontSize:11,color:'#9CA3AF',width:60,flexShrink:0 }}>{l}</span><span style={{ fontSize:12,fontWeight:500 }}>{v||'—'}</span></div>
              ))}
            </div>
          )}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
            {[{l:'Rentals',v:history.length,c:'#111827'},{l:'Total Paid',v:`$${totalPaid.toLocaleString()}`,c:'#065F46'},{l:'Balance Owed',v:`$${totalOwed.toLocaleString()}`,c:totalOwed>0?'#991B1B':'#065F46'}].map(s=>(
              <div key={s.l} style={{ background:'#fff',border:'1px solid #F3F4F6',borderRadius:8,padding:'10px 12px' }}>
                <p style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#9CA3AF',fontFamily:'IBM Plex Mono,monospace',marginBottom:5 }}>{s.l}</p>
                <p style={{ fontSize:18,fontWeight:700,color:s.c }}>{s.v}</p>
              </div>
            ))}
          </div>
          <h4 style={{ fontSize:13,fontWeight:700,marginBottom:4 }}>Rental History ({history.length})</h4>
          {history.map(r => (
            <div key={r.id} style={{ background:'#fff',border:'1px solid #F3F4F6',borderRadius:10,padding:'12px 14px',marginBottom:6 }}>
              <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                <div style={{ display:'flex',gap:6,alignItems:'center' }}>
                  <span style={{ fontSize:11,color:'#9CA3AF',fontFamily:'IBM Plex Mono,monospace' }}>{r.id}</span>
                  <span style={{ fontSize:13,fontWeight:700 }}>{r.asset}</span>
                </div>
                <PayBadge status={r.payment_status}/>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 12px',fontSize:11,color:'#6B7280' }}>
                <span>Due: {fmtDate(r.due_date)}</span>
                <span>Amount: <strong>${r.price.toLocaleString()}</strong></span>
                <span>Driver: {r.assigned_driver}</span>
                <span>Method: {r.payment_method||'—'}</span>
              </div>
              <div style={{ marginTop:8 }}>
                <a href={`${APP_URL}/portal/${r.portal_token}`} target="_blank" style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:5,fontSize:11,fontWeight:600,background:'#F0F7FF',color:'#2563EB',textDecoration:'none',border:'1px solid #BFDBFE' }}>
                  🔗 Portal Link
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<'dashboard'|'drivers'|'collections'|'invoice'>('dashboard');
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [extensions, setExtensions] = useState<ExtensionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewRental, setShowNewRental] = useState(false);
  const [clientPanel, setClientPanel] = useState<string|null>(null);
  const [search, setSearch] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [toast, setToast] = useState('');

  // Invoice state
  const [invNo, setInvNo] = useState('');
  const [invDate, setInvDate] = useState(new Date().toISOString().slice(0,10));
  const [invDue, setInvDue] = useState('');
  const [invClient, setInvClient] = useState('');
  const [invAddr, setInvAddr] = useState('');
  const [invCity, setInvCity] = useState('');
  const [invPhone, setInvPhone] = useState('');
  const [invMethod, setInvMethod] = useState('');
  const [invNotes, setInvNotes] = useState('');
  const [invTax, setInvTax] = useState('');
  const [invOther, setInvOther] = useState('');
  const [invItems, setInvItems] = useState([{id:1,desc:'',date:'',amount:''},{id:2,desc:'',date:'',amount:''}]);
  const [invNextId, setInvNextId] = useState(3);
  const [invPreview, setInvPreview] = useState(false);
  const [invPrefill, setInvPrefill] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('sams_user');
    if (!u) { router.push('/login'); return; }
    setUser(JSON.parse(u));
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from('rentals').select('*').order('created_at', { ascending: false }),
      supabase.from('extension_requests').select('*').eq('status','pending'),
    ]);
    if (r) setRentals(r);
    if (e) setExtensions(e);
    setLoading(false);
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const copyPortalLink = (token: string) => {
    navigator.clipboard.writeText(`${APP_URL}/portal/${token}`);
    showToast('Portal link copied to clipboard!');
  };

  const markPaid = async (id: string) => {
    await supabase.from('rentals').update({ payment_status: 'paid' }).eq('id', id);
    showToast('Marked as paid ✓');
    loadData();
  };

  const approveExtension = async (ext: ExtensionRequest) => {
    const rental = rentals.find(r => r.id === ext.rental_id);
    if (!rental) return;
    const newDue = new Date(rental.due_date);
    newDue.setDate(newDue.getDate() + ext.extra_days);
    await supabase.from('rentals').update({
      due_date: newDue.toISOString().slice(0,10),
      duration_days: rental.duration_days + ext.extra_days,
      price: rental.price + ext.extra_cost,
    }).eq('id', ext.rental_id);
    await supabase.from('extension_requests').update({ status:'approved', responded_at: new Date().toISOString() }).eq('id', ext.id);
    showToast('Extension approved ✓');
    loadData();
  };

  const denyExtension = async (id: string) => {
    await supabase.from('extension_requests').update({ status:'denied', responded_at: new Date().toISOString() }).eq('id', id);
    showToast('Extension denied');
    loadData();
  };

  // Invoice helpers
  const invSubtotal = invItems.reduce((s,i)=>s+(parseFloat(i.amount)||0),0);
  const invTaxAmt = parseFloat(invTax)||0;
  const invOtherAmt = parseFloat(invOther)||0;
  const invTotal = invSubtotal + invTaxAmt + invOtherAmt;
  const fmtMon = (n: number) => `$ ${n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
  const fmtD = (s: string) => s ? new Date(s+'T00:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
  const addInvRow = () => { setInvItems(p=>[...p,{id:invNextId,desc:'',date:'',amount:''}]); setInvNextId(n=>n+1); };
  const removeInvRow = (id: number) => setInvItems(p=>p.filter(i=>i.id!==id));
  const updateInvItem = (id: number, f: string, v: string) => setInvItems(p=>p.map(i=>i.id===id?{...i,[f]:v}:i));

  const prefillInvoice = (rid: string) => {
    setInvPrefill(rid);
    const r = rentals.find(x=>x.id===rid);
    if (!r) return;
    setInvNo(rid); setInvDate(r.start_date||''); setInvDue(r.due_date||'');
    setInvClient(r.client_name||''); setInvAddr(r.client_address||''); setInvCity('');
    setInvPhone(r.client_phone||''); setInvMethod(r.payment_method||''); setInvNotes(r.notes||'');
    setInvItems([{id:1,desc:r.asset||'',date:r.start_date||'',amount:String(r.price||'')},{id:2,desc:'',date:'',amount:''}]);
  };

  // Stats
  const active = rentals.filter(r=>r.rental_status==='active').length;
  const overdue = rentals.filter(r=>daysUntil(r.due_date)<0&&r.payment_status!=='paid').length;
  const paid = rentals.filter(r=>r.payment_status==='paid').length;
  const revenue = rentals.filter(r=>r.payment_status==='paid').reduce((s,r)=>s+r.price,0);
  const uniqueClients = [...new Set(rentals.map(r=>r.client_name))];
  const searchResults = search.length > 1 ? uniqueClients.filter(c=>c.toLowerCase().includes(search.toLowerCase())) : [];

  const inp: React.CSSProperties = { width:'100%',background:'#FAFAFA',border:'1px solid #E5E7EB',borderRadius:7,padding:'9px 11px',fontSize:13,color:'#111827',outline:'none',boxSizing:'border-box' };
  const lbl: React.CSSProperties = { fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9CA3AF',display:'block',marginBottom:5,fontFamily:'IBM Plex Mono,monospace' };

  if (loading) return (
    <div style={{ minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#F9FAFB' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:32,height:32,border:'3px solid #E5E7EB',borderTopColor:'#2563EB',borderRadius:'50%',animation:'spin 1s linear infinite',margin:'0 auto 12px' }}/>
        <p style={{ fontSize:14,color:'#9CA3AF' }}>Loading RentalHQ...</p>
      </div>
    </div>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{__html:"@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}"}} />

      {toast && <div style={{ position:'fixed',bottom:24,right:24,background:'#111827',color:'#fff',padding:'12px 20px',borderRadius:10,fontWeight:600,fontSize:14,zIndex:500,boxShadow:'0 8px 32px rgba(0,0,0,0.3)',animation:'fadeIn 0.3s ease' }}>{toast}</div>}

      {showNewRental && <NewRentalForm onSaved={() => { setShowNewRental(false); loadData(); showToast('Rental saved! Portal link ready to share.'); }} onClose={() => setShowNewRental(false)} />}

      {clientPanel && <ClientPanel client={clientPanel} rentals={rentals} onClose={() => setClientPanel(null)} />}

      {/* HEADER */}
      <header style={{ background:'#fff',borderBottom:'1px solid #E5E7EB',padding:'0 28px',display:'flex',alignItems:'center',justifyContent:'space-between',height:56,position:'sticky',top:0,zIndex:100,boxShadow:'0 1px 3px rgba(0,0,0,0.04)' }}>
        <div style={{ display:'flex',alignItems:'center',gap:20 }}>
          <div style={{ display:'flex',alignItems:'baseline',gap:6 }}>
            <span style={{ fontSize:14,fontWeight:700,color:'#111827' }}>Sams Construction</span>
            <span style={{ fontSize:10,fontWeight:600,color:'#2563EB',background:'#EFF6FF',padding:'2px 6px',borderRadius:4,fontFamily:'IBM Plex Mono,monospace' }}>RentalHQ</span>
          </div>
          <nav style={{ display:'flex',gap:2 }}>
            {[{id:'dashboard',label:'Dashboard'},{id:'drivers',label:'🚛 Drivers'},{id:'collections',label:'⚖️ Collections'},{id:'invoice',label:'📄 Invoice'}].map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)} style={{ padding:'5px 12px',borderRadius:6,fontSize:12,fontWeight:500,cursor:'pointer',border:'none',background:tab===t.id?'#F3F4F6':'transparent',color:tab===t.id?'#111827':'#6B7280' }}>{t.label}</button>
            ))}
          </nav>
        </div>
        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
          {overdue > 0 && <div style={{ display:'flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,background:'#FEF2F2',border:'1px solid #FCA5A5' }}><span style={{ width:6,height:6,borderRadius:'50%',background:'#EF4444',display:'inline-block',animation:'pulse 1.5s infinite' }}/><span style={{ fontSize:11,fontWeight:600,color:'#991B1B',fontFamily:'IBM Plex Mono,monospace' }}>{overdue} overdue</span></div>}
          {extensions.length > 0 && <div style={{ padding:'4px 10px',borderRadius:20,background:'#FFFBEB',border:'1px solid #FCD34D',fontSize:11,fontWeight:600,color:'#92400E',fontFamily:'IBM Plex Mono,monospace' }}>{extensions.length} extension req</div>}

          {/* Search */}
          <div style={{ position:'relative' }}>
            <div style={{ display:'flex',alignItems:'center',gap:6,padding:'6px 11px',borderRadius:8,border:'1px solid #E5E7EB',background:'#F9FAFB',cursor:'text' }} onClick={()=>setShowSearch(true)}>
              <span>🔍</span>
              <input value={search} onChange={e=>{setSearch(e.target.value);setShowSearch(true);}} onFocus={()=>setShowSearch(true)} placeholder="Search clients…" style={{ border:'none',background:'transparent',outline:'none',fontSize:12,width:120 }}/>
            </div>
            {showSearch && searchResults.length > 0 && (
              <div style={{ position:'absolute',top:'calc(100% + 4px)',right:0,width:260,background:'#fff',borderRadius:10,boxShadow:'0 8px 30px rgba(0,0,0,0.12)',border:'1px solid #F3F4F6',zIndex:300,overflow:'hidden' }}>
                {searchResults.map(c=>(
                  <button key={c} onClick={()=>{setClientPanel(c);setShowSearch(false);setSearch('');}} style={{ width:'100%',padding:'10px 14px',textAlign:'left',border:'none',background:'#fff',cursor:'pointer',borderBottom:'1px solid #F3F4F6',fontSize:13,fontWeight:600,color:'#111827' }} onMouseEnter={e=>(e.currentTarget.style.background='#F0F7FF')} onMouseLeave={e=>(e.currentTarget.style.background='#fff')}>{c}</button>
                ))}
              </div>
            )}
          </div>

          <button onClick={()=>setShowNewRental(true)} style={{ padding:'7px 14px',borderRadius:8,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',background:'#2563EB',color:'#fff' }}>+ New Rental</button>
          <div style={{ width:28,height:28,borderRadius:'50%',background:'#111827',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700,color:'#fff' }}>{user?.name?.[0]||'S'}</div>
        </div>
      </header>

      {showSearch && <div style={{ position:'fixed',inset:0,zIndex:99 }} onClick={()=>setShowSearch(false)}/>}

      {/* PAGE TITLE */}
      <div style={{ background:'#fff',borderBottom:'1px solid #F3F4F6',padding:'14px 28px' }}>
        <h1 style={{ fontSize:18,fontWeight:700,color:'#111827' }}>{tab==='dashboard'?'Rental Dashboard':tab==='drivers'?'Driver Tracking':tab==='collections'?'Collections & Lien Tracker':'Invoice Generator'}</h1>
        <p style={{ fontSize:11,color:'#9CA3AF',marginTop:2 }}>{tab==='dashboard'?'All rentals, alerts, and client management':tab==='drivers'?'Real-time driver status and job tracking':tab==='collections'?'Overdue accounts and legal action tools':'Fill in and generate professional invoices'}</p>
      </div>

      <main style={{ padding:'22px 28px',maxWidth:1400,margin:'0 auto' }}>

        {/* ── DASHBOARD TAB ── */}
        {tab === 'dashboard' && (
          <div>
            {/* Stats */}
            <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:22 }}>
              {[{l:'Active Rentals',v:active,sub:'Equipment out',a:false},{l:'Overdue',v:overdue,sub:'Need action now',a:overdue>0},{l:'Paid',v:paid,sub:'This month',a:false},{l:'Revenue',v:`$${revenue.toLocaleString()}`,sub:'Confirmed',a:false}].map((s,i)=>(
                <div key={i} style={{ background:'#fff',borderRadius:10,padding:'16px 18px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',border:'1px solid #F3F4F6' }}>
                  <p style={{ fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.07em',color:'#9CA3AF',marginBottom:6,fontFamily:'IBM Plex Mono,monospace' }}>{s.l}</p>
                  <p style={{ fontSize:26,fontWeight:700,color:s.a?'#DC2626':'#111827',lineHeight:1 }}>{s.v}</p>
                  <p style={{ fontSize:11,color:'#9CA3AF',marginTop:4 }}>{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Extension requests banner */}
            {extensions.length > 0 && (
              <div style={{ background:'#FFFBEB',border:'1px solid #FCD34D',borderRadius:10,padding:'14px 18px',marginBottom:18 }}>
                <h4 style={{ fontSize:13,fontWeight:700,color:'#92400E',marginBottom:10 }}>📅 Pending Extension Requests ({extensions.length})</h4>
                {extensions.map(ext => (
                  <div key={ext.id} style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid #FDE68A',flexWrap:'wrap',gap:8 }}>
                    <span style={{ fontSize:13,color:'#374151' }}><strong>{ext.client_name}</strong> — rental {ext.rental_id} — +{ext.extra_days} days (+${ext.extra_cost})</span>
                    <div style={{ display:'flex',gap:8 }}>
                      <button onClick={()=>approveExtension(ext)} style={{ padding:'5px 12px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',background:'#ECFDF5',color:'#065F46' }}>✓ Approve</button>
                      <button onClick={()=>denyExtension(ext.id)} style={{ padding:'5px 12px',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer',border:'none',background:'#FEF2F2',color:'#991B1B' }}>✕ Deny</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rentals table */}
            <div style={{ background:'#fff',borderRadius:11,overflow:'hidden',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',border:'1px solid #F3F4F6' }}>
              <div style={{ padding:'14px 18px',borderBottom:'1px solid #F3F4F6',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                <h3 style={{ fontSize:14,fontWeight:700 }}>All Rentals</h3>
                <span style={{ fontSize:10,color:'#9CA3AF',fontFamily:'IBM Plex Mono,monospace' }}>{rentals.length} records</span>
              </div>
              {rentals.length === 0 ? (
                <div style={{ padding:'48px',textAlign:'center',color:'#9CA3AF' }}>
                  <div style={{ fontSize:32,marginBottom:8 }}>📋</div>
                  <div style={{ fontSize:14,fontWeight:600,color:'#374151',marginBottom:4 }}>No rentals yet</div>
                  <div style={{ fontSize:12 }}>Click "+ New Rental" to get started</div>
                </div>
              ) : (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#FAFAFA' }}>
                        {['ID','Asset','Client','Driver','Due Date','Price','Payment','Status','Portal','Actions'].map(h=>(
                          <th key={h} style={{ padding:'9px 12px',textAlign:'left',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.06em',color:'#9CA3AF',borderBottom:'1px solid #F3F4F6',fontFamily:'IBM Plex Mono,monospace',whiteSpace:'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rentals.map((r,i)=>{
                        const d = daysUntil(r.due_date);
                        const rowBg = r.rental_status==='overdue'?'#FFFAFA':i%2===0?'#fff':'#FAFAFA';
                        return (
                          <tr key={r.id} style={{ background:rowBg }} onMouseEnter={e=>(e.currentTarget.style.background='#F0F7FF')} onMouseLeave={e=>(e.currentTarget.style.background=rowBg)}>
                            <td style={{ padding:'10px 12px',fontFamily:'IBM Plex Mono,monospace',fontSize:11,color:'#9CA3AF',borderBottom:'1px solid #F3F4F6' }}>{r.id}</td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6' }}><div style={{ fontWeight:600 }}>{r.asset}</div><div style={{ fontSize:10,color:'#9CA3AF' }}>{r.category}</div></td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6' }}>
                              <button onClick={()=>setClientPanel(r.client_name)} style={{ background:'none',border:'none',padding:0,cursor:'pointer',fontWeight:600,color:'#2563EB',fontSize:13,textDecoration:'underline',textDecorationColor:'#BFDBFE',fontFamily:'inherit' }}>{r.client_name}</button>
                              <div style={{ fontSize:10,color:'#9CA3AF',marginTop:1 }}>{r.client_phone}</div>
                            </td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6' }}><DriverBadge status={r.driver_status}/></td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6' }}>
                              <div style={{ fontFamily:'IBM Plex Mono,monospace',fontSize:11 }}>{r.due_date}</div>
                              <div style={{ fontSize:10,marginTop:1,fontWeight:d<=1?600:400,color:d<0?'#DC2626':d<=2?'#D97706':'#9CA3AF' }}>{d<0?`${Math.abs(d)}d overdue`:d===0?'Due today':`${d}d left`}</div>
                            </td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6',fontFamily:'IBM Plex Mono,monospace',fontWeight:600,fontSize:12 }}>${r.price.toLocaleString()}</td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6' }}><PayBadge status={r.payment_status}/></td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6' }}><StatusBadge status={r.rental_status}/></td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6' }}>
                              <button onClick={()=>copyPortalLink(r.portal_token)} style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'4px 8px',borderRadius:5,fontSize:11,fontWeight:600,background:'#F0F7FF',color:'#2563EB',border:'1px solid #BFDBFE',cursor:'pointer',whiteSpace:'nowrap' }}>🔗 Copy Link</button>
                            </td>
                            <td style={{ padding:'10px 12px',borderBottom:'1px solid #F3F4F6' }}>
                              <div style={{ display:'flex',gap:5 }}>
                                {r.payment_status !== 'paid' && <button onClick={()=>markPaid(r.id)} style={{ padding:'4px 8px',borderRadius:5,fontSize:11,fontWeight:600,background:'#ECFDF5',color:'#065F46',border:'none',cursor:'pointer',whiteSpace:'nowrap' }}>✓ Paid</button>}
                                <button onClick={()=>{prefillInvoice(r.id);setTab('invoice');}} style={{ padding:'4px 8px',borderRadius:5,fontSize:11,fontWeight:600,background:'#F9FAFB',color:'#374151',border:'1px solid #E5E7EB',cursor:'pointer' }}>📄</button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── DRIVERS TAB ── */}
        {tab === 'drivers' && (
          <div>
            <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:20,marginBottom:24 }}>
              {['Sams','Samu','Jose Luis'].map(driver => {
                const jobs = rentals.filter(r => r.assigned_driver === driver && r.rental_status !== 'completed');
                return (
                  <div key={driver} style={{ background:'#fff',borderRadius:12,border:'1px solid #F3F4F6',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',overflow:'hidden' }}>
                    <div style={{ padding:'14px 18px',borderBottom:'1px solid #F3F4F6',background:'#111827',display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <div style={{ width:32,height:32,borderRadius:'50%',background:'#374151',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:700,color:'#fff' }}>{driver[0]}</div>
                        <div><div style={{ fontSize:14,fontWeight:700,color:'#fff' }}>{driver}</div><div style={{ fontSize:10,color:'#9CA3AF' }}>Driver</div></div>
                      </div>
                      <div style={{ background:'#374151',padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:600,color:'#9CA3AF',fontFamily:'IBM Plex Mono,monospace' }}>{jobs.length} job{jobs.length!==1?'s':''}</div>
                    </div>
                    <div style={{ padding:'12px' }}>
                      {jobs.length === 0 ? (
                        <div style={{ textAlign:'center',padding:'20px',color:'#9CA3AF',fontSize:12 }}>No active jobs</div>
                      ) : jobs.map(r => (
                        <div key={r.id} style={{ background:'#F9FAFB',borderRadius:8,padding:'12px',marginBottom:8,border:'1px solid #F3F4F6' }}>
                          <div style={{ display:'flex',justifyContent:'space-between',marginBottom:6 }}>
                            <span style={{ fontSize:13,fontWeight:700 }}>{r.asset}</span>
                            <DriverBadge status={r.driver_status}/>
                          </div>
                          <div style={{ fontSize:11,color:'#6B7280',marginBottom:8,lineHeight:1.6 }}>
                            <div>{r.client_name}</div>
                            <div>{r.client_address}</div>
                            <div style={{ fontFamily:'IBM Plex Mono,monospace',marginTop:2 }}>Due: {r.due_date} · {daysUntil(r.due_date) < 0 ? `⚠️ ${Math.abs(daysUntil(r.due_date))}d overdue` : `${daysUntil(r.due_date)}d left`}</div>
                          </div>
                          <div style={{ display:'flex',gap:4,flexWrap:'wrap' }}>
                            <a href={`tel:${r.client_phone?.replace(/\D/g,'')}`} style={{ padding:'4px 8px',borderRadius:5,fontSize:11,fontWeight:600,background:'#EFF6FF',color:'#1D4ED8',textDecoration:'none',border:'1px solid #BFDBFE' }}>📞</a>
                            <a href={`https://maps.google.com?q=${encodeURIComponent(r.client_address||'')}`} target="_blank" style={{ padding:'4px 8px',borderRadius:5,fontSize:11,fontWeight:600,background:'#ECFDF5',color:'#065F46',textDecoration:'none',border:'1px solid #A7F3D0' }}>🗺 Map</a>
                            <span style={{ fontSize:11,color:'#9CA3AF',padding:'4px 8px',fontFamily:'IBM Plex Mono,monospace' }}>{r.id}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ padding:'12px',borderTop:'1px solid #F3F4F6' }}>
                      <a href={`/driver/${encodeURIComponent(driver)}`} target="_blank" style={{ display:'block',textAlign:'center',padding:'8px',borderRadius:7,fontSize:12,fontWeight:600,background:'#2563EB',color:'#fff',textDecoration:'none' }}>
                        Open Driver App →
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COLLECTIONS TAB ── */}
        {tab === 'collections' && (
          <div>
            <div style={{ background:'#FEF2F2',border:'1px solid #FCA5A5',borderRadius:10,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12 }}>
              <span style={{ fontSize:24 }}>⚖️</span>
              <div>
                <p style={{ fontSize:14,fontWeight:700,color:'#991B1B' }}>Collections Overview</p>
                <p style={{ fontSize:12,color:'#DC2626',marginTop:2 }}>Total outstanding: <strong>${rentals.filter(r=>r.payment_status!=='paid').reduce((s,r)=>s+r.price,0).toLocaleString()}</strong> across {rentals.filter(r=>r.payment_status!=='paid').length} unpaid rentals</p>
              </div>
            </div>

            {rentals.filter(r=>r.payment_status!=='paid').length === 0 ? (
              <div style={{ background:'#fff',borderRadius:12,padding:'48px',textAlign:'center',color:'#9CA3AF',border:'1px solid #F3F4F6' }}>
                <div style={{ fontSize:32,marginBottom:8 }}>✅</div>
                <div style={{ fontSize:14,fontWeight:600,color:'#374151' }}>All accounts current</div>
              </div>
            ) : (
              <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
                {rentals.filter(r=>r.payment_status!=='paid').map(r => {
                  const d = daysUntil(r.due_date);
                  const overdueDays = d < 0 ? Math.abs(d) : 0;
                  const stage = overdueDays === 0 ? 'Not yet due' : overdueDays < 7 ? '🟡 Reminder' : overdueDays < 14 ? '🟠 Warning' : overdueDays < 30 ? '🔴 Final Notice' : '⛔ Lien/Attorney';
                  const lienwBody = `NOTICE OF INTENT TO FILE MECHANIC'S LIEN\n\nDate: ${new Date().toLocaleDateString()}\n\nTO: ${r.client_name}\n${r.client_address}\n\nFROM: ${COMPANY}\n188-16 Woodhull Ave, Hollis NY 11423\nTel: 646-529-8499\n\nRE: Unpaid rental invoice — ${r.id}\n\nPlease be advised that ${COMPANY} intends to file a Mechanic's Lien against the property located at:\n\n${r.client_address}\n\nFor the unpaid amount of $${r.price.toLocaleString()} relating to equipment rental services rendered (${r.asset}, ${fmtDate(r.start_date)} to ${fmtDate(r.due_date)}).\n\nTo avoid the filing of this lien, full payment of $${r.price.toLocaleString()} must be received within 10 days of this notice.\n\nPayment can be made via:\n- Zelle: [YOUR ZELLE NUMBER]\n- Check payable to: ${COMPANY}\n\nFailure to pay will result in the filing of a formal Mechanic's Lien, which will encumber your property and prevent any sale or refinancing until this debt is satisfied. You will also be responsible for all legal and collection fees.\n\nSincerely,\n${COMPANY}\n646-529-8499\nsamsconstructionltd23@outlook.com`;

                  return (
                    <div key={r.id} style={{ background:'#fff',borderRadius:11,border:'1px solid #F3F4F6',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',padding:'16px 18px' }}>
                      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:10 }}>
                        <div>
                          <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:6,flexWrap:'wrap' }}>
                            <span style={{ fontSize:15,fontWeight:700 }}>{r.client_name}</span>
                            <span style={{ fontSize:12,color:'#9CA3AF',fontFamily:'IBM Plex Mono,monospace' }}>{r.id}</span>
                            <span style={{ fontSize:12,fontWeight:600 }}>{stage}</span>
                          </div>
                          <div style={{ fontSize:12,color:'#6B7280',lineHeight:1.7 }}>
                            <span style={{ fontFamily:'IBM Plex Mono,monospace',fontWeight:700,color:overdueDays>0?'#DC2626':'#374151',fontSize:14 }}>${r.price.toLocaleString()}</span>
                            {overdueDays > 0 && <span style={{ color:'#DC2626',marginLeft:8 }}>{overdueDays} days overdue</span>}
                            {overdueDays === 0 && <span style={{ color:'#9CA3AF',marginLeft:8 }}>Due: {r.due_date}</span>}
                            <span style={{ display:'block' }}>Equipment: {r.asset}</span>
                            <span>Phone: {r.client_phone}</span>
                          </div>
                        </div>
                        <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                          <a href={`tel:${r.client_phone?.replace(/\D/g,'')}`} style={{ padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:600,background:'#EFF6FF',color:'#1D4ED8',textDecoration:'none',border:'1px solid #BFDBFE' }}>📞 Call</a>
                          <button onClick={()=>copyPortalLink(r.portal_token)} style={{ padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:600,background:'#F0F7FF',color:'#2563EB',border:'1px solid #BFDBFE',cursor:'pointer' }}>🔗 Send Portal</button>
                          {overdueDays >= 7 && (
                            <button onClick={()=>{ window.location.href='mailto:'+r.client_email+'?subject=NOTICE OF INTENT TO FILE MECHANIC LIEN — '+r.id+'&body='+encodeURIComponent(lienwBody); }} style={{ padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:600,background:'#FEF2F2',color:'#991B1B',border:'1px solid #FCA5A5',cursor:'pointer' }}>⚖️ Send Lien Notice</button>
                          )}
                          {r.payment_status !== 'paid' && <button onClick={()=>markPaid(r.id)} style={{ padding:'6px 12px',borderRadius:6,fontSize:12,fontWeight:600,background:'#ECFDF5',color:'#065F46',border:'none',cursor:'pointer' }}>✓ Mark Paid</button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INVOICE TAB ── */}
        {tab === 'invoice' && (
          <div style={{ maxWidth:760,margin:'0 auto' }}>
            {invPreview ? (
              <div>
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20,flexWrap:'wrap',gap:10 }}>
                  <button onClick={()=>setInvPreview(false)} style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',border:'1px solid #E5E7EB',background:'#fff',color:'#374151' }}>← Edit</button>
                  <div style={{ display:'flex',gap:10,alignItems:'center' }}>
                    <span style={{ fontSize:12,color:'#9CA3AF' }}>Ctrl+P → <strong style={{ color:'#374151' }}>Save as PDF</strong></span>
                    <button onClick={()=>window.print()} style={{ padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:'#1D4ED8',color:'#fff' }}>🖨 Print / PDF</button>
                  </div>
                </div>
                <div id="printable" style={{ background:'#fff',border:'1px solid #ccc',padding:'32px 36px',fontFamily:'Arial,sans-serif',fontSize:13,color:'#111' }}>
                  <div style={{ fontSize:20,fontWeight:700,color:'#1D4ED8',marginBottom:12 }}>SAMS CONSTRUCTION SERVICES LTD</div>
                  <hr style={{ border:'none',borderTop:'2px solid #1D4ED8',marginBottom:16 }}/>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:0,marginBottom:16 }}>
                    <div style={{ fontSize:12,lineHeight:2 }}>
                      <div>188-16 WOODHULL AVE</div><div>Hollis NY 11423</div>
                      <div style={{ marginTop:6 }}>646 529 8499</div><div>BIC#4376</div>
                    </div>
                    <div>
                      <table style={{ width:'100%',borderCollapse:'collapse',marginBottom:8 }}>
                        <tbody>
                          <tr><td style={{ padding:'3px 8px',fontSize:12,color:'#555' }}>Invoice No.</td><td style={{ padding:'3px 8px',fontSize:12,fontWeight:600 }}>{invNo||'—'}</td></tr>
                          <tr><td style={{ padding:'3px 8px',fontSize:12,color:'#555' }}>Invoice Date:</td><td style={{ padding:'3px 8px',fontSize:12,fontWeight:600 }}>{fmtD(invDate)||'—'}</td></tr>
                        </tbody>
                      </table>
                      <table style={{ width:'100%',borderCollapse:'collapse',border:'1px solid #90BEE0' }}>
                        <tbody>
                          <tr style={{ background:'#D6E8F7' }}><td style={{ padding:'4px 8px',fontSize:12,fontWeight:600,width:80 }}>Bill to :</td><td style={{ padding:'4px 8px',fontSize:12,fontWeight:700 }}>{invClient}</td></tr>
                          <tr style={{ background:'#EAF4FB' }}><td style={{ padding:'4px 8px',fontSize:12,color:'#555' }}>Address:</td><td style={{ padding:'4px 8px',fontSize:12 }}><strong>{invAddr}</strong>{invCity?<><br/>{invCity}</>:''}</td></tr>
                          <tr style={{ background:'#D6E8F7' }}><td style={{ padding:'4px 8px',fontSize:12,color:'#555' }}>Phone</td><td style={{ padding:'4px 8px',fontSize:12,color:'#1D4ED8' }}>{invPhone}</td></tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <table style={{ width:'100%',borderCollapse:'collapse',marginBottom:0,border:'1px solid #90BEE0' }}>
                    <thead><tr style={{ background:'#1D4ED8' }}><th style={{ padding:'7px 10px',textAlign:'left',color:'#fff',fontSize:12,fontWeight:700,width:'55%' }}>Description</th><th style={{ padding:'7px 10px',textAlign:'center',color:'#fff',fontSize:12,fontWeight:700,width:'20%' }}>Date</th><th style={{ padding:'7px 10px',textAlign:'right',color:'#fff',fontSize:12,fontWeight:700,width:'25%' }}>Amount</th></tr></thead>
                    <tbody>
                      {invItems.filter(i=>i.desc||i.amount).map((item,idx)=>(
                        <tr key={item.id} style={{ borderBottom:'1px solid #BDD6E8',background:idx%2===0?'#fff':'#EAF4FB' }}>
                          <td style={{ padding:'6px 10px',fontSize:12,fontStyle:'italic' }}>{item.desc}</td>
                          <td style={{ padding:'6px 10px',fontSize:12,textAlign:'center' }}>{fmtD(item.date)||item.date}</td>
                          <td style={{ padding:'6px 10px',fontSize:12,textAlign:'right' }}>{item.amount?`$ ${parseFloat(item.amount).toLocaleString('en-US',{minimumFractionDigits:2})}`:''}</td>
                        </tr>
                      ))}
                      {Array.from({length:Math.max(0,8-invItems.filter(i=>i.desc||i.amount).length)}).map((_,i)=>(
                        <tr key={`e${i}`} style={{ borderBottom:'1px solid #BDD6E8',background:((invItems.filter(x=>x.desc||x.amount).length+i)%2===0)?'#fff':'#EAF4FB' }}><td style={{ padding:'6px 10px' }}>&nbsp;</td><td/><td/></tr>
                      ))}
                    </tbody>
                  </table>
                  <table style={{ width:'100%',borderCollapse:'collapse',borderLeft:'1px solid #90BEE0',borderRight:'1px solid #90BEE0' }}>
                    <tbody>
                      <tr style={{ borderBottom:'1px solid #BDD6E8' }}><td style={{ padding:'5px 10px',fontSize:12,color:'#555',width:'40%' }}>{invNotes?<em>{invNotes}</em>:''}</td><td style={{ padding:'5px 10px',fontSize:12,textAlign:'right',color:'#555',width:'35%' }}>Sales Tax</td><td style={{ padding:'5px 10px',fontSize:12,textAlign:'right',borderLeft:'2px solid #1D4ED8',width:'25%' }}>{invTaxAmt>0?fmtMon(invTaxAmt):''}</td></tr>
                      <tr style={{ borderBottom:'1px solid #BDD6E8' }}><td/><td style={{ padding:'5px 10px',fontSize:12,textAlign:'right',color:'#555' }}>Other</td><td style={{ padding:'5px 10px',fontSize:12,textAlign:'right',borderLeft:'2px solid #1D4ED8' }}>{invOtherAmt>0?fmtMon(invOtherAmt):''}</td></tr>
                    </tbody>
                  </table>
                  <table style={{ width:'100%',borderCollapse:'collapse',border:'1px solid #90BEE0' }}>
                    <tbody><tr style={{ background:'#D6E8F7' }}><td style={{ padding:'8px 10px',fontSize:13,fontWeight:700,textAlign:'right' }}>TOTAL</td><td style={{ padding:'8px 14px',fontSize:14,fontWeight:700,textAlign:'right',width:'25%' }}>${invTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</td></tr></tbody>
                  </table>
                  {invMethod&&<div style={{ marginTop:10,fontSize:11,color:'#555' }}>Payment Method: <strong>{invMethod}</strong></div>}
                </div>
              </div>
            ) : (
              <div>
                {rentals.length > 0 && (
                  <div style={{ background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:10,padding:'14px 18px',marginBottom:20,display:'flex',alignItems:'center',gap:12 }}>
                    <span>⚡</span>
                    <div style={{ flex:1 }}><p style={{ fontSize:13,fontWeight:600,color:'#1D4ED8' }}>Auto-fill from rental</p><p style={{ fontSize:12,color:'#3B82F6' }}>Pick a rental to fill in all details automatically.</p></div>
                    <select style={{ ...inp,width:'auto',minWidth:200,cursor:'pointer',background:'#fff' }} value={invPrefill} onChange={e=>prefillInvoice(e.target.value)}>
                      <option value="">Select rental...</option>
                      {rentals.map(r=><option key={r.id} value={r.id}>{r.id} — {r.client_name}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ background:'#fff',borderRadius:12,border:'1px solid #F3F4F6',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',overflow:'hidden' }}>
                  <div style={{ background:'#111827',padding:'16px 22px' }}><h3 style={{ fontSize:14,fontWeight:700,color:'#fff' }}>Invoice — Sams Construction Services LTD</h3><p style={{ fontSize:12,color:'#9CA3AF',marginTop:2 }}>Fill in details, preview, then print or save as PDF</p></div>
                  <div style={{ padding:'20px 22px',display:'flex',flexDirection:'column',gap:18 }}>
                    <div>
                      <p style={{ ...lbl,marginBottom:10 }}>Invoice Details</p>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
                        <div><label style={lbl}>Invoice No.</label><input style={inp} placeholder="332" value={invNo} onChange={e=>setInvNo(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                        <div><label style={lbl}>Invoice Date</label><input type="date" style={inp} value={invDate} onChange={e=>setInvDate(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                        <div><label style={lbl}>Due Date</label><input type="date" style={inp} value={invDue} onChange={e=>setInvDue(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                      </div>
                    </div>
                    <div>
                      <p style={{ ...lbl,marginBottom:10 }}>Bill To</p>
                      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                        <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Client Name</label><input style={inp} placeholder="Stallion Construction" value={invClient} onChange={e=>setInvClient(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                        <div style={{ gridColumn:'1/-1' }}><label style={lbl}>Address</label><input style={inp} placeholder="459 Underhill Ave" value={invAddr} onChange={e=>setInvAddr(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                        <div><label style={lbl}>City / State</label><input style={inp} placeholder="Bronx, NY" value={invCity} onChange={e=>setInvCity(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                        <div><label style={lbl}>Phone</label><input style={inp} placeholder="917-561-6594" value={invPhone} onChange={e=>setInvPhone(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                      </div>
                    </div>
                    <div>
                      <p style={{ ...lbl,marginBottom:10 }}>Line Items</p>
                      <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
                        <thead><tr style={{ background:'#F9FAFB' }}>{['Description','Date','Amount ($)',''].map((h,i)=>(<th key={i} style={{ padding:'7px 8px',textAlign:'left',fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:'#9CA3AF',borderBottom:'1px solid #E5E7EB',fontFamily:'IBM Plex Mono,monospace',width:i===1?'140px':i===2?'120px':i===3?'30px':'auto' }}>{h}</th>))}</tr></thead>
                        <tbody>
                          {invItems.map(item=>(
                            <tr key={item.id}>
                              <td style={{ padding:'4px 4px 4px 0' }}><input style={inp} placeholder="RENT CAT 320 - 3 DAYS" value={item.desc} onChange={e=>updateInvItem(item.id,'desc',e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></td>
                              <td style={{ padding:'4px' }}><input type="date" style={inp} value={item.date} onChange={e=>updateInvItem(item.id,'date',e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></td>
                              <td style={{ padding:'4px' }}><input type="number" min="0" step="0.01" style={inp} placeholder="0.00" value={item.amount} onChange={e=>updateInvItem(item.id,'amount',e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></td>
                              <td style={{ padding:'4px 0 4px 4px',textAlign:'center' }}>{invItems.length>1&&<button onClick={()=>removeInvRow(item.id)} style={{ background:'none',border:'none',cursor:'pointer',color:'#EF4444',fontSize:16 }}>×</button>}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button onClick={addInvRow} style={{ fontSize:12,color:'#2563EB',background:'none',border:'none',cursor:'pointer',fontWeight:600,padding:'8px 0' }}>+ Add line item</button>
                    </div>
                    <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:12 }}>
                      <div><label style={lbl}>Sales Tax ($)</label><input type="number" min="0" step="0.01" style={inp} placeholder="0.00" value={invTax} onChange={e=>setInvTax(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                      <div><label style={lbl}>Other ($)</label><input type="number" min="0" step="0.01" style={inp} placeholder="0.00" value={invOther} onChange={e=>setInvOther(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                      <div><label style={lbl}>Payment Method</label><select style={{ ...inp,cursor:'pointer' }} value={invMethod} onChange={e=>setInvMethod(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}><option value="">— Select —</option>{['Cash','Check','Zelle','Venmo','Card','Bank Transfer'].map(m=><option key={m}>{m}</option>)}</select></div>
                      <div><label style={lbl}>Notes</label><input style={inp} placeholder="not tax include $00" value={invNotes} onChange={e=>setInvNotes(e.target.value)} onFocus={e=>(e.target.style.borderColor='#2563EB')} onBlur={e=>(e.target.style.borderColor='#E5E7EB')}/></div>
                    </div>
                    <div style={{ background:'#F9FAFB',borderRadius:8,border:'1px solid #F3F4F6',padding:'12px 16px',display:'flex',justifyContent:'flex-end' }}>
                      <div style={{ fontSize:16,fontWeight:700,color:'#111827' }}>TOTAL: ${invTotal.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
                    </div>
                    <button onClick={()=>setInvPreview(true)} style={{ width:'100%',padding:'13px',background:'#111827',color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:'pointer' }}>👁 Preview Invoice</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
