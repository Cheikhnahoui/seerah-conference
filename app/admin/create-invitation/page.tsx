'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Attendee } from '@/types';
import { InvitationCard } from '@/components/InvitationCard';
import { PhoneInput } from '@/components/PhoneInput';
import { validateName } from '@/lib/utils';
import { toE164, isValidPhoneForCountry, DEFAULT_COUNTRY, type CountryCode } from '@/lib/phone';

export default function CreateInvitationPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [fullName, setFullName] = useState('');
  const [phoneLocal, setPhoneLocal] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [noPhone, setNoPhone] = useState(false);
  const [city, setCity] = useState('');
  const [occupation, setOccupation] = useState('');

  const [errors, setErrors] = useState<{ full_name?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [createdAttendee, setCreatedAttendee] = useState<Attendee | null>(null);

  const getToken = () => localStorage.getItem('admin_token') || '';

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin');
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const validate = (): boolean => {
    const newErrors: { full_name?: string; phone?: string } = {};
    if (!validateName(fullName)) newErrors.full_name = 'الرجاء إدخال الاسم الكامل (3 أحرف على الأقل)';
    if (!noPhone && !isValidPhoneForCountry(phoneLocal, phoneCountry)) newErrors.phone = 'رقم هاتف غير صالح';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let e164: string | null = null;
    if (!noPhone) {
      e164 = toE164(phoneLocal, phoneCountry);
      if (!e164) {
        setErrors((prev) => ({ ...prev, phone: 'رقم هاتف غير صالح' }));
        return;
      }
    }

    setLoading(true);
    setServerError('');
    try {
      const response = await fetch('/api/attendees/admin-create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({
          full_name: fullName,
          phone_number: noPhone ? '' : e164,
          city,
          occupation,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setCreatedAttendee(result.data);
      } else if (response.status === 401) {
        router.replace('/admin');
      } else {
        setServerError(result.error || 'حدث خطأ، حاول مرة أخرى');
      }
    } catch {
      setServerError('حدث خطأ في الاتصال، حاول مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setCreatedAttendee(null);
    setFullName('');
    setPhoneLocal('');
    setCity('');
    setOccupation('');
    setErrors({});
    setServerError('');
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          إنشاء دعوة يدوياً
        </h1>
        <p className="text-sm mt-1" style={{ color: '#444444' }}>
          أدخل اسم الشخص ورقم هاتفه، وستُنشأ له بطاقة دعوة فوراً — بنفس تصميم الموقع تماماً، ومقبولة مباشرة.
        </p>
      </div>

      {!createdAttendee ? (
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          {serverError && (
            <div className="alert-error rounded-xl p-4 text-center text-sm">{serverError}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                الاسم الكامل <span style={{ color: 'var(--color-gold)' }}>*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value.replace(/[0-9]/g, ''))}
                placeholder="أدخل الاسم الكامل"
                className="input-islamic w-full px-4 py-3 rounded-xl text-base"
                style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
                disabled={loading}
              />
              {errors.full_name && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.full_name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                رقم الهاتف {!noPhone && <span style={{ color: 'var(--color-gold)' }}>*</span>}
              </label>
              {!noPhone && (
                <PhoneInput
                  value={phoneLocal}
                  country={phoneCountry}
                  onChange={(value, country) => { setPhoneLocal(value); setPhoneCountry(country); }}
                  lang="ar"
                  disabled={loading}
                />
              )}
              {errors.phone && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.phone}</p>}

              <label className="flex items-center gap-2 mt-2 text-sm" style={{ color: '#555555' }}>
                <input
                  type="checkbox"
                  checked={noPhone}
                  onChange={(e) => { setNoPhone(e.target.checked); setErrors((prev) => ({ ...prev, phone: undefined })); }}
                  disabled={loading}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <span>لا أعرف رقم هاتف هذا الشخص</span>
              </label>
              {noPhone && (
                <p className="text-xs mt-1" style={{ color: '#888888' }}>
                  ستُنشأ له بطاقة دعوة وQR فريد ويظهر في قائمة المشاركين، لكنه لن يستطيع استرجاع دعوته بنفسه لاحقاً (بما أنه لا يوجد رقم للبحث به) — سلّمه البطاقة مباشرة.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                المدينة <span style={{ color: '#888888', fontSize: '0.75rem' }}>(اختياري)</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input-islamic w-full px-4 py-3 rounded-xl text-base"
                style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
                الصفة أو الوظيفة <span style={{ color: '#888888', fontSize: '0.75rem' }}>(اختياري)</span>
              </label>
              <input
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="input-islamic w-full px-4 py-3 rounded-xl text-base"
                style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <span className="spinner w-5 h-5" style={{ borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                  <span>جاري الإنشاء...</span>
                </>
              ) : (
                <>
                  <span>إنشاء الدعوة</span>
                  <span>🎫</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="animate-[slideUp_0.5s_ease-out]">
          <InvitationCard attendee={createdAttendee} />
          <div className="text-center mt-6">
            <button onClick={reset} className="text-sm hover:underline" style={{ color: 'var(--color-green)' }}>
              إنشاء دعوة أخرى
            </button>
          </div>
        </div>
      )}
    </div>
  );
}