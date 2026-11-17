'use client';

import { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  HelpCircle,
  X,
  FileText,
} from 'lucide-react';

export interface KBArticleItem {
  id: string;
  title: string;
  content: string;
  category: string;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminKnowledgeBaseClientProps {
  initialArticles: KBArticleItem[];
}

const CATEGORY_OPTIONS = [
  'Hardware Troubleshooting',
  'Hardware Maintenance',
  'Software & OS',
  'Emergency Guide',
  'Kebijakan & Garansi',
  'FAQ Bisnis',
  'Prosedur Servis',
];

export default function AdminKnowledgeBaseClient({ initialArticles }: AdminKnowledgeBaseClientProps) {
  const [articles, setArticles] = useState<KBArticleItem[]>(initialArticles);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<KBArticleItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: CATEGORY_OPTIONS[0],
    content: '',
    isPublished: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered Articles
  const filteredArticles = useMemo(() => {
    return articles.filter((a) => {
      const matchSearch =
        search.trim() === '' ||
        a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.content.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase());

      const matchCat = selectedCategory === 'ALL' || a.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [articles, search, selectedCategory]);

  const uniqueCategories = useMemo(() => {
    const set = new Set(articles.map((a) => a.category));
    return Array.from(set);
  }, [articles]);

  const openCreateModal = () => {
    setEditingArticle(null);
    setFormData({
      title: '',
      category: CATEGORY_OPTIONS[0],
      content: '',
      isPublished: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (article: KBArticleItem) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      category: article.category,
      content: article.content,
      isPublished: article.isPublished,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      showToast('Judul dan konten wajib diisi', 'error');
      return;
    }

    setSubmitting(true);
    try {
      if (editingArticle) {
        // PATCH
        const res = await fetch(`/api/admin/knowledge-base/${editingArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal update artikel');

        setArticles((prev) =>
          prev.map((a) => (a.id === editingArticle.id ? { ...a, ...formData, updatedAt: new Date().toISOString() } : a))
        );
        showToast('Artikel berhasil diperbarui');
      } else {
        // POST
        const res = await fetch('/api/admin/knowledge-base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Gagal membuat artikel');

        const newArticle: KBArticleItem = {
          id: json.data.article.id,
          title: json.data.article.title,
          content: json.data.article.content,
          category: json.data.article.category,
          isPublished: json.data.article.isPublished,
          createdAt: json.data.article.createdAt,
          updatedAt: json.data.article.updatedAt,
        };
        setArticles((prev) => [newArticle, ...prev]);
        showToast('Artikel baru berhasil ditambahkan');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast(err.message || 'Terjadi kesalahan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const togglePublishStatus = async (article: KBArticleItem) => {
    try {
      const newStatus = !article.isPublished;
      const res = await fetch(`/api/admin/knowledge-base/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: newStatus }),
      });
      if (!res.ok) throw new Error('Gagal mengubah status publikasi');

      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, isPublished: newStatus } : a))
      );
      showToast(newStatus ? 'Artikel dipublikasikan' : 'Artikel diubah ke Draf');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/knowledge-base/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Gagal menghapus artikel');

