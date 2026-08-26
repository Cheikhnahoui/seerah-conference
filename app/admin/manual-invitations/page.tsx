'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Attendee } from '@/types';
import { InvitationCard } from '@/components/InvitationCard';
import { isPlaceholderPhone, formatForDisplay } from '@/lib/phone';

export default function ManualInvitationsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('admin_token') || '';

  useEffect(() => {
    if (!getToken()) {
      router.replace('/admin');
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ manual: 'true', search, limit: '200' });
      const response = await fetch(`/api/attendees?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.status === 401) {
        router.replace('/admin');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setAttendees(data.data || []);
        setTotal(data.count || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, router]);

  useEffect(() => {
    if (!checkingAuth) fetchAttendees();
  }, [checkingAuth, fetchAttendees]);

  const toggleDelivery = async (a: Attendee) => {
    const currentStatus = (a as any).delivery_status || 'not_delivered';
    const nextStatus = currentStatus === 'delivered' ? 'not_delivered' : 'delivered';

    setUpdatingId(a.id);
    try {
      const response = await fetch(`/api/attendees/${a.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ delivery_status: nextStatus }),
      });
      if ((await response.json()).success) {
        setAttendees((prev) =>
          prev.map((x) => (x.id === a.id ? ({ ...x, delivery_status: nextStatus } as any) : x))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const deliveredCount = attendees.filter((a) => (a as any).delivery_status === 'delivered').length;

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          الدعوات اليدوية
        </h1>
        <p className="text-sm mt-1" style={{ color: '#444444' }}>
          كل الدعوات التي أنشأتها بنفسك (فردياً أو عبر رفع جماعي) — بمعزل عن التسجيل العام للموقع.
        </p>
        <p className="text-sm mt-2 font-medium" style={{ color: 'var(--color-green)' }}>
          الإجمالي: {total} — تم تسليم {deliveredCount} منها
        </p>
      </div>

      <div className="glass rounded-2xl p-4 mb-6" style={{ border: '1px solid rgba(201, 168, 76, 0.15)' }}>
        <input
          type="text"
          placeholder="ابحث بالاسم أو رقم التسجيل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-islamic w-full px-4 py-2.5 rounded-xl text-sm"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner" /></div>
      ) : attendees.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#333333' }}>
          <p className="text-4xl mb-3">🎫</p>
          <p>لا توجد دعوات يدوية بعد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {attendees.map((a) => {
            const delivered = (a as any).delivery_status === 'delivered';
            const noPhone = isPlaceholderPhone(a.phone_number);
            const expanded = expandedId === a.id;

            return (
              <div key={a.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: '#fff' }}>
                <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-semibold" style={{ color: '#1a1a1a' }}>{a.full_name}</p>
                    <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(201,168,76,0.8)' }}>{a.registration_number}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                      {noPhone ? 'بدون رقم هاتف' : formatForDisplay(a.phone_number)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleDelivery(a)}
                      disabled={updatingId === a.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        background: delivered ? 'rgba(45,122,95,0.15)' : 'rgba(201,168,76,0.15)',
                        color: delivered ? '#1a5c2a' : 'var(--color-gold)',
                        border: `1px solid ${delivered ? 'rgba(45,122,95,0.35)' : 'rgba(201,168,76,0.35)'}`,
                      }}
                    >
                      {updatingId === a.id ? '...' : delivered ? '✅ تم التسليم' : '⏳ لم تُسلَّم'}
                    </button>

                    <button
                      onClick={() => setExpandedId(expanded ? null : a.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(26,92,42,0.1)', color: 'var(--color-green)', border: '1px solid rgba(26,92,42,0.25)' }}
                    >
                      {expanded ? 'إخفاء البطاقة' : 'عرض البطاقة'}
                    </button>
                  </div>
                </div>

                {expanded && (
                  <div className="p-4 pt-0">
                    <InvitationCard attendee={a} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}