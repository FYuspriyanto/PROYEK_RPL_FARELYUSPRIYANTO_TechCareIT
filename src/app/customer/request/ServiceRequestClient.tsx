'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wrench,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  Laptop,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';

interface ServiceRequestClientProps {
  user: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  services: any[];
}

function ServiceRequestForm({ user, services }: ServiceRequestClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get('serviceId');
  const paramDeviceType = searchParams.get('deviceType');
  const paramDeviceBrand = searchParams.get('deviceBrand');
  const paramDeviceModel = searchParams.get('deviceModel');
  const paramProblem = searchParams.get('problemDescription');
  const paramNotes = searchParams.get('notes');
  const isFromAi = searchParams.get('fromAi') === 'true';

  const initialServiceId =
    services.find((s) => s.id === preselectedServiceId)?.id ||
    services[0]?.id ||
    '';

  const [formData, setFormData] = useState({
    serviceId: initialServiceId,
    deviceType: paramDeviceType || 'Laptop',
    deviceBrand: paramDeviceBrand || '',
    deviceModel: paramDeviceModel || '',
    problemDescription: paramProblem || '',
    preferredDate: new Date().toISOString().split('T')[0],
    preferredTimeSlot: 'Pagi (09:00 - 12:00 WIB)',
    address: user.address || '',
    notes: paramNotes || '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected service object for live cost preview
  const selectedService = services.find((s) => s.id === formData.serviceId) || services[0];

  const symptomQuickChips = [
    'Mati Total / No Power',
    'Suhu Panas Overheat',
    'Blue Screen (BSOD)',
    'Layar Blank / Garis',
    'SSD Tidak Terbaca',
    'Kipas Bising Kasar',
    'Reinstall macOS / Windows',
    'Upgrade RAM & SSD',
  ];

  const handleChipClick = (chip: string) => {
    setFormData((prev) => ({
      ...prev,
      problemDescription: prev.problemDescription
        ? `${prev.problemDescription}, ${chip}`
        : chip,
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (formData.problemDescription.trim().length < 10) {
      setErrorMessage('Deskripsi kerusakan minimal 10 karakter agar teknisi dapat menganalisa dengan baik.');
      setLoading(false);
      return;
    }

    const preferredSchedule = `${formData.preferredDate} - ${formData.preferredTimeSlot}`;

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          deviceType: formData.deviceType,
          deviceBrand: formData.deviceBrand,
          deviceModel: formData.deviceModel,
          problemDescription: formData.problemDescription,
          preferredSchedule,
          address: formData.address,
          notes: formData.notes,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Gagal mengajukan permohonan servis.');
        setLoading(false);
        return;
      }

      // Success -> Redirect to confirmation page
      const orderNumber = data.data?.order?.orderNumber || 'SRV-NEW';
      const orderId = data.data?.order?.id || '';
      router.push(`/customer/request/success?orderNumber=${orderNumber}&orderId=${orderId}`);
    } catch (err: any) {
      setErrorMessage('Terjadi kesalahan jaringan saat mengirim data.');
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '2rem' }} className="grid-detail">
      {/* Left Form Area */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Formulir Pengajuan Servis IT</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Isi spesifikasi perangkat dan gejala kerusakan untuk diproses oleh teknisi kami
          </p>
        </div>

        {/* AI Pre-fill Notice Banner */}
        {isFromAi && (
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 23, 42, 0.9) 100%)',
              border: '1.5px solid var(--accent-cyan)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
              boxShadow: '0 4px 20px rgba(56,189,248,0.18)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 0 12px rgba(56,189,248,0.3)',
              }}
            >
              <Sparkles size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>
                  Form Terisi Otomatis dari Konsultasi TechCare AI
                </h4>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: 'rgba(56,189,248,0.2)',
                    color: 'var(--accent-cyan)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '999px',
                    border: '1px solid rgba(56,189,248,0.3)',
                  }}
                >
                  AI Pre-filled
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Layanan, jenis perangkat, dan rincian keluhan telah diisi dari percakapan Anda dengan AI.
                Anda dapat memeriksa kembali dan mengubah informasi di bawah sebelum melakukan konfirmasi pesanan.
              </p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fb7185',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              marginBottom: '1.5rem',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{errorMessage}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Service Selection */}
          <div className="form-group">
            <label className="form-label">Pilih Paket Layanan IT</label>
            <select
              name="serviceId"
              className="form-input"
              value={formData.serviceId}
              onChange={handleChange}
              required
            >
              {services.map((srv) => (
                <option key={srv.id} value={srv.id} style={{ background: '#111726' }}>
                  {srv.name} ({srv.category}) - Mulai Rp {srv.priceFrom.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          {/* Device Type and Brand */}
          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Jenis Perangkat</label>
              <select
                name="deviceType"
                className="form-input"
                value={formData.deviceType}
                onChange={handleChange}
                required
              >
                <option value="Laptop" style={{ background: '#111726' }}>Laptop</option>
                <option value="PC Desktop" style={{ background: '#111726' }}>PC Desktop / All-in-One</option>
                <option value="MacBook" style={{ background: '#111726' }}>MacBook / Mac Mini / iMac</option>
                <option value="Server / Storage" style={{ background: '#111726' }}>Server / NAS / External Storage</option>
                <option value="Lainnya" style={{ background: '#111726' }}>Lainnya</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Merk (Brand)</label>
              <input
                name="deviceBrand"
                type="text"
                required
                placeholder="Contoh: Asus, Lenovo, Apple, Dell, MSI"
                className="form-input"
                value={formData.deviceBrand}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Device Model */}
          <div className="form-group">
            <label className="form-label">Model / Tipe Seri Perangkat</label>
            <input
              name="deviceModel"
              type="text"
              required
              placeholder="Contoh: ROG Strix G15 / ThinkPad X1 / MacBook Pro M2"
              className="form-input"
              value={formData.deviceModel}
              onChange={handleChange}
            />
          </div>

          {/* Problem Description with Symptom Chips */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
              <label className="form-label">Deskripsi Kerusakan & Gejala Detail</label>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Min. 10 Karakter</span>
            </div>

            <textarea
              name="problemDescription"
              rows={4}
              required
              minLength={10}
              placeholder="Jelaskan secara rinci kronologi dan kendala yang dialami perangkat..."
              className="form-input"
              value={formData.problemDescription}
              onChange={handleChange}
            />

            {/* Quick Symptom Chips */}
            <div style={{ marginTop: '0.65rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                💡 Rekomendasi Gejala Cepat (Klik untuk menambahkan):
              </div>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {symptomQuickChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    className="btn btn-secondary btn-sm"
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem' }}
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preferred Schedule */}
          <div className="grid-2" style={{ marginTop: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Jadwal Preferensi Antar / Jemput</label>
              <input
                name="preferredDate"
                type="date"
                required
                className="form-input"
                value={formData.preferredDate}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slot Waktu Kedatangan</label>
              <select
                name="preferredTimeSlot"
                className="form-input"
                value={formData.preferredTimeSlot}
                onChange={handleChange}
              >
                <option value="Pagi (09:00 - 12:00 WIB)" style={{ background: '#111726' }}>Pagi (09:00 - 12:00 WIB)</option>
                <option value="Siang (13:00 - 16:00 WIB)" style={{ background: '#111726' }}>Siang (13:00 - 16:00 WIB)</option>
                <option value="Sore (16:00 - 18:30 WIB)" style={{ background: '#111726' }}>Sore (16:00 - 18:30 WIB)</option>
              </select>
            </div>
          </div>

          {/* Address */}
          <div className="form-group">
            <label className="form-label">Alamat Domisili / Lokasi Penjemputan</label>
            <textarea
              name="address"
              rows={2}
              placeholder="Jl. Gatot Subroto No. 45, Jakarta Selatan (Lengkap dengan patokan)"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Catatan Tambahan & Kelengkapan (Opsional)</label>
            <input
              name="notes"
              type="text"
              placeholder="Contoh: Unit disertakan adaptor charger original 230W dan dus"
              className="form-input"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '1rem', marginTop: '1rem' }}
          >
            {loading ? 'Mengirim Data Permintaan...' : 'Ajukan Permohonan Servis Sekarang'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>

      {/* Right Summary Live Preview */}
      <div>
        <div
          className="glass-card"
          style={{
            padding: '1.75rem',
            position: 'sticky',
            top: '90px',
            border: '1px solid rgba(56, 189, 248, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Sparkles size={18} color="var(--accent-cyan)" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Ringkasan Layanan</h3>
          </div>

          {selectedService && (
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Paket Terpilih:</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                {selectedService.name}
              </div>
              <span className="badge badge-indigo" style={{ marginBottom: '1.25rem' }}>
                {selectedService.category}
              </span>

              <div
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.65rem',
                  fontSize: '0.85rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimasi Biaya Mulai:</span>
                  <strong style={{ color: 'var(--accent-cyan)', fontSize: '1.05rem' }}>
                    Rp {selectedService.priceFrom.toLocaleString('id-ID')}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimasi Waktu Pengerjaan:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedService.estimatedDuration}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Status Awal Pesanan:</span>
                  <strong style={{ color: '#f59e0b' }}>REQUESTED</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <ShieldCheck size={15} color="var(--accent-emerald)" />
                  <span>Garansi Resmi 90 Hari untuk sparepart</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle2 size={15} color="var(--accent-cyan)" />
                  <span>Pelacakan 6 tahap realtime di portal</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Clock size={15} color="var(--accent-indigo)" />
                  <span>Konfirmasi rincian biaya sebelum tindakan</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ServiceRequestClient(props: ServiceRequestClientProps) {
  return (
    <div>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Buat Pengajuan Servis Baru</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Layanan penanganan masalah hardware dan software perangkat komputer
        </p>
      </div>

      <Suspense fallback={<div className="glass-card" style={{ padding: '3rem', textAlign: 'center' }}>Memuat formulir...</div>}>
        <ServiceRequestForm {...props} />
      </Suspense>
    </div>
  );
}
