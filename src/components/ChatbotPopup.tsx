"use client";

import { useState, useRef, useEffect } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  recommendedServices?: Array<{
    id: string;
    name: string;
    category: string;
    description: string;
    priceFrom: number;
    estimatedDuration?: string;
  }>;
  suggestedPrompts?: string[];
  providerUsed?: string;
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
}

const WELCOME_MESSAGE =
  "Halo! Saya TechCare AI Assistant 🤖\n\nSaya terhubung langsung ke database TechCare dan dapat membantu Anda:\n\n📋 **Memeriksa status pesanan & perkembangan servis**\n🧾 **Mengecek tagihan & invoice secara real-time**\n🔧 **Mendiagnosa kendala laptop/PC** dan troubleshooting aman\n💡 **Merekomendasikan paket servis** yang sesuai\n\nSilakan login untuk mengakses data pesanan dan tagihan pribadi Anda, atau tanyakan hal umum seputar layanan kami!";

const QUICK_QUESTIONS = [
  "Laptop saya sangat lambat",
  "Laptop cepat panas",
  "Bagaimana cara mengajukan service?",
  "Berapa lama garansi service?",
  "Daftar layanan TechCare",
  "Jam operasional bengkel",
];

export function ChatbotPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [requiresAuth, setRequiresAuth] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll ke pesan terakhir
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const openChat = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([
        { role: "assistant", content: WELCOME_MESSAGE }
      ]);
    }
  };

  const closeChat = () => {
    setIsOpen(false);
  };

  const sendMessage = async (text: string) => {
    const message = text.trim();
    if (!message || loading) return;

    setLoading(true);
    setErrorBanner(null);
    
    const userMsg: ChatMessage = {
      role: "user",
      content: message,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message,
          sessionId: sessionId || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat memproses respon AI');
      }

      if (data.data?.sessionId && !sessionId) {
        setSessionId(data.data.sessionId);
      }

      if (data.data?.requiresAuth) {
        setRequiresAuth(true);
      }

      const reply = data.data?.assistantMessage?.content || "Maaf, saya tidak bisa merespons saat ini.";
      
      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: reply,
        recommendedServices: data.data?.recommendedServices || [],
        suggestedPrompts: data.data?.suggestedPrompts || [],
        providerUsed: data.data?.providerUsed,
        serviceRequestProposal: data.data?.serviceRequestProposal,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setErrorBanner(err.message || 'Gagal terhubung ke AI Assistant. Silakan coba kembali.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleLoginClick = () => {
    window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
  };

  // Helper to format content with basic markdown support
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      if (!line.trim()) {
        return <div key={idx} style={{ height: '0.5rem' }} />;
      }
      
      // Bold text **text**
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={idx} style={{ margin: '0.25rem 0', lineHeight: 1.6 }}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="chatbot-root">
      {isOpen && (
        <div className="chatbot-panel">
          {/* Header */}
          <div className="chatbot-header">
            <div className="chatbot-header-title">
              <span className="chatbot-avatar">🤖</span>
              <div>
                <div className="chatbot-title">TechCare AI</div>
                <div className="chatbot-status">Online • Database Terhubung</div>
              </div>
            </div>
            <button
              type="button"
              className="chatbot-close"
              onClick={closeChat}
              aria-label="Tutup chat"
            >
              ✕
            </button>
          </div>

          {/* Error Banner */}
          {errorBanner && (
            <div
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                margin: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: '#f87171',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>⚠️</span>
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

          {/* Auth Required Banner */}
          {requiresAuth && !errorBanner && (
            <div
              style={{
                background: 'rgba(56,189,248,0.15)',
                border: '1px solid rgba(56,189,248,0.3)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                margin: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: 'var(--accent-cyan)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔐</span>
                <span>Silakan login untuk mengakses data pesanan & tagihan pribadi Anda</span>
              </div>
              <button
                onClick={handleLoginClick}
                style={{
                  background: 'var(--accent-cyan)',
                  border: 'none',
                  color: '#0f172a',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Login
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`chatbot-msg ${msg.role === "user" ? "user" : "bot"}`}
              >
                <div style={{ lineHeight: 1.6 }}>{renderFormattedContent(msg.content)}</div>
                
                {/* Service Recommendation Cards */}
                {msg.role === "assistant" && msg.recommendedServices && msg.recommendedServices.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                      ✨ Rekomendasi Layanan Terkait:
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {msg.recommendedServices.map((svc) => (
                        <div
                          key={svc.id}
                          style={{
                            background: 'rgba(30, 41, 59, 0.7)',
                            border: '1px solid rgba(56,189,248,0.25)',
                            borderRadius: '8px',
                            padding: '0.75rem',
                            minWidth: 180,
                            maxWidth: 250,
                            flex: 1,
                          }}
                        >
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--accent-cyan)', background: 'rgba(56,189,248,0.12)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                            {svc.category}
                          </span>
                          <h4 style={{ margin: '0.35rem 0', fontSize: '0.8rem', fontWeight: 700 }}>{svc.name}</h4>
                          <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{svc.description}</p>
                          <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>Rp {svc.priceFrom.toLocaleString('id-ID')}</span>
                            <a
                              href={`/customer/request?serviceId=${svc.id}`}
                              style={{
                                fontSize: '0.7rem',
                                color: 'var(--accent-cyan)',
                                textDecoration: 'underline',
                              }}
                            >
                              Pesan
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Request Proposal */}
                {msg.role === "assistant" && msg.serviceRequestProposal?.canCreateRequest && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 23, 42, 0.95) 100%)',
                      border: '1.5px solid var(--accent-cyan)',
                      borderRadius: '12px',
                      padding: '1rem',
                      boxShadow: '0 8px 30px rgba(56,189,248,0.25)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '6px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                        🔧
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>Buat Service Request</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>AI telah menyiapkan draf data berdasarkan keluhan Anda</div>
                      </div>
                    </div>
                    
                    <div style={{ background: 'rgba(0,0,0,0.35)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                      {msg.serviceRequestProposal.serviceName && (
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>Layanan:</span>
                          <strong style={{ color: 'var(--accent-cyan)' }}>{msg.serviceRequestProposal.serviceName}</strong>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>Perangkat:</span>
                        <span style={{ color: '#fff', fontWeight: 600 }}>
                          {msg.serviceRequestProposal.deviceType} {msg.serviceRequestProposal.deviceBrand} {msg.serviceRequestProposal.deviceModel}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <span style={{ color: 'var(--text-muted)', minWidth: 80 }}>Keluhan:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{msg.serviceRequestProposal.problemDescription}</span>
                      </div>
                    </div>

                    <a
                      href={`/customer/request?serviceId=${encodeURIComponent(msg.serviceRequestProposal.serviceId || '')}&deviceType=${encodeURIComponent(msg.serviceRequestProposal.deviceType || '')}&deviceBrand=${encodeURIComponent(msg.serviceRequestProposal.deviceBrand || '')}&deviceModel=${encodeURIComponent(msg.serviceRequestProposal.deviceModel || '')}&problemDescription=${encodeURIComponent(msg.serviceRequestProposal.problemDescription || '')}&notes=${encodeURIComponent(msg.serviceRequestProposal.notes || '')}&fromAi=true`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                        color: '#fff',
                        textDecoration: 'none',
                        padding: '0.55rem 1rem',
                        borderRadius: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        boxShadow: '0 4px 18px rgba(56,189,248,0.4)',
                      }}
                    >
                      {msg.serviceRequestProposal.buttonLabel || 'Buat Service Request'}
                    </a>
                  </div>
                )}

                {/* Follow-up Prompts */}
                {msg.role === "assistant" && msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && i === messages.length - 1 && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {msg.suggestedPrompts.map((p, pIdx) => (
                      <button
                        key={pIdx}
                        onClick={() => sendMessage(p)}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: '999px',
                          padding: '0.3rem 0.65rem',
                          color: 'var(--text-secondary)',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                        }}
                      >
                        💬 {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="chatbot-msg bot chatbot-typing">Mengetik…</div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 1 && !loading && (
            <div className="chatbot-quick" style={{ padding: '0 0.75rem 0.75rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Topik Cepat:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    type="button"
                    className="chatbot-quick-btn"
                    onClick={() => sendMessage(q)}
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.65rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.7rem',
                      cursor: 'pointer',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <form className="chatbot-form" onSubmit={handleSubmit} style={{ padding: '0.75rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan status pesanan, tagihan, atau keluhan laptop…"
              aria-label="Ketik pesan"
              disabled={loading}
              style={{
                flex: 1,
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.65rem 0.85rem',
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              className="chatbot-send"
              disabled={!input.trim() || loading}
              style={{
                width: 38,
                height: 38,
                borderRadius: '8px',
                background:
                  input.trim() && !loading
                    ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))'
                    : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
              }}
            >
              {loading ? (
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4 31.4" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Floating button */}
      <button
        type="button"
        className="chatbot-fab"
        onClick={isOpen ? closeChat : openChat}
        aria-label="Buka asisten AI TechCare"
      >
        🤖
      </button>
    </div>
  );
}
