'use client';

import { useState, useEffect, useCallback } from 'react';

interface Goal {
  id: string;
  title: string;
  title_fr: string | null;
  description: string | null;
  description_fr: string | null;
  icon: string | null;
  display_order: number;
  is_active: boolean;
}

const EMPTY_FORM = { title: '', title_fr: '', description: '', description_fr: '', icon: '', display_order: 0 };

export default function AdminGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const token = getToken();
    const res = await fetch('/api/goals', { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const result = await res.json();
    if (result.success) setGoals(result.data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const startCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
    setError('');
  };

  const startEdit = (g: Goal) => {
    setEditingId(g.id);
    setForm({
      title: g.title, title_fr: g.title_fr || '',
      description: g.description || '', description_fr: g.description_fr || '',
      icon: g.icon || '', display_order: g.display_order,
    });
    setShowForm(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.title.trim().length < 2) {
      setError('العنوان مطلوب');
      return;
    }
    setSubmitting(true);
    const token = getToken();
    try {
      const url = editingId ? `/api/goals/${editingId}` : '/api/goals';
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          title: form.title.trim(),
          title_fr: form.title_fr.trim() || null,
          description: form.description.trim() || null,
          description_fr: form.description_fr.trim() || null,
          icon: form.icon.trim() || null,
          display_order: Number(form.display_order) || 0,
        }),
      });
      const result = await res.json();
      if (result.success) {
        setShowForm(false);
        fetchGoals();
      } else {
        setError(result.error || 'حدث خطأ');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (g: Goal) => {
    setBusyId(g.id);
    const token = getToken();
    try {
      const res = await fetch(`/api/goals/${g.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ is_active: !g.is_active }),
      });
      const result = await res.json();
      if (result.success) setGoals((prev) => prev.map((x) => (x.id === g.id ? result.data : x)));
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
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const result = await res.json();
      if (result.success) setGoals((prev) => prev.filter((x) => x.id !== id));
    } finally {
      setBusyId(null);
      setDeleteTarget(null);
    }
  };

  const inputStyle: React.CSSProperties = { background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)' };

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>أهداف التجمّع</h1>
        <button onClick={startCreate} className="px-4 py-2 rounded-full text-sm font-semibold" style={{ background: 'var(--color-green)', color: '#fff' }}>
          + إضافة هدف
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-2xl p-5 mb-6 space-y-3" style={{ background: '#fff', border: '1px solid var(--color-border)' }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">العنوان (عربي)</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">العنوان (فرنسي)</label>
              <input value={form.title_fr} onChange={(e) => setForm({ ...form, title_fr: e.target.value })} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} dir="ltr" />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">الوصف (عربي)</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-y" style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">الوصف (فرنسي)</label>
              <textarea value={form.description_fr} onChange={(e) => setForm({ ...form, description_fr: e.target.value })} rows={2} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-y" style={inputStyle} dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">أيقونة (إيموجي)</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} placeholder="🕌" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">ترتيب العرض</label>
              <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} />
            </div>
          </div>

          {error && <p className="text-sm px-4 py-2.5 rounded-lg" style={{ background: 'rgba(200,40,40,0.1)', color: '#b02a2a' }}>{error}</p>}

          <div className="flex gap-2">
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg text-sm font-bold disabled:opacity-50" style={{ background: 'var(--color-green)', color: '#fff' }}>
              {submitting ? 'جارٍ الحفظ...' : editingId ? 'حفظ التعديلات' : 'إضافة'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-lg text-sm font-medium" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>
              إلغاء
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: 'var(--color-border)' }} />)}</div>
      ) : goals.length === 0 ? (
        <p className="text-sm text-center py-12" style={{ color: 'var(--color-text-muted)' }}>لا توجد أهداف بعد</p>
      ) : (
        <div className="space-y-2">
          {goals.map((g) => {
            const busy = busyId === g.id;
            return (
              <div key={g.id} className="rounded-xl p-4 flex items-center gap-3" style={{ background: '#fff', border: '1px solid var(--color-border)', opacity: busy ? 0.6 : 1 }}>
                <span className="text-xl flex-shrink-0">{g.icon || '•'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm">{g.title}</p>
                  {!g.is_active && <span className="text-xs" style={{ color: '#888' }}>معطَّل</span>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button disabled={busy} onClick={() => toggleActive(g)} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
                    {g.is_active ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button disabled={busy} onClick={() => startEdit(g)} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'var(--color-green)', color: '#fff' }}>تعديل</button>
                  <button disabled={busy} onClick={() => setDeleteTarget(g)} className="px-2.5 py-1 rounded-lg text-xs font-medium" style={{ background: 'rgba(200,40,40,0.1)', color: '#b02a2a' }}>حذف</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: '#fff' }}>
            <p className="font-bold mb-2">تأكيد الحذف</p>
            <p className="text-sm mb-5" style={{ color: 'var(--color-text-muted)' }}>حذف &quot;{deleteTarget.title}&quot;؟</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>إلغاء</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: '#b02a2a', color: '#fff' }}>حذف نهائياً</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}