'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, CheckCheck, X, Package, FileText, AlertCircle, CheckCircle2, Clock, Zap, Info } from 'lucide-react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationBellProps {
  initialUnreadCount?: number;
  /** Base path untuk halaman "lihat semua" — "/customer/notifications" atau "/admin/notifications" */
  basePath?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  ORDER_RECEIVED: <Package size={15} color="#38bdf8" />,
  DIAGNOSING: <Zap size={15} color="#a78bfa" />,
  ESTIMATE_READY: <FileText size={15} color="#34d399" />,
  APPROVAL_NEEDED: <AlertCircle size={15} color="#fbbf24" />,
  IN_PROGRESS: <Clock size={15} color="#60a5fa" />,
  COMPLETED: <CheckCircle2 size={15} color="#10b981" />,
  INVOICE_CREATED: <FileText size={15} color="#38bdf8" />,
  PAYMENT_RECEIVED: <CheckCheck size={15} color="#10b981" />,
  NEW_ORDER_ADMIN: <Package size={15} color="#f97316" />,
  CUSTOMER_APPROVAL: <Clock size={15} color="#fbbf24" />,
  PAYMENT_UPDATE: <CheckCheck size={15} color="#10b981" />,
};

function getTypeIcon(type: string) {
  return TYPE_ICONS[type] ?? <Info size={15} color="#38bdf8" />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Baru saja';
  if (min < 60) return `${min} menit lalu`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} jam lalu`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

export default function NotificationBell({ initialUnreadCount = 0, basePath = '/customer/notifications' }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/notifications?take=20');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.data?.notifications ?? []);
        setUnreadCount(data.data?.unreadCount ?? 0);
      }
    } catch {
      // silent fail
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Poll for new notifications every 30 seconds
  useEffect(() => {
    fetchNotifications(true);
    pollRef.current = setInterval(() => fetchNotifications(true), 30000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen) fetchNotifications();
  };

  const handleMarkRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllRead = async () => {
    setMarking(true);
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setMarking(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    const wasUnread = notifications.find((n) => n.id === id)?.isRead === false;
    if (wasUnread) setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={handleToggle}
        aria-label={`Notifikasi (${unreadCount} belum dibaca)`}
        style={{
          position: 'relative',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid var(--border-subtle)',
          background: open ? 'rgba(56, 189, 248, 0.12)' : 'rgba(17, 23, 38, 0.6)',
          color: open ? 'var(--accent-cyan)' : 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s ease',
          flexShrink: 0,
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -3,
              right: -3,
              background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
              color: '#fff',
              fontSize: '0.6rem',
              fontWeight: 800,
              minWidth: 18,
              height: 18,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 3px',
              border: '2px solid var(--bg-primary)',
              lineHeight: 1,
              animation: 'pulse 2s infinite',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          id="notification-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 10px)',
            right: 0,
            width: 380,
            maxHeight: 520,
            background: 'rgba(12, 16, 28, 0.98)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 200,
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '1rem 1.25rem',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Bell size={16} color="var(--accent-cyan)" />
              <strong style={{ fontSize: '0.9rem' }}>Notifikasi</strong>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'rgba(244, 63, 94, 0.15)',
                    border: '1px solid rgba(244, 63, 94, 0.4)',
                    color: '#f43f5e',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '0.1rem 0.45rem',
                    borderRadius: 20,
                  }}
                >
                  {unreadCount} baru
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={marking}
                  title="Tandai semua sudah dibaca"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.3rem 0.5rem',
                    borderRadius: 6,
                  }}
                >
                  <CheckCheck size={14} />
                  {marking ? '...' : 'Tandai semua'}
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: 6,
                  display: 'flex',
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: 380 }}>
            {loading ? (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Memuat notifikasi...
              </div>
            ) : notifications.length === 0 ? (
              <div
                style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                }}
              >
                <Bell size={36} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>
                  Belum ada notifikasi
                </div>
                <div style={{ fontSize: '0.78rem' }}>
                  Update pesanan akan muncul di sini
                </div>
              </div>
            ) : (
              notifications.map((notif) => {
                const content = (
                  <div
                    style={{
                      padding: '0.85rem 1.25rem',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      background: notif.isRead ? 'transparent' : 'rgba(56, 189, 248, 0.04)',
                      cursor: 'pointer',
                      transition: 'background 0.15s',
                      position: 'relative',
                    }}
                    onClick={() => !notif.isRead && handleMarkRead(notif.id)}
                  >
                    {/* Unread dot */}
                    {!notif.isRead && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: 'var(--accent-cyan)',
                          flexShrink: 0,
                        }}
                      />
                    )}

                    {/* Icon */}
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginLeft: notif.isRead ? 0 : 8,
                      }}
                    >
                      {getTypeIcon(notif.type)}
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '0.82rem',
                          fontWeight: notif.isRead ? 500 : 700,
                          color: notif.isRead ? 'var(--text-secondary)' : '#fff',
                          marginBottom: '0.2rem',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {notif.title}
                      </div>
                      <div
                        style={{
                          fontSize: '0.76rem',
                          color: 'var(--text-muted)',
                          lineHeight: 1.45,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {notif.message}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.3rem', opacity: 0.7 }}>
                        {timeAgo(notif.createdAt)}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={(e) => handleDelete(notif.id, e)}
                      title="Hapus notifikasi"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: '0.2rem',
                        borderRadius: 4,
                        display: 'flex',
                        flexShrink: 0,
                        opacity: 0.5,
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                );

                return notif.link ? (
                  <Link key={notif.id} href={notif.link} style={{ textDecoration: 'none' }}>
                    {content}
                  </Link>
                ) : (
                  <div key={notif.id}>{content}</div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'center',
            }}
          >
            <Link
              href={basePath}
              onClick={() => setOpen(false)}
              style={{
                fontSize: '0.8rem',
                color: 'var(--accent-cyan)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Lihat semua notifikasi →
            </Link>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @media (max-width: 480px) {
          #notification-dropdown {
            width: calc(100vw - 2rem);
            right: -80px;
          }
        }
      `}</style>
    </div>
  );
}
