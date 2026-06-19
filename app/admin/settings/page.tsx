'use client';

import { useState, useEffect } from 'react';

interface Config {
  conf_name: string;
  conf_date: string;
  conf_location: string;
  conf_description: string;
  welcome_text: string;
  logo_url: string;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<Config>({
    conf_name: '',
    conf_date: '',
    conf_location: '',
    conf_description: '',
    welcome_text: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const getToken = () => localStorage.getItem('admin_token') || '';

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConfig(d.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(config),
      });
      const data = await response.json();
      if (data.success) {
        setMessage('✅ تم حفظ الإعدادات بنجاح');
      } else {
        setMessage('❌ حدث خطأ أثناء الحفظ');
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          إعدادات المؤتمر
        </h1>
        <p className="text-sm mt-1" style={{ color: '#444444' }}>
          تعديل معلومات المؤتمر التي تظهر في الموقع وبطاقات الدعوة
        </p>
      </div>

      {message && (
        <div className={`rounded-xl p-4 mb-6 text-center text-sm ${message.includes('✅') ? 'alert-success' : 'alert-error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="rounded-2xl p-6 space-y-5" style={{ background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
          <h2 className="font-semibold" style={{ color: 'var(--color-gold)' }}>معلومات المؤتمر</h2>

          <FormField label="اسم المؤتمر">
            <input
              type="text"
              value={config.conf_name}
              onChange={(e) => setConfig({ ...config, conf_name: e.target.value })}
              className="input-islamic w-full px-4 py-3 rounded-xl"
            />
          </FormField>

          <FormField label="تاريخ المؤتمر">
            <input
              type="text"
              value={config.conf_date}
              onChange={(e) => setConfig({ ...config, conf_date: e.target.value })}
              className="input-islamic w-full px-4 py-3 rounded-xl"
              placeholder="١٥-١٧ ربيع الأول ١٤٤٦"
            />
          </FormField>

          <FormField label="مكان المؤتمر">
            <input
              type="text"
              value={config.conf_location}
              onChange={(e) => setConfig({ ...config, conf_location: e.target.value })}
              className="input-islamic w-full px-4 py-3 rounded-xl"
            />
          </FormField>

          <FormField label="وصف المؤتمر">
            <textarea
              value={config.conf_description}
              onChange={(e) => setConfig({ ...config, conf_description: e.target.value })}
              rows={4}
              className="input-islamic w-full px-4 py-3 rounded-xl resize-none"
            />
          </FormField>

          <FormField label="نص الترحيب">
            <input
              type="text"
              value={config.welcome_text}
              onChange={(e) => setConfig({ ...config, welcome_text: e.target.value })}
              className="input-islamic w-full px-4 py-3 rounded-xl"
            />
          </FormField>

          <FormField label="رابط الشعار (URL)">
            <input
              type="url"
              value={config.logo_url}
              onChange={(e) => setConfig({ ...config, logo_url: e.target.value })}
              className="input-islamic w-full px-4 py-3 rounded-xl"
              dir="ltr"
              style={{ textAlign: 'right' }}
              placeholder="https://..."
            />
          </FormField>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-gold w-full py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2">
          {saving ? (
            <><span className="spinner w-5 h-5" style={{ borderWidth: '2px' }} /><span>جاري الحفظ...</span></>
          ) : (
            <><span>💾</span><span>حفظ الإعدادات</span></>
          )}
        </button>
      </form>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
        {label}
      </label>
      {children}
    </div>
  );
}
