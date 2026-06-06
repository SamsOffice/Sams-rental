'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Rental } from '@/lib/supabase';

const COMPANY = 'Sams Construction Services LTD';
const ZELLE = '646-529-8499';

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
}
function fmtDate(s: string) {
  if (!s) return '—';
  return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

const EXTENSION_DAYS = [1, 2, 3, 7, 14];

export default function PortalPage({ params }: { params: { token: string } }) {
  const [rental, setRental] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [extDays, setExtDays] = useState(0);
  const [extRequested, setExtRequested] = useState(false);
  const [extLoading, setExtLoading] = useState(false);
  const [showPayInfo, setShowPayInfo] = useState(false);

  useEffect(() => {
    supabase
      .from('rentals')
      .select('*')
      .eq('portal_token', params.token)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setNotFound(true); }
        else { setRental(data); }
        setLoading(false);
      });
  }, [params.token]);

  const requestExtension = async () => {
    if (!rental || extDays === 0) return;
    setExtLoading(true);
    const dailyRate = rental.price / rental.duration_days;
    const extraCost = Math.round(dailyRate * extDays * 100) / 100;
    await supabase.from('extension_requests').insert({
      rental_id: rental.id,
      client_name: rental.client_name,
      extra_days: extDays,
      extra_cost: extraCost,
      status: 'pending',
    });
    setExtRequested(true);
    setExtLoading(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #E5E7EB', borderTopColor: '#2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>Loading your invoice...</p>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB', padding: 20 }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Invoice Not Found</h1>
        <p style={{ color: '#6B7280', marginBottom: 20 }}>This link may be invalid or expired. Please contact us directly.</p>
        <a href="tel:6465298499" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 9, background: '#2563EB', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>📞 Call 646-529-8499</a>
      </div>
    </div>
  );

  if (!rental) return null;

  const days = daysUntil(rental.due_date);
  const overdueDays = days < 0 ? Math.abs(days) : 0;
  const isPaid = rental.payment_status === 'paid';
  const dailyRate = rental.price / rental.duration_days;
  const extCost = extDays > 0 ? Math.round(dailyRate * extDays * 100) / 100 : 0;
  const progressPct = Math.max(0, Math.min(100, ((rental.duration_days - Math.max(0, days)) / rental.duration_days) * 100));

  const statusColor = isPaid ? '#065F46' : overdueDays > 0 ? '#991B1B' : days <= 2 ? '#92400E' : '#1D4ED8';
  const statusBg = isPaid ? '#ECFDF5' : overdueDays > 0 ? '#FEF2F2' : days <= 2 ? '#FFFBEB' : '#EFF6FF';
  const statusText = isPaid ? '✅ PAID IN FULL' : overdueDays > 0 ? `⚠️ ${overdueDays} DAYS OVERDUE` : days === 0 ? '⏰ DUE TODAY' : `${days} DAYS REMAINING`;

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', fontFamily: 'DM Sans, sans-serif' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #E5E7EB', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1D4ED8' }}>SAMS CONSTRUCTION SERVICES LTD</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>188-16 Woodhull Ave, Hollis NY 11423 · 646-529-8499</div>
        </div>
        <a href="tel:6465298499" style={{ padding: '8px 14px', borderRadius: 8, background: '#EFF6FF', color: '#1D4ED8', textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #BFDBFE' }}>📞 Call Us</a>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeIn 0.3s ease' }}>

        {/* Greeting */}
        <div>
          <p style={{ fontSize: 13, color: '#9CA3AF' }}>Hello,</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{rental.client_name}</h1>
        </div>

        {/* Status banner */}
        <div style={{ background: statusBg, border: `1px solid`, borderColor: isPaid ? '#A7F3D0' : overdueDays > 0 ? '#FCA5A5' : days <= 2 ? '#FCD34D' : '#BFDBFE', borderRadius: 12, padding: '16px 18px' }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: statusColor, marginBottom: 4 }}>{statusText}</div>
          {!isPaid && overdueDays === 0 && days > 0 && (
            <div style={{ fontSize: 12, color: '#6B7280' }}>Equipment due back on {fmtDate(rental.due_date)}</div>
          )}
          {overdueDays > 0 && !isPaid && (
            <div style={{ fontSize: 12, color: '#DC2626', marginTop: 4 }}>
              Please arrange payment or contact us immediately at 646-529-8499
            </div>
          )}
          {isPaid && <div style={{ fontSize: 12, color: '#065F46', marginTop: 4 }}>Thank you for your payment! No action needed.</div>}
        </div>

        {/* Progress bar (only if active) */}
        {!isPaid && (
          <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9CA3AF', marginBottom: 8 }}>
              <span>Started: {fmtDate(rental.start_date)}</span>
              <span>Due: {fmtDate(rental.due_date)}</span>
            </div>
            <div style={{ background: '#F3F4F6', borderRadius: 10, height: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progressPct}%`, background: overdueDays > 0 ? '#EF4444' : days <= 2 ? '#F59E0B' : '#2563EB', borderRadius: 10, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 6, textAlign: 'center' }}>
              {rental.duration_days} day rental · {overdueDays > 0 ? `${overdueDays} days past due` : `${days} days remaining`}
            </div>
          </div>
        )}

        {/* Invoice details */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: '#111827' }}>Rental Details</h3>
          {[
            ['Invoice', rental.id],
            ['Equipment', rental.asset],
            ['Category', rental.category],
            ['Start Date', fmtDate(rental.start_date)],
            ['Due Date', fmtDate(rental.due_date)],
            ['Duration', `${rental.duration_days} day${rental.duration_days !== 1 ? 's' : ''}`],
            ['Driver', rental.assigned_driver],
          ].map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #F9FAFB', fontSize: 13 }}>
              <span style={{ color: '#9CA3AF' }}>{label}</span>
              <span style={{ fontWeight: 500, color: '#111827', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 16, fontWeight: 700 }}>
            <span>Total Due</span>
            <span style={{ color: isPaid ? '#065F46' : '#111827' }}>${rental.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Payment section */}
        {!isPaid && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>💳 Pay Now</h3>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Amount due: <strong style={{ color: '#111827' }}>${rental.price.toLocaleString()}</strong></p>
            </div>
            <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Zelle */}
              <div style={{ background: '#F0F7FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#1D4ED8', marginBottom: 4 }}>Zelle</div>
                <div style={{ fontSize: 13, color: '#374151', marginBottom: 8 }}>Send payment to: <strong>{ZELLE}</strong></div>
                <button onClick={() => { navigator.clipboard.writeText(ZELLE); }} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 6, border: '1px solid #BFDBFE', background: '#fff', color: '#2563EB', cursor: 'pointer', fontWeight: 600 }}>
                  Copy Zelle Number
                </button>
              </div>

              {/* Check */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Check</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>Payable to: <strong style={{ color: '#111827' }}>{COMPANY}</strong></div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>Mail to: 188-16 Woodhull Ave, Hollis NY 11423</div>
              </div>

              {/* Cash */}
              <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 4 }}>Cash</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>Contact us to arrange cash payment upon equipment return.</div>
              </div>

              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#92400E' }}>
                ⚠️ After payment, please send confirmation to: <strong>samsconstructionltd23@outlook.com</strong> or call <strong>646-529-8499</strong>
              </div>
            </div>
          </div>
        )}

        {/* Extension request */}
        {!isPaid && (
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #F3F4F6' }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>📅 Need More Time?</h3>
              <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Request an extension — subject to availability and approval</p>
            </div>
            <div style={{ padding: '14px 18px' }}>
              {extRequested ? (
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>✅</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>Extension Requested!</div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>We'll review and contact you within 24 hours. Additional charges will apply.</div>
                </div>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 12 }}>Daily rate: <strong>${dailyRate.toFixed(2)}/day</strong></p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, marginBottom: 12 }}>
                    {EXTENSION_DAYS.map(d => (
                      <button key={d} onClick={() => setExtDays(extDays === d ? 0 : d)} style={{ padding: '10px 4px', borderRadius: 8, border: `2px solid ${extDays === d ? '#2563EB' : '#E5E7EB'}`, background: extDays === d ? '#EFF6FF' : '#F9FAFB', color: extDays === d ? '#1D4ED8' : '#374151', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                        {d}d
                      </button>
                    ))}
                  </div>
                  {extDays > 0 && (
                    <div style={{ background: '#F0F7FF', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
                      +{extDays} days · <strong>+${extCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> additional charge
                    </div>
                  )}
                  <button onClick={requestExtension} disabled={extDays === 0 || extLoading} style={{ width: '100%', padding: '13px', borderRadius: 9, background: extDays === 0 ? '#F3F4F6' : '#2563EB', color: extDays === 0 ? '#9CA3AF' : '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: extDays === 0 ? 'not-allowed' : 'pointer' }}>
                    {extLoading ? 'Sending...' : extDays === 0 ? 'Select days above' : `Request +${extDays} Day Extension`}
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Contact */}
        <div style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid #F3F4F6', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700 }}>Questions? Contact Us</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="tel:6465298499" style={{ flex: 1, padding: '12px', borderRadius: 9, background: '#EFF6FF', color: '#1D4ED8', textDecoration: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center', display: 'block' }}>📞 Call</a>
            <a href="mailto:samsconstructionltd23@outlook.com" style={{ flex: 1, padding: '12px', borderRadius: 9, background: '#F9FAFB', color: '#374151', textDecoration: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center', display: 'block', border: '1px solid #E5E7EB' }}>✉ Email</a>
          </div>
        </div>

        <p style={{ fontSize: 11, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.6 }}>
          {COMPANY} · 188-16 Woodhull Ave, Hollis NY 11423<br/>
          This invoice is private and only accessible via this link.
        </p>
      </div>
    </div>
  );
}
