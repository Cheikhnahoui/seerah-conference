'use client';

import { useState, useEffect, useRef } from 'react';
import { Attendee } from '@/types';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

type ScanResult = {
  success: boolean;
  attendee?: Attendee;
  alreadyAttended?: boolean;
  message: string;
};

export default function AttendancePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrRef = useRef<unknown>(null);

  // FIX 1: Check token validity on every page load via API
  useEffect(() => {
    const token = localStorage.getItem('attendance_token');
    if (!token) return;
    fetch('/api/auth', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.valid) setAuthenticated(true); })
      .catch(() => {});
    return () => { stopScanner(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('attendance_token', data.token);
        setAuthenticated(true);
      } else {
        setLoginError(data.error || 'بيانات الدخول غير صحيحة');
      }
    } catch {
      setLoginError('حدث خطأ في الاتصال');
    } finally {
      setLoginLoading(false);
    }
  };

  const processQR = async (qrData: string) => {
    if (processing) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('attendance_token');
      const response = await fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ qr_data: qrData }),
      });
      const data = await response.json();

      // FIX 1: If token expired, force re-login
      if (response.status === 401) {
        localStorage.removeItem('attendance_token');
        setAuthenticated(false);
        return;
      }

      setResult(data);
    } catch {
      setResult({ success: false, message: 'خطأ في الاتصال بالخادم' });
    } finally {
      setProcessing(false);
    }
  };

  const startScanner = async () => {
    if (!scannerRef.current) return;
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const scanner = new Html5Qrcode('qr-reader');
      html5QrRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText: string) => { processQR(decodedText); },
        () => {}
      );
    } catch (error) {
      console.error('Scanner error:', error);
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrRef.current) {
      try {
        const scanner = html5QrRef.current as { stop: () => Promise<void> };
        await scanner.stop();
      } catch {}
    }
    setScanning(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('attendance_token');
    stopScanner();
    setAuthenticated(false);
  };

  // LOGIN SCREEN
  if (!authenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))', border: '3px solid rgba(184,134,11,0.4)' }}>
                <span style={{ fontSize: '2rem' }}>📷</span>
              </div>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
              نظام تسجيل الحضور
            </h1>
            <p className="text-sm mt-1" style={{ color: '#555' }}>
              تسجيل دخول موظف الاستقبال
            </p>
          </div>

          <div className="rounded-2xl p-8 shadow-lg" style={{ background: '#fff', border: '1px solid var(--color-border)' }}>
            {loginError && (
              <div className="alert-error rounded-xl p-3 mb-5 text-center text-sm">{loginError}</div>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>البريد الإلكتروني</label>
                <input type="email" placeholder="admin@seerah-conf.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  className="input-islamic w-full px-4 py-3 rounded-xl"
                  dir="ltr" style={{ textAlign: 'left', color: '#1a1a1a' }} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>كلمة المرور</label>
                <input type="password" placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="input-islamic w-full px-4 py-3 rounded-xl"
                  dir="ltr" style={{ textAlign: 'left' }} required />
              </div>
              <button type="submit" disabled={loginLoading}
                className="btn-gold w-full py-3.5 rounded-xl text-base font-bold flex items-center justify-center gap-2">
                {loginLoading ? <><span className="spinner w-5 h-5" style={{ borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /><span>جاري الدخول...</span></> : <span>دخول ←</span>}
              </button>
            </form>
          </div>

          <div className="text-center mt-4">
            <Link href="/" className="text-sm hover:underline" style={{ color: 'var(--color-green)' }}>
              العودة للصفحة الرئيسية
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // SCANNER SCREEN
  return (
    <main className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="container mx-auto px-4 py-6 max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            تسجيل الحضور
          </h1>
          <button onClick={handleLogout}
            className="text-sm px-4 py-2 rounded-lg font-medium"
            style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626' }}>
            خروج
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className={`rounded-2xl p-5 mb-5 text-center animate-[slideUp_0.3s_ease-out]`}
            style={{
              background: result.success ? 'rgba(26,92,42,0.1)' : result.alreadyAttended ? 'rgba(184,134,11,0.1)' : 'rgba(220,38,38,0.1)',
              border: `1px solid ${result.success ? 'rgba(26,92,42,0.3)' : result.alreadyAttended ? 'rgba(184,134,11,0.3)' : 'rgba(220,38,38,0.3)'}`,
              position: 'relative',
            }}>
            <button
              onClick={() => setResult(null)}
              style={{
                position: 'absolute', top: '10px', left: '10px',
                background: 'rgba(0,0,0,0.1)', border: 'none', borderRadius: '50%',
                width: '28px', height: '28px', cursor: 'pointer',
                fontSize: '14px', color: '#555', lineHeight: '28px',
              }}>
              ✕
            </button>
            <div className="text-4xl mb-2">
              {result.success ? '✅' : result.alreadyAttended ? '⚠️' : '❌'}
            </div>
            <p className="text-lg font-bold mb-3" style={{ color: '#1a1a1a' }}>{result.message}</p>
            {result.attendee && (
              <div className="text-sm space-y-1 text-right" style={{ color: '#333' }}>
                <p>👤 <strong>{result.attendee.full_name}</strong></p>
                <p>📱 {result.attendee.phone_number}</p>
                {result.attendee.city && <p>📍 {result.attendee.city}</p>}
                <p>🎫 {result.attendee.registration_number}</p>
              </div>
            )}
          </div>
        )}

        {/* QR Scanner */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="text-center font-bold mb-4" style={{ color: 'var(--color-green-dark)' }}>
            مسح رمز QR
          </h2>

          <div className="relative mb-4">
            <div id="qr-reader" ref={scannerRef} className="rounded-xl overflow-hidden"
              style={{ background: '#000', minHeight: scanning ? '280px' : '0' }} />
            {scanning && (
              <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                <div className="scan-corner scan-corner-tl" />
                <div className="scan-corner scan-corner-tr" />
                <div className="scan-corner scan-corner-bl" />
                <div className="scan-corner scan-corner-br" />
                <div className="scan-line-animated" />
              </div>
            )}
          </div>

          {!scanning ? (
            <button onClick={startScanner}
              className="btn-gold w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2">
              <span>📷</span><span>تشغيل الكاميرا</span>
            </button>
          ) : (
            <button onClick={stopScanner}
              className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2"
              style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)', color: '#dc2626' }}>
              <span>⏹️</span><span>إيقاف الكاميرا</span>
            </button>
          )}
        </div>

        {/* Manual entry */}
        <div className="rounded-2xl p-5" style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h3 className="text-center text-sm font-medium mb-4" style={{ color: '#555' }}>
            أو أدخل رقم التسجيل يدوياً
          </h3>
          <div className="flex gap-3">
            <input type="text" value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && manualCode.trim()) processQR(manualCode.trim()); }}
              placeholder="ISNA-XXXXX-XXXX"
              className="input-islamic flex-1 px-4 py-3 rounded-xl text-sm"
              dir="ltr" style={{ color: '#1a1a1a' }} />
            <button
              onClick={() => { if (manualCode.trim()) processQR(manualCode.trim()); }}
              disabled={!manualCode.trim() || processing}
              className="btn-gold px-6 py-3 rounded-xl font-bold"
              style={{ opacity: !manualCode.trim() ? 0.5 : 1 }}>
              {processing ? '...' : 'تحقق'}
            </button>
          </div>
        </div>

        <div className="text-center mt-5">
          <Link href="/admin/dashboard" className="text-sm hover:underline" style={{ color: 'var(--color-green)' }}>
            لوحة الإدارة
          </Link>
        </div>
      </div>
    </main>
  );
}