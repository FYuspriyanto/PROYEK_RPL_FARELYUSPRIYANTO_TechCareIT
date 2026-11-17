'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  Sparkles,
  RotateCcw,
  User,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  Info,
  Clock,
  HelpCircle,
  Cpu,
  ChevronRight,
} from 'lucide-react';

interface ServiceRec {
  id: string;
  name: string;
  category: string;
  description: string;
  priceFrom: number;
  estimatedDuration?: string;
}

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  recommendedServices?: ServiceRec[];
  suggestedPrompts?: string[];
  serviceRequestProposal?: {
    canCreateRequest: boolean;
    serviceId?: string;
    serviceName?: string;
    servicePriceFrom?: number;
    deviceType?: string;
    deviceBrand?: string;
    deviceModel?: string;
    problemDescription?: string;
    notes?: string;
    buttonLabel?: string;
  };
  providerUsed?: string;
  createdAt?: string;
}

interface AIChatClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

const STARTER_PROMPTS = [
  { label: 'Status pesanan saya', icon: '📋', text: 'Apa status pesanan saya saat ini?' },
  { label: 'Tagihan & invoice saya', icon: '🧾', text: 'Berapa tagihan yang harus saya bayar?' },
  { label: 'Laptop sangat lambat & lemot', icon: '🐌', text: 'Laptop saya sangat lambat.' },
  { label: 'Laptop cepat panas', icon: '🔥', text: 'Laptop cepat panas dan kipas berisik saat dipakai.' },
  { label: 'PC mati total', icon: '⚡', text: 'PC mati total tidak mau menyala sama sekali.' },
  { label: 'Garansi servis', icon: '🛡️', text: 'Berapa lama garansi servis di TechCare?' },
];

