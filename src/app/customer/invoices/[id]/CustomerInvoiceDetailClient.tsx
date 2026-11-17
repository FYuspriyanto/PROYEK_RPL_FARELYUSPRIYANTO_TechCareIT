'use client';

import Link from 'next/link';
import { ChevronLeft, Printer, CheckCircle2, Clock, AlertCircle, ShieldCheck } from 'lucide-react';
import PaymentConfirmActions from '@/components/PaymentConfirmActions';

interface CustomerInvoiceDetailClientProps {
  invoice: any;
}

export default function CustomerInvoiceDetailClient({ invoice }: CustomerInvoiceDetailClientProps) {
  const spareParts: { name: string; qty: number; unitPrice: number }[] =
    invoice.spareParts ? JSON.parse(invoice.spareParts) : [];

  const STATUS_CONFIG: Record<string, { cls: string; label: string; desc: string }> = {
    PAID:      { cls: 'badge-emerald', label: 'LUNAS',                  desc: 'Pembayaran telah dikonfirmasi.' },
    PENDING:   { cls: 'badge-indigo',  label: 'MENUNGGU KONFIRMASI',    desc: 'Transfer diterima, menunggu verifikasi admin.' },
    UNPAID:    { cls: 'badge-amber',   label: 'BELUM DIBAYAR',          desc: 'Silakan lakukan pembayaran sesuai metode yang dipilih.' },
    CANCELLED: { cls: 'badge-rose',    label: 'DIBATALKAN',             desc: 'Invoice ini telah dibatalkan.' },
  };
  const statusCfg = STATUS_CONFIG[invoice.paymentStatus] || STATUS_CONFIG.UNPAID;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }} className="no-print">
        <Link href="/customer/invoices" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.875rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Daftar Faktur
        </Link>
        <button
          onClick={() => window.print()}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <Printer size={16} /> Cetak / Simpan PDF
        </button>
      </div>

      {/* Invoice Document */}
      <div
        className="glass-card invoice-print-document"
        style={{ padding: '2.5rem', border: '1px solid rgba(56,189,248,0.25)', boxShadow: '0 0 30px rgba(56,189,248,0.08)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid rgba(56,189,248,0.25)' }}>
          <div>
            {/* Company */}
            <div style={{ fontSize: '1.4rem', fontWeight: 900, background: 'linear-gradient(135deg, #38bdf8, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '0.15rem' }}>
              TechCare IT Solutions
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Computer Service & IT Support Professional</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
              📍 Workshop TechCare · 📞 +62 821-xxxx-xxxx · techcare.id
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '0.05em', color: 'var(--accent-cyan)' }}>INVOICE</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
              Diterbitkan: {new Date(invoice.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        {/* Status Banner */}
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)', marginBottom: '1.75rem',
            background: invoice.paymentStatus === 'PAID' ? 'rgba(16,185,129,0.1)' : invoice.paymentStatus === 'PENDING' ? 'rgba(99,102,241,0.1)' : 'rgba(245,158,11,0.1)',
            border: `1px solid ${invoice.paymentStatus === 'PAID' ? 'rgba(16,185,129,0.3)' : invoice.paymentStatus === 'PENDING' ? 'rgba(99,102,241,0.3)' : 'rgba(245,158,11,0.3)'}`,
          }}
        >
          <span className={`badge ${statusCfg.cls}`}>{statusCfg.label}</span>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{statusCfg.desc}</span>
          {invoice.paymentMethod && (
            <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Metode: {invoice.paymentMethod}
            </span>
          )}
        </div>

        {/* Bill-to + Order Info */}
        <div className="grid-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>TAGIHAN KEPADA</div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>{invoice.order?.customer?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{invoice.order?.customer?.email}</div>
            {invoice.order?.customer?.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{invoice.order.customer.phone}</div>}
            {invoice.order?.customer?.profile?.address && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>{invoice.order.customer.profile.address}</div>}
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>DETAIL PERBAIKAN</div>
            <div style={{ fontSize: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <div><strong>No. Order:</strong> {invoice.order?.orderNumber}</div>
              <div><strong>Layanan:</strong> {invoice.order?.service?.name}</div>
              <div><strong>Perangkat:</strong> {invoice.order?.deviceBrand} {invoice.order?.deviceModel} ({invoice.order?.deviceType})</div>
              {invoice.order?.technician && <div><strong>Teknisi:</strong> {invoice.order.technician.name}</div>}
            </div>
          </div>
        </div>

        {/* Line Items Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                  {['#', 'Deskripsi', 'Qty', 'Harga Satuan', 'Total'].map((h) => (
                    <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: spareParts.length > 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>1</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>
                    Biaya Jasa Servis
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>{invoice.order?.service?.name}</div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>1</td>
                  <td style={{ padding: '0.85rem 1rem' }}>Rp {(invoice.serviceFee || 0).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700 }}>Rp {(invoice.serviceFee || 0).toLocaleString('id-ID')}</td>
                </tr>
                {spareParts.map((part, i) => (
                  <tr key={i} style={{ borderBottom: i < spareParts.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>{i + 2}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>Spare Part — {part.name}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>{part.qty}</td>
                    <td style={{ padding: '0.85rem 1rem' }}>Rp {part.unitPrice.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 600 }}>Rp {(part.qty * part.unitPrice).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.75rem' }}>
          <div style={{ minWidth: '280px' }}>
            {[
              { label: 'Subtotal', val: `Rp ${invoice.subtotal.toLocaleString('id-ID')}`, bold: false, color: 'var(--text-primary)' },
              ...(invoice.discount > 0 ? [{ label: 'Diskon', val: `- Rp ${invoice.discount.toLocaleString('id-ID')}`, bold: false, color: '#f59e0b' }] : []),
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-subtle)', fontSize: '0.875rem', color }}>
                <span>{label}</span><span>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', fontWeight: 900, fontSize: '1.25rem', color: '#34d399', borderTop: '2px solid rgba(52,211,153,0.3)', marginTop: '0.25rem' }}>
              <span>TOTAL</span><span>Rp {invoice.total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        </div>

        {/* Payment Info */}
        {invoice.paymentStatus !== 'PAID' && invoice.paymentStatus !== 'CANCELLED' && (
          <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
            <div style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '0.9rem' }}>📋 Informasi Pembayaran:</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              • <strong>Cash:</strong> Bayar langsung di workshop TechCare saat pengambilan perangkat.<br />
              • <strong>Bank Transfer:</strong> BCA — 1234-5678-90 · a.n. TechCare IT Solutions<br />
              &nbsp;&nbsp;Sertakan No. Order <strong>{invoice.order?.orderNumber}</strong> sebagai keterangan transfer.
            </div>
          </div>
        )}

        {/* Customer payment confirmation — hanya saat UNPAID */}
        {invoice.paymentStatus === 'UNPAID' && (
          <PaymentConfirmActions invoiceId={invoice.id} total={invoice.total} />
        )}

        {/* Notes */}
        {invoice.notes && (
          <div style={{ background: 'rgba(15,23,42,0.5)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', border: '1px solid var(--border-subtle)', marginBottom: '1.25rem' }}>
            <strong>Catatan: </strong>{invoice.notes}
          </div>
        )}

        {/* Warranty Footer */}
        {invoice.paymentStatus === 'PAID' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', fontSize: '0.85rem', color: '#34d399' }}>
            <ShieldCheck size={18} />
            <span><strong>Garansi 90 Hari</strong> berlaku sejak tanggal penerimaan unit. Simpan invoice ini sebagai bukti garansi.</span>
          </div>
        )}

        <div style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem' }}>
          Terima kasih telah mempercayakan perbaikan perangkat Anda kepada TechCare IT Solutions. 🙏
        </div>
      </div>

      <style>{`
        @media print {
          body { background: #fff !important; color: #000 !important; }
          .no-print { display: none !important; }
          .invoice-print-document {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
            background: #fff !important;
            color: #000 !important;
            padding: 2rem !important;
          }
          .badge { border: 1px solid #ccc !important; color: #000 !important; background: #f5f5f5 !important; }
        }
      `}</style>
    </div>
  );
}
