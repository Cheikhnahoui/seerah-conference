'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UpdatePost, UpdateType, UPDATE_TYPE_LABELS } from '@/types';
import { formatDateShort } from '@/lib/utils';

const FILTERS: { value: UpdateType | 'all'; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'news', label: UPDATE_TYPE_LABELS.news },
  { value: 'announcement', label: UPDATE_TYPE_LABELS.announcement },
  { value: 'notice', label: UPDATE_TYPE_LABELS.notice },
  { value: 'scholar', label: UPDATE_TYPE_LABELS.scholar },
  { value: 'event', label: UPDATE_TYPE_LABELS.event },
];

export default function AdminUpdatesPage() {
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<UpdateType | 'all'>('all');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UpdatePost | null>(null);

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const params = new URLSearchParams({ limit: '100', offset: '0' });
    if (filter !== 'all') params.set('type', filter);
    const res = await fetch(`/api/updates?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const result = await res.json();
    if (result.success) setPosts(result.data);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const updatePost = async (id: string, patch: Partial<UpdatePost>) => {
    setBusyId(id);
    const token = getToken();
    try {
      const res = await fetch(`/api/updates/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(patch),
      });
      const result = await res.json();
      if (result.success) {
        setPosts((prev) => prev.map((p) => (p.id === id ? result.data : p)));
      } else {
        alert(result.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBusyId(id);
    const token = getToken();
    try {
      const res = await fetch(`/api/updates/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await res.json();
      if (result.success) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert(result.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="px-4 py-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          إدارة المستجدات
        </h1>
        <Link
          href="/admin/updates/create"
          className="px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--color-green)', color: '#fff' }}
        >
          + إضافة مستجد جديد
        </Link>
      </div>

      {/* فلترة */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-4 px-4">
        {FILTERS.map((f) => {
          const active = filter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
              style={{
                background: active ? 'var(--color-green)' : '#fff',
                color: active ? '#fff' : 'var(--color-text-muted)',
                border: `1px solid ${active ? 'var(--color-green)' : 'var(--color-border)'}`,
              }}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--color-border)' }} />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>لا توجد منشورات بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const busy = busyId === post.id;
            return (
              <div
                key={post.id}
                className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ background: '#fff', border: '1px solid var(--color-border)', opacity: busy ? 0.6 : 1 }}
              >
                {/* صورة مصغرة */}
                <div
                  className="w-full sm:w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden"
                  style={{ background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))' }}
                >
                  {post.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>

                {/* المعلومات */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: 'rgba(26,92,42,0.1)', color: 'var(--color-green-dark)' }}
                    >
                      {UPDATE_TYPE_LABELS[post.type]}
                    </span>
                    {post.is_pinned && <span className="text-xs">📌</span>}
                    {post.is_important_notice && <span className="text-xs">⚠️</span>}
                    {!post.is_published && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: '#f0f0f0', color: '#888' }}>
                        غير منشور
                      </span>
                    )}
                  </div>
                  <p className="font-bold text-sm mt-1 truncate" style={{ color: 'var(--color-text)' }}>{post.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                    {formatDateShort(post.publish_date)}
                  </p>
                </div>

                {/* الأزرار */}
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <button
                    disabled={busy}
                    onClick={() => updatePost(post.id, { is_published: !post.is_published })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  >
                    {post.is_published ? 'إلغاء النشر' : 'نشر'}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => updatePost(post.id, { is_pinned: !post.is_pinned })}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  >
                    {post.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                  </button>
                  <Link
                    href={`/admin/updates/${post.id}/edit`}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-85"
                    style={{ background: 'var(--color-green)', color: '#fff' }}
                  >
                    تعديل
                  </Link>
                  <button
                    disabled={busy}
                    onClick={() => setDeleteTarget(post)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                    style={{ background: 'rgba(200,40,40,0.1)', color: '#b02a2a' }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* تأكيد الحذف */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff' }}>
            <p className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>تأكيد الحذف</p>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
              هل أنت متأكد من حذف &quot;{deleteTarget.title}&quot;؟ لا يمكن التراجع عن هذا الإجراء.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#b02a2a', color: '#fff' }}
              >
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}