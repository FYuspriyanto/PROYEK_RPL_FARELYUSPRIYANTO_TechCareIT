'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Cpu, Lock, Mail, ArrowRight, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const errorParam = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === 'unauthorized_admin_access'
      ? 'Akses ditolak: Akun Customer tidak memiliki izin mengakses area Admin.'
      : ''
  );

  const handleFillCredentials = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Gagal login. Periksa kembali email dan password Anda.');
        setLoading(false);
        return;
      }

      // Success -> Redirect to destination or role default
      const destination = redirectParam || data.data?.redirectTo || '/customer/dashboard';
      router.push(destination);
      router.refresh();
    } catch (err: any) {
      setErrorMessage('Terjadi kendala jaringan saat menghubungi server.');
      setLoading(false);
    }
  };

  return (
    <div className="glass-card">
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>
        Masuk Akun
      </h2>

      {errorMessage && (
        <div
          style={{
            background: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fb7185',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.65rem',
            marginBottom: '1.25rem',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label" htmlFor="email-input">
            Alamat Email
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="email-input"
              type="email"
              required
              placeholder="nama@email.com"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="password-input">
            Kata Sandi (Password)
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="password-input"
              type="password"
              required
              placeholder="••••••••"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '0.75rem' }}
        >
          {loading ? 'Memverifikasi...' : 'Masuk Sekarang'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </form>

      {/* Quick Demo Accounts */}
      <div
        style={{
          marginTop: '1.75rem',
          paddingTop: '1.5rem',
          borderTop: '1px solid var(--border-subtle)',
        }}
      >
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}
        >
          Akun Uji Coba Cepat (Seed Accounts):
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleFillCredentials('admin@techcare.id', 'AdminPassword123!')}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
          >
            <ShieldCheck size={16} style={{ color: 'var(--accent-cyan)' }} />
            <span>
              <strong>Admin:</strong> admin@techcare.id
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFillCredentials('budi@gmail.com', 'Customer123!')}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
          >
            <UserCheck size={16} style={{ color: 'var(--accent-emerald)' }} />
            <span>
              <strong>Customer 1 (Budi):</strong> budi@gmail.com
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFillCredentials('siti@gmail.com', 'Customer123!')}
            className="btn btn-secondary btn-sm"
            style={{ justifyContent: 'flex-start', textAlign: 'left', width: '100%' }}
          >
            <UserCheck size={16} style={{ color: 'var(--accent-indigo)' }} />
            <span>
              <strong>Customer 2 (Siti):</strong> siti@gmail.com
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '460px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontWeight: 800,
              fontSize: '1.5rem',
              marginBottom: '0.5rem',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 0 15px rgba(56, 189, 248, 0.4)',
              }}
            >
              <Cpu size={24} />
            </div>
            <span>
              Tech<span className="text-gradient">Care</span>
            </span>
          </Link>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Masuk ke portal layanan & manajemen servis IT
          </p>
        </div>

        <Suspense fallback={<div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>Memuat form...</div>}>
          <LoginForm />
        </Suspense>

        {/* Footer Link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Belum memiliki akun?{' '}
          <Link href="/register" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Daftar Customer Baru
          </Link>
        </p>
      </div>
    </div>
  );
}

