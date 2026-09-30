'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { UpdateCard } from '@/components/UpdateCard';
import { UpdatePost } from '@/types';

interface OrgContent {
  org_name: string;
  org_name_fr: string;
  logo_url: string;
  hero_description: string;
  about_text: string;
  about_image_url: string;
  mission_text: string;
  vision_text: string;
  fields_text: string;
}

interface Goal {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
}

interface Stat {
  id: string;
  label: string;
  value: string;
  icon: string | null;
}

function GoalsSection() {
  const [goals, setGoals] = useState<Goal[] | null>(null);

  useEffect(() => {
    fetch('/api/goals')
      .then((r) => r.json())
      .then((result) => { if (result.success) setGoals(result.data); })
      .catch(() => setGoals([]));
  }, []);

  if (goals !== null && goals.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <h2 className="text-2xl font-bold text-center mb-8" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
        أهداف التجمّع
      </h2>
      {goals === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-32 rounded-2xl animate-pulse" style={{ background: 'var(--color-border)' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => (
            <div key={g.id} className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 2px 10px rgba(0,0,0,0.04)' }}>
              <span className="text-2xl block mb-2">{g.icon || '🕌'}</span>
              <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--color-green-dark)' }}>{g.title}</h3>
              {g.description && <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{g.description}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function StatsSection() {
  const [stats, setStats] = useState<Stat[] | null>(null);

  useEffect(() => {
    fetch('/api/org-stats')
      .then((r) => r.json())
      .then((result) => { if (result.success) setStats(result.data); })
      .catch(() => setStats([]));
  }, []);

  if (stats !== null && stats.length === 0) return null;

  return (
    <section className="py-12" style={{ background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))' }}>
      <div className="container mx-auto px-4 max-w-4xl">
        {stats === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.1)' }} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((s) => (
              <div key={s.id} className="text-center">
                <span className="text-2xl block mb-1">{s.icon || '📊'}</span>
                <p className="text-2xl font-bold" style={{ color: '#fff' }}>{s.value}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LatestUpdatesSection() {
  const [posts, setPosts] = useState<UpdatePost[] | null>(null);

  useEffect(() => {
    fetch('/api/updates?limit=4')
      .then((res) => res.json())
      .then((result) => { if (result.success) setPosts(result.data); })
      .catch(() => setPosts([]));
  }, []);

  if (posts !== null && posts.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          آخر المستجدات
        </h2>
        <Link href="/updates" className="text-sm font-semibold px-4 py-2 rounded-full transition-opacity hover:opacity-85"
          style={{ background: 'var(--color-green)', color: '#fff' }}>
          عرض جميع المستجدات ←
        </Link>
      </div>
      {posts === null ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="rounded-2xl animate-pulse" style={{ background: 'var(--color-border)', aspectRatio: '3 / 4' }} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {posts.map((post) => <UpdateCard key={post.id} post={post} />)}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const [org, setOrg] = useState<OrgContent | null>(null);

  useEffect(() => {
    fetch('/api/org-content')
      .then((r) => r.json())
      .then((result) => { if (result.success) setOrg(result.data); })
      .catch(() => setOrg({} as OrgContent));
  }, []);

  const orgName = org?.org_name || 'التجمع الثقافي الإسلامي في موريتانيا وغرب إفريقيا';

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }} dir="rtl">
      {/* Hero */}
      <header className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-green-dark) 0%, var(--color-green) 60%, #2d7a40 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{ border: '2px solid var(--color-gold-light)' }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10" style={{ border: '2px solid var(--color-gold-light)' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-14 max-w-3xl text-center">
          {org?.logo_url && (
            <div className="w-24 h-24 mx-auto mb-6 rounded-full overflow-hidden" style={{ border: '2px solid rgba(212,160,23,0.7)', background: '#fff' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={org.logo_url} alt={orgName} className="w-full h-full object-contain" />
            </div>
          )}

          <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-tight" style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif' }}>
            {orgName}
          </h1>

          <div className="flex justify-center my-4">
            <div className="h-0.5 w-32 rounded" style={{ background: 'rgba(212,160,23,0.7)' }} />
            <span className="mx-3 text-sm" style={{ color: '#d4a017' }}>✦</span>
            <div className="h-0.5 w-32 rounded" style={{ background: 'rgba(212,160,23,0.7)' }} />
          </div>

          <p className="text-base mb-8 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.88)' }}>
            {org?.hero_description || 'صرح علمي وثقافي يُعنى بخدمة السيرة النبوية، ونشر قيم الإسلام، وتعزيز التواصل العلمي والثقافي في موريتانيا وغرب إفريقيا.'}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <a href="#about" className="px-6 py-3 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              التعرف على التجمّع
            </a>
            <Link href="/conference" className="px-6 py-3 rounded-full text-sm font-bold transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-gold, #d4a017)', color: '#1a1a1a' }}>
              مؤتمر السيرة النبوية
            </Link>
          </div>
        </div>
      </header>

      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-green), var(--color-gold), var(--color-green))' }} />

      {/* من نحن */}
      <section id="about" className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          {org?.about_image_url ? (
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={org.about_image_url} alt="من نحن" className="w-full object-cover" style={{ aspectRatio: '4/3' }} />
            </div>
          ) : (
            <div className="rounded-2xl flex items-center justify-center" style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))' }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '2.5rem' }}>☽</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
              من نحن
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-muted)' }}>
              {org?.about_text || 'المحتوى قيد الإضافة.'}
            </p>
          </div>
        </div>
      </section>

      {/* الأهداف */}
      <GoalsSection />

      {/* الإحصائيات */}
      <StatsSection />

      {/* آخر المستجدات */}
      <LatestUpdatesSection />

      {/* الفوتر */}
      <footer className="pt-10 pb-6" style={{ background: 'var(--color-green-dark)', color: 'rgba(255,255,255,0.8)' }}>
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="grid sm:grid-cols-3 gap-8 mb-8 text-sm">
            <div>
              <h3 className="font-bold text-white mb-3">{orgName}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {org?.hero_description || ''}
              </p>
            </div>
            <div>
              <h3 className="font-bold text-white mb-3">روابط الموقع</h3>
              <ul className="space-y-1.5">
                <li><a href="#about" className="hover:underline">من نحن</a></li>
                <li><Link href="/conference" className="hover:underline">مؤتمر السيرة النبوية</Link></li>
                <li><Link href="/updates" className="hover:underline">الأخبار والمستجدات</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-white mb-3">تواصل معنا</h3>
              <ul className="space-y-1.5">
                <li><Link href="/conference/retrieve" className="hover:underline">استرجاع بطاقة الدعوة</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 text-center text-xs" style={{ borderTop: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)' }}>
            {orgName} © {new Date().getFullYear()}
          </div>
        </div>
      </footer>
    </main>
  );
}