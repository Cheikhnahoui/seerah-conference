'use client';

import { useState, useEffect, useCallback } from 'react';
import { Attendee } from '@/types';
import { formatDate, exportToCSV } from '@/lib/utils';

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', phone_number: '', city: '', occupation: '' });
  const limit = 20;

  const getToken = () => localStorage.getItem('admin_token') || '';

  const fetchAttendees = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, city: cityFilter, page: String(page), limit: String(limit) });
      const response = await fetch(`/api/attendees?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        setAttendees(data.data || []);
        setTotal(data.count || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [search, cityFilter, page]);

  useEffect(() => { fetchAttendees(); }, [fetchAttendees]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشارك؟')) return;
    const response = await fetch(`/api/attendees/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if ((await response.json()).success) fetchAttendees();
  };

  const startEdit = (a: Attendee) => {
    setEditingId(a.id);
    setEditForm({ full_name: a.full_name, phone_number: a.phone_number, city: a.city || '', occupation: a.occupation || '' });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const response = await fetch(`/api/attendees/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify(editForm),
    });
    if ((await response.json()).success) { setEditingId(null); fetchAttendees(); }
  };

  const handleExportCSV = () => {
    const exportData = attendees.map((a) => ({
      'رقم التسجيل': a.registration_number,
      'الاسم الكامل': a.full_name,
      'رقم الهاتف': a.phone_number,
      'المدينة': a.city || '',
      'الصفة أو الوظيفة': a.occupation || '',
      'حالة الحضور': a.attendance_status === 'attended' ? 'حاضر' : 'مسجل',
      'تاريخ التسجيل': formatDate(a.registration_date),
      'تاريخ الحضور': a.attendance_date ? formatDate(a.attendance_date) : '',
    }));
    exportToCSV(exportData, 'المشاركون');
  };

  const handleExportExcel = async () => {
    const XLSX = await import('xlsx');
    const data = attendees.map((a) => ({
      'رقم التسجيل': a.registration_number,
      'الاسم الكامل': a.full_name,
      'رقم الهاتف': a.phone_number,
      'المدينة': a.city || '',
      'الصفة أو الوظيفة': a.occupation || '',
      'حالة الحضور': a.attendance_status === 'attended' ? 'حاضر' : 'مسجل',
      'تاريخ التسجيل': formatDate(a.registration_date),
      'تاريخ الحضور': a.attendance_date ? formatDate(a.attendance_date) : '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'المشاركون');
    XLSX.writeFile(wb, 'المشاركون.xlsx');
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            إدارة المشاركين
          </h1>
          <p className="text-sm mt-1" style={{ color: '#333333' }}>إجمالي: {total} مشارك</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCSV} className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'rgba(45, 122, 95, 0.2)', border: '1px solid rgba(45, 122, 95, 0.4)', color: '#6ee7b7' }}>
            📥 CSV
          </button>
          <button onClick={handleExportExcel} className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'rgba(201, 168, 76, 0.2)', border: '1px solid rgba(201, 168, 76, 0.4)', color: 'var(--color-green-dark)' }}>
            📊 Excel
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="glass rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3"
        style={{ border: '1px solid rgba(201, 168, 76, 0.15)' }}>
        <input type="text" placeholder="البحث بالاسم أو الهاتف..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-islamic flex-1 px-4 py-2.5 rounded-xl text-sm" />
        <input type="text" placeholder="فلترة بالمدينة..." value={cityFilter}
          onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
          className="input-islamic flex-1 px-4 py-2.5 rounded-xl text-sm sm:max-w-[200px]" />
        <button onClick={fetchAttendees} className="btn-gold px-6 py-2.5 rounded-xl text-sm font-semibold">
          🔍 بحث
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><div className="spinner" /></div>
      ) : attendees.length === 0 ? (
        <div className="text-center py-16" style={{ color: '#333333' }}>
          <p className="text-4xl mb-3">👥</p>
          <p>لا توجد نتائج</p>
        </div>
      ) : (
        <>
          {/* MOBILE: Cards view */}
          <div className="hidden space-y-3 mb-6">
            {attendees.map((a) => (
              <div key={a.id} className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(201, 168, 76, 0.15)' }}>
                {editingId === a.id ? (
                  <div className="space-y-2">
                    <input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                      className="input-islamic px-3 py-2 rounded-lg text-sm w-full" placeholder="الاسم" />
                    <input value={editForm.phone_number} onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                      className="input-islamic px-3 py-2 rounded-lg text-sm w-full" placeholder="الهاتف" dir="ltr" />
                    <input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      className="input-islamic px-3 py-2 rounded-lg text-sm w-full" placeholder="المدينة" />
                    <input value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                      className="input-islamic px-3 py-2 rounded-lg text-sm w-full" placeholder="الصفة أو الوظيفة" />
                    <div className="flex gap-2 pt-1">
                      <button onClick={saveEdit} className="flex-1 py-2 rounded-lg text-sm font-medium"
                        style={{ background: 'rgba(45, 122, 95, 0.3)', color: '#6ee7b7' }}>حفظ</button>
                      <button onClick={() => setEditingId(null)} className="flex-1 py-2 rounded-lg text-sm"
                        style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,230,208,0.5)' }}>إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-bold text-base" style={{ color: '#1a1a1a' }}>{a.full_name}</p>
                        <p className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(201, 168, 76, 0.6)' }}>{a.registration_number}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${a.attendance_status === 'attended' ? 'badge-attended' : 'badge-registered'}`}>
                        {a.attendance_status === 'attended' ? '✅ حاضر' : '🕐 مسجل'}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm mb-3">
                      <p style={{ color: '#1a1a1a' }}>📱 <span dir="ltr">{a.phone_number.replace(/^222/, '')}</span></p>
                      {a.city && <p style={{ color: '#1a1a1a' }}>📍 {a.city}</p>}
                      {a.occupation && <p style={{ color: '#1a1a1a' }}>💼 {a.occupation}</p>}
                      <p className="text-xs" style={{ color: '#333333' }}>📅 {formatDate(a.registration_date)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(a)} className="flex-1 py-1.5 rounded-lg text-xs"
                        style={{ background: 'rgba(201, 168, 76, 0.15)', color: 'var(--color-gold)' }}>✏️ تعديل</button>
                      <button onClick={() => handleDelete(a.id)} className="flex-1 py-1.5 rounded-lg text-xs"
                        style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}>🗑️ حذف</button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* DESKTOP: Table view */}
          <div className="block glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(201, 168, 76, 0.15)' }}>
            <div className="overflow-x-auto">
              <table className="w-full table-islamic" style={{ minWidth: '800px' }}>
                <thead>
                  <tr>
                    <th>رقم التسجيل</th>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>المدينة</th>
                    <th>الصفة</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a) => (
                    <tr key={a.id}>
                      {editingId === a.id ? (
                        <>
                          <td className="text-xs" style={{ color: 'rgba(201, 168, 76, 0.7)' }}>{a.registration_number}</td>
                          <td><input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            className="input-islamic px-2 py-1 rounded-lg text-sm w-full" /></td>
                          <td><input value={editForm.phone_number} onChange={(e) => setEditForm({ ...editForm, phone_number: e.target.value })}
                            className="input-islamic px-2 py-1 rounded-lg text-sm w-full" dir="ltr" /></td>
                          <td><input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            className="input-islamic px-2 py-1 rounded-lg text-sm w-full" /></td>
                          <td><input value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                            className="input-islamic px-2 py-1 rounded-lg text-sm w-full" /></td>
                          <td><span className={`px-2 py-1 rounded-full text-xs ${a.attendance_status === 'attended' ? 'badge-attended' : 'badge-registered'}`}>
                            {a.attendance_status === 'attended' ? '✅ حاضر' : '🕐 مسجل'}</span></td>
                          <td className="text-xs" style={{ color: '#333333' }}>{formatDate(a.registration_date)}</td>
                          <td><div className="flex gap-1">
                            <button onClick={saveEdit} className="px-3 py-1 rounded-lg text-xs font-medium"
                              style={{ background: 'rgba(45, 122, 95, 0.3)', color: '#6ee7b7' }}>حفظ</button>
                            <button onClick={() => setEditingId(null)} className="px-3 py-1 rounded-lg text-xs font-medium"
                              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,230,208,0.5)' }}>إلغاء</button>
                          </div></td>
                        </>
                      ) : (
                        <>
                          <td className="text-xs font-mono" style={{ color: 'rgba(201, 168, 76, 0.7)' }}>{a.registration_number}</td>
                          <td className="font-medium">{a.full_name}</td>
                          <td dir="ltr" className="text-right">{a.phone_number.replace(/^222/, '')}</td>
                          <td>{a.city || '—'}</td>
                          <td className="text-xs">{a.occupation || '—'}</td>
                          <td><span className={`px-2 py-1 rounded-full text-xs ${a.attendance_status === 'attended' ? 'badge-attended' : 'badge-registered'}`}>
                            {a.attendance_status === 'attended' ? '✅ حاضر' : '🕐 مسجل'}</span></td>
                          <td className="text-xs" style={{ color: '#333333' }}>{formatDate(a.registration_date)}</td>
                          <td><div className="flex gap-1">
                            <button onClick={() => startEdit(a)} className="px-3 py-1 rounded-lg text-xs"
                              style={{ background: 'rgba(201, 168, 76, 0.15)', color: 'var(--color-gold)' }}>✏️</button>
                            <button onClick={() => handleDelete(a.id)} className="px-3 py-1 rounded-lg text-xs"
                              style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5' }}>🗑️</button>
                          </div></td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 py-4 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-30"
            style={{ background: 'rgba(201, 168, 76, 0.1)', color: 'var(--color-gold)' }}>← السابق</button>
          <span className="text-sm" style={{ color: '#333333' }}>{page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="px-4 py-2 rounded-lg text-sm disabled:opacity-30"
            style={{ background: 'rgba(201, 168, 76, 0.1)', color: 'var(--color-gold)' }}>التالي →</button>
        </div>
      )}
    </div>
  );
}