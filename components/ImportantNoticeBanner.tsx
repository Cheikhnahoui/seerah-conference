'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { UpdatePost } from '@/types';

const DISMISS_KEY_PREFIX = 'notice_dismissed_';

export function ImportantNoticeBanner() {
  const [notice, setNotice] = useState<UpdatePost | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/updates?type=notice&limit=5')
      .then((res) => res.json())
      .then((result) => {
        if (cancelled || !result.success) return;
        const posts: UpdatePost[] = result.data || [];
        const important = posts.find((p) => p.is_important_notice && p.is_published);
        if (!important) return;

        try {
          const wasDismissed = sessionStorage.getItem(DISMISS_KEY_PREFIX + important.id);
          if (wasDismissed) return;
        } catch {
          // sessionStorage غير متاح — نتجاهل ونعرض الإشعار دائماً
        }

        setNotice(important);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, []);

  if (!notice || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY_PREFIX + notice.id, '1');
    } catch {
      // تجاهل
    }
  };

  return (
    <div
      className="w-full px-4 py-3 flex items-center gap-3 flex-wrap sm:flex-nowrap"
      style={{
        background: 'linear-gradient(90deg, #b02a2a, #c8483a)',
        color: '#fff',
      }}
      role="alert"
    >
      <span className="text-lg flex-shrink-0">⚠️</span>

      <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
        <span className="font-bold text-sm flex-shrink-0">إشعار مهم:</span>
        <span className="text-sm truncate">{notice.title}</span>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        <Link
          href={`/updates/${notice.id}`}
          className="text-xs font-semibold underline underline-offset-2 whitespace-nowrap"
        >
          التفاصيل
        </Link>
        <button
          onClick={handleDismiss}
          aria-label="إغلاق"
          className="text-lg leading-none opacity-80 hover:opacity-100 transition-opacity"
        >
          ×
        </button>
      </div>
    </div>
  );
}