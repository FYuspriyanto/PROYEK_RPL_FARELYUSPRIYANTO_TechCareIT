'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Cpu, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Gagal mendaftar akun. Periksa input data Anda.');
        setLoading(false);
        return;
      }

      setSuccessMessage('Registrasi berhasil! Mengalihkan ke dashboard...');
      setTimeout(() => {
        router.push(data.data?.redirectTo || '/customer/dashboard');
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan jaringan saat mendaftar.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1rem',
      }}
    >
      <div style={{ width: '100%', maxWidth: '520px' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
            Buat akun customer untuk memesan & melacak servis IT
          </p>
        </div>

        {/* Card Form */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.25rem' }}>
            Registrasi Customer Baru
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

          {successMessage && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                marginBottom: '1.25rem',
              }}
            >
              <CheckCircle2 size={18} />
              <div>{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Nama Lengkap
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Contoh: Rian Pratama"
                className="form-input"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Alamat Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="rian@example.com"
                className="form-input"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                Kata Sandi (Min. 8 Karakter)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">
                Nomor WhatsApp / HP
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="08123456789"
                className="form-input"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="address">
                Alamat Lengkap Domisili
              </label>
              <textarea
                id="address"
                name="address"
                rows={2}
                placeholder="Jl. Gatot Subroto No. 20, Jakarta Selatan"
                className="form-input"
                style={{ resize: 'vertical' }}
                value={formData.address}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              {loading ? 'Memproses Pendaftaran...' : 'Daftar Sekarang'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <p
          style={{
            textAlign: 'center',
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Sudah punya akun?{' '}
          <Link href="/login" style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>
            Masuk di Sini
          </Link>
        </p>
      </div>
    </div>
  );
}
