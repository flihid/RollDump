import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchApi } from '../lib/api';
import toast from 'react-hot-toast';

interface VariantInput {
  format: string;
  frameSize: string;
  exposures: string;
}

const VALID_FORMATS = [
  { value: '35mm', label: '35mm' },
  { value: '120', label: '120 (Medium Format)' },
  { value: 'large_format', label: 'Large Format' },
];

export default function AdminAddFilm() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role !== 'admin') {
      toast.error('Akses ditolak');
      navigate('/');
    }
  }, [navigate]);

  const [form, setForm] = useState({
    name: '',
    brand: '',
    iso: '',
    type: 'color',
    description: '',
    imageUrl: '',
    datasheetUrl: '',
  });

  const [variants, setVariants] = useState<VariantInput[]>([
    { format: '35mm', frameSize: '24x36', exposures: '36' },
  ]);

  const addVariant = () => {
    setVariants(prev => [...prev, { format: '35mm', frameSize: '', exposures: '' }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error('Minimal satu varian diperlukan');
      return;
    }
    setVariants(prev => prev.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof VariantInput, value: string) => {
    setVariants(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v));
  };

  const handleSubmit = async () => {
    setShowConfirm(false);
    setSaving(true);

    const payload = {
      name: form.name,
      brand: form.brand,
      iso: parseInt(form.iso),
      type: form.type,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      datasheetUrl: form.datasheetUrl || undefined,
      variants: variants.map(v => ({
        format: v.format,
        frameSize: v.frameSize || undefined,
        exposures: v.exposures ? parseInt(v.exposures) : undefined,
      })),
    };

    try {
      await fetchApi('/api/v1/admin/films', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      toast.success('Film berhasil ditambahkan! 🎉');
      navigate('/films');
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan film');
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = form.name && form.brand && form.iso && parseInt(form.iso) > 0 && variants.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">➕ Tambah Film Baru</h1>
            <p className="text-sm text-gray-500">Back-office admin katalog</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            &larr; Kembali
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 md:p-8">
          {/* Film Info */}
          <div className="space-y-5 mb-8">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Informasi Film</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Film *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="Kodak Portra 400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={e => setForm({ ...form, brand: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="Kodak"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ISO *</label>
                <input
                  type="number"
                  value={form.iso}
                  onChange={e => setForm({ ...form, iso: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="400"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipe *</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition bg-white"
                >
                  <option value="color">Color</option>
                  <option value="bw">Black & White</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition resize-none"
                placeholder="Deskripsi singkat tentang film ini..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Gambar Film</label>
                <input
                  type="url"
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL Datasheet (.PDF)</label>
                <input
                  type="url"
                  value={form.datasheetUrl}
                  onChange={e => setForm({ ...form, datasheetUrl: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                  placeholder="https://example.com/datasheet.pdf"
                />
              </div>
            </div>
          </div>

          {/* Variants */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-bold text-gray-800">Varian Format</h2>
              <button
                onClick={addVariant}
                className="text-sm font-medium text-primary-600 hover:text-primary-800 transition flex items-center gap-1"
              >
                <span className="text-lg">+</span> Tambah Varian
              </button>
            </div>

            {variants.map((variant, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 relative group">
                {variants.length > 1 && (
                  <button
                    onClick={() => removeVariant(index)}
                    className="absolute top-3 right-3 text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                    title="Hapus varian"
                  >
                    ✕
                  </button>
                )}
                <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Varian {index + 1}</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Format *</label>
                    <select
                      value={variant.format}
                      onChange={e => updateVariant(index, 'format', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                    >
                      {VALID_FORMATS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Frame Size</label>
                    <input
                      type="text"
                      value={variant.frameSize}
                      onChange={e => updateVariant(index, 'frameSize', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="24x36"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Exposures</label>
                    <input
                      type="number"
                      value={variant.exposures}
                      onChange={e => updateVariant(index, 'exposures', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="36"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={!isFormValid || saving}
            className="w-full py-3 bg-black text-white font-semibold rounded-xl hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Menyimpan...' : 'Simpan Katalog'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Simpan Katalog?</h3>
            <p className="text-gray-500 mb-6">
              Film <strong>{form.name}</strong> dengan {variants.length} varian format akan ditambahkan ke katalog.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 py-2.5 bg-black text-white font-medium rounded-xl hover:bg-gray-800 transition"
              >
                Ya, Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
