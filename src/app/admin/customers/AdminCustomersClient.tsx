'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search, Users, ArrowRight, Calendar, Package, Phone, Mail } from 'lucide-react';

interface AdminCustomersClientProps {
  customers: any[];
}

export default function AdminCustomersClient({ customers }: AdminCustomersClientProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return customers.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone || '').toLowerCase().includes(q)
    );
  }, [customers, search]);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Customer Management</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {filtered.length} dari {customers.length} pelanggan terdaftar
        </p>
      </div>

      {/* Search */}
      <div className="glass-card" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.75rem' }}>
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}
          />
          <input
            type="text"
            placeholder="Cari customer berdasarkan nama, email, atau nomor telepon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
      </div>

      {/* Customer Table */}
      {filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Users size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>Tidak Ada Customer Ditemukan</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Coba ubah kata kunci pencarian.
          </p>
        </div>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Kontak</th>
                <th>Alamat</th>
                <th>Total Order</th>
                <th>Bergabung</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => (
                <tr key={customer.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: 800,
                          color: '#fff',
                          flexShrink: 0,
                        }}
                      >
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{customer.name}</div>
                        <span className="badge badge-cyan" style={{ fontSize: '0.65rem' }}>CUSTOMER</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.825rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-secondary)' }}>
                        <Mail size={12} /> {customer.email}
                      </span>
                      {customer.phone && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-muted)' }}>
                          <Phone size={12} /> {customer.phone}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '180px' }}>
                    {customer.profile?.address || <span style={{ color: 'var(--text-muted)' }}>Belum diisi</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Package size={14} color="var(--accent-cyan)" />
                      <strong style={{ color: 'var(--accent-cyan)' }}>{customer._count?.orders ?? 0}</strong>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>order</span>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={12} />
                      {new Date(customer.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.775rem' }}
                    >
                      Detail <ArrowRight size={12} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
