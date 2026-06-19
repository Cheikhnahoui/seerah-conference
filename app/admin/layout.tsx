'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (pathname === '/admin') { setReady(true); return; }
    const token = localStorage.getItem('admin_token');
    if (!token) { router.push('/admin'); return; }
    setReady(true);
  }, [pathname, router]);

  if (!ready) return null;
  if (pathname === '/admin') return <>{children}</>;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    router.push('/admin');
  };

  const navItems = [
    { href: '/admin/dashboard', label: 'الإحصائيات', icon: '📊' },
    { href: '/admin/attendees', label: 'المشاركون', icon: '👥' },
    { href: '/admin/settings', label: 'إعدادات المؤتمر', icon: '⚙️' },
    { href: '/admin/attendance', label: 'مسح QR', icon: '📷' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--color-bg)' }}>
      {/* Top bar */}
      <div className="w-full px-4 py-3 flex items-center justify-between shadow-sm"
        style={{ background: 'linear-gradient(135deg, var(--color-green-dark), var(--color-green))', borderBottom: '2px solid rgba(184,134,11,0.4)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)', border: '1.5px solid rgba(212,160,23,0.6)' }}>
            <span style={{ color: '#d4a017', fontSize: '1.1rem' }}>☽</span>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">لوحة الإدارة</p>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.7)' }}>السيرة النبوية</p>
          </div>
        </div>
        <button onClick={handleLogout} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-opacity hover:opacity-80"
          style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
          خروج
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 pb-24">
        {children}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 shadow-lg"
        style={{ background: '#fff', borderTop: '1px solid var(--color-border)' }}>
        <div className="flex">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}
                className="flex-1 flex flex-col items-center py-3 gap-1 text-xs font-medium transition-colors"
                style={{ color: active ? 'var(--color-green)' : 'var(--color-text-light)', background: active ? 'rgba(26,92,42,0.06)' : 'transparent' }}>
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
