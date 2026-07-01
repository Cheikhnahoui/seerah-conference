'use client';

import { useState, useEffect } from 'react';
import { Stats } from '@/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token') || '';
      const response = await fetch('/api/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          لوحة الإحصائيات
        </h1>
        <p className="text-sm mt-1" style={{ color: '#444444' }}>
          المؤتمر الدولي للسيرة النبوية — تحديث كل 30 ثانية
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="إجمالي المسجلين" value={stats?.total_registered || 0} icon="👥" color="#c9a84c" />
        <StatCard label="إجمالي الحاضرين" value={stats?.total_attended || 0} icon="✅" color="#2d7a5f" />
        <StatCard label="نسبة الحضور" value={`${stats?.attendance_rate || 0}%`} icon="📊" color="#1a5c4a" />
        <StatCard label="لم يحضروا بعد" value={(stats?.total_registered || 0) - (stats?.total_attended || 0)} icon="⏳" color="#9a7a30" />
      </div>

      {/* Attendance bar */}
      <div className="glass rounded-2xl p-6" style={{ border: '1px solid rgba(201, 168, 76, 0.15)' }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--color-gold)' }}>نسبة الحضور</h2>
        <div className="relative h-6 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${stats?.attendance_rate || 0}%`, background: 'linear-gradient(90deg, var(--color-green), var(--color-gold))' }} />
        </div>
        <div className="flex justify-between text-xs mt-2" style={{ color: '#444444' }}>
          <span>{stats?.total_attended} حاضر</span>
          <span>{stats?.attendance_rate}%</span>
          <span>{stats?.total_registered} مسجل</span>
        </div>
      {/* Conference Photo */}
      <div className="glass rounded-2xl overflow-hidden mt-6" style={{ border: '1px solid rgba(201, 168, 76, 0.15)' }}>
        <img
          src="/conference-photo.jpeg"
          alt="المؤتمر الدولي للسيرة النبوية"
          style={{ width: '100%', height: '360px', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
        />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <div className="w-2 h-2 rounded-full mt-1" style={{ background: color }} />
      </div>
      <div className="text-2xl md:text-3xl font-bold mb-1" style={{ color, fontFamily: 'Cairo, sans-serif' }}>{value}</div>
      <div className="text-xs" style={{ color: '#444444' }}>{label}</div>
    </div>
  );
}