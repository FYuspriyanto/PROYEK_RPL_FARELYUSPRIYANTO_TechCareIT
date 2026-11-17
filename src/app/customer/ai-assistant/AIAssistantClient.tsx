'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Bot,
  Send,
  Sparkles,
  Laptop,
  AlertCircle,
  Wrench,
  ArrowRight,
  RotateCcw,
  User,
  Loader2,
  ChevronRight,
  MessageCircle,
  Zap,
} from 'lucide-react';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  options?: string[];
  services?: { id: string; name: string; description: string; priceFrom: number }[];
}

const DIAGNOSTIC_FLOW: Record<string, { question: string; options: string[] }> = {
  start: {
    question: '👋 Halo! Saya **TechCare AI** — asisten diagnostik IT Anda. Saya akan membantu mengidentifikasi masalah perangkat dan merekomendasikan solusi terbaik.\n\n**Apa jenis perangkat yang bermasalah?**',
    options: ['💻 Laptop', '🖥️ PC Desktop', '🖨️ Printer / Scanner', '🌐 Jaringan / WiFi', '📱 Smartphone / Tablet'],
  },
  laptop: {
    question: '**Apa gejala utama yang dialami laptop Anda?**',
    options: ['🔋 Tidak mau menyala / mati total', '🐌 Sangat lambat / hang', '🔥 Terlalu panas / overheat', '💧 Terkena cairan / kemasukan air', '🖥️ Layar bermasalah (blank / retak / flickering)', '⌨️ Keyboard / touchpad tidak berfungsi', '🔊 Speaker / audio tidak berfungsi', '💾 Data hilang / harddisk error'],
  },
  pc: {
    question: '**Apa gejala utama yang dialami PC Desktop Anda?**',
    options: ['❌ Tidak mau booting / POST error', '🐌 Sangat lambat / freeze', '🔊 Bunyi beep terus menerus', '🖥️ Tidak ada tampilan di monitor', '💨 Kipas angin mati / overheat', '⚡ Mati sendiri / restart otomatis', '💾 Harddisk / SSD error'],
  },
  printer: {
    question: '**Apa masalah yang dialami printer/scanner Anda?**',
    options: ['🚫 Tidak terdeteksi oleh komputer', '🎨 Hasil cetak buruk / warna pudar', '📄 Kertas macet (paper jam)', '🖨️ Error / lampu berkedip', '🔗 Masalah koneksi WiFi printing'],
  },
  network: {
    question: '**Apa masalah jaringan/WiFi yang Anda alami?**',
    options: ['📶 WiFi tidak terhubung sama sekali', '🐢 Koneksi sangat lambat', '🔄 Sering putus / tidak stabil', '🛡️ Masalah keamanan jaringan', '⚙️ Setting router perlu dikonfigurasi'],
  },
};

const DIAGNOSTIC_RESULTS: Record<string, { diagnosis: string; recommendation: string; urgency: 'high' | 'medium' | 'low'; serviceKeyword: string }> = {
  'Tidak mau menyala / mati total': {
    diagnosis: '⚡ Kemungkinan masalah: **Baterai rusak / tidak mengisi**, adapter charger bermasalah, atau kerusakan pada motherboard power rail.',
    recommendation: 'Perlu pemeriksaan langsung oleh teknisi untuk tes voltase dan komponen power.',
    urgency: 'high',
    serviceKeyword: 'laptop',
  },
  'Sangat lambat / hang': {
    diagnosis: '🐌 Kemungkinan penyebab: **RAM tidak cukup**, harddisk sektor rusak (bad sector), terlalu banyak program startup, atau serangan malware/virus.',
    recommendation: 'Diagnosa software + hardware diperlukan. Mungkin perlu upgrade RAM atau penggantian HDD ke SSD.',
    urgency: 'medium',
    serviceKeyword: 'upgrade',
  },
  'Terlalu panas / overheat': {
    diagnosis: '🔥 Penyebab utama: **Pasta termal kering** (thermal paste), kipas pendingin kotor/mati, atau heatsink tersumbat debu.',
    recommendation: 'Cleaning fan + penggantian thermal paste sangat disarankan sebelum kerusakan menyebar ke CPU/GPU.',
    urgency: 'medium',
    serviceKeyword: 'cleaning',
  },
  'Terkena cairan / kemasukan air': {
    diagnosis: '💧 **DARURAT!** Kerusakan akibat cairan bisa sangat cepat merusak komponen (short circuit, korosi motherboard).',
    recommendation: 'SEGERA matikan dan jangan colok charger! Harus ditangani dalam 24 jam untuk tingkat keberhasilan terbaik.',
    urgency: 'high',
    serviceKeyword: 'laptop',
  },
  'Layar bermasalah (blank / retak / flickering)': {
    diagnosis: '🖥️ Kemungkinan: **Kabel flex LCD longgar**, LCD rusak fisik, atau GPU bermasalah.',
    recommendation: 'Perlu pengecekan kabel dan LCD secara langsung. Penggantian LCD bisa dilakukan hari yang sama.',
    urgency: 'medium',
    serviceKeyword: 'laptop',
  },
  'Data hilang / harddisk error': {
    diagnosis: '💾 Risiko kehilangan data permanen! Kemungkinan **bad sector HDD**, SSD firmware rusak, atau partisi terhapus.',
    recommendation: 'Hentikan penggunaan segera. Tim recovery data kami dapat menyelamatkan hingga 95% data yang hilang.',
    urgency: 'high',
    serviceKeyword: 'data',
  },
};