      setArticles((prev) => prev.filter((a) => a.id !== id));
      setDeleteConfirmId(null);
      showToast('Artikel berhasil dihapus');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '0.85rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: toastMessage.type === 'success' ? '#064e3b' : '#7f1d1d',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontSize: '0.9rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            border: `1px solid ${toastMessage.type === 'success' ? '#10b981' : '#ef4444'}`,
          }}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--accent-cyan)',
                background: 'rgba(56,189,248,0.1)',
                padding: '0.2rem 0.6rem',
                borderRadius: '999px',
                border: '1px solid rgba(56,189,248,0.2)',
              }}
            >
              <Sparkles size={12} /> AI Grounding Source
            </span>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Knowledge Base Database
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            Basis data pengetahuan resmi yang digunakan oleh TechCare AI Assistant untuk menjawab pertanyaan customer secara akurat.
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
            padding: '0.7rem 1.25rem',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(56,189,248,0.3)',
          }}
        >
          <Plus size={18} /> Tambah Artikel
        </button>
      </div>

      {/* Info Card */}
      <div
        style={{
          background: 'rgba(56,189,248,0.05)',
          border: '1px solid rgba(56,189,248,0.18)',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
        }}
      >
        <HelpCircle size={20} color="var(--accent-cyan)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--text-primary)' }}>Cara Kerja Grounding AI:</strong> Setiap artikel yang berstatus{' '}
          <strong style={{ color: '#10b981' }}>Published</strong> otomatis diintegrasikan ke sistem AI saat customer berkonsultasi di{' '}
          <code>/customer/ai</code>. Pastikan informasi troubleshooting, jam buka, dan kebijakan garansi ditulis dengan jelas dan aman.
        </div>
      </div>

      {/* Filters & Search */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 320px', maxWidth: 450 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Cari artikel berdasarkan judul, kategori, atau isi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.6rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedCategory('ALL')}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              background: selectedCategory === 'ALL' ? 'var(--accent-cyan)' : 'var(--bg-card)',
              color: selectedCategory === 'ALL' ? '#000' : 'var(--text-secondary)',
              borderColor: selectedCategory === 'ALL' ? 'var(--accent-cyan)' : 'var(--border-subtle)',
            }}
          >
            Semua ({articles.length})
          </button>
          {uniqueCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '999px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                border: '1px solid',
                background: selectedCategory === cat ? 'var(--accent-cyan)' : 'var(--bg-card)',
                color: selectedCategory === cat ? '#000' : 'var(--text-secondary)',
                borderColor: selectedCategory === cat ? 'var(--accent-cyan)' : 'var(--border-subtle)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Articles Grid / List */}
      {filteredArticles.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <BookOpen size={44} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>Tidak ada artikel ditemukan</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Ubah kata kunci pencarian atau klik &quot;Tambah Artikel&quot; untuk membuat yang baru.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {filteredArticles.map((article) => (
            <div
              key={article.id}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                padding: '1.4rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                {/* Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99,102,241,0.15)',
                      color: 'var(--accent-indigo)',
                      border: '1px solid rgba(99,102,241,0.25)',
                    }}
                  >
                    {article.category}
                  </span>

                  <button
                    onClick={() => togglePublishStatus(article)}
                    title="Klik untuk toggle status"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '0.2rem 0.6rem',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      border: 'none',
                      background: article.isPublished ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                      color: article.isPublished ? '#10b981' : '#f87171',
                    }}
                  >
                    {article.isPublished ? (
                      <>
                        <CheckCircle2 size={12} /> Published
                      </>
                    ) : (
                      <>
                        <XCircle size={12} /> Draft
                      </>
                    )}
                  </button>
                </div>

                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: '0 0 0.65rem 0',
                    lineHeight: 1.4,
                  }}
                >
                  {article.title}
                </h3>

                <p
                  style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    lineHeight: 1.6,
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {article.content}
                </p>
              </div>

              {/* Actions Footer */}
              <div
                style={{
                  marginTop: '1.25rem',
                  paddingTop: '0.85rem',
                  borderTop: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {article.content.length} karakter
                </span>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => openEditModal(article)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      background: 'rgba(255,255,255,0.05)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem 0.75rem',
                      color: 'var(--text-primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    <Edit2 size={13} /> Edit
                  </button>

                  {deleteConfirmId === article.id ? (
                    <div style={{ display: 'flex', gap: '0.3rem' }}>
                      <button
                        onClick={() => handleDelete(article.id)}
                        style={{
                          background: '#dc2626',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.4rem 0.6rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Hapus!
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        style={{
                          background: 'rgba(255,255,255,0.1)',
                          color: 'var(--text-secondary)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          padding: '0.4rem 0.5rem',
                          fontSize: '0.75rem',
                          cursor: 'pointer',
                        }}
                      >
                        Batal
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(article.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.4rem 0.6rem',
                        color: '#f87171',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}
        >
          <div
            style={{
              background: '#0d1117',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-xl)',
              width: '100%',
              maxWidth: 650,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <FileText size={22} color="var(--accent-cyan)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {editingArticle ? 'Edit Artikel Knowledge Base' : 'Tambah Artikel Knowledge Base'}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Title */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Judul Artikel *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Gejala dan Solusi Laptop Lemot / Lambat"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Category */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Kategori *
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setFormData({ ...formData, category: cat })}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: '1px solid',
                        background: formData.category === cat ? 'rgba(56,189,248,0.2)' : 'var(--bg-card)',
                        color: formData.category === cat ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                        borderColor: formData.category === cat ? 'var(--accent-cyan)' : 'var(--border-subtle)',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Atau ketik kategori custom..."
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Content */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Isi / Konten Panduan *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {formData.content.length} karakter
                  </span>
                </div>
                <textarea
                  required
                  rows={8}
                  placeholder="Tuliskan troubleshooting langkah-demi-langkah, penjelasan penyebab masalah, atau kebijakan garansi/toko di sini..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '0.875rem',
                    lineHeight: 1.6,
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Published Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-card)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  style={{ width: 18, height: 18, cursor: 'pointer', accentColor: 'var(--accent-cyan)' }}
                />
                <label htmlFor="isPublished" style={{ fontSize: '0.875rem', color: 'var(--text-primary)', cursor: 'pointer' }}>
                  <strong>Publikasikan artikel</strong> (aktif digunakan oleh AI Assistant untuk grounding)
                </label>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '0.7rem 1.25rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.7rem 1.5rem',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                    border: 'none',
                    color: '#fff',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting && <Loader2 size={16} className="animate-spin" />}
                  {editingArticle ? 'Simpan Perubahan' : 'Buat Artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
