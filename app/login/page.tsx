'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const USERS = [
  { email: 'secretary@samsconstruction.com', password: 'sams2024', role: 'secretary', name: 'Secretary' },
  { email: 'owner@samsconstruction.com',     password: 'owner2024', role: 'owner',     name: 'Owner' },
];

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    await new Promise(r => setTimeout(r, 600));
    const user = USERS.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem('sams_user', JSON.stringify(user));
      router.push('/dashboard');
    } else {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 8,
    border: '1px solid #E5E7EB', background: '#F9FAFB',
    fontSize: 14, color: '#111827', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', marginBottom: 4 }}>
            Sams Construction Services LTD
          </div>
          <div style={{ fontSize: 12, color: '#9CA3AF', fontFamily: 'IBM Plex Mono, monospace' }}>
            Private Internal System
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 14, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #F3F4F6' }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Sign In</h1>
          <p style={{ fontSize: 13, color: '#9CA3AF', marginBottom: 24 }}>Staff access only — not public</p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Email</label>
              <input style={inp} type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Password</label>
              <input style={inp} type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#E5E7EB'} />
            </div>
            {error && <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#991B1B' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ padding: '12px', borderRadius: 9, background: loading ? '#9CA3AF' : '#2563EB', color: '#fff', border: 'none', fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 20, padding: '12px 14px', background: '#F9FAFB', borderRadius: 8, fontSize: 12, color: '#9CA3AF', lineHeight: 1.7 }}>
            <strong style={{ color: '#374151' }}>Staff credentials:</strong><br />
            Secretary: secretary@samsconstruction.com / sams2024<br />
            Owner: owner@samsconstruction.com / owner2024
          </div>
        </div>
      </div>
    </div>
  );
}
