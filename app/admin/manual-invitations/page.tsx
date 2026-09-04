'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Attendee } from '@/types';
import { InvitationCard } from '@/components/InvitationCard';
import { isPlaceholderPhone, formatForDisplay } from '@/lib/phone';

function qrPayloadFor(a: Attendee): string {
  return a.qr_token
    ? JSON.stringify({ token: a.qr_token, app: 'seerah-conf' })
    : JSON.stringify({ reg: a.registration_number, app: 'seerah-conf' });
}

async function generateQrPngBlob(a: Attendee): Promise<Blob> {
  const QRCode = await import('qrcode');
  const dataUrl = await QRCode.toDataURL(qrPayloadFor(a), {
    width: 600,
    margin: 2,
    color: { dark: '#1a4a1a', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

function safeFileName(name: string): string {
  return name.trim().replace(/\s+/g, '_').replace(/[^\p{L}\p{N}_-]/gu, '') || 'guest';
}

export default function ManualInvitationsPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);

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
    const currentStatus = a.delivery_status || 'not_delivered';
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
          prev.map((x) => (x.id === a.id ? { ...x, delivery_status: nextStatus } : x))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const downloadSingleQr = async (a: Attendee) => {
    setDownloadingId(a.id);
    try {
      const blob = await generateQrPngBlob(a);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeFileName(a.full_name)}_QR.png`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingId(null);
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

  const downloadSelectedZip = async () => {
    if (selectedIds.size === 0) return;
    setBulkDownloading(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      const selected = attendees.filter((a) => selectedIds.has(a.id));
      for (const a of selected) {
        const blob = await generateQrPngBlob(a);
        zip.file(`${safeFileName(a.full_name)}_QR.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `دعوات-يدوية-QR-${new Date().toISOString().slice(0, 10)}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Bulk QR export error:', e);
    } finally {
      setBulkDownloading(false);
    }
  };

  const [excelProgress, setExcelProgress] = useState({ done: 0, total: 0 });
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAll, setDeletingAll] = useState(false);

  const handleDeleteAllManual = async () => {
    if (deleteConfirmText !== 'حذف الكل') return;
    setDeletingAll(true);
    try {
      const response = await fetch('/api/attendees/delete-all-manual', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (response.status === 401) {
        router.replace('/admin');
        return;
      }
      const data = await response.json();
      if (data.success) {
        setShowDeleteAllDialog(false);
        setDeleteConfirmText('');
        fetchAttendees();
      } else {
        alert(data.error || 'حدث خطأ أثناء الحذف');
      }
    } catch (e) {
      console.error('Delete all manual error:', e);
      alert('حدث خطأ في الاتصال');
    } finally {
      setDeletingAll(false);
    }
  };


  const downloadAcceptedExcel = async () => {
    setExportingExcel(true);
    setExcelProgress({ done: 0, total: 0 });
    const BATCH = 100;
    try {
      let offset = 0;
      let total = Infinity;
      let fileIndex = 1;
      let totalFiles = 1;

      while (offset < total) {
        const response = await fetch(`/api/attendees/export-accepted-manual?offset=${offset}&limit=${BATCH}`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });

        if (response.status === 401) {
          router.replace('/admin');
          return;
        }

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          alert(data?.error || 'حدث خطأ أثناء التصدير');
          return;
        }

        total = parseInt(response.headers.get('X-Total-Count') || '0');
        totalFiles = Math.max(1, Math.ceil(total / BATCH));
        const returned = parseInt(response.headers.get('X-Returned-Count') || '0');

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const suffix = totalFiles > 1 ? `-جزء-${fileIndex}-من-${totalFiles}` : '';
        link.download = `المقبولون-يدوياً${suffix}-${new Date().toISOString().slice(0, 10)}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);

        offset += returned || BATCH;
        fileIndex += 1;
        setExcelProgress({ done: Math.min(offset, total), total });

        if (returned === 0) break; // safety: avoid infinite loop
      }
    } catch (e) {
      console.error('Excel export error:', e);
      alert('حدث خطأ في الاتصال');
    } finally {
      setExportingExcel(false);
    }
  };
  const deliveredCount = attendees.filter((a) => a.delivery_status === 'delivered').length;
  const attendedCount = attendees.filter((a) => a.attendance_status === 'attended').length;
  const allSelected = attendees.length > 0 && selectedIds.size === attendees.length;

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
        <div className="flex flex-wrap gap-4 mt-3 text-sm font-medium">
          <span style={{ color: 'var(--color-green)' }}>الإجمالي: {total}</span>
          <span style={{ color: '#1a5c2a' }}>تم التسليم: {deliveredCount}</span>
          <span style={{ color: 'var(--color-gold)' }}>حضر فعلياً: {attendedCount}</span>
        </div>

        {total > 0 && (
          <button
            onClick={() => setShowDeleteAllDialog(true)}
            className="mt-4 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.35)', color: '#dc2626' }}
          >
            🗑️ حذف كل الدعوات اليدوية ({total})
          </button>
        )}
      </div>

      {showDeleteAllDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
        >
          <div className="rounded-2xl p-6 max-w-md w-full" style={{ background: '#fff' }}>
            <h2 className="text-lg font-bold mb-2" style={{ color: '#dc2626' }}>
              ⚠️ تأكيد حذف نهائي
            </h2>
            <p className="text-sm mb-4" style={{ color: '#444' }}>
              سيتم حذف <strong>{total}</strong> شخصاً من الدعوات اليدوية نهائياً وبلا رجعة. التسجيل العام
              للموقع (غير اليدوي) لن يُمس إطلاقاً.
              <br /><br />
              للتأكيد، اكتب <strong dir="rtl">حذف الكل</strong> في الحقل أدناه:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="حذف الكل"
              className="input-islamic w-full px-4 py-3 rounded-xl text-base mb-4"
              dir="rtl"
              disabled={deletingAll}
            />
            <div className="flex gap-3">
              <button
                onClick={handleDeleteAllManual}
                disabled={deleteConfirmText !== 'حذف الكل' || deletingAll}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{
                  background: deleteConfirmText === 'حذف الكل' ? '#dc2626' : 'rgba(220,38,38,0.3)',
                  color: '#fff',
                  cursor: deleteConfirmText === 'حذف الكل' ? 'pointer' : 'not-allowed',
                }}
              >
                {deletingAll ? 'جاري الحذف...' : 'حذف نهائياً'}
              </button>
              <button
                onClick={() => { setShowDeleteAllDialog(false); setDeleteConfirmText(''); }}
                disabled={deletingAll}
                className="flex-1 py-3 rounded-xl text-sm font-bold"
                style={{ background: 'rgba(0,0,0,0.05)', color: '#555' }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="glass rounded-2xl p-4 mb-4 space-y-3" style={{ border: '1px solid rgba(201, 168, 76, 0.15)' }}>
        <input
          type="text"
          placeholder="ابحث بالاسم أو رقم التسجيل..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-islamic w-full px-4 py-2.5 rounded-xl text-sm"
        />

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="text-xs" style={{ color: '#777' }}>
            يُصدَّر فقط المقبولون (approved) من الدعوات اليدوية.
          </div>
          <button
            onClick={downloadAcceptedExcel}
            disabled={exportingExcel}
            className="px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
            style={{ background: 'rgba(45,110,45,0.1)', color: 'var(--color-green-dark)', border: '1px solid rgba(45,110,45,0.3)' }}
          >
            {exportingExcel ? (
              <>
                <span className="spinner w-4 h-4" style={{ borderWidth: '2px' }} />
                <span>
                  جاري التصدير{excelProgress.total > 0 ? ` (${excelProgress.done} / ${excelProgress.total})` : '...'}
                </span>
              </>
            ) : (
              <span>📗 تصدير المقبولين إلى Excel</span>
            )}
          </button>
        </div>

        {attendees.length > 0 && (
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: '#555' }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span>تحديد الكل ({selectedIds.size})</span>
            </label>

            <button
              onClick={downloadSelectedZip}
              disabled={selectedIds.size === 0 || bulkDownloading}
              className="btn-gold px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2"
              style={{ opacity: selectedIds.size === 0 ? 0.5 : 1 }}
            >
              {bulkDownloading ? (
                <><span className="spinner w-4 h-4" style={{ borderWidth: '2px' }} /><span>جاري التجهيز...</span></>
              ) : (
                <span>📦 تنزيل QR المحدّدين (ZIP)</span>
              )}
            </button>
          </div>
        )}
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
            const delivered = a.delivery_status === 'delivered';
            const attended = a.attendance_status === 'attended';
            const noPhone = isPlaceholderPhone(a.phone_number);
            const expanded = expandedId === a.id;

            return (
              <div key={a.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid var(--color-border)', background: '#fff' }}>
                <div className="p-4 flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(a.id)}
                      onChange={() => toggleSelect(a.id)}
                      className="mt-1.5"
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <div>
                      <p className="font-semibold" style={{ color: '#1a1a1a' }}>{a.full_name}</p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: 'rgba(201,168,76,0.8)' }}>{a.registration_number}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                        {noPhone ? 'بدون رقم هاتف' : formatForDisplay(a.phone_number)}
                      </p>
                      {attended && (
                        <p className="text-xs mt-0.5 font-medium" style={{ color: 'var(--color-gold-dark)' }}>
                          ✓ حضر فعلياً
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <button
                      onClick={() => downloadSingleQr(a)}
                      disabled={downloadingId === a.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{ background: 'rgba(45,110,45,0.08)', color: 'var(--color-green-dark)', border: '1px solid rgba(45,110,45,0.25)' }}
                    >
                      {downloadingId === a.id ? '...' : '⬇️ QR'}
                    </button>

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