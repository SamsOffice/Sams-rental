'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Rental } from '@/lib/supabase';

const STATUS_FLOW = [
  { key: 'assigned',   label: '📋 Assigned',    next: 'on_the_way',  nextLabel: '🚛 On My Way'       },
  { key: 'on_the_way', label: '🚛 En Route',     next: 'picked_up',   nextLabel: '📦 I Picked It Up'  },
  { key: 'picked_up',  label: '📦 Picked Up',    next: 'delivered',   nextLabel: '✅ Delivered'        },
  { key: 'delivered',  label: '✅ Delivered',     next: null,          nextLabel: null                  },
];

function daysUntil(d: string) {
  return Math.ceil((new Date(d).getTime() - new Date().setHours(0,0,0,0)) / 86400000);
}

export default function DriverPage({ params }: { params: { name: string } }) {
  const driverName = decodeURIComponent(params.name);
  const [jobs, setJobs] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('rentals')
      .select('*')
      .eq('assigned_driver', driverName)
      .neq('rental_status', 'completed')
      .order('due_date', { ascending: true });
    if (data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (rentalId: string, newStatus: string) => {
    setUpdating(rentalId);
    await supabase.from('rentals').update({ driver_status: newStatus }).eq('id', rentalId);
    await supabase.from('driver_updates').insert({
      rental_id: rentalId,
      driver_name: driverName,
      status: newStatus,
      timestamp: new Date().toISOString(),
    });
    await load();
    setUpdating(null);
  };

  const statusConfig = (status: string) => STATUS_FLOW.find(s => s.key === status) || STATUS_FLOW[0];

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111827' }}>
      <div style={{ textAlign: 'center', color: '#fff' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🚛</div>
        <p style={{ color: '#9CA3AF', fontSize: 14 }}>Loading your jobs...</p>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#111827', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#1F2937', padding: '20px 20px 16px', borderBottom: '1px solid #374151' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 11, color: '#9CA3AF', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'IBM Plex Mono, monospace' }}>Driver App</p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>👷 {driverName}</h1>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Sams Construction Services LTD</p>
          </div>
          <div style={{ background: '#374151', padding: '8px 14px', borderRadius: 20, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{jobs.length}</div>
            <div style={{ fontSize: 10, color: '#9CA3AF' }}>Active Jobs</div>
          </div>
        </div>
      </div>

      {/* Jobs */}
      <div style={{ padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {jobs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>No jobs right now</div>
            <div style={{ fontSize: 14, color: '#9CA3AF' }}>Check back later or contact the office</div>
          </div>
        ) : jobs.map(job => {
          const days = daysUntil(job.due_date);
          const sc = statusConfig(job.driver_status);
          const isOverdue = days < 0;
          const isDueSoon = days <= 1 && days >= 0;

          return (
            <div key={job.id} style={{ background: '#1F2937', borderRadius: 14, overflow: 'hidden', border: `1px solid ${isOverdue ? '#7F1D1D' : isDueSoon ? '#78350F' : '#374151'}` }}>
              {/* Job header */}
              <div style={{ padding: '14px 16px', borderBottom: '1px solid #374151' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, color: '#6B7280', fontFamily: 'IBM Plex Mono, monospace' }}>{job.id}</span>
                  <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: isOverdue ? '#7F1D1D' : isDueSoon ? '#78350F' : '#374151', color: isOverdue ? '#FCA5A5' : isDueSoon ? '#FCD34D' : '#9CA3AF' }}>
                    {isOverdue ? `⚠️ ${Math.abs(days)}d overdue` : days === 0 ? '⏰ Due today' : `${days}d left`}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{job.asset}</h3>
                <p style={{ fontSize: 14, color: '#9CA3AF' }}>{job.client_name}</p>
              </div>

              {/* Job details */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  ['📍 Address', job.client_address || '—'],
                  ['📅 Due Date', job.due_date],
                  ['💳 Payment', job.payment_status.toUpperCase()],
                  ['💰 Amount', `$${job.price.toLocaleString()}`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 12, color: '#6B7280', width: 90, flexShrink: 0 }}>{label}</span>
                    <span style={{ fontSize: 12, color: label === '💳 Payment' ? (job.payment_status === 'paid' ? '#34D399' : '#F87171') : '#E5E7EB', fontWeight: label === '💳 Payment' ? 700 : 400 }}>{value}</span>
                  </div>
                ))}
                {job.notes && <div style={{ background: '#374151', borderRadius: 6, padding: '8px 10px', fontSize: 11, color: '#D1D5DB' }}>📝 {job.notes}</div>}
              </div>

              {/* Action buttons */}
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Current status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#9CA3AF' }}>Status:</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{sc.label}</span>
                </div>

                {/* Next status button */}
                {sc.next && (
                  <button
                    onClick={() => updateStatus(job.id, sc.next!)}
                    disabled={updating === job.id}
                    style={{
                      width: '100%', padding: '14px', borderRadius: 10, fontSize: 16, fontWeight: 700,
                      cursor: updating === job.id ? 'not-allowed' : 'pointer', border: 'none',
                      background: updating === job.id ? '#374151' : '#2563EB', color: '#fff',
                      transition: 'all 0.15s',
                    }}
                  >
                    {updating === job.id ? '⏳ Updating...' : `Tap when: ${sc.nextLabel}`}
                  </button>
                )}

                {job.driver_status === 'delivered' && (
                  <div style={{ background: '#064E3B', borderRadius: 10, padding: '14px', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#34D399' }}>
                    ✅ Delivered — Job Complete
                  </div>
                )}

                {/* Call & Map buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <a href={`tel:${job.client_phone?.replace(/\D/g, '')}`}
                    style={{ flex: 1, padding: '12px', borderRadius: 9, background: '#1D4ED8', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center', display: 'block' }}>
                    📞 Call Client
                  </a>
                  <a href={`https://maps.google.com?q=${encodeURIComponent(job.client_address || '')}`} target="_blank"
                    style={{ flex: 1, padding: '12px', borderRadius: 9, background: '#065F46', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600, textAlign: 'center', display: 'block' }}>
                    🗺 Directions
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid #374151', marginTop: 10 }}>
        <p style={{ fontSize: 11, color: '#6B7280' }}>Sams Construction Services LTD · 646-529-8499</p>
      </div>
    </div>
  );
}
