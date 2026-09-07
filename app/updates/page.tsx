'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { UpdateCard } from '@/components/UpdateCard';
import { UpdatePost, UpdateType, UPDATE_TYPE_LABELS } from '@/types';

const PAGE_SIZE = 12;

const FILTERS: { value: UpdateType | 'all'; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'news', label: UPDATE_TYPE_LABELS.news },
  { value: 'announcement', label: UPDATE_TYPE_LABELS.announcement },
  { value: 'notice', label: UPDATE_TYPE_LABELS.notice },
  { value: 'scholar', label: UPDATE_TYPE_LABELS.scholar },
  { value: 'event', label: UPDATE_TYPE_LABELS.event },
];

export default function UpdatesPage() {
  const [activeFilter, setActiveFilter] = useState<UpdateType | 'all'>('all');
  const [posts, setPosts] = useState<UpdatePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchPosts = useCallback(async (filter: UpdateType | 'all', offset: number) => {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (filter !== 'all') params.set('type', filter);
    const res = await fetch(`/api/updates?${params.toString()}`);
    return res.json();
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchPosts(activeFilter, 0).then((result) => {
      if (cancelled) return;
      if (result.success) {
        setPosts(result.data);
        setTotal(result.meta?.total ?? result.data.length);
        setHasMore((result.meta?.total ?? 0) > result.data.length);
      } else {
        setPosts([]);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [activeFilter, fetchPosts]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const result = await fetchPosts(activeFilter, posts.length);
    if (result.success) {
      setPosts((prev) => [...prev, ...result.data]);
      setHasMore(posts.length + result.data.length < (result.meta?.total ?? 0));
    }
    setLoadingMore(false);
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }} dir="rtl">
      {/* Header */}
      <header
        className="relative overflow-hidden py-10"
        style={{ background: 'linear-gradient(135deg, var(--color-green-dark) 0%, var(--color-green) 60%, #2d7a40 100%)' }}
      >
        <div className="relative z-10 container mx-auto px-4 max-w-4xl text-center">
          <Link
            href="/"
            className="inline-block mb-4 text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            → العودة للصفحة الرئيسية
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold" style={{ color: '#fff', fontFamily: 'Cairo, sans-serif' }}>
            آخر المستجدات
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.8)' }}>
            كل ما هو جديد حول المؤتمر في مكان واحد
          </p>
        </div>
      </header>

      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-green), var(--color-gold), var(--color-green))' }} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* تبويبات الفلترة */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          {FILTERS.map((f) => {
            const active = activeFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
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

        {/* الشبكة */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ background: 'var(--color-border)', aspectRatio: '3 / 4' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg mb-1" style={{ color: 'var(--color-text-muted)' }}>لا توجد مستجدات بعد</p>
            <p className="text-sm" style={{ color: 'var(--color-text-light)' }}>تابعونا لمعرفة آخر أخبار المؤتمر</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <UpdateCard key={post.id} post={post} />
              ))}
            </div>

            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold transition-opacity hover:opacity-85 disabled:opacity-50"
                  style={{ background: 'var(--color-green)', color: '#fff' }}
                >
                  {loadingMore ? 'جارٍ التحميل...' : 'تحميل المزيد'}
                </button>
              </div>
            )}

            <p className="text-center text-xs mt-6" style={{ color: 'var(--color-text-light)' }}>
              عرض {posts.length} من {total}
            </p>
          </>
        )}
      </div>
    </main>
  );
}