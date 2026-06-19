'use client';

import { useState, useEffect } from 'react';
import { RegistrationForm } from '@/components/RegistrationForm';
import { InvitationCard } from '@/components/InvitationCard';
import { Attendee } from '@/types';

let configCache: Record<string, string> | null = null;
let configPromise: Promise<void> | null = null;

async function loadConfig() {
  if (configCache) return;
  if (!configPromise) {
    configPromise = fetch('/api/config')
      .then(res => res.json())
      .then(result => { if (result.success) configCache = result.data; })
      .catch(() => { configCache = {}; });
  }
  await configPromise;
}

export default function HomePage() {
  const [registeredAttendee, setRegisteredAttendee] = useState<Attendee | null>(null);
  const [config, setConfig] = useState({
    conf_name: 'المؤتمر الدولي للسيرة النبوية',
    conf_date: '١٥-١٧ ربيع الأول ١٤٤٦',
    conf_location: 'نواكشوط - موريتانيا',
    conf_description: 'يسعدنا دعوتكم للمشاركة في المؤتمر الدولي للسيرة النبوية',
  });

  useEffect(() => {
    loadConfig().then(() => {
      if (configCache) {
        setConfig(prev => ({
          ...prev,
          conf_name: configCache?.conf_name || prev.conf_name,
          conf_date: configCache?.conf_date || prev.conf_date,
          conf_location: configCache?.conf_location || prev.conf_location,
          conf_description: configCache?.conf_description || prev.conf_description,
        }));
      }
    });
  }, []);

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      {/* Top green banner */}
      <div className="w-full py-2 text-center text-sm font-medium"
        style={{ background: 'var(--color-green)', color: '#fff' }}>
        بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
      </div>

      {/* Header */}
      <header className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-green-dark) 0%, var(--color-green) 60%, #2d7a40 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
            style={{ border: '2px solid var(--color-gold-light)' }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10"
            style={{ border: '2px solid var(--color-gold-light)' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-10 max-w-3xl text-center">
        {/* Hero Banner - unified design */}
        <div dir="ltr" className="relative w-full mb-6 overflow-hidden" style={{
          height: '220px',
          borderRadius: '20px',
          border: '2px solid rgba(212,160,23,0.4)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
          background: 'var(--color-green-dark)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px'
        }}>

          {/* Left image - Dome of the Rock */}
          <div style={{
            flex: '1',
            height: '100%',
            borderRadius: '10px',
            overflow: 'hidden',
            minWidth: '60px',
            backgroundImage: 'url(/dome.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }} />

          {/* Center: GCI Logo */}
          <div style={{
            flexShrink: 0,
            width: 'clamp(140px, 40%, 260px)',
            height: '100%',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '2px solid rgba(212,160,23,0.7)',
            boxShadow: '0 0 30px rgba(212,160,23,0.2)',
          }}>
            <img
              src="/gci-logo.jpeg"
              alt="شعار التجمع الثقافي الإسلامي"
              style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#0a0a0a' }}
            />
          </div>

          {/* Right image - Green Dome */}
          <div style={{
            flex: '1',
            height: '100%',
            borderRadius: '10px',
            overflow: 'hidden',
            minWidth: '60px',
            backgroundImage: 'url(/green-dome.jpeg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
          }} />

          {/* Gold lines */}
          <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }} />
          <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }} />
        </div>


          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight"
            style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif' }}>
            {config.conf_name}
          </h1>

          <div className="flex justify-center my-3">
            <div className="h-0.5 w-32 rounded" style={{ background: 'rgba(212,160,23,0.7)' }} />
            <span className="mx-3 text-sm" style={{ color: '#d4a017' }}>✦</span>
            <div className="h-0.5 w-32 rounded" style={{ background: 'rgba(212,160,23,0.7)' }} />
          </div>

          <p className="text-base mb-6" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {config.conf_description}
          </p>

          {/* Date and location pills */}
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span>📅</span>
              <span>{config.conf_date}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span>📍</span>
              <span>{config.conf_location}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Gold divider */}
      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-green), var(--color-gold), var(--color-green))' }} />

      {/* Main content */}
      <div className="container mx-auto px-4 py-10 max-w-2xl">
        {!registeredAttendee ? (
          <RegistrationForm onSuccess={setRegisteredAttendee} />
        ) : (
          <div className="animate-[slideUp_0.5s_ease-out]">
            <InvitationCard attendee={registeredAttendee} />
            <div className="text-center mt-6">
              <button onClick={() => setRegisteredAttendee(null)}
                className="text-sm hover:underline" style={{ color: 'var(--color-green)' }}>
                تسجيل مشارك آخر
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="text-center py-8 mt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex justify-center gap-6 text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/retrieve" className="hover:text-green-700 transition-colors">استرجاع الدعوة</a>
          <span>|</span>
          <a href="/attendance" className="hover:text-green-700 transition-colors">موظف الاستقبال</a>
          <span>|</span>
          <a href="/admin" className="hover:text-green-700 transition-colors">لوحة الإدارة</a>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
          {config.conf_name} © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}