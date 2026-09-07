import Link from 'next/link';
import { UpdatePost, UPDATE_TYPE_LABELS, PARTICIPATION_STATUS_LABELS } from '@/types';
import { formatDateShort } from '@/lib/utils';

interface UpdateCardProps {
  post: UpdatePost;
}

const TYPE_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
  news: { bg: 'rgba(26,92,42,0.1)', color: 'var(--color-green-dark)' },
  announcement: { bg: 'rgba(212,160,23,0.15)', color: '#8a6a10' },
  notice: { bg: 'rgba(200,40,40,0.1)', color: '#b02a2a' },
  scholar: { bg: 'rgba(26,92,42,0.1)', color: 'var(--color-green-dark)' },
  event: { bg: 'rgba(45,122,64,0.12)', color: '#2d7a40' },
};

function excerpt(text: string | null, max = 110): string {
  if (!text) return '';
  const clean = text.trim();
  return clean.length > max ? clean.slice(0, max).trim() + '…' : clean;
}

export function UpdateCard({ post }: UpdateCardProps) {
  const isScholar = post.type === 'scholar';
  const badge = TYPE_BADGE_STYLE[post.type] || TYPE_BADGE_STYLE.news;

  return (
    <Link
      href={`/updates/${post.id}`}
      className="group block rounded-2xl overflow-hidden transition-transform hover:-translate-y-0.5"
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
      }}
    >
      {/* الصورة */}
      <div
        className="w-full relative overflow-hidden"
        style={{
          aspectRatio: isScholar ? '1 / 1' : '16 / 9',
          background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))',
        }}
      >
        {post.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt={post.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '2rem' }}>☽</span>
          </div>
        )}

        {post.is_pinned && (
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1"
            style={{ background: 'rgba(0,0,0,0.55)', color: '#d4a017' }}
          >
            <span>📌</span><span>مثبّت</span>
          </div>
        )}

        <div
          className="absolute bottom-2 left-2 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: badge.bg, color: badge.color, backdropFilter: 'blur(4px)' }}
        >
          {UPDATE_TYPE_LABELS[post.type]}
        </div>
      </div>

      {/* المحتوى */}
      <div className="p-4">
        <h3
          className="font-bold text-base mb-1 line-clamp-2"
          style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}
        >
          {post.title}
        </h3>

        {isScholar ? (
          <div className="flex flex-col gap-1 mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {(post.role || post.country) && (
              <p className="line-clamp-1">
                {post.role}
                {post.role && post.country ? ' — ' : ''}
                {post.country}
              </p>
            )}
            {post.participation_status && (
              <span
                className="inline-block w-fit px-2.5 py-0.5 rounded-full text-xs font-medium mt-1"
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
          <>
            <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--color-text-muted)' }}>
              {excerpt(post.content)}
            </p>
            <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
              {formatDateShort(post.publish_date)}
            </p>
          </>
        )}
      </div>
    </Link>
  );
}