'use client';

import { useRef, useState } from 'react';

interface ImageUploaderProps {
  value: string; // رابط الصورة الحالية (فارغ إن لم تُرفع بعد)
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUploader({ value, onChange, label = 'الصورة' }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-image', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const result = await res.json();

      if (result.success) {
        onChange(result.data.url);
      } else {
        setError(result.error || 'فشل رفع الصورة');
      }
    } catch {
      setError('حدث خطأ في الاتصال أثناء رفع الصورة');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>{label}</label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleFileSelect}
        className="hidden"
        id={`image-upload-${label}`}
      />

      {value ? (
        <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="معاينة" className="w-full object-cover" style={{ maxHeight: '220px' }} />
          <div className="absolute inset-0 flex items-end justify-center p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent 50%)' }}>
            <div className="flex gap-2 w-full">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="flex-1 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ background: '#fff', color: 'var(--color-text)' }}
              >
                {uploading ? 'جارٍ الرفع...' : 'تغيير الصورة'}
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={uploading}
                className="px-3 py-2 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ background: 'rgba(200,40,40,0.85)', color: '#fff' }}
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-full py-8 rounded-xl flex flex-col items-center justify-center gap-2 text-sm font-medium transition-colors disabled:opacity-60"
          style={{
            background: 'var(--color-bg)',
            border: '2px dashed var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        >
          <span className="text-2xl">{uploading ? '⏳' : '📷'}</span>
          <span>{uploading ? 'جارٍ رفع الصورة...' : 'اضغط لاختيار صورة من جهازك'}</span>
        </button>
      )}

      {error && (
        <p className="text-xs mt-1.5" style={{ color: '#b02a2a' }}>{error}</p>
      )}
    </div>
  );
}