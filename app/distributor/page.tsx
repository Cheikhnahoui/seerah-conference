'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DistributorLoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim() || !password) {
      setError('الرجاء إدخال رقم الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/distributor/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone.trim(), password }),
      });
      const result = await res.json();

      if (result.success) {
        localStorage.setItem('distributor_token', result.data.token);
        localStorage.setItem('distributor_name', result.data.distributor.full_name);
        router.push('/distributor/dashboard');
      } else {
        setError(result.error || 'حدث خطأ');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}
      dir="rtl"
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))', border: '2px solid rgba(212,160,23,0.5)' }}
          >
            <span style={{ color: '#d4a017', fontSize: '1.3rem' }}>☽</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            دخول الموزّعين
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            المؤتمر الدولي للسيرة النبوية
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
        >
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>رقم الهاتف</label>
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

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>كلمة المرور</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm px-4 py-2.5 rounded-lg" style={{ background: 'rgba(200,40,40,0.1)', color: '#b02a2a' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-green)', color: '#fff' }}
          >
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </main>
  );
}