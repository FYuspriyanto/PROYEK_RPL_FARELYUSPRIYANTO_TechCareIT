'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Users,
  Wrench,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  ChevronRight,
  Cpu,
  FileText,
  BookOpen,
  Bell,
  Bot,
} from 'lucide-react';
import NotificationBell from '@/components/NotificationBell';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { label: 'Service Orders', href: '/admin/orders', icon: Package },
  { label: 'Invoices', href: '/admin/invoices', icon: FileText },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Technicians', href: '/admin/technicians', icon: Wrench },
  { label: 'Services', href: '/admin/services', icon: Settings },
  { label: 'Knowledge Base', href: '/admin/knowledge-base', icon: BookOpen },
  { label: 'Konfigurasi AI', href: '/admin/ai-config', icon: Bot },
  { label: 'Notifications', href: '/admin/notifications', icon: Bell },
];

interface AdminLayoutClientProps {
  user: { name: string; email: string; role: string };
  unreadNotifications?: number;
  children: React.ReactNode;
}

export default function AdminLayoutClient({ user, unreadNotifications = 0, children }: AdminLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    router.push('/login');
    router.refresh();
  };

  const Sidebar = () => (
    <aside
      style={{
        width: '260px',
        background: 'rgba(10, 13, 20, 0.97)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        flexShrink: 0,
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '1.5rem 1.25rem 1.25rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px rgba(56,189,248,0.35)',
            }}
          >
            <Cpu size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>TechCare</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
              ADMIN PANEL
            </div>
          </div>
        </div>

        {/* Admin badge */}
        <div
          style={{
            marginTop: '1rem',
            padding: '0.65rem 0.85rem',
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={14} color="var(--accent-indigo)" />
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--accent-indigo)' }}>
              Administrator
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600, marginTop: '0.2rem' }}>
            {user.name}
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '1rem 0.75rem', overflowY: 'auto' }}>
        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.1em', padding: '0 0.5rem', marginBottom: '0.5rem' }}>
          MENU UTAMA
        </div>

        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '0.25rem',
                background: isActive ? 'rgba(56, 189, 248, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(56, 189, 248, 0.25)' : '1px solid transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.875rem',
                transition: 'all var(--transition-normal)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Icon size={17} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-muted)',
            fontSize: '0.825rem',
            marginBottom: '0.25rem',
          }}
        >
          <ChevronRight size={15} style={{ transform: 'rotate(180deg)' }} />
          Lihat Landing Page
        </Link>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.6rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'transparent',
            border: 'none',
            color: '#f87171',
            fontSize: '0.825rem',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          <LogOut size={15} />
          {loggingOut ? 'Keluar...' : 'Logout'}
        </button>
      </div>
    </aside>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <div className="bg-mesh" />

      {/* Desktop sidebar */}
      <div className="admin-sidebar-desktop">
        <Sidebar />
      </div>

      {/* Mobile overlay sidebar */}
      {sidebarOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            display: 'flex',
          }}
        >
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSidebarOpen(false)}
          />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top bar */}
        <header
          style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(10, 13, 20, 0.8)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <button
            className="admin-mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'none',
            }}
          >
            <Menu size={22} />
          </button>

          <div style={{ flex: 1 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Admin Panel &rsaquo;{' '}
              <span style={{ color: 'var(--text-secondary)' }}>
                {navItems.find((n) => pathname.startsWith(n.href))?.label || 'Dashboard'}
              </span>
            </span>
          </div>

          {/* Notification Bell */}
          <NotificationBell initialUnreadCount={unreadNotifications} basePath="/admin/notifications" />

          <span className="badge badge-indigo" style={{ fontSize: '0.7rem' }}>
            <ShieldCheck size={11} /> ADMIN
          </span>
        </header>

        <main style={{ flex: 1, padding: '2rem 1.5rem', overflowY: 'auto' }}>
          {children}
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .admin-sidebar-desktop { display: block; }
          .admin-mobile-menu-btn { display: none !important; }
        }
        @media (max-width: 767px) {
          .admin-sidebar-desktop { display: none; }
          .admin-mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
