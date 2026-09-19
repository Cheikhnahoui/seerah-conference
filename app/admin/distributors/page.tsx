'use client';

import { useState, useEffect, useCallback } from 'react';

interface Distributor {
  id: string;
  full_name: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
  registered_count: number;
}

export default function AdminDistributorsPage() {
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Distributor | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);

  const fetchDistributors = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('/api/admin/distributors', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const result = await res.json();
    if (result.success) setDistributors(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDistributors(); }, [fetchDistributors]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (fullName.trim().length < 3) {
      setFormError('الاسم مطلوب (3 أحرف على الأقل)');
      return;
    }
    if (phone.trim().length < 6) {
      setFormError('رقم هاتف غير صالح');
      return;
    }
    if (password.length < 6) {
      setFormError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    setSubmitting(true);
    const token = getToken();
    try {
      const res = await fetch('/api/admin/distributors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ full_name: fullName.trim(), phone_number: phone.trim(), password }),
      });
      const result = await res.json();
      if (result.success) {
        setFullName('');
        setPhone('');
        setPassword('');
        setShowForm(false);
        fetchDistributors();
      } else {
        setFormError(result.error || 'حدث خطأ');
      }
    } catch {
      setFormError('حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (d: Distributor) => {
    setBusyId(d.id);
    const token = getToken();
    try {
      const res = await fetch(`/api/admin/distributors/${d.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ is_active: !d.is_active }),
      });
      const result = await res.json();
      if (result.success) {
        setDistributors((prev) => prev.map((x) => (x.id === d.id ? { ...x, is_active: result.data.is_active } : x)));
      } else {
        alert(result.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setBusyId(id);
    const token = getToken();
    try {
      const res = await fetch(`/api/admin/distributors/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await res.json();
      if (result.success) {
        setDistributors((prev) => prev.filter((x) => x.id !== id));
      } else {
        alert(result.error || 'حدث خطأ');
      }
    } catch {
      alert('حدث خطأ في الاتصال');
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          إدارة الموزعين
        </h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-full text-sm font-semibold transition-opacity hover:opacity-85"
          style={{ background: 'var(--color-green)', color: '#fff' }}
        >
          {showForm ? 'إلغاء' : '+ إضافة موزّع'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl p-5 mb-6 space-y-3"
          style={{ background: '#fff', border: '1px solid var(--color-border)' }}
        >
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>الاسم الكامل</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>رقم الهاتف (لتسجيل الدخول)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              dir="ltr"
              placeholder="+222..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>كلمة المرور</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
              style={{ background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              placeholder="6 أحرف على الأقل"
            />
          </div>

          {formError && (
            <p className="text-sm px-4 py-2.5 rounded-lg" style={{ background: 'rgba(200,40,40,0.1)', color: '#b02a2a' }}>
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--color-green)', color: '#fff' }}
          >
            {submitting ? 'جارٍ الحفظ...' : 'إنشاء الموزّع'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: 'var(--color-border)' }} />
          ))}
        </div>
      ) : distributors.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--color-text-muted)' }}>لا يوجد موزعون بعد</p>
      ) : (
        <div className="space-y-3">
          {distributors.map((d) => {
            const busy = busyId === d.id;
            return (
              <div
                key={d.id}
                className="rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                style={{ background: '#fff', border: '1px solid var(--color-border)', opacity: busy ? 0.6 : 1 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{d.full_name}</p>
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{
                        background: d.is_active ? 'rgba(26,92,42,0.1)' : '#f0f0f0',
                        color: d.is_active ? 'var(--color-green-dark)' : '#888',
                      }}
                    >
                      {d.is_active ? 'فعّال' : 'معطَّل'}
                    </span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-light)' }} dir="ltr">{d.phone_number}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    سجّل {d.registered_count} مشارك
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    disabled={busy}
                    onClick={() => toggleActive(d)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                    style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
                  >
                    {d.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => setDeleteTarget(d)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
                    style={{ background: 'rgba(200,40,40,0.1)', color: '#b02a2a' }}
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff' }}>
            <p className="font-bold mb-2" style={{ color: 'var(--color-text)' }}>تأكيد الحذف</p>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>
              هل أنت متأكد من حذف الموزّع &quot;{deleteTarget.full_name}&quot;؟ المشاركون الذين سجّلهم سيبقون في القائمة، لكن سيفقدون الربط به.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: '#b02a2a', color: '#fff' }}
              >
                حذف نهائياً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}