export default function AIAssistantClient() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: DIAGNOSTIC_FLOW.start.question,
      options: DIAGNOSTIC_FLOW.start.options,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [currentStep, setCurrentStep] = useState<'start' | 'device' | 'symptom' | 'result'>('start');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateTyping = (callback: () => void, delay = 1200) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      callback();
    }, delay);
  };

  const handleOptionClick = (option: string) => {
    const userMessage: Message = { role: 'user', content: option };

    setMessages((prev) => [...prev, userMessage]);

    if (currentStep === 'start') {
      // Device selected
      const deviceKey = option.includes('Laptop') ? 'laptop'
        : option.includes('PC') ? 'pc'
        : option.includes('Printer') ? 'printer'
        : 'network';

      setSelectedDevice(deviceKey);
      setCurrentStep('device');

      simulateTyping(() => {
        const flow = DIAGNOSTIC_FLOW[deviceKey];
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: flow.question,
            options: flow.options,
          },
        ]);
      });
    } else if (currentStep === 'device') {
      // Symptom selected — generate diagnosis
      setCurrentStep('result');

      const cleanOption = option.replace(/^[^\w]+/, '').trim();
      const resultKey = Object.keys(DIAGNOSTIC_RESULTS).find(
        (k) => option.includes(k.substring(2)) || k.includes(cleanOption.substring(0, 20))
      ) || option;

      const result = DIAGNOSTIC_RESULTS[resultKey] || {
        diagnosis: '🔍 Gejala yang Anda sebutkan memerlukan pemeriksaan langsung oleh teknisi bersertifikat kami.',
        recommendation: 'Silakan bawa perangkat ke workshop kami atau gunakan layanan jemput perangkat.',
        urgency: 'medium' as const,
        serviceKeyword: 'service',
      };

      simulateTyping(() => {
        const urgencyColor = result.urgency === 'high' ? '#f43f5e' : result.urgency === 'medium' ? '#f59e0b' : '#10b981';
        const urgencyLabel = result.urgency === 'high' ? '🔴 PRIORITAS TINGGI' : result.urgency === 'medium' ? '🟡 SEGERA DITANGANI' : '🟢 DAPAT DIJADWALKAN';

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `**📋 Hasil Diagnosa AI:**\n\n${result.diagnosis}\n\n**💡 Rekomendasi:** ${result.recommendation}\n\n**Tingkat Urgensi:** ${urgencyLabel}`,
            options: ['🔄 Mulai Diagnosa Baru', '📋 Ajukan Service Request'],
          },
        ]);
      }, 1800);
    } else if (currentStep === 'result') {
      if (option.includes('Baru')) {
        // Reset
        setCurrentStep('start');
        setSelectedDevice('');
        simulateTyping(() => {
          setMessages([
            {
              role: 'assistant',
              content: DIAGNOSTIC_FLOW.start.question,
              options: DIAGNOSTIC_FLOW.start.options,
            },
          ]);
        }, 600);
      }
    }
  };

  const handleSendText = () => {
    if (!inputText.trim()) return;

    const userMsg: Message = { role: 'user', content: inputText };
    setInputText('');
    setMessages((prev) => [...prev, userMsg]);

    simulateTyping(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '🤖 Untuk diagnosa yang lebih akurat, silakan gunakan pertanyaan interaktif di atas. Jika pertanyaan Anda menyangkut hal spesifik di luar diagnosa, tim support kami siap membantu melalui WhatsApp atau Anda dapat langsung mengajukan service request.',
          options: ['📋 Ajukan Service Request', '🔄 Mulai Diagnosa Ulang'],
        },
      ]);
    });
  };

  // Escape HTML terlebih dahulu agar konten user/LLM tidak bisa
  // menyuntikkan markup/script (XSS), baru terapkan format ringan.
  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatContent = (content: string) => {
    return escapeHtml(content)
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-cyan) 0%, var(--accent-indigo) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>TechCare AI Assistant</h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Powered by Intelligent IT Diagnostic Engine
            </p>
          </div>
          <span className="badge badge-emerald" style={{ marginLeft: 'auto' }}>
            <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#10b981', marginRight: 4 }} />
            Online
          </span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Ceritakan gejala perangkat Anda dan AI kami akan membantu mendiagnosa masalah serta merekomendasikan layanan terbaik.
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid-3" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
        {[
          { icon: <Laptop size={18} />, label: 'Diagnosa Laptop', color: 'var(--accent-cyan)' },
          { icon: <Zap size={18} />, label: 'Cek Jaringan', color: 'var(--accent-indigo)' },
          { icon: <Wrench size={18} />, label: 'Info Layanan', color: 'var(--accent-emerald)' },
        ].map((item, i) => (
          <div
            key={i}
            className="glass-card"
            style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: item.color }}
          >
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </div>

      {/* Chat Window */}
      <div
        className="glass-card"
        style={{
          padding: 0,
          overflow: 'hidden',
          border: '1px solid var(--border-accent)',
          boxShadow: '0 0 30px rgba(56, 189, 248, 0.08)',
        }}
      >
        {/* Chat Messages */}
        <div
          style={{
            height: '480px',
            overflowY: 'auto',
            padding: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {messages.map((msg, idx) => (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
              {/* Avatar & bubble */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem', maxWidth: '80%', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                {/* Avatar */}
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: msg.role === 'assistant'
                      ? 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))'
                      : 'rgba(99, 102, 241, 0.25)',
                    border: '1px solid var(--border-accent)',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: msg.role === 'user' ? 'var(--accent-indigo)' : '#fff',
                  }}
                >
                  {msg.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
                </div>

                {/* Bubble */}
                <div
                  style={{
                    background: msg.role === 'assistant'
                      ? 'rgba(17, 23, 38, 0.9)'
                      : 'rgba(99, 102, 241, 0.2)',
                    border: `1px solid ${msg.role === 'assistant' ? 'var(--border-accent)' : 'rgba(99, 102, 241, 0.4)'}`,
                    borderRadius: msg.role === 'assistant' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    padding: '0.9rem 1.1rem',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    color: 'var(--text-primary)',
                  }}
                  dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }}
                />
              </div>

              {/* Option buttons */}
              {msg.options && idx === messages.length - 1 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem',
                    paddingLeft: '2.85rem',
                    maxWidth: '90%',
                  }}
                >
                  {msg.options.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => {
                        if (opt.includes('Ajukan Service')) return;
                        handleOptionClick(opt);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: '0.8rem', textAlign: 'left', whiteSpace: 'normal' }}
                    >
                      {opt.includes('Ajukan Service') ? (
                        <Link href="/customer/request" style={{ color: 'inherit', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {opt}
                          <ArrowRight size={13} />
                        </Link>
                      ) : (
                        opt
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
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
                  background: 'rgba(17, 23, 38, 0.9)',
                  border: '1px solid var(--border-accent)',
                  borderRadius: '4px 16px 16px 16px',
                  padding: '0.75rem 1.1rem',
                  display: 'flex',
                  gap: '0.3rem',
                  alignItems: 'center',
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: 'var(--accent-cyan)',
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(10, 13, 20, 0.6)',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <input
            type="text"
            placeholder="Ketik pertanyaan Anda tentang masalah IT..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
            className="form-input"
            style={{ flex: 1, fontSize: '0.875rem' }}
          />
          <button onClick={handleSendText} className="btn btn-primary btn-sm" style={{ flexShrink: 0 }}>
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Bottom CTA */}
      <div
        className="glass-card"
        style={{
          marginTop: '1.5rem',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          background: 'rgba(56, 189, 248, 0.05)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
        }}
      >
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Siap untuk ditangani teknisi?</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Ajukan service request resmi dan teknisi bersertifikat kami akan segera menghubungi Anda.
          </div>
        </div>
        <Link href="/customer/request" className="btn btn-primary">
          <Wrench size={16} />
          <span>Ajukan Service Sekarang</span>
          <ArrowRight size={16} />
        </Link>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
