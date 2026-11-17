'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet } from 'lucide-react';

interface PaymentConfirmActionsProps {
  invoiceId: string;
  total: number;
}

/** Konfirmasi pembayaran customer — UNPAID → PENDING, admin lalu verifikasi. */
export default function PaymentConfirmActions({ invoiceId, total }: PaymentConfirmActionsProps) {
  const router = useRouter();
  const [method, setMethod] = useState<'Cash' | 'Bank Transfer'>('Bank Transfer');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleConfirm = async () => {
    if (!confirm(`Konfirmasi pembayaran Rp ${total.toLocaleString('id-ID')} via ${method}?`)) return;
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/confirm-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: method }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ ok: false, text: data.message || 'Gagal mengonfirmasi pembayaran' });
        return;
      }
      setMessage({ ok: true, text: data.message || 'Berhasil' });
      router.refresh();
    } catch {
      setMessage({ ok: false, text: 'Terjadi kesalahan jaringan' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="no-print"
      style={{
        background: 'rgba(99, 102, 241, 0.07)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.25rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, fontSize: '0.95rem', marginBottom: '0.35rem' }}>
        <Wallet size={17} color="var(--accent-indigo)" />
        <span>Sudah Melakukan Pembayaran?</span>
      </div>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.55 }}>
        Setelah membayar, pilih metode lalu tekan konfirmasi. Admin akan memverifikasi
        dan Anda menerima notifikasi saat pembayaran dikonfirmasi.
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

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as 'Cash' | 'Bank Transfer')}
          className="form-input"
          style={{ maxWidth: '220px' }}
        >
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cash">Cash</option>
        </select>
        <button
          onClick={handleConfirm}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Mengirim...' : 'Konfirmasi Sudah Bayar'}
        </button>
      </div>
    </div>
  );
}
