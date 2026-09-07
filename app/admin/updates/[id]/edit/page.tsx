'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { UpdateType, ParticipationStatus, UPDATE_TYPE_LABELS, PARTICIPATION_STATUS_LABELS } from '@/types';

const TYPE_OPTIONS: UpdateType[] = ['news', 'announcement', 'notice', 'scholar', 'event'];

export default function EditUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [type, setType] = useState<UpdateType>('news');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [additionalImagesText, setAdditionalImagesText] = useState('');
  const [country, setCountry] = useState('');
  const [role, setRole] = useState('');
  const [participationStatus, setParticipationStatus] = useState<ParticipationStatus>('confirmed');
  const [isPublished, setIsPublished] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [isImportantNotice, setIsImportantNotice] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const isScholar = type === 'scholar';

  useEffect(() => {
    if (!id) return;
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

    fetch(`/api/updates/${id}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) {
          setNotFound(true);
          setLoading(false);
          return;
        }
        const post = result.data;
        setType(post.type);
        setTitle(post.title || '');
        setContent(post.content || '');
        setImageUrl(post.image_url || '');
        setAdditionalImagesText((post.additional_images || []).join('\n'));
        setCountry(post.country || '');
        setRole(post.role || '');
        setParticipationStatus(post.participation_status || 'confirmed');
        setIsPublished(post.is_published);
        setIsPinned(post.is_pinned);
        setIsImportantNotice(post.is_important_notice);
        setLoading(false);
      })
      .catch(() => {
        setNotFound(true);
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (title.trim().length < 2) {
      setError('العنوان مطلوب');
      return;
    }

    setSubmitting(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;

    const additional_images = additionalImagesText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      const res = await fetch(`/api/updates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          type,
          title: title.trim(),
          content: content.trim() || null,
          image_url: imageUrl.trim() || null,
          additional_images: additional_images.length > 0 ? additional_images : null,
          country: isScholar ? country.trim() || null : null,
          role: isScholar ? role.trim() || null : null,
          participation_status: isScholar ? participationStatus : null,
          is_published: isPublished,
          is_pinned: isPinned,
          is_important_notice: isScholar ? false : isImportantNotice,
        }),
      });
      const result = await res.json();
      if (result.success) {
        router.push('/admin/updates');
      } else {
        setError(result.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#fff',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
  };

  if (loading) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto" dir="rtl">
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-text-light)' }}>جارٍ التحميل...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="px-4 py-6 max-w-2xl mx-auto text-center" dir="rtl">
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>لم يُعثر على هذا المنشور</p>
        <Link href="/admin/updates" className="text-sm font-semibold" style={{ color: 'var(--color-green)' }}>→ رجوع</Link>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/updates" className="text-sm" style={{ color: 'var(--color-text-muted)' }}>→ رجوع</Link>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          تعديل المستجد
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* نوع المنشور */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>نوع المنشور</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setType(opt)}
                className="px-3 py-2 rounded-lg text-xs font-medium transition-colors"
                style={{
                  background: type === opt ? 'var(--color-green)' : '#fff',
                  color: type === opt ? '#fff' : 'var(--color-text-muted)',
                  border: `1px solid ${type === opt ? 'var(--color-green)' : 'var(--color-border)'}`,
                }}
              >
                {UPDATE_TYPE_LABELS[opt]}
              </button>
            ))}
          </div>
        </div>

        {/* العنوان / الاسم */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            {isScholar ? 'الاسم الكامل' : 'العنوان'}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
          />
        </div>

        {/* حقول خاصة بالعالم/الشيخ */}
        {isScholar && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>البلد</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>الصفة/التخصص</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>حالة المشاركة</label>
              <div className="flex gap-2">
                {(['confirmed', 'expected'] as ParticipationStatus[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setParticipationStatus(s)}
                    className="px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      background: participationStatus === s ? 'var(--color-green)' : '#fff',
                      color: participationStatus === s ? '#fff' : 'var(--color-text-muted)',
                      border: `1px solid ${participationStatus === s ? 'var(--color-green)' : 'var(--color-border)'}`,
                    }}
                  >
                    {PARTICIPATION_STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* المحتوى / النبذة */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            {isScholar ? 'نبذة قصيرة (اختياري)' : 'المحتوى'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-y"
            style={inputStyle}
          />
        </div>

        {/* الصورة الرئيسية */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
            رابط الصورة {isScholar ? '(صورة العالم/الشيخ)' : 'الرئيسية'}
          </label>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
            style={inputStyle}
            placeholder="https://..."
          />
        </div>

        {/* صور إضافية */}
        {!isScholar && (
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>
              صور إضافية (اختياري — رابط واحد في كل سطر)
            </label>
            <textarea
              value={additionalImagesText}
              onChange={(e) => setAdditionalImagesText(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-y"
              style={inputStyle}
            />
          </div>
        )}

        {/* خيارات النشر */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)' }}>
          <label className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-text)' }}>منشور (ظاهر للزوار)</span>
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4" />
          </label>
          <label className="flex items-center justify-between text-sm">
            <span style={{ color: 'var(--color-text)' }}>تثبيت في أعلى القائمة</span>
            <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="w-4 h-4" />
          </label>
          {!isScholar && (
            <label className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--color-text)' }}>إظهار كإشعار مهم في الصفحة الرئيسية</span>
              <input type="checkbox" checked={isImportantNotice} onChange={(e) => setIsImportantNotice(e.target.checked)} className="w-4 h-4" />
            </label>
          )}
        </div>

        {error && (
          <p className="text-sm px-4 py-2.5 rounded-lg" style={{ background: 'rgba(200,40,40,0.1)', color: '#b02a2a' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-green)', color: '#fff' }}
        >
          {submitting ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
        </button>
      </form>
    </div>
  );
}