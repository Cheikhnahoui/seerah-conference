'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
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
      if (data.success && data.token) {
        localStorage.setItem('admin_token', data.token);
        router.push('/admin/dashboard');
      } else {
        setError(data.error || 'بيانات الدخول غير صحيحة');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))', border: '3px solid rgba(184,134,11,0.4)' }}>
              <span style={{ fontSize: '2rem' }}>🔐</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            لوحة الإدارة
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            المؤتمر الدولي للسيرة النبوية
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 shadow-lg" style={{ background: '#fff', border: '1px solid var(--color-border)' }}>
          {error && (
            <div className="alert-error rounded-xl p-3 mb-5 text-center text-sm">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="أدخل البريد الإلكتروني"
                className="input-islamic w-full px-4 py-3 rounded-xl text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input-islamic w-full px-4 py-3 rounded-xl text-sm"
                required
              />
            </div>
            <button type="submit" disabled={loading}
              className="btn-gold w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2">
              {loading ? <><span className="spinner w-5 h-5" style={{ borderWidth: '2px' }} /><span>جاري الدخول...</span></> : <span>دخول ←</span>}
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <a href="/" className="text-sm hover:underline" style={{ color: 'var(--color-green)' }}>
            العودة للصفحة الرئيسية
          </a>
        </div>
      </div>
    </div>
  );
}