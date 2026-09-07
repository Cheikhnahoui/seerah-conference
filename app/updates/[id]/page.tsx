'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  UpdatePost,
  UPDATE_TYPE_LABELS,
  PARTICIPATION_STATUS_LABELS,
} from '@/types';
import { formatDate } from '@/lib/utils';

export default function UpdateDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [post, setPost] = useState<UpdatePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    fetch(`/api/updates/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setPost(result.data);
        } else {
          setNotFound(true);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setNotFound(true);
          setLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [id]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="animate-pulse text-sm" style={{ color: 'var(--color-text-light)' }}>جارٍ التحميل...</div>
      </main>
    );
  }

  if (notFound || !post) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 px-4" style={{ background: 'var(--color-bg)' }} dir="rtl">
        <p className="text-lg font-semibold" style={{ color: 'var(--color-text-muted)' }}>لم يُعثر على هذا المنشور</p>
        <Link
          href="/updates"
          className="px-5 py-2 rounded-full text-sm font-semibold"
          style={{ background: 'var(--color-green)', color: '#fff' }}
        >
          → العودة لكل المستجدات
        </Link>
      </main>
    );
  }

  const isScholar = post.type === 'scholar';

  return (
    <main className="min-h-screen pb-16" style={{ background: 'var(--color-bg)' }} dir="rtl">
      {/* Header */}
      <header
        className="relative overflow-hidden py-6"
        style={{ background: 'linear-gradient(135deg, var(--color-green-dark) 0%, var(--color-green) 60%, #2d7a40 100%)' }}
      >
        <div className="relative z-10 container mx-auto px-4 max-w-3xl">
          <Link
            href="/updates"
            className="inline-block text-sm font-medium hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(255,255,255,0.85)' }}
          >
            → العودة لكل المستجدات
          </Link>
        </div>
      </header>

      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-green), var(--color-gold), var(--color-green))' }} />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <article
          className="rounded-2xl overflow-hidden"
          style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          {/* الصورة الرئيسية */}
          {post.image_url && (
            <div
              className="w-full relative overflow-hidden"
              style={{ aspectRatio: isScholar ? '4 / 3' : '16 / 9', background: 'var(--color-green-dark)' }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="p-6 sm:p-8">
            {/* شارة النوع */}
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{ background: 'rgba(26,92,42,0.1)', color: 'var(--color-green-dark)' }}
            >
              {UPDATE_TYPE_LABELS[post.type]}
            </span>

            {/* العنوان */}
            <h1
              className="text-2xl sm:text-3xl font-bold mb-3 leading-tight"
              style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}
            >
              {post.title}
            </h1>

            {/* بيانات العالم/الشيخ */}
            {isScholar ? (
              <div className="flex flex-wrap gap-2 mb-5">
                {post.country && (
                  <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                    📍 {post.country}
                  </span>
                )}
                {post.role && (
                  <span className="px-3 py-1 rounded-full text-sm" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
                    🎓 {post.role}
                  </span>
                )}
                {post.participation_status && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      background: post.participation_status === 'confirmed' ? 'rgba(26,92,42,0.1)' : 'rgba(212,160,23,0.15)',
                      color: post.participation_status === 'confirmed' ? 'var(--color-green-dark)' : '#8a6a10',
                    }}
                  >
                    {PARTICIPATION_STATUS_LABELS[post.participation_status]}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm mb-5" style={{ color: 'var(--color-text-light)' }}>
                نُشر بتاريخ {formatDate(post.publish_date)}
              </p>
            )}

            {/* المحتوى الكامل */}
            {post.content && (
              <div
                className="prose max-w-none text-base leading-relaxed whitespace-pre-wrap"
                style={{ color: 'var(--color-text)' }}
              >
                {post.content}
              </div>
            )}

            {/* الصور الإضافية */}
            {post.additional_images && post.additional_images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                {post.additional_images.map((src, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={src}
                    alt={`صورة إضافية ${i + 1}`}
                    className="w-full rounded-xl object-cover"
                    style={{ aspectRatio: '1 / 1' }}
                  />
                ))}
              </div>
            )}
          </div>
        </article>

        <div className="text-center mt-8">
          <Link
            href="/updates"
            className="inline-block px-5 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-85"
            style={{ background: 'var(--color-green)', color: '#fff' }}
          >
            → العودة لكل المستجدات
          </Link>
        </div>
      </div>
    </main>
  );
}