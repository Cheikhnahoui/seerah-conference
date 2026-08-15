'use client';

import { useState, useEffect } from 'react';
import {
  ConfDateParts,
  formatConfDate,
  HIJRI_MONTHS,
  GREGORIAN_MONTHS,
} from '@/lib/dateFormat';
import { translateLocation } from '@/lib/venueTranslations';

interface Config extends ConfDateParts {
  conf_name: string;
  conf_location: string;
  conf_description: string;
  welcome_text: string;
  logo_url: string;
}

const EMPTY_CONFIG: Config = {
  conf_name: '',
  conf_location: '',
  conf_description: '',
  welcome_text: '',
  logo_url: '',
  hijri_day_start: 21,
  hijri_day_end: 23,
  hijri_month: 3, // ربيع الأول
  hijri_year: 1448,
  greg_day_start: 4,
  greg_day_end: 6,
  greg_month: 9, // سبتمبر
  greg_year: 2026,
};

export default function SettingsPage() {
  const [config, setConfig] = useState<Config>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const getToken = () => localStorage.getItem('admin_token') || '';

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConfig({ ...EMPTY_CONFIG, ...d.data });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      // The French date/location are derived automatically and saved
      // alongside the Arabic data, so every part of the app (including
      // the invitation card) can read a ready-made string without
      // re-implementing the translation logic.
      const payload = {
        ...config,
        conf_date: formatConfDate(config, 'ar'),
        conf_date_fr: formatConfDate(config, 'fr'),
        conf_location_fr: translateLocation(config.conf_location),
      };

      const response = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(payload),
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

  const previewLocationFr = translateLocation(config.conf_location);

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          إعدادات المؤتمر
        </h1>
        <p className="text-sm mt-1" style={{ color: '#444444' }}>
          تعديل معلومات المؤتمر التي تظهر في الموقع وبطاقات الدعوة. يكفي إدخال البيانات
          بالعربية — النسخة الفرنسية تُبنى تلقائياً.
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

          {/* ============================= */}
          {/* STRUCTURED DATE                */}
          {/* ============================= */}

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
              تاريخ المؤتمر (هجري)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={config.hijri_day_start}
                onChange={(e) => setConfig({ ...config, hijri_day_start: Number(e.target.value) })}
                className="input-islamic px-3 py-2 rounded-xl text-center"
                placeholder="من (يوم)"
              />
              <input
                type="number"
                value={config.hijri_day_end}
                onChange={(e) => setConfig({ ...config, hijri_day_end: Number(e.target.value) })}
                className="input-islamic px-3 py-2 rounded-xl text-center"
                placeholder="إلى (يوم)"
              />
              <input
                type="number"
                value={config.hijri_year}
                onChange={(e) => setConfig({ ...config, hijri_year: Number(e.target.value) })}
                className="input-islamic px-3 py-2 rounded-xl text-center"
                placeholder="السنة الهجرية"
              />
            </div>
            <select
              value={config.hijri_month}
              onChange={(e) => setConfig({ ...config, hijri_month: Number(e.target.value) })}
              className="input-islamic w-full px-4 py-3 rounded-xl mt-2"
            >
              {HIJRI_MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m.ar} ({m.fr})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
              تاريخ المؤتمر (ميلادي)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="number"
                value={config.greg_day_start}
                onChange={(e) => setConfig({ ...config, greg_day_start: Number(e.target.value) })}
                className="input-islamic px-3 py-2 rounded-xl text-center"
                placeholder="من (يوم)"
              />
              <input
                type="number"
                value={config.greg_day_end}
                onChange={(e) => setConfig({ ...config, greg_day_end: Number(e.target.value) })}
                className="input-islamic px-3 py-2 rounded-xl text-center"
                placeholder="إلى (يوم)"
              />
              <input
                type="number"
                value={config.greg_year}
                onChange={(e) => setConfig({ ...config, greg_year: Number(e.target.value) })}
                className="input-islamic px-3 py-2 rounded-xl text-center"
                placeholder="السنة الميلادية"
              />
            </div>
            <select
              value={config.greg_month}
              onChange={(e) => setConfig({ ...config, greg_month: Number(e.target.value) })}
              className="input-islamic w-full px-4 py-3 rounded-xl mt-2"
            >
              {GREGORIAN_MONTHS.map((m, i) => (
                <option key={i} value={i + 1}>{m.ar} ({m.fr})</option>
              ))}
            </select>
          </div>

          {/* Live preview so the admin can verify before saving */}
          <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(45,110,45,0.06)', border: '1px dashed var(--color-green)' }}>
            <p dir="rtl">🇦🇪 {formatConfDate(config, 'ar') || '—'}</p>
            <p dir="ltr" className="mt-1">🇫🇷 {formatConfDate(config, 'fr') || '—'}</p>
          </div>

          {/* ============================= */}
          {/* LOCATION (Arabic only input)   */}
          {/* ============================= */}

          <FormField label="مكان المؤتمر (بالعربية فقط)">
            <input
              type="text"
              value={config.conf_location}
              onChange={(e) => setConfig({ ...config, conf_location: e.target.value })}
              className="input-islamic w-full px-4 py-3 rounded-xl"
              placeholder="المركز الدولي للمؤتمرات (المختار ولد داداه)"
            />
          </FormField>

          <div className="rounded-xl p-3 text-sm" style={{ background: 'rgba(184,134,11,0.06)', border: '1px dashed var(--color-gold)' }}>
            <p dir="ltr">🇫🇷 {previewLocationFr || '—'}</p>
            <p className="text-xs mt-1" style={{ color: '#777' }} dir="rtl">
              هذه هي الترجمة الفرنسية التي ستُعرض تلقائياً. إذا احتوت على كلمات عربية لم تُترجم، أخبرني لأضيفها إلى قاموس الترجمة.
            </p>
          </div>

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