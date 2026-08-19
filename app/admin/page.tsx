'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      // Handle any of the response shapes the auth API might return:
      // { token }, { data: { token } }, or { data: "tokenstring" }.
      const token: string | undefined =
        data?.token ||
        data?.data?.token ||
        (typeof data?.data === 'string' ? data.data : undefined);

      if (response.ok && data.success !== false && token) {
        localStorage.setItem('admin_token', token);
        router.push('/admin/dashboard');
      } else {
        setError(data?.error || 'بيانات الدخول غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-bg)' }}
      dir="rtl"
    >
      <div
        className="w-full max-w-md rounded-2xl p-6 md:p-10"
        style={{
          background: '#ffffff',
          border: '1px solid rgba(184, 134, 11, 0.25)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}
          >
            لوحة الإدارة
          </h1>
          <p className="text-sm" style={{ color: '#555555' }}>
            سجّل الدخول لإدارة إعدادات المؤتمر والمشاركين
          </p>
        </div>

        {error && (
          <div className="alert-error rounded-xl p-4 mb-6 text-center text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-islamic w-full px-4 py-3 rounded-xl text-base"
              style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
              dir="ltr"
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-islamic w-full px-4 py-3 rounded-xl text-base"
              style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
              dir="ltr"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-gold w-full py-4 rounded-xl text-lg font-bold mt-2 flex items-center justify-center gap-3"
            style={{ fontFamily: 'Cairo, sans-serif', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? (
              <>
                <span
                  className="spinner w-5 h-5"
                  style={{ borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                />
                <span>جاري الدخول...</span>
              </>
            ) : (
              <span>تسجيل الدخول</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}