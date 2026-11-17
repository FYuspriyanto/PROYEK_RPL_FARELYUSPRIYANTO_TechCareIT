'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FileText, Plus, Search, ArrowRight, CheckCircle2, Clock,
  AlertCircle, X, Loader2, Trash2,
} from 'lucide-react';

interface AdminInvoicesClientProps {
  invoices: any[];
  ordersWithoutInvoice: any[];
}

const STATUS_MAP: Record<string, { cls: string; label: string }> = {
  UNPAID:    { cls: 'badge-amber',   label: 'BELUM BAYAR' },
  PENDING:   { cls: 'badge-indigo',  label: 'PENDING' },
  PAID:      { cls: 'badge-emerald', label: 'LUNAS' },
  CANCELLED: { cls: 'badge-rose',    label: 'DIBATALKAN' },
};

export default function AdminInvoicesClient({ invoices: initial, ordersWithoutInvoice }: AdminInvoicesClientProps) {
  const [invoices, setInvoices] = useState<any[]>(initial);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form state
  const [createForm, setCreateForm] = useState({
    orderId: '',
    serviceFee: '',
    discount: '0',
    paymentMethod: 'Cash' as 'Cash' | 'Bank Transfer',
    notes: '',
    spareParts: [] as { name: string; qty: string; unitPrice: string }[],
  });
  const [creating, setCreating] = useState(false);
  const [createFeedback, setCreateFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return invoices.filter((inv) => {
      const matchStatus = statusFilter === 'ALL' || inv.paymentStatus === statusFilter;
      const matchSearch = !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.order?.customer?.name?.toLowerCase().includes(q) ||
        inv.order?.orderNumber?.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [invoices, search, statusFilter]);

  // Calculate preview totals
  const previewServiceFee = parseFloat(createForm.serviceFee) || 0;
  const previewDiscount = parseFloat(createForm.discount) || 0;
  const previewPartsTotal = createForm.spareParts.reduce(
    (s, p) => s + (parseInt(p.qty) || 0) * (parseFloat(p.unitPrice) || 0), 0
  );
  const previewSubtotal = previewServiceFee + previewPartsTotal;
  const previewTotal = Math.max(0, previewSubtotal - previewDiscount);

  const addSparePart = () =>
    setCreateForm((p) => ({ ...p, spareParts: [...p.spareParts, { name: '', qty: '1', unitPrice: '' }] }));

  const removeSparePart = (i: number) =>
    setCreateForm((p) => ({ ...p, spareParts: p.spareParts.filter((_, idx) => idx !== i) }));

  const updateSparePart = (i: number, field: string, value: string) =>
    setCreateForm((p) => ({
      ...p,
      spareParts: p.spareParts.map((sp, idx) => idx === i ? { ...sp, [field]: value } : sp),
    }));

  const handleCreate = async () => {
    if (!createForm.orderId) { setCreateFeedback({ type: 'err', msg: 'Pilih order terlebih dahulu' }); return; }
    if (!createForm.serviceFee) { setCreateFeedback({ type: 'err', msg: 'Biaya servis wajib diisi' }); return; }

    setCreating(true);
    setCreateFeedback(null);

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: createForm.orderId,
          serviceFee: parseFloat(createForm.serviceFee) || 0,
          spareParts: createForm.spareParts.map((sp) => ({
            name: sp.name,
            qty: parseInt(sp.qty) || 1,
            unitPrice: parseFloat(sp.unitPrice) || 0,
          })).filter((sp) => sp.name),
          discount: parseFloat(createForm.discount) || 0,
          paymentMethod: createForm.paymentMethod,
          notes: createForm.notes || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setCreateFeedback({ type: 'err', msg: data.error || 'Gagal membuat invoice' });
      } else {
        setCreateFeedback({ type: 'ok', msg: 'Invoice berhasil dibuat!' });
        setInvoices((prev) => [data.data.invoice, ...prev]);
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateForm({ orderId: '', serviceFee: '', discount: '0', paymentMethod: 'Cash', notes: '', spareParts: [] });
          setCreateFeedback(null);
        }, 1200);
      }
    } catch {
      setCreateFeedback({ type: 'err', msg: 'Terjadi kesalahan jaringan' });
    } finally {
      setCreating(false);
    }
  };

  // Auto-fill service fee when order is picked
  const handleOrderSelect = (orderId: string) => {
    const order = ordersWithoutInvoice.find((o: any) => o.id === orderId);
    setCreateForm((p) => ({
      ...p,
      orderId,
      serviceFee: order?.service?.priceFrom?.toString() || order?.estimatedCost?.toString() || '',
    }));
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Invoice Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {filtered.length} invoice • {ordersWithoutInvoice.length} order belum dibuatkan invoice
          </p>
        </div>
        <button onClick={() => { setShowCreateModal(true); setCreateFeedback(null); }} className="btn btn-primary">
          <Plus size={16} /> Buat Invoice
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input type="text" placeholder="Cari no. invoice, customer, order..." value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingLeft: '2.4rem', fontSize: '0.875rem' }} />
          </div>
          {['ALL', 'UNPAID', 'PENDING', 'PAID', 'CANCELLED'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              style={{
                padding: '0.3rem 0.8rem', borderRadius: 'var(--radius-full)', fontSize: '0.78rem', fontWeight: 600,
                border: '1px solid', cursor: 'pointer', transition: 'all var(--transition-fast)',
                background: statusFilter === s ? 'rgba(56,189,248,0.18)' : 'transparent',
                borderColor: statusFilter === s ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                color: statusFilter === s ? 'var(--accent-cyan)' : 'var(--text-muted)',
              }}
            >{s}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <FileText size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Belum Ada Invoice</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Klik "Buat Invoice" untuk membuat invoice dari service order.</p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Invoice</th>
                <th>No. Order</th>
                <th>Customer</th>
                <th>Layanan</th>
                <th>Subtotal</th>
                <th>Diskon</th>
                <th>Total</th>
                <th>Metode Bayar</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const s = STATUS_MAP[inv.paymentStatus] || { cls: 'badge-cyan', label: inv.paymentStatus };
                return (
                  <tr key={inv.id}>
                    <td><strong style={{ color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>{inv.invoiceNumber}</strong></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{inv.order?.orderNumber}</td>
                    <td>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{inv.order?.customer?.name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{inv.order?.customer?.email}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{inv.order?.service?.name}</td>
                    <td style={{ fontSize: '0.85rem' }}>Rp {inv.subtotal.toLocaleString('id-ID')}</td>
                    <td style={{ fontSize: '0.85rem', color: '#f59e0b' }}>
                      {inv.discount > 0 ? `- Rp ${inv.discount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td><strong style={{ color: '#34d399', fontSize: '0.9rem' }}>Rp {inv.total.toLocaleString('id-ID')}</strong></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{inv.paymentMethod || '-'}</td>
                    <td><span className={`badge ${s.cls}`} style={{ fontSize: '0.7rem' }}>{s.label}</span></td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(inv.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </td>
                    <td>
                      <Link href={`/admin/invoices/${inv.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                        Kelola <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Invoice Modal */}
      {showCreateModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', overflowY: 'auto', padding: '2rem 1rem' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}
        >
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: '620px', padding: '2rem', border: '1px solid var(--border-accent)', boxShadow: '0 0 40px rgba(56,189,248,0.15)' }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Buat Invoice Baru</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {createFeedback && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: createFeedback.type === 'ok' ? 'rgba(16,185,129,0.12)' : 'rgba(244,63,94,0.1)', border: `1px solid ${createFeedback.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(244,63,94,0.3)'}`, borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: createFeedback.type === 'ok' ? '#34d399' : '#f87171' }}>
                {createFeedback.type === 'ok' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                {createFeedback.msg}
              </div>
            )}

            {/* Order Selector */}
            <div className="form-group">
              <label className="form-label">Pilih Service Order *</label>
              <select className="form-input" value={createForm.orderId} onChange={(e) => handleOrderSelect(e.target.value)}>
                <option value="">-- Pilih Order --</option>
                {ordersWithoutInvoice.map((o: any) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} — {o.customer?.name} ({o.deviceBrand} {o.deviceModel})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-2" style={{ gap: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Biaya Servis (Rp) *</label>
                <input type="number" className="form-input" value={createForm.serviceFee} onChange={(e) => setCreateForm((p) => ({ ...p, serviceFee: e.target.value }))} placeholder="Contoh: 350000" min={0} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Diskon (Rp)</label>
                <input type="number" className="form-input" value={createForm.discount} onChange={(e) => setCreateForm((p) => ({ ...p, discount: e.target.value }))} placeholder="0" min={0} />
              </div>
            </div>

            {/* Spare Parts */}
            <div style={{ margin: '1rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Spare Parts / Komponen</label>
                <button onClick={addSparePart} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                  <Plus size={13} /> Tambah Part
                </button>
              </div>
              {createForm.spareParts.map((sp, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 1fr 32px', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <input type="text" placeholder="Nama part" value={sp.name} onChange={(e) => updateSparePart(i, 'name', e.target.value)} className="form-input" style={{ fontSize: '0.82rem' }} />
                  <input type="number" placeholder="Qty" value={sp.qty} onChange={(e) => updateSparePart(i, 'qty', e.target.value)} className="form-input" style={{ fontSize: '0.82rem' }} min={1} />
                  <input type="number" placeholder="Harga satuan" value={sp.unitPrice} onChange={(e) => updateSparePart(i, 'unitPrice', e.target.value)} className="form-input" style={{ fontSize: '0.82rem' }} min={0} />
                  <button onClick={() => removeSparePart(i)} style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', cursor: 'pointer', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Metode Pembayaran</label>
                <select className="form-input" value={createForm.paymentMethod} onChange={(e) => setCreateForm((p) => ({ ...p, paymentMethod: e.target.value as any }))}>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Catatan</label>
                <input type="text" className="form-input" value={createForm.notes} onChange={(e) => setCreateForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Opsional" />
              </div>
            </div>

            {/* Total Preview */}
            <div style={{ background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.2)', borderRadius: 'var(--radius-md)', padding: '1rem 1.25rem', marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Kalkulasi Otomatis:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Biaya Servis</span>
                  <span>Rp {previewServiceFee.toLocaleString('id-ID')}</span>
                </div>
                {previewPartsTotal > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Spare Parts</span>
                    <span>Rp {previewPartsTotal.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.3rem' }}>
                  <span>Subtotal</span>
                  <span>Rp {previewSubtotal.toLocaleString('id-ID')}</span>
                </div>
                {previewDiscount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b' }}>
                    <span>Diskon</span>
                    <span>- Rp {previewDiscount.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1rem', color: '#34d399', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.3rem' }}>
                  <span>TOTAL</span>
                  <span>Rp {previewTotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-secondary" style={{ flex: 1 }}>Batal</button>
              <button onClick={handleCreate} disabled={creating} className="btn btn-primary" style={{ flex: 1 }}>
                {creating ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Membuat...</> : <><FileText size={15} /> Buat Invoice</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
