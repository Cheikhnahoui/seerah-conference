'use client';

import { useState } from 'react';
import { Attendee } from '@/types';
import { InvitationCard } from '@/components/InvitationCard';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import { MAURITANIA_CONFIG, formatMauritanianPhone } from '@/lib/mauritania';
import Link from 'next/link';

export default function RetrievePage() {
  const [phoneLocal, setPhoneLocal] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneLocal.trim()) return;
    setLoading(true);
    setError('');
    setAttendee(null);

    try {
      const fullPhone = formatMauritanianPhone(phoneLocal);
      const digits = fullPhone.replace(/\D/g, '');

      // FIX: Use the dedicated retrieve endpoint instead of the admin attendees list
      const response = await fetch(`/api/retrieve?phone=${digits}`);
      const result = await response.json();

      if (result.success && result.data) {
        setAttendee(result.data);
      } else {
        setError(result.error || 'لم يتم العثور على تسجيل بهذا الرقم');
      }
    } catch {
      setError('حدث خطأ أثناء البحث');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen relative" style={{ background: 'var(--color-bg)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #c9a84c 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <IslamicPattern className="opacity-[0.03]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm mb-8 hover:opacity-80 transition-opacity"
          style={{ color: 'rgba(201, 168, 76, 0.7)' }}>
          <span>→</span>
          <span>العودة للصفحة الرئيسية</span>
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            استرجاع بطاقة الدعوة
          </h1>
          <p style={{ color: 'rgba(240, 230, 208, 0.6)' }}>
            أدخل رقم هاتفك الموريتاني لاسترجاع بطاقة دعوتك
          </p>
        </div>

        {!attendee && (
          <div className="glass rounded-2xl p-8 mb-8" style={{ border: '1px solid rgba(201, 168, 76, 0.2)' }}>
            <form onSubmit={handleSearch} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                  رقم الهاتف المسجل
                </label>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-bold flex-shrink-0"
                    style={{
                      background: 'rgba(201, 168, 76, 0.15)',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                      color: 'var(--color-gold)',
                      fontFamily: 'monospace',
                    }}>
                    <span>{MAURITANIA_CONFIG.countryFlag}</span>
                    <span>{MAURITANIA_CONFIG.countryCode}</span>
                  </div>
                  <input
                    type="tel"
                    value={phoneLocal}
                    onChange={(e) => setPhoneLocal(e.target.value.replace(/[^\d\s\-]/g, ''))}
                    placeholder="XX XX XX XX"
                    className="input-islamic flex-1 px-4 py-3 rounded-xl text-base"
                    dir="ltr"
                    style={{ textAlign: 'left', fontFamily: 'monospace' }}
                    maxLength={12}
                  />
                </div>
              </div>

              {error && (
                <div className="alert-error rounded-xl p-4 text-center text-sm">{error}</div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-gold w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <span className="spinner w-5 h-5" style={{ borderWidth: '2px' }} />
                    <span>جاري البحث...</span>
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    <span>بحث عن دعوتي</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {attendee && (
          <div className="animate-[slideUp_0.5s_ease-out]">
            <InvitationCard attendee={attendee} />
            <div className="text-center mt-6">
              <button
                onClick={() => { setAttendee(null); setPhoneLocal(''); }}
                className="text-sm hover:underline"
                style={{ color: 'rgba(201, 168, 76, 0.7)' }}>
                البحث برقم آخر
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
