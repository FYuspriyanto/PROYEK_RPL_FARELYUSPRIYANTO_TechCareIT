'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  Package,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  Info,
  CheckCheck,
  Zap,
  Trash2,
  X,
} from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; border: string; bg: string }> = {
  ORDER_RECEIVED: {
    icon: <Package size={18} color="#38bdf8" />,
    border: 'rgba(56, 189, 248, 0.3)',
    bg: 'rgba(56, 189, 248, 0.05)',
  },
  DIAGNOSING: {
    icon: <Zap size={18} color="#a78bfa" />,
    border: 'rgba(167, 139, 250, 0.3)',
    bg: 'rgba(167, 139, 250, 0.05)',
  },
  ESTIMATE_READY: {
    icon: <FileText size={18} color="#34d399" />,
    border: 'rgba(52, 211, 153, 0.3)',
    bg: 'rgba(52, 211, 153, 0.05)',
  },
  APPROVAL_NEEDED: {
    icon: <AlertCircle size={18} color="#fbbf24" />,
    border: 'rgba(251, 191, 36, 0.35)',
    bg: 'rgba(251, 191, 36, 0.06)',
  },
  IN_PROGRESS: {
    icon: <Clock size={18} color="#60a5fa" />,
    border: 'rgba(96, 165, 250, 0.3)',
    bg: 'rgba(96, 165, 250, 0.05)',
  },
  COMPLETED: {
    icon: <CheckCircle2 size={18} color="#10b981" />,
    border: 'rgba(16, 185, 129, 0.35)',
    bg: 'rgba(16, 185, 129, 0.06)',
  },
  INVOICE_CREATED: {
    icon: <FileText size={18} color="#38bdf8" />,
    border: 'rgba(56, 189, 248, 0.3)',
    bg: 'rgba(56, 189, 248, 0.05)',
  },
  PAYMENT_RECEIVED: {
    icon: <CheckCheck size={18} color="#10b981" />,
    border: 'rgba(16, 185, 129, 0.35)',
    bg: 'rgba(16, 185, 129, 0.06)',
  },
  NEW_ORDER_ADMIN: {
    icon: <Package size={18} color="#f97316" />,
    border: 'rgba(249, 115, 22, 0.3)',
    bg: 'rgba(249, 115, 22, 0.05)',
  },
  CUSTOMER_APPROVAL: {
    icon: <Clock size={18} color="#fbbf24" />,
    border: 'rgba(251, 191, 36, 0.3)',
    bg: 'rgba(251, 191, 36, 0.05)',
  },
  PAYMENT_UPDATE: {
    icon: <CheckCheck size={18} color="#10b981" />,
    border: 'rgba(16, 185, 129, 0.3)',
    bg: 'rgba(16, 185, 129, 0.05)',
  },
};

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? {
    icon: <Info size={18} color="#38bdf8" />,
    border: 'rgba(56, 189, 248, 0.25)',
    bg: 'rgba(56, 189, 248, 0.04)',
  };
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
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface Props {
  initialNotifications: Notification[];
}

export default function NotificationsClient({ initialNotifications }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [markingAll, setMarkingAll] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' }).catch(() => {});
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setMarkingAll(false);
    }
  }, []);

  const handleDelete = useCallback(async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' }).catch(() => {});
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <>
      {/* Actions row */}
      {unreadCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <CheckCheck size={15} />
            {markingAll ? 'Menandai...' : `Tandai semua sudah dibaca (${unreadCount})`}
          </button>
        </div>
      )}

      {/* Notifications list */}
      {notifications.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <Bell size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontWeight: 600, fontSize: '1.15rem', marginBottom: '0.5rem' }}>
            Belum Ada Notifikasi
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '360px', margin: '0 auto' }}>
            Notifikasi update status pesanan, konfirmasi biaya, dan pengambilan perangkat akan muncul di sini.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {notifications.map((notif) => {
            const cfg = getTypeConfig(notif.type);
            const content = (
              <div
                className="glass-card"
                style={{
                  padding: '1.25rem 1.5rem',
                  background: notif.isRead ? 'rgba(17, 23, 38, 0.4)' : cfg.bg,
                  border: `1px solid ${notif.isRead ? 'var(--border-subtle)' : cfg.border}`,
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-start',
                  cursor: notif.link ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  opacity: notif.isRead ? 0.75 : 1,
                  position: 'relative',
                }}
                onClick={() => !notif.isRead && handleMarkRead(notif.id)}
              >
                {/* Unread indicator */}
                {!notif.isRead && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: 'var(--accent-cyan)',
                      borderRadius: '4px 0 0 4px',
                    }}
                  />
                )}

                {/* Icon */}
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: 'rgba(15, 23, 42, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    border: `1px solid ${cfg.border}`,
                  }}
                >
                  {cfg.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '0.5rem',
                      marginBottom: '0.35rem',
                    }}
                  >
                    <strong
                      style={{
                        fontSize: '0.925rem',
                        color: notif.isRead ? 'var(--text-secondary)' : '#fff',
                        fontWeight: notif.isRead ? 500 : 700,
                      }}
                    >
                      {notif.title}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {notif.message}
                  </p>

                  {!notif.isRead && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleMarkRead(notif.id); }}
                      style={{
                        marginTop: '0.6rem',
                        background: 'none',
                        border: 'none',
                        color: 'var(--accent-cyan)',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                      }}
                    >
                      <CheckCheck size={13} />
                      Tandai sudah dibaca
                    </button>
                  )}
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
                    padding: '0.25rem',
                    borderRadius: 6,
                    display: 'flex',
                    flexShrink: 0,
                    opacity: 0.5,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <Trash2 size={14} />
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
          })}
        </div>
      )}
    </>
  );
}
