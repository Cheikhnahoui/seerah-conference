'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Attendee } from '@/types';
import { formatDate, exportToCSV } from '@/lib/utils';
import { PhoneInput } from '@/components/PhoneInput';
import {
  toE164,
  splitPhoneForEditing,
  formatForDisplay,
  isPlaceholderPhone,
  DEFAULT_COUNTRY,
  type CountryCode,
} from '@/lib/phone';

interface EditForm {
  full_name: string;
  phone_local: string;
  phone_country: CountryCode;
  city: string;
  occupation: string;
}

/**
 * Builds a wa.me link that opens WhatsApp directly to a chat with
 * this specific attendee, with a personalized message PRE-FILLED
 * (not sent) containing the link to THEIR invitation card only.
 * The admin reviews and manually presses Send inside WhatsApp.
 */
function buildWhatsAppLink(a: Attendee): string {
  const digits = a.phone_number.replace(/\D/g, ''); // wa.me needs no leading '+'
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const invitationUrl = `${origin}/invitation/${a.id}`;
  const message =
    'مرحبا بكم معنا في رحاب الدورة التاسعة والثلاثين من المؤتمر الدولي للسيرة النبوية الذي ينظمه التجمع الثقافي الإسلامي برئاسة فضيلة الشيخ محمد الحافظ النحوي.\n' +
    'ستنعقد هذه الدورة بحول اللـه بتاريخ 14 - 16 سبتمبر 2026، بمشاركة وحضور وفود عربية وإسلامية.\n' +
    'مرحبا بكم في موعد متجدد مع السيرة العطرة وقيمها الخالدة ورسالتها الجامعة.\n' +
    '#المؤتمر_الدولي_للسيرة_39\n' +
    `رابط دعوتكم :\n${invitationUrl}`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export default function AttendeesPage() {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    full_name: '', phone_local: '', phone_country: DEFAULT_COUNTRY, city: '', occupation: '',
  });
  const [editPhoneError, setEditPhoneError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [exportingSelfRegistered, setExportingSelfRegistered] = useState(false);
  const limit = 50; // larger batch since there's no page navigation anymore

  const getToken = () => localStorage.getItem('admin_token') || '';

  // Initial load / whenever the search or city filter changes: reset
  // the list and fetch page 1 fresh.
  const fetchFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, city: cityFilter, page: '1', limit: String(limit) });
      const response = await fetch(`/api/attendees?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        const fetched = data.data || [];
        setAttendees(fetched);
        setTotal(data.count || 0);
        setPage(1);
        setHasMore(fetched.length < (data.count || 0));
      }
    } finally {
      setLoading(false);
    }
  }, [search, cityFilter]);

  // Infinite scroll: fetch the next page and append it.
  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams({ search, city: cityFilter, page: String(nextPage), limit: String(limit) });
      const response = await fetch(`/api/attendees?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await response.json();
      if (data.success) {
        const fetched = data.data || [];
        const newTotal = data.count ?? total;
        setAttendees((prev) => {
          const merged = [...prev, ...fetched];
          setHasMore(merged.length < newTotal);
          return merged;
        });
        setPage(nextPage);
      }
    } finally {
      setLoadingMore(false);
    }
  }, [page, search, cityFilter, loadingMore, hasMore, total]);

  useEffect(() => { fetchFirstPage(); }, [fetchFirstPage]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '300px' }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المشارك؟')) return;
    const response = await fetch(`/api/attendees/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${getToken()}` },
    });
    if ((await response.json()).success) fetchFirstPage();
  };

  const handleApproval = async (id: string, approval_status: 'approved' | 'rejected') => {
    const response = await fetch(`/api/attendees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({ approval_status }),
    });
    if ((await response.json()).success) fetchFirstPage();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`هل أنت متأكد من حذف ${selectedIds.size} مشارك؟ لا يمكن التراجع عن هذا الإجراء.`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        Array.from(selectedIds).map((id) =>
          fetch(`/api/attendees/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${getToken()}` },
          })
        )
      );
      setSelectedIds(new Set());
      fetchFirstPage();
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === attendees.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(attendees.map((a) => a.id)));
    }
  };

  const startEdit = (a: Attendee) => {
    setEditingId(a.id);
    setEditPhoneError('');
    const { country, national } = splitPhoneForEditing(a.phone_number);
    setEditForm({
      full_name: a.full_name,
      phone_local: national,
      phone_country: country,
      city: a.city || '',
      occupation: a.occupation || '',
    });
  };

  const saveEdit = async () => {
    if (!editingId) return;

    const e164 = toE164(editForm.phone_local, editForm.phone_country);
    if (!e164) {
      setEditPhoneError('رقم هاتف غير صالح');
      return;
    }
    setEditPhoneError('');

    const response = await fetch(`/api/attendees/${editingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
      body: JSON.stringify({
        full_name: editForm.full_name,
        phone_number: e164,
        city: editForm.city,
        occupation: editForm.occupation,
      }),
    });
    if ((await response.json()).success) { setEditingId(null); fetchFirstPage(); }
  };

  const handleExportSelfRegistered = async () => {
    setExportingSelfRegistered(true);
    try {
      const response = await fetch('/api/attendees/export-self-registered', {
        headers: { Authorization: `Bearer ${getToken()}` },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        alert(data?.error || 'حدث خطأ أثناء التصدير');
        return;
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'self_registered_users.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export self-registered error:', e);
      alert('حدث خطأ في الاتصال');
    } finally {
      setExportingSelfRegistered(false);
    }
  };

  const handleExportCSV = () => {
    const exportData = attendees.map((a) => ({
      'رقم التسجيل': a.registration_number,
      'الاسم الكامل': a.full_name,
      'رقم الهاتف': formatForDisplay(a.phone_number),
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
      'رقم الهاتف': formatForDisplay(a.phone_number),
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

  const allSelected = attendees.length > 0 && selectedIds.size === attendees.length;

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
            إدارة المشاركين
          </h1>
          <p className="text-sm mt-1" style={{ color: '#333333' }}>إجمالي: {total} مشارك</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} disabled={bulkDeleting}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.4)', color: '#dc2626' }}>
              {bulkDeleting ? '...' : `🗑️ حذف المحدد (${selectedIds.size})`}
            </button>
          )}
          <button onClick={handleExportSelfRegistered} disabled={exportingSelfRegistered}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
            style={{ background: 'rgba(26, 92, 42, 0.15)', border: '1px solid rgba(26, 92, 42, 0.4)', color: 'var(--color-green-dark)' }}>
            {exportingSelfRegistered ? '...' : '📗 تصدير المسجلين ذاتياً'}
          </button>
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
        <button onClick={fetchFirstPage} className="btn-gold px-6 py-2.5 rounded-xl text-sm font-semibold">
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
          {/* DESKTOP: Table view */}
          <div className="block glass rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(201, 168, 76, 0.15)' }}>
            <div className="overflow-x-auto">
              <table className="w-full table-islamic" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '40px' }}>
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll}
                        style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                    </th>
                    <th>رقم التسجيل</th>
                    <th>الاسم</th>
                    <th>الهاتف</th>
                    <th>المدينة</th>
                    <th>الصفة</th>
                    <th>الموافقة</th>
                    <th>الحالة</th>
                    <th>التاريخ</th>
                    <th>إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {attendees.map((a) => (
                    <tr key={a.id} style={{ background: selectedIds.has(a.id) ? 'rgba(220,38,38,0.05)' : undefined }}>
                      {editingId === a.id ? (
                        <>
                          <td></td>
                          <td className="text-xs" style={{ color: 'rgba(201, 168, 76, 0.7)' }}>{a.registration_number}</td>
                          <td><input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                            className="input-islamic px-2 py-1 rounded-lg text-sm w-full" /></td>
                          <td style={{ minWidth: '220px' }}>
                            <PhoneInput
                              value={editForm.phone_local}
                              country={editForm.phone_country}
                              onChange={(value, country) => setEditForm({ ...editForm, phone_local: value, phone_country: country })}
                              lang="ar"
                            />
                            {editPhoneError && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{editPhoneError}</p>}
                          </td>
                          <td><input value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                            className="input-islamic px-2 py-1 rounded-lg text-sm w-full" /></td>
                          <td><input value={editForm.occupation} onChange={(e) => setEditForm({ ...editForm, occupation: e.target.value })}
                            className="input-islamic px-2 py-1 rounded-lg text-sm w-full" /></td>
                          <td>{approvalBadge(a.approval_status)}</td>
                          <td><span className={`px-2 py-1 rounded-full text-xs ${a.attendance_status === 'attended' ? 'badge-attended' : 'badge-registered'}`}>
                            {a.attendance_status === 'attended' ? '✅ حاضر' : '🕐 مسجل'}</span></td>
                          <td className="text-xs" style={{ color: '#333333' }}>{formatDate(a.registration_date)}</td>
                          <td><div className="flex gap-1">
                            <button onClick={saveEdit} className="px-3 py-1 rounded-lg text-xs font-medium"
                              style={{ background: 'rgba(45, 122, 95, 0.3)', color: '#6ee7b7' }}>حفظ</button>
                            <button onClick={() => { setEditingId(null); setEditPhoneError(''); }} className="px-3 py-1 rounded-lg text-xs font-medium"
                              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(240,230,208,0.5)' }}>إلغاء</button>
                          </div></td>
                        </>
                      ) : (
                        <>
                          <td>
                            <input type="checkbox" checked={selectedIds.has(a.id)} onChange={() => toggleSelect(a.id)}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }} />
                          </td>
                          <td className="text-xs font-mono" style={{ color: 'rgba(201, 168, 76, 0.7)' }}>{a.registration_number}</td>
                          <td className="font-medium">{a.full_name}</td>
                          <td dir="ltr" className="text-right">
                            {isPlaceholderPhone(a.phone_number) ? (
                              <span style={{ color: '#999' }}>بدون رقم</span>
                            ) : (
                              <a
                                href={buildWhatsAppLink(a)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: '#1a5c2a', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                                title="فتح واتساب مع رسالة جاهزة تحتوي رابط بطاقته"
                              >
                                {formatForDisplay(a.phone_number)}
                              </a>
                            )}
                          </td>
                          <td>{a.city || '—'}</td>
                          <td className="text-xs">{a.occupation || '—'}</td>
                          <td>{approvalBadge(a.approval_status)}</td>
                          <td><span className={`px-2 py-1 rounded-full text-xs ${a.attendance_status === 'attended' ? 'badge-attended' : 'badge-registered'}`}>
                            {a.attendance_status === 'attended' ? '✅ حاضر' : '🕐 مسجل'}</span></td>
                          <td className="text-xs" style={{ color: '#333333' }}>{formatDate(a.registration_date)}</td>
                          <td><div className="flex gap-1 flex-wrap">
                            {a.approval_status !== 'approved' && (
                              <button onClick={() => handleApproval(a.id, 'approved')} className="px-3 py-1 rounded-lg text-xs font-medium"
                                style={{ background: 'rgba(45, 122, 95, 0.2)', border: '1px solid rgba(45, 122, 95, 0.4)', color: '#1a5c2a' }}>
                                ✅ موافقة
                              </button>
                            )}
                            {a.approval_status !== 'rejected' && (
                              <button onClick={() => handleApproval(a.id, 'rejected')} className="px-3 py-1 rounded-lg text-xs font-medium"
                                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#dc2626' }}>
                                ❌ رفض
                              </button>
                            )}
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

      {/* Infinite scroll trigger + loading indicator */}
      {attendees.length > 0 && (
        <div ref={sentinelRef} className="flex items-center justify-center py-6">
          {loadingMore && <div className="spinner" />}
          {!hasMore && !loadingMore && (
            <p className="text-sm" style={{ color: '#888' }}>تم عرض جميع المشاركين ({total})</p>
          )}
        </div>
      )}
    </div>
  );
}

function approvalBadge(status: string | undefined) {
  if (status === 'approved') {
    return (
      <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(45,122,95,0.2)', color: '#1a5c2a' }}>
        ✅ مقبول
      </span>
    );
  }
  if (status === 'rejected') {
    return (
      <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(239,68,68,0.15)', color: '#dc2626' }}>
        ❌ مرفوض
      </span>
    );
  }
  return (
    <span className="px-2 py-1 rounded-full text-xs" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--color-gold)' }}>
      ⏳ قيد الانتظار
    </span>
  );
}