export default function AIChatClient({ user }: AIChatClientProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load existing conversation on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        setLoadingHistory(true);
        const res = await fetch('/api/ai/history');
        if (res.ok) {
          const json = await res.json();
          if (json.data && json.data.messages && json.data.messages.length > 0) {
            setSessionId(json.data.sessionId);
            const formatted: Message[] = json.data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              recommendedServices: m.metadata?.recommendedServices || [],
              suggestedPrompts: m.metadata?.suggestedPrompts || [],
              serviceRequestProposal: m.metadata?.serviceRequestProposal,
              providerUsed: m.metadata?.providerUsed,
              createdAt: m.createdAt,
            }));
            setMessages(formatted);
          } else {
            // Initialize with warm welcome message
            const initialSession = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
            setSessionId(initialSession);
            setMessages([
              {
                role: 'assistant',
                content:
                  `👋 Halo **${user.name.split(' ')[0]}**! Saya **TechCare AI Assistant** 🤖\n\n` +
                  `Saya kini memiliki akses langsung ke **data akun Anda**, sehingga dapat menjawab:\n\n` +
                  `📋 **Status & detail pesanan servis Anda**\n` +
                  `🧾 **Tagihan dan status pembayaran invoice**\n` +
                  `🔧 **Troubleshooting** masalah laptop/komputer Anda\n` +
                  `💡 **Rekomendasi layanan** yang sesuai dengan masalah Anda\n\n` +
                  `Silakan tanyakan apa saja — mulai dari "status pesanan saya" hingga "laptop saya lambat".`,
                suggestedPrompts: [
                  'Apa status pesanan saya saat ini?',
                  'Berapa tagihan yang harus saya bayar?',
                  'Laptop saya sangat lambat',
                  'Bagaimana cara membuat service request?',
                ],
              },
            ]);
          }
        }
      } catch (err) {
        console.error('Failed to load chat history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [user]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');
    setErrorBanner(null);

    const userMsg: Message = {
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || 'Terjadi kesalahan saat memproses respon AI');
      }

      if (json.data?.sessionId && !sessionId) {
        setSessionId(json.data.sessionId);
      }

      const assistantMsg: Message = {
        role: 'assistant',
        content: json.data.assistantMessage.content,
        recommendedServices: json.data.recommendedServices || [],
        suggestedPrompts: json.data.suggestedPrompts || [],
        serviceRequestProposal: json.data.serviceRequestProposal || json.data.assistantMessage?.metadata?.serviceRequestProposal,
        providerUsed: json.data.providerUsed,
        createdAt: json.data.assistantMessage.createdAt,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorBanner(err.message || 'Gagal terhubung ke AI Assistant. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = async () => {
    if (confirm('Mulai percakapan baru? Riwayat chat sesi ini akan direset.')) {
      try {
        if (sessionId) {
          await fetch(`/api/ai/history?sessionId=${sessionId}`, { method: 'DELETE' }).catch(() => {});
        }
        const newSession = `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        setSessionId(newSession);
        setMessages([
          {
            role: 'assistant',
            content:
              `👋 Sesi chat baru dimulai, **${user.name.split(' ')[0]}**!\n\n` +
              `Saya masih memiliki akses ke **data akun Anda** — silakan tanyakan tentang pesanan, tagihan, atau masalah teknis.`,
            suggestedPrompts: [
              'Apa status pesanan saya?',
              'Berapa tagihan saya?',
              'Laptop saya sangat lambat',
            ],
          },
        ]);
        setErrorBanner(null);
      } catch (err) {
        console.error('Reset error:', err);
      }
    }
  };

  // Helper formatting for bolding, bullet points, numbers, and warnings
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return lines.map((line, idx) => {
      // Empty line
      if (!line.trim()) {
        return <div key={idx} style={{ height: '0.6rem' }} />;
      }

      // Warning or caution callout
      if (line.includes('⚠️') || line.includes('Perhatian:') || line.includes('PERINGATAN')) {
        return (
          <div
            key={idx}
            style={{
              background: 'rgba(245,158,11,0.1)',
              borderLeft: '3px solid #f59e0b',
              padding: '0.45rem 0.75rem',
              borderRadius: '0 6px 6px 0',
              fontSize: '0.85rem',
              color: '#fbbf24',
              margin: '0.4rem 0',
            }}
          >
            {formatInlineText(line)}
          </div>
        );
      }

      // Tip / Troubleshooting callout
      if (line.includes('💡')) {
        return (
          <div
            key={idx}
            style={{
              background: 'rgba(56,189,248,0.1)',
              borderLeft: '3px solid var(--accent-cyan)',
              padding: '0.45rem 0.75rem',
              borderRadius: '0 6px 6px 0',
              fontSize: '0.85rem',
              color: 'var(--accent-cyan)',
              margin: '0.4rem 0',
            }}
          >
            {formatInlineText(line)}
          </div>
        );
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', margin: '0.2rem 0', paddingLeft: '0.5rem' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>•</span>
            <span style={{ flex: 1 }}>{formatInlineText(line.substring(2))}</span>
          </div>
        );
      }

      // Numbered lists (1. 2. etc)
      const numMatch = line.match(/^(\d+\.)\s*(.*)$/);
      if (numMatch) {
        return (
          <div key={idx} style={{ display: 'flex', gap: '0.5rem', margin: '0.25rem 0', paddingLeft: '0.5rem' }}>
            <span style={{ color: 'var(--accent-indigo)', fontWeight: 700, minWidth: '1.25rem' }}>{numMatch[1]}</span>
            <span style={{ flex: 1 }}>{formatInlineText(numMatch[2])}</span>
          </div>
        );
      }

      return (
        <p key={idx} style={{ margin: '0.25rem 0', lineHeight: 1.6 }}>
          {formatInlineText(line)}
        </p>
      );
    });
  };

  // Inline markdown formatter for **bold** and `code`
  const formatInlineText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} style={{ color: '#fff', fontWeight: 600 }}>
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={i} style={{ color: 'var(--text-secondary)' }}>
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={i}
            style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '0.15rem 0.4rem',
              borderRadius: '4px',
              fontSize: '0.825rem',
              color: 'var(--accent-cyan)',
              fontFamily: 'monospace',
            }}
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 4.5rem)',
        maxWidth: 1100,
        margin: '0 auto',
        padding: '1rem 1.5rem',
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '0.85rem 1.25rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 20px rgba(56,189,248,0.4)',
              position: 'relative',
            }}
          >
            <Bot size={22} color="#fff" />
            <span
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #0f172a',
              }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                TechCare AI Assistant
              </h1>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  background: 'rgba(16,185,129,0.15)',
                  color: '#10b981',
                  padding: '0.15rem 0.5rem',
                  borderRadius: '999px',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
              >
                Online • DB Grounded
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '0.785rem', color: 'var(--text-muted)' }}>
              Konsultasi kendala komputer, panduan troubleshooting aman & rekomendasi layanan teknisi
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={handleResetChat}
            title="Mulai percakapan baru"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.5rem 0.85rem',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <RotateCcw size={14} /> Sesi Baru
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div
          style={{
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.85rem',
            color: '#f87171',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={16} />
            <span>{errorBanner}</span>
          </div>
          <button
            onClick={() => setErrorBanner(null)}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Chat Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem 0.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem',
        }}
      >
        {loadingHistory ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '0.6rem', color: 'var(--text-muted)' }}>
            <Loader2 size={20} className="animate-spin" />
            <span style={{ fontSize: '0.9rem' }}>Memuat percakapan...</span>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isUser = msg.role === 'user';

            return (
              <div
                key={msg.id || index}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isUser ? 'flex-end' : 'flex-start',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.75rem',
                    maxWidth: isUser ? '80%' : '88%',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                  }}
                >
                  {/* Avatar */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: isUser
                        ? 'linear-gradient(135deg, var(--accent-indigo), #8b5cf6)'
                        : 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {isUser ? <User size={16} color="#fff" /> : <Bot size={16} color="#fff" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    style={{
                      background: isUser
                        ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
                        : 'rgba(15, 23, 42, 0.85)',
                      border: isUser
                        ? '1px solid rgba(99,102,241,0.3)'
                        : '1px solid var(--border-subtle)',
                      borderRadius: isUser ? '18px 4px 18px 18px' : '4px 18px 18px 18px',
                      padding: '1rem 1.25rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.9rem',
                      boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    {/* Role Header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        marginBottom: '0.45rem',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: isUser ? 'var(--accent-indigo)' : 'var(--accent-cyan)',
                      }}
                    >
                      <span>{isUser ? 'Anda' : 'TechCare AI Assistant'}</span>
                      {msg.providerUsed && (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem', fontWeight: 400 }}>
                          • via {msg.providerUsed}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ lineHeight: 1.6 }}>{renderFormattedContent(msg.content)}</div>
                  </div>
                </div>

                {/* Service Request Proposal Action Card */}
                {!isUser && msg.serviceRequestProposal?.canCreateRequest && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      marginLeft: '2.75rem',
                      width: 'calc(100% - 2.75rem)',
                      maxWidth: 680,
                      background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      border: '1.5px solid var(--accent-cyan)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '1.25rem',
                      boxShadow: '0 8px 30px rgba(56,189,248,0.25)',
                      backdropFilter: 'blur(12px)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.85rem',
                        flexWrap: 'wrap',
                        gap: '0.5rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            boxShadow: '0 0 12px rgba(56,189,248,0.4)',
                          }}
                        >
                          <Wrench size={18} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                            Buat Service Request
                          </h4>
                          <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>
                            AI telah menyiapkan draf data berdasarkan keluhan Anda
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          background: 'rgba(56,189,248,0.15)',
                          color: 'var(--accent-cyan)',
                          padding: '0.25rem 0.65rem',
                          borderRadius: '999px',
                          border: '1px solid rgba(56,189,248,0.3)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                        }}
                      >
                        <Sparkles size={11} /> Pre-fill Siap
                      </span>
                    </div>

                    {/* Pre-fill Summary Details */}
                    <div
                      style={{
                        background: 'rgba(0,0,0,0.35)',
                        borderRadius: 'var(--radius-md)',
                        padding: '0.85rem 1rem',
                        fontSize: '0.825rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.45rem',
                        marginBottom: '1rem',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {msg.serviceRequestProposal.serviceName && (
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <span style={{ color: 'var(--text-muted)', minWidth: 120 }}>Layanan Cocok:</span>
                          <strong style={{ color: 'var(--accent-cyan)' }}>
                            {msg.serviceRequestProposal.serviceName}
                          </strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: 120 }}>Perangkat:</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>
                          {msg.serviceRequestProposal.deviceType} • {msg.serviceRequestProposal.deviceBrand}{' '}
                          {msg.serviceRequestProposal.deviceModel}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: 120 }}>Ringkasan:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {msg.serviceRequestProposal.problemDescription}
                        </span>
                      </div>
                    </div>

                    {/* Action Button & Confirmation Note */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 360 }}>
                        🔒 Anda dapat memeriksa, mengedit detail perangkat, jadwal & alamat sebelum melakukan konfirmasi akhir.
                      </p>

                      <Link
                        href={`/customer/request?serviceId=${encodeURIComponent(msg.serviceRequestProposal.serviceId || '')}&deviceType=${encodeURIComponent(msg.serviceRequestProposal.deviceType || '')}&deviceBrand=${encodeURIComponent(msg.serviceRequestProposal.deviceBrand || '')}&deviceModel=${encodeURIComponent(msg.serviceRequestProposal.deviceModel || '')}&problemDescription=${encodeURIComponent(msg.serviceRequestProposal.problemDescription || '')}&notes=${encodeURIComponent(msg.serviceRequestProposal.notes || '')}&fromAi=true`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                          color: '#fff',
                          textDecoration: 'none',
                          padding: '0.7rem 1.4rem',
                          borderRadius: 'var(--radius-md)',
                          fontSize: '0.875rem',
                          fontWeight: 700,
                          boxShadow: '0 4px 18px rgba(56,189,248,0.4)',
                        }}
                      >
                        <span>{msg.serviceRequestProposal.buttonLabel || 'Buat Service Request'}</span>
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* Service Recommendation Cards (Below Assistant Reply) */}
                {!isUser && msg.recommendedServices && msg.recommendedServices.length > 0 && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      marginLeft: '2.75rem',
                      width: 'calc(100% - 2.75rem)',
                      maxWidth: 680,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        color: 'var(--accent-cyan)',
                        marginBottom: '0.6rem',
                      }}
                    >
                      <Sparkles size={14} />
                      <span>Rekomendasi Layanan TechCare Terkait:</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                      {msg.recommendedServices.map((svc) => (
                        <div
                          key={svc.id}
                          style={{
                            background: 'rgba(30, 41, 59, 0.7)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.85rem',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            backdropFilter: 'blur(8px)',
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: '0.68rem',
                                fontWeight: 600,
                                background: 'rgba(56,189,248,0.12)',
                                color: 'var(--accent-cyan)',
                                padding: '0.15rem 0.4rem',
                                borderRadius: '4px',
                                display: 'inline-block',
                                marginBottom: '0.35rem',
                              }}
                            >
                              {svc.category}
                            </span>
                            <h4
                              style={{
                                margin: '0 0 0.35rem 0',
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                lineHeight: 1.3,
                              }}
                            >
                              {svc.name}
                            </h4>
                            <p
                              style={{
                                margin: 0,
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                lineHeight: 1.4,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {svc.description}
                            </p>
                          </div>

                          <div
                            style={{
                              marginTop: '0.75rem',
                              paddingTop: '0.5rem',
                              borderTop: '1px solid rgba(255,255,255,0.06)',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Mulai dari</div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
                                Rp {svc.priceFrom.toLocaleString('id-ID')}
                              </div>
                            </div>

                            <Link
                              href={`/customer/request?serviceId=${svc.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                                color: '#fff',
                                textDecoration: 'none',
                                padding: '0.35rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                boxShadow: '0 2px 8px rgba(56,189,248,0.25)',
                              }}
                            >
                              <span>Pesan</span>
                              <ArrowRight size={12} />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Follow-up Prompts Chips (Only show on latest assistant message) */}
                {!isUser &&
                  index === messages.length - 1 &&
                  msg.suggestedPrompts &&
                  msg.suggestedPrompts.length > 0 && (
                    <div
                      style={{
                        marginTop: '0.75rem',
                        marginLeft: '2.75rem',
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap',
                      }}
                    >
                      {msg.suggestedPrompts.map((p, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleSendMessage(p)}
                          style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: '999px',
                            padding: '0.35rem 0.75rem',
                            color: 'var(--text-secondary)',
                            fontSize: '0.785rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          💬 {p}
                        </button>
                      ))}
                    </div>
                  )}
              </div>
            );
          })
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Bot size={16} color="#fff" />
            </div>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '4px 18px 18px 18px',
                padding: '0.85rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--text-secondary)',
                fontSize: '0.85rem',
              }}
            >
              <Loader2 size={16} className="animate-spin" color="var(--accent-cyan)" />
              <span>TechCare AI sedang menganalisa masalah & data knowledge base...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Starter Prompts Carousel / Grid (when chat is still fresh) */}
      {messages.length <= 1 && !loading && (
        <div style={{ marginBottom: '0.85rem', flexShrink: 0 }}>
          <div
            style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
            }}
          >
            <Sparkles size={12} color="var(--accent-cyan)" />
            <span>Topik Cepat yang Sering Dikonsultasikan:</span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.5rem',
            }}
          >
            {STARTER_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.text)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.55rem 0.75rem',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.785rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                <span>{item.icon}</span>
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.label}
                </span>
                <ChevronRight size={12} color="var(--text-muted)" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Chat Input Bar */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: '0.65rem 0.85rem 0.65rem 1.15rem',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
          flexShrink: 0,
        }}
      >
        <textarea
          ref={inputRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Tanyakan masalah laptop Anda... (contoh: Laptop saya sangat lambat)"
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            lineHeight: 1.5,
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            maxHeight: 100,
          }}
        />

        <button
          onClick={() => handleSendMessage()}
          disabled={!inputText.trim() || loading}
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--radius-md)',
            background:
              inputText.trim() && !loading
                ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))'
                : 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: inputText.trim() && !loading ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s ease',
            flexShrink: 0,
            boxShadow:
              inputText.trim() && !loading ? '0 0 15px rgba(56,189,248,0.4)' : 'none',
          }}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </div>

      {/* Safety Notice Footer */}
      <div
        style={{
          textAlign: 'center',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          marginTop: '0.5rem',
          flexShrink: 0,
        }}
      >
        AI memberikan rekomendasi awal & troubleshooting dasar yang aman. Diagnosis fisik resmi dilakukan oleh teknisi TechCare.
      </div>
    </div>
  );
}
