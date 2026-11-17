'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Cpu,
  LayoutDashboard,
  Wrench,
  PlusCircle,
  Package,
  FileText,
  Bot,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

interface CustomerPortalLayoutClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    phone: string | null;
    address: string | null;
    orderCount: number;
  };
  unreadNotifications?: number;
  children: React.ReactNode;
}

export default function CustomerPortalLayoutClient({
  user,
  unreadNotifications = 0,
  children,
}: CustomerPortalLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  };

  const navItems = [
    {
      label: 'Dashboard',
      href: '/customer/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      label: 'Katalog Services',
      href: '/services',
      icon: Wrench,
      badge: null,
    },
    {
      label: 'Ajukan Servis (Request)',
      href: '/customer/request',
      icon: PlusCircle,
      badge: 'Baru',
      badgeColor: 'badge-cyan',
    },
    {
      label: 'Pesanan Saya (My Orders)',
      href: '/customer/orders',
      icon: Package,
      badge: user.orderCount > 0 ? `${user.orderCount}` : null,
      badgeColor: 'badge-indigo',
    },
    {
      label: 'Faktur & Pembayaran (Invoice)',
      href: '/customer/invoices',
      icon: FileText,
      badge: null,
    },
    {
      label: 'AI Diagnostic Assistant',
      href: '/customer/ai',
      icon: Bot,
      badge: 'Smart AI',
      badgeColor: 'badge-emerald',
    },
    {
      label: 'Notifikasi',
      href: '/customer/notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? `${unreadNotifications}` : null,
      badgeColor: 'badge-amber',
    },
    {
      label: 'Profil Akun',
      href: '/customer/profile',
      icon: User,
      badge: null,
    },
  ];

  const isActive = (href: string) => {
    if (href === '/services') {
      return pathname.startsWith('/services');
    }
    return pathname === href || (href !== '/customer/dashboard' && pathname.startsWith(href));
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header
        style={{
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'rgba(10, 13, 20, 0.9)',
          backdropFilter: 'blur(16px)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '66px',
            padding: '0 1.5rem',
          }}
        >
          {/* Mobile Menu Button + Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn btn-secondary btn-sm mobile-toggle"
              style={{ padding: '0.4rem', display: 'none' }}
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link
              href="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                fontWeight: 800,
                fontSize: '1.25rem',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  boxShadow: '0 0 12px rgba(56, 189, 248, 0.35)',
                }}
              >
                <Cpu size={20} />
              </div>
              <span>
                Tech<span className="text-gradient">Care</span>
              </span>
              <span
                className="badge badge-cyan"
                style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem', marginLeft: '0.25rem' }}
              >
                Portal Customer
              </span>
            </Link>
          </div>

          {/* User Info & Quick Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link
              href="/customer/request"
              className="btn btn-primary btn-sm header-action-btn"
              style={{ display: 'flex' }}
            >
              <PlusCircle size={15} />
              <span>Ajukan Servis</span>
            </Link>

            {/* Notification Bell */}
            <NotificationBell initialUnreadCount={unreadNotifications} />

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                padding: '0.35rem 0.75rem',
                background: 'rgba(17, 23, 38, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #38bdf8, #6366f1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {user.name.charAt(0)}
              </div>
              <div style={{ textAlign: 'left', lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Customer</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="btn btn-secondary btn-sm"
              style={{ color: '#fb7185', padding: '0.45rem 0.75rem' }}
              title="Keluar dari akun"
            >
              <LogOut size={15} />
              <span className="logout-text">{loggingOut ? '...' : 'Keluar'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Body (Sidebar + Content) */}
      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {/* Left Sidebar */}
        <aside
          style={{
            width: '270px',
            backgroundColor: 'rgba(14, 19, 32, 0.85)',
            backdropFilter: 'blur(12px)',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '1.5rem 1rem',
            flexShrink: 0,
          }}
          className={`portal-sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}
        >
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '0 0.75rem 0.6rem 0.75rem',
              }}
            >
              Menu Layanan Pelanggan
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {navItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.7rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.875rem',
                      fontWeight: active ? 600 : 500,
                      color: active ? '#ffffff' : 'var(--text-secondary)',
                      background: active
                        ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.18))'
                        : 'transparent',
                      border: active
                        ? '1px solid rgba(56, 189, 248, 0.35)'
                        : '1px solid transparent',
                      transition: 'all var(--transition-fast)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <Icon
                        size={17}
                        style={{
                          color: active ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        }}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`badge ${item.badgeColor || 'badge-cyan'}`}
                        style={{ fontSize: '0.68rem', padding: '0.1rem 0.45rem' }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Quick Help Card */}
          <div
            style={{
              marginTop: '2rem',
              background: 'rgba(17, 23, 38, 0.6)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <ShieldCheck size={16} color="var(--accent-emerald)" />
              <strong style={{ fontSize: '0.85rem' }}>Garansi 90 Hari</strong>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Semua perbaikan tersimpan otomatis dalam riwayat servis Anda.
            </p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, padding: '2rem 1.5rem', maxWidth: '100%', overflowX: 'hidden' }}>
          {children}
        </main>
      </div>

      <style jsx global>{`
        @media (max-width: 900px) {
          .portal-sidebar {
            position: fixed;
            top: 66px;
            bottom: 0;
            left: -280px;
            z-index: 45;
            transition: left 0.25s ease;
          }
          .portal-sidebar.mobile-open {
            left: 0;
          }
          .mobile-toggle {
            display: inline-flex !important;
          }
          .logout-text {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
