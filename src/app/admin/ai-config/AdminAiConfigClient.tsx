'use client';

import { useState } from 'react';
import {
  Bot,
  Plus,
  Save,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  RotateCw,
  Trash2,
  Edit2,
  Key,
  Sliders,
  Cpu,
  Star,
  ExternalLink,
  Info,
} from 'lucide-react';

export interface AiConfigItem {
  id: string;
  providerName: string;
  providerSlug: string;
  apiKey: string;
  maskedApiKey: string;
  model: string;
  baseUrl: string | null;
  isActive: boolean;
  isPrimary: boolean;
  maxTokens: number;
  temperature: number;
  timeoutMs: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Preset options for quick configuration
const PROVIDER_PRESETS: Record<
  string,
  {
    name: string;
    slug: string;
    baseUrl: string;
    defaultModel: string;
    models: string[];
    helpText: string;
    apiDocUrl: string;
  }
> = {
  nvidia: {
    name: 'NVIDIA NIM',
    slug: 'nvidia',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    defaultModel: 'nvidia/nemotron-3-super-120b-a12b',
    models: [
      'nvidia/nemotron-3-super-120b-a12b',
      'meta/llama-3.1-70b-instruct',
      'meta/llama-3.3-70b-instruct',
      'mistralai/mistral-large-2-instruct',
    ],
    helpText: 'API dari build.nvidia.com. Format token: nvapi-...',
    apiDocUrl: 'https://build.nvidia.com',
  },
  gemini: {
    name: 'Google Gemini',
    slug: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    models: [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-2.5-flash',
    ],
    helpText: 'API dari Google AI Studio. Format token: AIzaSy...',
    apiDocUrl: 'https://aistudio.google.com/app/apikey',
  },
  openai: {
    name: 'OpenAI',
    slug: 'openai',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo'],
    helpText: 'API dari platform.openai.com. Format token: sk-...',
    apiDocUrl: 'https://platform.openai.com/api-keys',
  },
  groq: {
    name: 'Groq',
    slug: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    models: [
      'llama-3.3-70b-versatile',
      'llama-3.1-8b-instant',
      'mixtral-8x7b-32768',
    ],
    helpText: 'Ultra-fast LLM API dari console.groq.com. Format token: gsk_...',
    apiDocUrl: 'https://console.groq.com/keys',
  },
  custom: {
    name: 'Custom Provider (OpenAI Compatible)',
    slug: 'custom',
    baseUrl: 'https://api.example.com/v1',
    defaultModel: 'custom-model',
    models: ['custom-model'],
    helpText: 'Endpoint provider pihak ketiga apa pun yang kompatibel dengan format OpenAI API.',
    apiDocUrl: '',
  },
};

export default function AdminAiConfigClient({
  initialConfigs,
}: {
  initialConfigs: AiConfigItem[];
}) {
  const [configs, setConfigs] = useState<AiConfigItem[]>(initialConfigs);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AiConfigItem | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('nvidia');

  // Form State
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formApiKey, setFormApiKey] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formBaseUrl, setFormBaseUrl] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsPrimary, setFormIsPrimary] = useState(false);
  const [formMaxTokens, setFormMaxTokens] = useState(1200);
  const [formTemperature, setFormTemperature] = useState(0.3);
  const [formTimeoutMs, setFormTimeoutMs] = useState(30000);
  const [formNotes, setFormNotes] = useState('');

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 6000);
  };

  const handleApplyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = PROVIDER_PRESETS[presetKey];
    if (!preset) return;

    setFormName(preset.name);
    setFormSlug(preset.slug);
    setFormBaseUrl(preset.baseUrl);
    setFormModel(preset.defaultModel);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    handleApplyPreset('nvidia');
    setFormApiKey('');
    setFormIsActive(true);
    setFormIsPrimary(configs.length === 0);
    setFormMaxTokens(1200);
    setFormTemperature(0.3);
    setFormTimeoutMs(30000);
    setFormNotes('');
    setShowModal(true);
  };

  const openEditModal = (item: AiConfigItem) => {
    setEditingItem(item);
    setSelectedPreset(
      PROVIDER_PRESETS[item.providerSlug] ? item.providerSlug : 'custom'
    );
    setFormName(item.providerName);
    setFormSlug(item.providerSlug);
    setFormApiKey(item.maskedApiKey); // Show masked as placeholder
    setFormModel(item.model);
    setFormBaseUrl(item.baseUrl || '');
    setFormIsActive(item.isActive);
    setFormIsPrimary(item.isPrimary);
    setFormMaxTokens(item.maxTokens);
    setFormTemperature(item.temperature);
    setFormTimeoutMs(item.timeoutMs);
    setFormNotes(item.notes || '');
    setShowModal(true);
  };

  // Submit create or edit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingItem) {
        // Update existing
        const payload: Record<string, any> = {
          providerName: formName,
          model: formModel,
          baseUrl: formBaseUrl.trim() || null,
          isActive: formIsActive,
          isPrimary: formIsPrimary,
          maxTokens: Number(formMaxTokens),
          temperature: Number(formTemperature),
          timeoutMs: Number(formTimeoutMs),
          notes: formNotes || null,
        };

        // If API key was modified and not the masked placeholder
        if (formApiKey && !formApiKey.includes('...')) {
          payload.apiKey = formApiKey.trim();
        }

        const res = await fetch(`/api/admin/ai-config/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal memperbarui konfigurasi');

        setConfigs((prev) =>
          prev.map((c) => {
            if (c.id === editingItem.id) {
              return {
                ...c,
                ...data.data.config,
                maskedApiKey: payload.apiKey
                  ? `${payload.apiKey.substring(0, 6)}...${payload.apiKey.substring(payload.apiKey.length - 4)}`
                  : c.maskedApiKey,
              };
            }
            if (formIsPrimary && c.id !== editingItem.id) {
              return { ...c, isPrimary: false };
            }
            return c;
          })
        );
        showToast('success', 'Konfigurasi provider berhasil diperbarui');
      } else {
        // Create new
        const payload = {
          providerName: formName,
          providerSlug: formSlug.toLowerCase().trim(),
          apiKey: formApiKey.trim(),
          model: formModel.trim(),
          baseUrl: formBaseUrl.trim() || null,
          isActive: formIsActive,
          isPrimary: formIsPrimary,
          maxTokens: Number(formMaxTokens),
          temperature: Number(formTemperature),
          timeoutMs: Number(formTimeoutMs),
          notes: formNotes || null,
        };

        const res = await fetch('/api/admin/ai-config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menambahkan provider');

        const newConfig = {
          ...data.data.config,
          maskedApiKey: `${payload.apiKey.substring(0, 6)}...${payload.apiKey.substring(payload.apiKey.length - 4)}`,
        };

        setConfigs((prev) => {
          let updated = [...prev];
          if (formIsPrimary) {
            updated = updated.map((c) => ({ ...c, isPrimary: false }));
          }
          return [newConfig, ...updated];
        });
        showToast('success', 'Provider AI baru berhasil ditambahkan');
      }

      setShowModal(false);
    } catch (err: any) {
      showToast('error', err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  // Set provider as primary
  const handleSetPrimary = async (item: AiConfigItem) => {
    if (item.isPrimary) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/ai-config/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPrimary: true, isActive: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menetapkan primary provider');

      setConfigs((prev) =>
        prev.map((c) => ({
          ...c,
          isPrimary: c.id === item.id,
          isActive: c.id === item.id ? true : c.isActive,
        }))
      );
      showToast('success', `${item.providerName} sekarang menjadi Primary Provider AI`);
    } catch (err: any) {
      showToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (item: AiConfigItem) => {
    if (item.isPrimary && item.isActive) {
      showToast('error', 'Primary provider tidak bisa dinonaktifkan. Tetapkan provider lain sebagai primary terlebih dahulu.');
      return;
    }

    try {
      const nextActive = !item.isActive;
      const res = await fetch(`/api/admin/ai-config/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConfigs((prev) =>
        prev.map((c) => (c.id === item.id ? { ...c, isActive: nextActive } : c))
      );
      showToast(
        'success',
        `Provider ${item.providerName} ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}`
      );
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Delete provider
  const handleDelete = async (item: AiConfigItem) => {
    if (item.isPrimary) {
      showToast('error', 'Tidak bisa menghapus provider Primary.');
      return;
    }

    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus provider "${item.providerName}"?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/ai-config/${item.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setConfigs((prev) => prev.filter((c) => c.id !== item.id));
      showToast('success', `Provider ${item.providerName} berhasil dihapus`);
    } catch (err: any) {
      showToast('error', err.message);
    }
  };

  // Test connection
  const handleTestConnection = async (item: AiConfigItem) => {
    setTestingId(item.id);
    setTestResult(null);

    try {
      const res = await fetch('/api/admin/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerSlug: item.providerSlug,
          providerName: item.providerName,
          apiKey: item.apiKey, // Uses decrypted/actual key from server
          model: item.model,
          baseUrl: item.baseUrl,
          temperature: item.temperature,
          timeoutMs: item.timeoutMs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestResult({
          id: item.id,
          success: false,
          message: data.error || 'Koneksi gagal',
        });
      } else {
        setTestResult({
          id: item.id,
          success: true,
          message: data.data.message,
        });
      }
    } catch (err: any) {
      setTestResult({
        id: item.id,
        success: false,
        message: err.message || 'Gagal menghubungi server tes',
      });
    } finally {
      setTestingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#fff' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: 800,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              margin: '0 0 0.35rem',
            }}
          >
            <Bot size={28} color="var(--accent-cyan)" />
            Konfigurasi AI Assistant
          </h1>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Kelola provider LLM, model, API key, serta fallback engine untuk chatbot TechCare AI.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '0.65rem 1.15rem',
            fontWeight: 700,
            fontSize: '0.875rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(56,189,248,0.25)',
          }}
        >
          <Plus size={16} /> Tambah Provider
        </button>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            fontSize: '0.875rem',
            background:
              notification.type === 'success'
                ? 'rgba(16,185,129,0.15)'
                : 'rgba(239,68,68,0.15)',
            border: `1px solid ${
              notification.type === 'success'
                ? 'rgba(16,185,129,0.3)'
                : 'rgba(239,68,68,0.3)'
            }`,
            color: notification.type === 'success' ? '#34d399' : '#f87171',
          }}
        >
          {notification.type === 'success' ? (
            <CheckCircle size={18} />
          ) : (
            <AlertTriangle size={18} />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Info Notice Box */}
      <div
        style={{
          background: 'rgba(56,189,248,0.06)',
          border: '1px solid rgba(56,189,248,0.2)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '1.75rem',
          display: 'flex',
          gap: '0.85rem',
          alignItems: 'flex-start',
        }}
      >
        <Info size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: '0.15rem' }} />
        <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: '#fff' }}>Prinsip Kerja & Integritas Konteks:</strong>
          <br />
          Mengubah provider atau model <strong>tidak mengubah aturan perilaku, batasan keamanan, maupun kemampuan pembacaan database</strong> yang telah dikonfigurasi. Seluruh prompt sistem, konteks data live (pesanan, invoice, pelanggan, katalog servis), dan aturan keamanan role tetap disuntikkan secara utuh ke provider mana pun yang aktif.
        </div>
      </div>

      {/* Provider List Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        {configs.map((item) => {
          const isTesting = testingId === item.id;
          const currentTest = testResult?.id === item.id ? testResult : null;

          return (
            <div
              key={item.id}
              style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: item.isPrimary
                  ? '2px solid var(--accent-cyan)'
                  : '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                backdropFilter: 'blur(12px)',
                boxShadow: item.isPrimary
                  ? '0 0 24px rgba(56,189,248,0.18)'
                  : 'none',
              }}
            >
              <div>
                {/* Header card */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 'var(--radius-md)',
                        background: item.isPrimary
                          ? 'rgba(56,189,248,0.18)'
                          : 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Cpu
                        size={20}
                        color={
                          item.isPrimary ? 'var(--accent-cyan)' : 'var(--text-muted)'
                        }
                      />
                    </div>
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '1.05rem',
                          fontWeight: 700,
                          color: '#fff',
                        }}
                      >
                        {item.providerName}
                      </h3>
                      <span
                        style={{
                          fontSize: '0.725rem',
                          color: 'var(--text-muted)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        Slug: {item.providerSlug}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    {item.isPrimary && (
                      <span
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '999px',
                          background: 'rgba(56,189,248,0.2)',
                          color: 'var(--accent-cyan)',
                          border: '1px solid rgba(56,189,248,0.35)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Star size={11} fill="var(--accent-cyan)" /> PRIMARY
                      </span>
                    )}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                        background: item.isActive
                          ? 'rgba(16,185,129,0.15)'
                          : 'rgba(148,163,184,0.15)',
                        color: item.isActive ? '#34d399' : '#94a3b8',
                        border: `1px solid ${
                          item.isActive
                            ? 'rgba(16,185,129,0.3)'
                            : 'rgba(148,163,184,0.3)'
                        }`,
                      }}
                    >
                      {item.isActive ? '● Aktif' : '○ Nonaktif'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.45rem',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.25)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Model:</span>
                    <strong style={{ color: '#fff', fontFamily: 'monospace' }}>
                      {item.model}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>API Key:</span>
                    <span style={{ fontFamily: 'monospace', color: '#cbd5e1' }}>
                      {item.maskedApiKey}
                    </span>
                  </div>
                  {item.baseUrl && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Base URL:</span>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          color: '#94a3b8',
                          maxWidth: '220px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={item.baseUrl}
                      >
                        {item.baseUrl}
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Parameter:</span>
                    <span style={{ color: '#cbd5e1' }}>
                      Temp: {item.temperature} | Max: {item.maxTokens} tok
                    </span>
                  </div>
                  {item.notes && (
                    <div style={{ marginTop: '0.25rem', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                      "{item.notes}"
                    </div>
                  )}
                </div>

                {/* Test Result Message */}
                {currentTest && (
                  <div
                    style={{
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '0.775rem',
                      marginBottom: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      background: currentTest.success
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(239,68,68,0.12)',
                      border: `1px solid ${
                        currentTest.success
                          ? 'rgba(16,185,129,0.3)'
                          : 'rgba(239,68,68,0.3)'
                      }`,
                      color: currentTest.success ? '#34d399' : '#f87171',
                    }}
                  >
                    {currentTest.success ? (
                      <CheckCircle size={15} style={{ flexShrink: 0 }} />
                    ) : (
                      <XCircle size={15} style={{ flexShrink: 0 }} />
                    )}
                    <span>{currentTest.message}</span>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => handleTestConnection(item)}
                    disabled={isTesting}
                    title="Uji koneksi API ke model"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(56,189,248,0.1)',
                      border: '1px solid rgba(56,189,248,0.25)',
                      color: 'var(--accent-cyan)',
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      cursor: isTesting ? 'wait' : 'pointer',
                    }}
                  >
                    {isTesting ? (
                      <RotateCw size={13} className="animate-spin" />
                    ) : (
                      <Play size={13} />
                    )}
                    {isTesting ? 'Menguji...' : 'Uji Koneksi'}
                  </button>

                  {!item.isPrimary && (
                    <button
                      onClick={() => handleSetPrimary(item)}
                      title="Jadikan provider utama chatbot"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.45rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid var(--border-subtle)',
                        color: '#cbd5e1',
                        fontSize: '0.775rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Star size={13} /> Set Primary
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    onClick={() => handleToggleActive(item)}
                    title={item.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                    style={{
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: item.isActive ? '#f87171' : '#34d399',
                      cursor: 'pointer',
                    }}
                  >
                    {item.isActive ? <XCircle size={15} /> : <CheckCircle size={15} />}
                  </button>

                  <button
                    onClick={() => openEditModal(item)}
                    title="Edit konfigurasi"
                    style={{
                      padding: '0.45rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid var(--border-subtle)',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={15} />
                  </button>

                  {!item.isPrimary && (
                    <button
                      onClick={() => handleDelete(item)}
                      title="Hapus provider"
                      style={{
                        padding: '0.45rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.25)',
                        color: '#f87171',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CREATE / EDIT */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            style={{
              background: '#0b1120',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '1.75rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '1.25rem',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <Sliders size={20} color="var(--accent-cyan)" />
                {editingItem ? 'Edit Konfigurasi Provider' : 'Tambah Provider AI Baru'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            {/* Preset Selector (Only for new or reference) */}
            {!editingItem && (
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.5rem',
                    fontWeight: 600,
                  }}
                >
                  PILIH TEMPLATE PROVIDER:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {Object.entries(PROVIDER_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleApplyPreset(key)}
                      style={{
                        padding: '0.55rem 0.75rem',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        textAlign: 'center',
                        cursor: 'pointer',
                        background:
                          selectedPreset === key
                            ? 'rgba(56,189,248,0.18)'
                            : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${
                          selectedPreset === key
                            ? 'var(--accent-cyan)'
                            : 'var(--border-subtle)'
                        }`,
                        color: selectedPreset === key ? 'var(--accent-cyan)' : '#cbd5e1',
                      }}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
                {PROVIDER_PRESETS[selectedPreset]?.helpText && (
                  <p
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent-cyan)',
                      marginTop: '0.5rem',
                      marginBottom: 0,
                    }}
                  >
                    💡 {PROVIDER_PRESETS[selectedPreset].helpText}{' '}
                    {PROVIDER_PRESETS[selectedPreset].apiDocUrl && (
                      <a
                        href={PROVIDER_PRESETS[selectedPreset].apiDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          color: 'var(--accent-cyan)',
                          textDecoration: 'underline',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.2rem',
                        }}
                      >
                        Buka Dashboard <ExternalLink size={10} />
                      </a>
                    )}
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Provider Name & Slug */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    Nama Provider *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="misal: NVIDIA, Google Gemini"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    Slug Identitas *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingItem)}
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="misal: nvidia, gemini, groq"
                    style={{
                      width: '100%',
                      background: editingItem
                        ? 'rgba(255,255,255,0.02)'
                        : 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      color: editingItem ? '#94a3b8' : '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* API Key */}
              <div style={{ marginBottom: '1rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.35rem',
                    fontWeight: 600,
                  }}
                >
                  <Key size={13} style={{ display: 'inline', marginRight: '0.35rem' }} />
                  API Key *{' '}
                  {editingItem && (
                    <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                      (Kosongkan jika tidak ingin mengubah key lama)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  required={!editingItem}
                  value={formApiKey}
                  onChange={(e) => setFormApiKey(e.target.value)}
                  placeholder={
                    editingItem
                      ? 'Biarkan tetap untuk memakai API key saat ini'
                      : 'Masukkan API Key resmi'
                  }
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 0.85rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Model & Base URL */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    Model Identifier *
                  </label>
                  <input
                    type="text"
                    required
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="misal: nvidia/nemotron-3-super-120b-a12b atau gemini-2.0-flash"
                    list="model-suggestions"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  />
                  <datalist id="model-suggestions">
                    {PROVIDER_PRESETS[selectedPreset]?.models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.35rem',
                      fontWeight: 600,
                    }}
                  >
                    Custom Base URL (Opsional)
                  </label>
                  <input
                    type="text"
                    value={formBaseUrl}
                    onChange={(e) => setFormBaseUrl(e.target.value)}
                    placeholder="https://integrate.api.nvidia.com/v1"
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                    }}
                  />
                </div>
              </div>

              {/* Hyperparameters: Max Tokens, Temperature, Timeout */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Max Output Tokens
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="8192"
                    value={formMaxTokens}
                    onChange={(e) => setFormMaxTokens(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.55rem 0.75rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Temperature (0.0 - 1.0)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="1.5"
                    value={formTemperature}
                    onChange={(e) => setFormTemperature(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.55rem 0.75rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '0.35rem',
                    }}
                  >
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="5000"
                    max="120000"
                    value={formTimeoutMs}
                    onChange={(e) => setFormTimeoutMs(Number(e.target.value))}
                    style={{
                      width: '100%',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.55rem 0.75rem',
                      color: '#fff',
                      fontSize: '0.85rem',
                    }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.35rem',
                  }}
                >
                  Catatan Admin (Opsional)
                </label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="misal: Akun Tier 1 untuk jam kerja"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.55rem 0.75rem',
                    color: '#fff',
                    fontSize: '0.85rem',
                  }}
                />
              </div>

              {/* Checkboxes: Active & Primary */}
              <div
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  marginBottom: '1.5rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                  />
                  <span>Status Aktif</span>
                </label>

                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formIsPrimary}
                    onChange={(e) => setFormIsPrimary(e.target.checked)}
                  />
                  <span style={{ color: formIsPrimary ? 'var(--accent-cyan)' : '#cbd5e1' }}>
                    Jadikan Primary Provider (Default)
                  </span>
                </label>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '0.65rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.65rem 1.4rem',
                    borderRadius: 'var(--radius-md)',
                    background:
                      'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    cursor: loading ? 'wait' : 'pointer',
                  }}
                >
                  <Save size={16} />
                  {loading ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

