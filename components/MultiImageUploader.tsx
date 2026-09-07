'use client';

import { useRef, useState } from 'react';

interface MultiImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  label?: string;
  maxImages?: number;
}

export function MultiImageUploader({
  value,
  onChange,
  label = 'صور إضافية',
  maxImages = 8,
}: MultiImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFilesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setError('');

    const remaining = maxImages - value.length;
    if (remaining <= 0) {
      setError(`لا يمكن إضافة أكثر من ${maxImages} صور`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    const filesToUpload = files.slice(0, remaining);
    setUploading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

    const uploadedUrls: string[] = [];
    for (const file of filesToUpload) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload-image', {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        const result = await res.json();
        if (result.success) {
          uploadedUrls.push(result.data.url);
        } else {
          setError(result.error || 'فشل رفع إحدى الصور');
        }
      } catch {
        setError('حدث خطأ في الاتصال أثناء رفع إحدى الصور');
      }
    }

    if (uploadedUrls.length > 0) {
      onChange([...value, ...uploadedUrls]);
    }

    setUploading(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
        {label} ({value.length}/{maxImages})
      </label>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        onChange={handleFilesSelect}
        className="hidden"
        id="multi-image-upload"
      />

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
        {value.map((url, i) => (
          <div key={i} className="relative rounded-lg overflow-hidden" style={{ aspectRatio: '1 / 1', border: '1px solid var(--color-border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={`صورة ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(i)}
              className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}
              aria-label="حذف الصورة"
            >
              ×
            </button>
          </div>
        ))}

        {value.length < maxImages && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex flex-col items-center justify-center gap-1 rounded-lg text-xs font-medium disabled:opacity-60"
            style={{
              aspectRatio: '1 / 1',
              background: 'var(--color-bg)',
              border: '2px dashed var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            <span className="text-lg">{uploading ? '⏳' : '+'}</span>
            <span>{uploading ? 'رفع...' : 'إضافة'}</span>
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs mt-1" style={{ color: '#b02a2a' }}>{error}</p>
      )}
    </div>
  );
}