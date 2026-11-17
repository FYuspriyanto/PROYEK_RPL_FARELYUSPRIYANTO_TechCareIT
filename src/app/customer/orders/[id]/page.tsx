import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import {
  ChevronLeft,
  Wrench,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Laptop,
  Phone,
  Calendar,
  DollarSign,
  Printer,
  Sparkles,
} from 'lucide-react';
import OrderStatusTimeline from '@/components/OrderStatusTimeline';
import OrderApprovalActions from '@/components/OrderApprovalActions';

export const dynamic = 'force-dynamic';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();

  if (!session) {
    redirect(`/login?redirect=/customer/orders/${id}`);
  }

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profile: true,
        },
      },
      service: true,
      technician: true,
      invoice: true,
    },
  });

  if (!order) {
    notFound();
  }

  // STRICT AUTHORIZATION: Customer cannot access another customer's order
  if (session.role === 'CUSTOMER' && order.customerId !== session.id) {
    redirect('/customer/orders');
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <span className="badge badge-amber">1. Permintaan Dibuat</span>;
      case 'DIAGNOSING':
        return <span className="badge badge-indigo">2. Sedang Didiagnosa</span>;
      case 'WAITING_APPROVAL':
        return <span className="badge badge-amber">3. Menunggu Persetujuan Biaya</span>;
      case 'IN_PROGRESS':
        return <span className="badge badge-cyan">4. Sedang Dikerjakan</span>;
      case 'READY':
        return <span className="badge badge-emerald">5. Siap Diambil / Diantar</span>;
      case 'COMPLETED':
        return <span className="badge badge-emerald">6. Selesai & Bergaransi</span>;
      case 'CANCELLED':
        return <span className="badge badge-rose">Dibatalkan</span>;
      default:
        return <span className="badge badge-cyan">{status}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      {/* Back Button */}
      <Link
        href="/customer/orders"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.4rem',
          color: 'var(--accent-cyan)',
          fontSize: '0.9rem',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}
      >
        <ChevronLeft size={16} />
        <span>Kembali ke Daftar Pesanan</span>
      </Link>

      {/* Header Card */}
      <div
        className="glass-card"
        style={{
          padding: '2rem',
          marginBottom: '2rem',
          border: '1px solid rgba(56, 189, 248, 0.35)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '1.25rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '1.25rem',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
              <span className="badge badge-cyan">No. Tiket Perbaikan</span>
              <strong style={{ fontSize: '1.4rem', color: 'var(--accent-cyan)' }}>
                {order.orderNumber}
              </strong>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Dibuat: {new Date(order.createdAt).toLocaleString('id-ID')} &bull; Terakhir Diperbarui:{' '}
              {new Date(order.updatedAt).toLocaleString('id-ID')}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: '0.4rem' }}>{getStatusBadge(order.status)}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimasi Total Biaya</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
              Rp {(order.finalCost || order.estimatedCost || 0).toLocaleString('id-ID')}
            </div>
          </div>
        </div>

        {/* 6-Stage Visual Timeline Tracker */}
        <div>
          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              marginBottom: '1.25rem',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <Sparkles size={16} color="var(--accent-cyan)" />
            <span>Pelacakan Status Progres Servis (6 Tahapan):</span>
          </h3>

          <OrderStatusTimeline currentStatus={order.status} />
        </div>
      </div>

      {/* Approval actions — hanya saat menunggu persetujuan */}
      {order.status === 'WAITING_APPROVAL' && (
        <OrderApprovalActions
          orderId={order.id}
          estimatedCost={order.estimatedCost ?? order.finalCost ?? 0}
        />
      )}

      {/* Detail Specs & Information Grid */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Card 1: Device and Problem Report */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Laptop size={18} color="var(--accent-cyan)" />
            <span>Informasi Perangkat & Kerusakan</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Jenis Perangkat:</span>
              <strong style={{ color: '#fff' }}>{order.deviceType}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Merk (Brand):</span>
              <strong style={{ color: '#fff' }}>{order.deviceBrand}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Seri / Tipe Model:</span>
              <strong style={{ color: '#fff' }}>{order.deviceModel}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Paket Layanan:</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{order.service?.name}</span>
            </div>

            {order.preferredSchedule && (
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Jadwal Antar/Jemput:</span>
                <span style={{ color: 'var(--text-primary)' }}>{order.preferredSchedule}</span>
              </div>
            )}
          </div>

          <div style={{ marginTop: '1.25rem', background: 'rgba(15, 23, 42, 0.6)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Deskripsi Kerusakan yang Dilaporkan:
            </strong>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              {order.problemDescription}
            </p>
          </div>
        </div>

        {/* Card 2: Technician & Progress Update */}
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Wrench size={18} color="var(--accent-indigo)" />
            <span>Teknisi & Catatan Pengerjaan</span>
          </h3>

          {order.technician ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Nama Teknisi:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>{order.technician.name}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Spesialisasi:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{order.technician.specialization}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Kontak WhatsApp:</span>
                <span style={{ color: 'var(--accent-emerald)' }}>{order.technician.phone}</span>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: '#f59e0b', marginBottom: '1.25rem' }}>
              ⏳ Teknisi sedang dalam proses penugasan oleh Administrator.
            </div>
          )}

          <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
            <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
              Laporan / Update Diagnosa Teknisi:
            </strong>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {order.notes || 'Belum ada catatan teknis tambahan. Teknisi akan mengupdate setelah tahap diagnosa selesai.'}
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Details Card */}
      {order.invoice && (
        <div className="glass-card" style={{ padding: '1.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <FileText size={20} color="var(--accent-cyan)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Faktur Pembayaran (Invoice)</h3>
            </div>

            <span
              className={`badge ${
                order.invoice.paymentStatus === 'PAID' ? 'badge-emerald' : 'badge-amber'
              }`}
            >
              {order.invoice.paymentStatus === 'PAID' ? 'LUNAS (PAID)' : 'BELUM DIBAYAR (UNPAID)'}
            </span>
          </div>

          <div className="grid-3" style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>
                Nomor Faktur
              </span>
              <strong style={{ color: 'var(--accent-cyan)' }}>{order.invoice.invoiceNumber}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>
                Subtotal
              </span>
              <strong style={{ color: '#fff' }}>Rp {order.invoice.subtotal.toLocaleString('id-ID')}</strong>
            </div>

            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem', display: 'block' }}>
                Total Pembayaran
              </span>
              <strong style={{ color: '#34d399', fontSize: '1.15rem' }}>
                Rp {order.invoice.total.toLocaleString('id-ID')}
              </strong>
            </div>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            * Pembayaran dapat dilakukan langsung di workshop saat pengambilan unit atau melalui transfer konfirmasi teknisi.
          </p>
        </div>
      )}
    </div>
  );
}
