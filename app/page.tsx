'use client';

import { useState, useEffect } from 'react';
import { RegistrationForm } from '@/components/RegistrationForm';
import { LangProvider, LangToggle, useLang } from '@/lib/i18n';
import { translateDateText } from '@/lib/dateFormat';
import { translateLocation } from '@/lib/venueTranslations';

let configCache: Record<string, any> | null = null;
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

interface HomeConfig {
  conf_name: string;
  conf_location: string;
  conf_description: string;
  conf_name_fr: string;
  conf_description_fr: string;
  conf_date_hijri: string;
  conf_date_gregorian: string;
}

const DEFAULT_CONFIG: HomeConfig = {
  conf_name: 'المؤتمر الدولي للسيرة النبوية',
  conf_location: 'المركز الدولي للمؤتمرات (المختار ولد داداه)',
  conf_description: 'يسعدنا دعوتكم للمشاركة في المؤتمر الدولي للسيرة النبوية',
  conf_name_fr: 'Conférence Internationale sur la Sîra du Prophète ﷺ',
  conf_description_fr: 'Nous sommes heureux de vous inviter à participer à la Conférence Internationale sur la Sîra du Prophète ﷺ',
  conf_date_hijri: '21 – 23 ربيع الأول 1448هـ',
  conf_date_gregorian: '4 – 6 سبتمبر 2026م',
};

function HomeContent() {
  const { t, lang } = useLang();
  const [config, setConfig] = useState<HomeConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    loadConfig().then(() => {
      if (configCache) {
        setConfig(prev => ({
          ...prev,
          conf_name: configCache?.conf_name || prev.conf_name,
          conf_location: configCache?.conf_location || prev.conf_location,
          conf_description: configCache?.conf_description || prev.conf_description,
          conf_name_fr: configCache?.conf_name_fr || prev.conf_name_fr,
          conf_description_fr: configCache?.conf_description_fr || prev.conf_description_fr,
          conf_date_hijri: configCache?.conf_date_hijri || prev.conf_date_hijri,
          conf_date_gregorian: configCache?.conf_date_gregorian || prev.conf_date_gregorian,
        }));
      }
    });
  }, []);

  // Date and location are ALWAYS derived from the same source text,
  // so the Arabic and French pages can never disagree again.
  const displayDate =
    lang === 'fr'
      ? `${translateDateText(config.conf_date_hijri)} (${translateDateText(config.conf_date_gregorian)})`
      : `${config.conf_date_hijri} الموافق ${config.conf_date_gregorian}`;
  const displayLocation =
    lang === 'fr' ? translateLocation(config.conf_location) : config.conf_location;

  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Top green banner */}
      <div className="w-full py-2 text-center text-sm font-medium"
        style={{ background: 'var(--color-green)', color: '#fff' }}>
        {t('bismillah')}
      </div>

      {/* Header */}
      <header className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-green-dark) 0%, var(--color-green) 60%, #2d7a40 100%)' }}>
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10"
            style={{ border: '2px solid var(--color-gold-light)' }} />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10"
            style={{ border: '2px solid var(--color-gold-light)' }} />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-6 max-w-3xl text-center">
          {/* Language Toggle */}
          <div className="mb-4">
            <LangToggle />
          </div>

          {/* Hero Banner */}
          <div dir="ltr" className="relative w-full mb-6 overflow-hidden" style={{
            height: '220px', borderRadius: '20px',
            border: '2px solid rgba(212,160,23,0.4)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
            background: 'var(--color-green-dark)',
            display: 'flex', alignItems: 'center', gap: '8px', padding: '8px',
          }}>
            <div style={{ flex: '1', height: '100%', borderRadius: '10px', overflow: 'hidden', minWidth: '60px',
              backgroundImage: 'url(/dome.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center top' }} />
            <div style={{ flexShrink: 0, width: 'clamp(140px, 40%, 260px)', height: '100%', borderRadius: '10px',
              overflow: 'hidden', border: '2px solid rgba(212,160,23,0.7)', boxShadow: '0 0 30px rgba(212,160,23,0.2)' }}>
              <img src="/gci-logo-new.jpeg" alt="GCI"
                style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#ffffff' }} />
            </div>
            <div style={{ flex: '1', height: '100%', borderRadius: '10px', overflow: 'hidden', minWidth: '60px',
              backgroundImage: 'url(/green-dome.jpeg)', backgroundSize: 'cover', backgroundPosition: 'center top' }} />
            <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }} />
            <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, transparent, #d4a017, transparent)' }} />
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-2 leading-tight"
            style={{ color: '#ffffff', fontFamily: 'Cairo, sans-serif' }}>
            {lang === 'fr' ? config.conf_name_fr : config.conf_name}
          </h1>

          <div className="flex justify-center my-3">
            <div className="h-0.5 w-32 rounded" style={{ background: 'rgba(212,160,23,0.7)' }} />
            <span className="mx-3 text-sm" style={{ color: '#d4a017' }}>✦</span>
            <div className="h-0.5 w-32 rounded" style={{ background: 'rgba(212,160,23,0.7)' }} />
          </div>

          <p className="text-base mb-6" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {lang === 'fr' ? config.conf_description_fr : config.conf_description}
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span>📅</span><span>{displayDate}</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
              <span>📍</span><span>{displayLocation}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="h-1.5" style={{ background: 'linear-gradient(90deg, var(--color-green), var(--color-gold), var(--color-green))' }} />

      <div className="container mx-auto px-4 py-10 max-w-2xl">
        <RegistrationForm />
      </div>

      <footer className="text-center py-8 mt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <div className="flex justify-center gap-6 text-sm mb-3" style={{ color: 'var(--color-text-muted)' }}>
          <a href="/retrieve" className="hover:text-green-700 transition-colors">{t('footer_retrieve')}</a>
          <span>|</span>
          <a href="/attendance" className="hover:text-green-700 transition-colors">{t('footer_reception')}</a>
          <span>|</span>
          <a href="/admin" className="hover:text-green-700 transition-colors">{t('footer_admin')}</a>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-text-light)' }}>
          {config.conf_name} © {new Date().getFullYear()}
        </p>
      </footer>
    </main>
  );
}

export default function HomePage() {
  return (
    <LangProvider>
      <HomeContent />
    </LangProvider>
  );
}