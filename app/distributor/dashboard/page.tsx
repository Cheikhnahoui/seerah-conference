'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface MyAttendee {
  id: string;
  full_name: string;
  phone_number: string;
  city: string | null;
  registration_date: string;
  registration_number: string;
}

export default function DistributorDashboardPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [distributorName, setDistributorName] = useState('');

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [occupation, setOccupation] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [attendees, setAttendees] = useState<MyAttendee[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [total, setTotal] = useState(0);

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('distributor_token') : null);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('distributor_token');
    localStorage.removeItem('distributor_name');
    router.push('/distributor');
  }, [router]);

  const fetchMyAttendees = useCallback(async () => {
    setLoadingList(true);
    const token = getToken();
    try {
      const res = await fetch('/api/distributor/my-attendees', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await res.json();
      if (result.success) {
        setAttendees(result.data);
        setTotal(result.meta?.total ?? result.data.length);
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      }
    } catch {
      // تجاهل — القائمة ستبقى فارغة، يمكن للموزّع المحاولة لاحقاً
    } finally {
      setLoadingList(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/distributor');
      return;
    }
    setDistributorName(localStorage.getItem('distributor_name') || '');
    setReady(true);
    fetchMyAttendees();
  }, [router, fetchMyAttendees]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMsg('');

    if (fullName.trim().length < 3) {
      setFormError('الاسم مطلوب (3 أحرف على الأقل)');
      return;
    }

    setSubmitting(true);
    const token = getToken();

    try {
      const res = await fetch('/api/distributor/register-attendee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phone.trim() || undefined,
          city: city.trim() || undefined,
          occupation: occupation.trim() || undefined,
        }),
      });
      const result = await res.json();

      if (result.success) {
        setSuccessMsg(`تم تسجيل "${result.data.full_name}" بنجاح`);
        setFullName('');
        setPhone('');
        setCity('');
        setOccupation('');
        fetchMyAttendees();
      } else if (res.status === 401 || res.status === 403) {
        handleLogout();
      } else {
        setFormError(result.error || 'حدث خطأ أثناء الحفظ');
      }
    } catch {
      setFormError('حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready) return null;

  return (
    <main className="min-h-screen pb-10" style={{ background: 'var(--color-bg)' }} dir="rtl">
      {/* Header */}
      <div
        className="w-full px-4 py-4 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))' }}
      >
        <div>
          <p className="text-sm font-bold text-white">مرحباً، {distributorName}</p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.75)' }}>لوحة الموزّع</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs px-3 py-1.5 rounded-lg font-medium"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
        >
          خروج
        </button>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-xl">
        {/* نموذج التسجيل */}
        <div
          className="rounded-2xl p-5 mb-6"
          style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            تسجيل مشارك جديد
          </h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder="الاسم الكامل"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>رقم الهاتف (اختياري)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                placeholder="+222..."
                dir="ltr"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>المدينة (اختياري)</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>الصفة (اختياري)</label>
                <input
                  type="text"
                  value={occupation}
                  onChange={(e) => setOccupation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
                  style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </div>
            </div>

            {formError && (
              <p className="text-sm px-4 py-2.5 rounded-lg" style={{ background: 'rgba(200,40,40,0.1)', color: '#b02a2a' }}>
                {formError}
              </p>
            )}
            {successMsg && (
              <p className="text-sm px-4 py-2.5 rounded-lg" style={{ background: 'rgba(26,92,42,0.1)', color: 'var(--color-green-dark)' }}>
                {successMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-green)', color: '#fff' }}
            >
              {submitting ? 'جارٍ التسجيل...' : 'تسجيل المشارك'}
            </button>
          </form>
        </div>

        {/* قائمة مشاركيني */}
        <div>
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            مشاركيني ({total})
          </h2>

          {loadingList ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-border)' }} />
              ))}
            </div>
          ) : attendees.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-muted)' }}>
              لم تسجّل أي مشارك بعد
            </p>
          ) : (
            <div className="space-y-2">
              {attendees.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl p-3.5"
                  style={{ background: '#fff', border: '1px solid var(--color-border)' }}
                >
                  <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{a.full_name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }} dir="ltr">
                    {a.phone_number.startsWith('NOPHONE') ? 'بدون رقم' : a.phone_number}
                    {a.city ? ` · ${a.city}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}