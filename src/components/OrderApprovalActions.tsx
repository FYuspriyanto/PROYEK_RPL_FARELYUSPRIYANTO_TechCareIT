'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, XCircle } from 'lucide-react';

interface OrderApprovalActionsProps {
  orderId: string;
  estimatedCost: number;
}

/** Tombol Setuju / Tolak estimasi biaya — hanya tampil saat WAITING_APPROVAL. */
export default function OrderApprovalActions({ orderId, estimatedCost }: OrderApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleAction = async (action: 'APPROVE' | 'REJECT') => {
    if (
      action === 'REJECT' &&
      !confirm('Tolak estimasi biaya ini? Pesanan akan dibatalkan dan admin akan menindaklanjuti.')
    ) {
      return;
    }
    setLoading(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.message || 'Gagal memproses persetujuan' });
        return;
      }
      setMessage({ ok: true, text: data.message || 'Berhasil' });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: 'Terjadi kesalahan jaringan' });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(251, 191, 36, 0.07)',
        border: '1px solid rgba(251, 191, 36, 0.35)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        marginBottom: '2rem',
      }}
    >
      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: '0.35rem' }}>
        ⏰ Persetujuan Biaya Diperlukan
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.55 }}>
        Teknisi menetapkan estimasi biaya sebesar{' '}
        <strong style={{ color: '#34d399' }}>Rp {estimatedCost.toLocaleString('id-ID')}</strong>.
        Setujui untuk memulai perbaikan, atau tolak jika tidak sesuai.
      </p>

      {message && (
        <div
          style={{
            fontSize: '0.85rem',
            marginBottom: '1rem',
            padding: '0.6rem 0.9rem',
            borderRadius: 'var(--radius-md)',
            background: message.ok ? 'rgba(16,185,129,0.1)' : 'rgba(244,63,94,0.1)',
            border: `1px solid ${message.ok ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`,
            color: message.ok ? '#34d399' : '#fb7185',
          }}
        >
          {message.text}
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => handleAction('APPROVE')}
          disabled={loading !== null}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <CheckCircle2 size={16} />
          {loading === 'APPROVE' ? 'Memproses...' : 'Setujui & Mulai Perbaikan'}
        </button>
        <button
          onClick={() => handleAction('REJECT')}
          disabled={loading !== null}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fb7185' }}
        >
          <XCircle size={16} />
          {loading === 'REJECT' ? 'Memproses...' : 'Tolak Estimasi'}
        </button>
      </div>
    </div>
  );
}
