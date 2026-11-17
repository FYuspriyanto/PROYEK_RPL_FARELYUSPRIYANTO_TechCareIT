import { redirect } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { FileText, ArrowRight, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CustomerInvoicesPage() {
  const session = await getSession();
  if (!session) redirect('/login?redirect=/customer/invoices');

  const ordersWithInvoices = await prisma.serviceOrder.findMany({
    where: {
      customerId: session.id,
      invoice: { isNot: null },
    },
    include: {
      invoice: true,
      service: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const invoices = ordersWithInvoices.map((order) => ({
    ...order.invoice!,
    orderNumber: order.orderNumber,
    serviceName: order.service?.name,
    deviceInfo: `${order.deviceBrand} ${order.deviceModel} (${order.deviceType})`,
    orderId: order.id,
  }));

  const totalPaid = invoices
    .filter((inv) => inv.paymentStatus === 'PAID')
    .reduce((sum, inv) => sum + inv.total, 0);

  const totalUnpaid = invoices
    .filter((inv) => ['UNPAID', 'PENDING'].includes(inv.paymentStatus))
    .reduce((sum, inv) => sum + inv.total, 0);

  const STATUS_CONFIG: Record<string, { cls: string; icon: any; label: string }> = {
    PAID:      { cls: 'badge-emerald', icon: CheckCircle2, label: 'LUNAS' },
    PENDING:   { cls: 'badge-indigo',  icon: Clock,        label: 'MENUNGGU KONFIRMASI' },
    UNPAID:    { cls: 'badge-amber',   icon: Clock,        label: 'BELUM DIBAYAR' },
    CANCELLED: { cls: 'badge-rose',    icon: AlertCircle,  label: 'DIBATALKAN' },
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Faktur & Pembayaran</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Riwayat tagihan dan status pelunasan servis perangkat Anda
        </p>
      </div>

      {/* Summary */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tagihan Menunggu Pembayaran</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f59e0b' }}>
            Rp {totalUnpaid.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Dapat dilunasi saat pengambilan unit atau via transfer
          </div>
        </div>

        <div className="glass-card" style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Sudah Dibayar</span>
            <CheckCircle2 size={20} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#34d399' }}>
            Rp {totalPaid.toLocaleString('id-ID')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Total pembayaran terverifikasi
          </div>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <FileText size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Belum Ada Faktur</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', maxWidth: '400px', margin: '0 auto 1.5rem auto' }}>
            Faktur akan diterbitkan oleh admin setelah diagnosa selesai.
          </p>
          <Link href="/customer/request" className="btn btn-primary btn-sm">
            Ajukan Servis Baru
          </Link>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>No. Faktur</th>
                <th>No. Pesanan</th>
                <th>Layanan & Perangkat</th>
                <th>Subtotal</th>
                <th>Diskon</th>
                <th>Total Tagihan</th>
                <th>Metode</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => {
                const cfg = STATUS_CONFIG[inv.paymentStatus] || { cls: 'badge-cyan', label: inv.paymentStatus, icon: Clock };
                return (
                  <tr key={inv.id}>
                    <td>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.82rem' }}>{inv.invoiceNumber}</strong>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>
                      <Link href={`/customer/orders/${inv.orderId}`} style={{ color: 'var(--accent-cyan)' }}>
                        {inv.orderNumber}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{inv.serviceName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{inv.deviceInfo}</div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>Rp {inv.subtotal.toLocaleString('id-ID')}</td>
                    <td style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
                      {inv.discount > 0 ? `- Rp ${inv.discount.toLocaleString('id-ID')}` : '-'}
                    </td>
                    <td>
                      <strong style={{ color: '#34d399', fontSize: '0.95rem' }}>
                        Rp {inv.total.toLocaleString('id-ID')}
                      </strong>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {(inv as any).paymentMethod || '-'}
                    </td>
                    <td>
                      <span className={`badge ${cfg.cls}`} style={{ fontSize: '0.7rem' }}>{cfg.label}</span>
                    </td>
                    <td>
                      <Link href={`/customer/invoices/${inv.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                        Lihat <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
