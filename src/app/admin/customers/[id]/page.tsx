import { requireAdmin } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronLeft, User, Phone, Mail, MapPin, Calendar, Package,
  Wrench, FileText, CheckCircle2, Clock
} from 'lucide-react';
import OrderStatusTimeline from '@/components/OrderStatusTimeline';

export const dynamic = 'force-dynamic';

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requireAdmin().catch(() => null);
  if (!session) redirect('/login?redirect=/admin/customers');

  const customer = await prisma.user.findUnique({
    where: { id, role: 'CUSTOMER' },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      createdAt: true,
      profile: true,
      orders: {
        orderBy: { createdAt: 'desc' },
        include: {
          service: true,
          technician: true,
          invoice: true,
        },
      },
    },
  });

  if (!customer) notFound();

  const STATUS_BADGE: Record<string, string> = {
    REQUESTED: 'badge-amber',
    DIAGNOSING: 'badge-indigo',
    WAITING_APPROVAL: 'badge-amber',
    IN_PROGRESS: 'badge-cyan',
    READY: 'badge-emerald',
    COMPLETED: 'badge-emerald',
    CANCELLED: 'badge-rose',
  };

  const totalSpent = customer.orders
    .filter((o) => o.invoice?.paymentStatus === 'PAID')
    .reduce((sum, o) => sum + (o.invoice?.total || 0), 0);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto' }}>
      <Link
        href="/admin/customers"
        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-cyan)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem' }}
      >
        <ChevronLeft size={16} /> Kembali ke Daftar Customer
      </Link>

      {/* Customer Profile Card */}
      <div
        className="glass-card"
        style={{ padding: '2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', border: '1px solid rgba(56,189,248,0.25)' }}
      >
        <div
          style={{
            width: 72, height: 72, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '2rem', fontWeight: 800, color: '#fff', flexShrink: 0,
            boxShadow: '0 0 20px rgba(56,189,248,0.3)',
          }}
        >
          {customer.name.charAt(0).toUpperCase()}
        </div>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{customer.name}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', marginTop: '0.4rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Mail size={13} /> {customer.email}
            </span>
            {customer.phone && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Phone size={13} /> {customer.phone}
              </span>
            )}
            {customer.profile?.address && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <MapPin size={13} /> {customer.profile.address}
              </span>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Calendar size={13} /> Bergabung {new Date(customer.createdAt).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>{customer.orders.length}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Order</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
              Rp {(totalSpent / 1_000_000).toFixed(1)}jt
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Total Dibayar</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f59e0b' }}>
              {customer.orders.filter((o) => o.status === 'COMPLETED').length}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Selesai</div>
          </div>
        </div>
      </div>

      {/* Service History */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Package size={18} color="var(--accent-cyan)" /> Riwayat Pesanan Servis
        </h2>

        {customer.orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
            <Package size={32} style={{ margin: '0 auto 0.75rem auto' }} />
            <p>Belum ada riwayat pesanan.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {customer.orders.map((order) => (
              <div
                key={order.id}
                style={{
                  padding: '1.25rem',
                  background: 'rgba(15,23,42,0.5)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.85rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                      <strong style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem' }}>{order.orderNumber}</strong>
                      <span className={`badge ${STATUS_BADGE[order.status] || 'badge-cyan'}`} style={{ fontSize: '0.68rem' }}>
                        {order.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#34d399' }}>
                      Rp {(order.finalCost || order.estimatedCost || 0).toLocaleString('id-ID')}
                    </div>
                    <span className={`badge ${order.invoice?.paymentStatus === 'PAID' ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.65rem' }}>
                      {order.invoice?.paymentStatus || 'NO INVOICE'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
                  <span><strong>Perangkat:</strong> {order.deviceBrand} {order.deviceModel} ({order.deviceType})</span>
                  <span><strong>Layanan:</strong> {order.service?.name}</span>
                  {order.technician && <span><strong>Teknisi:</strong> {order.technician.name}</span>}
                </div>

                <div style={{ marginTop: '0.75rem', textAlign: 'right' }}>
                  <Link href={`/admin/orders/${order.id}`} className="btn btn-outline btn-sm" style={{ fontSize: '0.75rem' }}>
                    Kelola Order
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
