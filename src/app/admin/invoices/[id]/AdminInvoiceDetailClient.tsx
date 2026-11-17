'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, FileText, Save, Printer, CheckCircle2,
  AlertCircle, Loader2, Trash2, Plus, DollarSign
} from 'lucide-react';

interface SparePart { name: string; qty: number; unitPrice: number; }

interface AdminInvoiceDetailClientProps {
  invoice: any;
}

const STATUS_OPTIONS = ['UNPAID', 'PENDING', 'PAID', 'CANCELLED'];

export default function AdminInvoiceDetailClient({ invoice }: AdminInvoiceDetailClientProps) {
  const router = useRouter();
  const isPaid = invoice.paymentStatus === 'PAID';

  const parsedParts: SparePart[] = invoice.spareParts ? JSON.parse(invoice.spareParts) : [];

  const [form, setForm] = useState({
    serviceFee: invoice.serviceFee?.toString() || '0',
    discount: invoice.discount?.toString() || '0',
    paymentStatus: invoice.paymentStatus,
    paymentMethod: invoice.paymentMethod || 'Cash',
    notes: invoice.notes || '',
    spareParts: parsedParts.map((p) => ({ name: p.name, qty: p.qty.toString(), unitPrice: p.unitPrice.toString() })),
  });

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  // Live totals
  const serviceFee = parseFloat(form.serviceFee) || 0;
  const discount = parseFloat(form.discount) || 0;
  const partsTotal = form.spareParts.reduce((s, p) => s + (parseInt(p.qty) || 0) * (parseFloat(p.unitPrice) || 0), 0);
  const subtotal = serviceFee + partsTotal;
  const total = Math.max(0, subtotal - discount);

  const addPart = () => setForm((p) => ({ ...p, spareParts: [...p.spareParts, { name: '', qty: '1', unitPrice: '' }] }));
  const removePart = (i: number) => setForm((p) => ({ ...p, spareParts: p.spareParts.filter((_, idx) => idx !== i) }));
  const updatePart = (i: number, field: string, value: string) =>
    setForm((p) => ({ ...p, spareParts: p.spareParts.map((sp, idx) => idx === i ? { ...sp, [field]: value } : sp) }));

  const handleSave = async () => {
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/invoices/${invoice.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceFee: parseFloat(form.serviceFee) || 0,
          spareParts: form.spareParts.map((sp) => ({
            name: sp.name,
            qty: parseInt(sp.qty) || 1,
            unitPrice: parseFloat(sp.unitPrice) || 0,
          })).filter((sp) => sp.name),
          discount: parseFloat(form.discount) || 0,
          paymentStatus: form.paymentStatus,
          paymentMethod: form.paymentMethod || null,
          notes: form.notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFeedback({ type: 'err', msg: data.error || 'Gagal menyimpan' });
      } else {
        setFeedback({ type: 'ok', msg: 'Invoice berhasil diperbarui!' });
        setTimeout(() => router.refresh(), 1200);
      }
    } catch {
      setFeedback({ type: 'err', msg: 'Terjadi kesalahan jaringan' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href="/admin/invoices" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.875rem', fontWeight: 600 }}>
          <ChevronLeft size={16} /> Daftar Invoice
        </Link>
        <button onClick={() => window.print()} className="btn btn-secondary">
          <Printer size={16} /> Cetak / Print
        </button>
      </div>

      {/* Invoice Header Card */}
      <div className="glass-card invoice-print-card" style={{ padding: '2rem', marginBottom: '1.5rem', border: '1px solid rgba(56,189,248,0.25)' }}>
        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
          <div>
            <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-cyan)', marginBottom: '0.25rem' }}>
              INVOICE
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>{invoice.invoiceNumber}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              Dibuat: {new Date(invoice.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Total Tagihan</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#34d399' }}>
              Rp {invoice.total.toLocaleString('id-ID')}
            </div>
            <span className={`badge ${invoice.paymentStatus === 'PAID' ? 'badge-emerald' : invoice.paymentStatus === 'PENDING' ? 'badge-indigo' : 'badge-amber'}`}>
              {invoice.paymentStatus}
            </span>
          </div>
        </div>

        {/* Customer + Order Info */}
        <div className="grid-2" style={{ gap: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>TAGIHAN KEPADA</div>
            <div style={{ fontWeight: 700 }}>{invoice.order?.customer?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{invoice.order?.customer?.email}</div>
            {invoice.order?.customer?.phone && <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{invoice.order.customer.phone}</div>}
            {invoice.order?.customer?.profile?.address && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{invoice.order.customer.profile.address}</div>}
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>DETAIL ORDER</div>
            <div style={{ fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <div><strong>No. Order:</strong> {invoice.order?.orderNumber}</div>
              <div><strong>Layanan:</strong> {invoice.order?.service?.name}</div>
              <div><strong>Perangkat:</strong> {invoice.order?.deviceBrand} {invoice.order?.deviceModel}</div>
              {invoice.order?.technician && <div><strong>Teknisi:</strong> {invoice.order.technician.name}</div>}
              {invoice.paymentMethod && <div><strong>Metode Bayar:</strong> {invoice.paymentMethod}</div>}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>RINCIAN BIAYA</div>
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15,23,42,0.6)' }}>
                  {['Deskripsi', 'Qty', 'Harga Satuan', 'Total'].map((h) => (
                    <th key={h} style={{ padding: '0.65rem 1rem', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Biaya Jasa Servis — {invoice.order?.service?.name}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>1</td>
                  <td style={{ padding: '0.75rem 1rem' }}>Rp {(invoice.serviceFee || 0).toLocaleString('id-ID')}</td>
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 700 }}>Rp {(invoice.serviceFee || 0).toLocaleString('id-ID')}</td>
                </tr>
                {parsedParts.map((part, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 1rem' }}>{part.name}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{part.qty}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>Rp {part.unitPrice.toLocaleString('id-ID')}</td>
                    <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>Rp {(part.qty * part.unitPrice).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <div style={{ minWidth: '260px', fontSize: '0.875rem' }}>
              {[
                { label: 'Subtotal', val: `Rp ${invoice.subtotal.toLocaleString('id-ID')}`, color: '#fff' },
                ...(invoice.discount > 0 ? [{ label: 'Diskon', val: `- Rp ${invoice.discount.toLocaleString('id-ID')}`, color: '#f59e0b' }] : []),
              ].map(({ label, val, color }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.3rem 0', borderBottom: '1px solid var(--border-subtle)', color }}>
                  <span>{label}</span><span>{val}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', fontWeight: 900, fontSize: '1.1rem', color: '#34d399' }}>
                <span>TOTAL</span><span>Rp {invoice.total.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </div>

        {invoice.notes && (
          <div style={{ background: 'rgba(15,23,42,0.5)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Catatan: </strong>{invoice.notes}
          </div>
        )}
      </div>

      {/* Admin Edit Panel */}
      <div className="glass-card no-print" style={{ padding: '2rem', border: '1px solid rgba(99,102,241,0.3)' }}>
        <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <DollarSign size={17} color="var(--accent-indigo)" /> Edit Invoice
          {isPaid && <span className="badge badge-emerald" style={{ marginLeft: '0.5rem', fontSize: '0.7rem' }}>PAID — Financial locked</span>}
        </h3>

        {feedback && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: feedback.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.1)', border: `1px solid ${feedback.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`, borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: feedback.type === 'ok' ? '#34d399' : '#f87171' }}>
            {feedback.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {feedback.msg}
          </div>
        )}

        <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Biaya Servis (Rp)</label>
            <input type="number" className="form-input" value={form.serviceFee} onChange={(e) => setForm((p) => ({ ...p, serviceFee: e.target.value }))} disabled={isPaid} min={0} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Diskon (Rp)</label>
            <input type="number" className="form-input" value={form.discount} onChange={(e) => setForm((p) => ({ ...p, discount: e.target.value }))} disabled={isPaid} min={0} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status Pembayaran</label>
            <select className="form-input" value={form.paymentStatus} onChange={(e) => setForm((p) => ({ ...p, paymentStatus: e.target.value }))}>
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Metode Pembayaran</label>
            <select className="form-input" value={form.paymentMethod} onChange={(e) => setForm((p) => ({ ...p, paymentMethod: e.target.value }))}>
              <option value="Cash">Cash</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>
        </div>

        {/* Spare parts edit */}
        {!isPaid && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Spare Parts</label>
              <button onClick={addPart} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}><Plus size={13} /> Tambah</button>
            </div>
            {form.spareParts.map((sp, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr 32px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                <input type="text" placeholder="Nama part" value={sp.name} onChange={(e) => updatePart(i, 'name', e.target.value)} className="form-input" style={{ fontSize: '0.82rem' }} />
                <input type="number" placeholder="Qty" value={sp.qty} onChange={(e) => updatePart(i, 'qty', e.target.value)} className="form-input" style={{ fontSize: '0.82rem' }} min={1} />
                <input type="number" placeholder="Harga satuan" value={sp.unitPrice} onChange={(e) => updatePart(i, 'unitPrice', e.target.value)} className="form-input" style={{ fontSize: '0.82rem' }} min={0} />
                <button onClick={() => removePart(i)} style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', cursor: 'pointer', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Live preview */}
        {!isPaid && (
          <div style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 'var(--radius-md)', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#34d399' }}>
              <span>Preview Total Baru:</span>
              <span>Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>
        )}

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label className="form-label">Catatan</label>
          <textarea className="form-input" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ width: '100%' }}>
          {saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Menyimpan...</> : <><Save size={15} /> Simpan Perubahan</>}
        </button>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          .no-print { display: none !important; }
          .invoice-print-card { box-shadow: none !important; border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; }
        }
      `}</style>
    </div>
  );
}
