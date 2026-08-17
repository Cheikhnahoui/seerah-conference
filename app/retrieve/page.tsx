'use client';

import { useState } from 'react';
import { Attendee } from '@/types';
import { InvitationCard } from '@/components/InvitationCard';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import { PhoneInput } from '@/components/PhoneInput';
import { toE164, DEFAULT_COUNTRY, type CountryCode } from '@/lib/phone';
import Link from 'next/link';
import { LangProvider, LangToggle, useLang } from '@/lib/i18n';

function RetrieveContent() {
  const { t, lang } = useLang();
  const [phoneLocal, setPhoneLocal] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [loading, setLoading] = useState(false);
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneLocal.trim()) return;

    const e164 = toE164(phoneLocal, phoneCountry);
    if (!e164) {
      setError(t('phone_error'));
      return;
    }

    setLoading(true);
    setError('');
    setAttendee(null);
    try {
      const response = await fetch(`/api/retrieve?phone=${encodeURIComponent(e164)}`);
      const result = await response.json();
      if (result.success && result.data) {
        setAttendee(result.data);
      } else {
        setError(result.error || t('retrieve_not_found'));
      }
    } catch {
      setError(t('retrieve_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative" style={{ background: 'var(--color-bg)' }} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <IslamicPattern className="opacity-[0.03]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-sm hover:opacity-80 transition-opacity"
            style={{ color: 'rgba(201, 168, 76, 0.7)' }}>
            <span>{lang === 'ar' ? '→' : '←'}</span>
            <span>{t('back_home')}</span>
          </Link>
          <LangToggle />
        </div>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            {t('retrieve_title')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)' }}>{t('retrieve_subtitle')}</p>
        </div>

        {!attendee && (
          <div className="glass rounded-2xl p-8 mb-8" style={{ border: '1px solid rgba(201, 168, 76, 0.2)' }}>
            <form onSubmit={handleSearch} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                  {t('retrieve_phone_label')}
                </label>
                <PhoneInput
                  value={phoneLocal}
                  country={phoneCountry}
                  onChange={(value, country) => { setPhoneLocal(value); setPhoneCountry(country); }}
                  lang={lang}
                  disabled={loading}
                />
              </div>

              {error && <div className="alert-error rounded-xl p-4 text-center text-sm">{error}</div>}

              <button type="submit" disabled={loading}
                className="btn-gold w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3">
                {loading ? (
                  <><span className="spinner w-5 h-5" style={{ borderWidth: '2px' }} /><span>{t('retrieve_searching')}</span></>
                ) : (
                  <><span>🔍</span><span>{t('retrieve_search')}</span></>
                )}
              </button>
            </form>
          </div>
        )}

        {attendee && (
          <div className="animate-[slideUp_0.5s_ease-out]">
            <InvitationCard attendee={attendee} />
            <div className="text-center mt-6">
              <button onClick={() => { setAttendee(null); setPhoneLocal(''); }}
                className="text-sm hover:underline" style={{ color: 'rgba(201, 168, 76, 0.7)' }}>
                {t('retrieve_another')}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function RetrievePage() {
  return (
    <LangProvider>
      <RetrieveContent />
    </LangProvider>
  );
}