'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Attendee } from '@/types';
import { InvitationCard } from '@/components/InvitationCard';
import { IslamicPattern } from '@/components/ui/IslamicPattern';
import Link from 'next/link';

export default function InvitationPage() {
  const params = useParams();
  const [attendee, setAttendee] = useState<Attendee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendee = async () => {
      try {
        const response = await fetch(`/api/attendees/${params.id}`);
        const data = await response.json();
        if (data.success) {
          setAttendee(data.data);
        } else {
          setError('لم يتم العثور على بطاقة الدعوة');
        }
      } catch {
        setError('حدث خطأ في تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) fetchAttendee();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <p className="text-4xl mb-4">❌</p>
          <p className="text-xl font-bold mb-2" style={{ color: '#fca5a5' }}>{error}</p>
          <Link href="/" className="text-sm hover:underline" style={{ color: 'rgba(201, 168, 76, 0.7)' }}>
            العودة للصفحة الرئيسية
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative" style={{ background: 'var(--color-bg)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <IslamicPattern className="opacity-[0.03]" />
      </div>
      <div className="relative z-10 container mx-auto px-4 py-12 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-gold-light)', fontFamily: 'Cairo, sans-serif' }}>
            بطاقة الدعوة الإلكترونية
          </h1>
        </div>
        {attendee && <InvitationCard attendee={attendee} />}
        <div className="text-center mt-8">
          <Link href="/" className="text-sm hover:underline" style={{ color: 'rgba(201, 168, 76, 0.6)' }}>
            تسجيل مشارك جديد
          </Link>
        </div>
      </div>
    </main>
  );
}
