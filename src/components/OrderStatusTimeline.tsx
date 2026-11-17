'use client';

import {
  FileText,
  Search,
  Clock,
  Wrench,
  CheckCircle,
  PackageCheck,
  AlertCircle,
  XCircle,
} from 'lucide-react';

interface OrderStatusTimelineProps {
  currentStatus: string;
}

export default function OrderStatusTimeline({ currentStatus }: OrderStatusTimelineProps) {
  // The 6 standard sequential steps
  const steps = [
    {
      key: 'REQUESTED',
      title: '1. Permintaan Dibuat',
      subtitle: 'Order diterima di sistem',
      icon: FileText,
    },
    {
      key: 'DIAGNOSING',
      title: '2. Diagnosa Teknisi',
      subtitle: 'Pengecekan komponen & keluhan',
      icon: Search,
    },
    {
      key: 'WAITING_APPROVAL',
      title: '3. Persetujuan Biaya',
      subtitle: 'Menunggu konfirmasi tindakan',
      icon: Clock,
    },
    {
      key: 'IN_PROGRESS',
      title: '4. Proses Pengerjaan',
      subtitle: 'Perbaikan / pergantian part',
      icon: Wrench,
    },
    {
      key: 'READY',
      title: '5. Siap Diambil',
      subtitle: 'Uji fungsi lolos & siap pickup',
      icon: PackageCheck,
    },
    {
      key: 'COMPLETED',
      title: '6. Selesai',
      subtitle: 'Unit diterima & garansi aktif',
      icon: CheckCircle,
    },
  ];

  if (currentStatus === 'CANCELLED') {
    return (
      <div
        style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid rgba(244, 63, 94, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          textAlign: 'center',
          color: '#fb7185',
        }}
      >
        <XCircle size={36} style={{ margin: '0 auto 0.5rem auto' }} />
        <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Pesanan Dibatalkan</h4>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Pesanan ini telah dibatalkan oleh pengguna atau administrator.
        </p>
      </div>
    );
  }

  // Get index of current step
  const currentIndex = steps.findIndex((s) => s.key === currentStatus);
  const activeStepIdx = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Desktop / Tablet Horizontal Timeline */}
      <div className="timeline-horizontal" style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
        {/* Background connector line */}
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '30px',
            right: '30px',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.1)',
            zIndex: 1,
            borderRadius: '9999px',
          }}
        >
          {/* Active progress fill */}
          <div
            style={{
              height: '100%',
              width: `${(activeStepIdx / (steps.length - 1)) * 100}%`,
              background: 'linear-gradient(90deg, #38bdf8, #6366f1)',
              borderRadius: '9999px',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.5)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {steps.map((step, idx) => {
          const isPassed = idx < activeStepIdx;
          const isCurrent = idx === activeStepIdx;
          const isFuture = idx > activeStepIdx;
          const Icon = step.icon;

          let circleBg = 'rgba(17, 23, 38, 1)';
          let borderColor = 'rgba(255, 255, 255, 0.15)';
          let iconColor = 'var(--text-muted)';
          let glowShadow = 'none';

          if (isPassed) {
            circleBg = 'linear-gradient(135deg, #10b981, #059669)';
            borderColor = '#10b981';
            iconColor = '#ffffff';
          } else if (isCurrent) {
            circleBg = 'linear-gradient(135deg, #38bdf8, #6366f1)';
            borderColor = '#38bdf8';
            iconColor = '#ffffff';
            glowShadow = '0 0 20px rgba(56, 189, 248, 0.6)';
          }

          return (
            <div
              key={step.key}
              style={{
                position: 'relative',
                zIndex: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                flex: 1,
              }}
            >
              {/* Step Circle */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: circleBg,
                  border: `2px solid ${borderColor}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: iconColor,
                  boxShadow: glowShadow,
                  marginBottom: '0.75rem',
                  transition: 'all 0.3s ease',
                }}
                className={isCurrent ? 'pulsing-step' : ''}
              >
                <Icon size={20} />
              </div>

              {/* Step Label */}
              <div style={{ maxWidth: '140px' }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: isCurrent || isPassed ? 700 : 500,
                    color: isCurrent ? 'var(--accent-cyan)' : isPassed ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {step.title}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: isCurrent ? 'var(--text-secondary)' : 'var(--text-muted)',
                    marginTop: '0.2rem',
                    lineHeight: 1.3,
                  }}
                >
                  {step.subtitle}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0.7);
          }
          70% {
            box-shadow: 0 0 0 12px rgba(56, 189, 248, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(56, 189, 248, 0);
          }
        }
        .pulsing-step {
          animation: pulseGlow 2s infinite;
        }
        @media (max-width: 768px) {
          .timeline-horizontal {
            flex-direction: column;
            gap: 1.25rem;
            align-items: flex-start;
          }
          .timeline-horizontal > div:first-child {
            display: none;
          }
          .timeline-horizontal > div {
            flex-direction: row !important;
            align-items: center !important;
            text-align: left !important;
            gap: 1rem;
          }
          .timeline-horizontal > div > div:first-child {
            margin-bottom: 0 !important;
          }
          .timeline-horizontal > div > div:last-child {
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}
