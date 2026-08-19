'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { translateDateText } from '@/lib/dateFormat';
import { translateLocation } from '@/lib/venueTranslations';

interface Config {
  conf_name: string;
  conf_date_hijri: string;
  conf_date_gregorian: string;
  conf_location: string;
  conf_description: string;
  welcome_text: string;
  logo_url: string;
}

const EMPTY_CONFIG: Config = {
  conf_name: '',
  conf_date_hijri: '21 – 23 ربيع الأول 1448هـ',
  conf_date_gregorian: '4 – 6 سبتمبر 2026م',
  conf_location: '',
  conf_description: '',
  welcome_text: '',
  logo_url: '',
};

export default function SettingsPage() {
  const router = useRouter();
  const [config, setConfig] = useState<Config>(EMPTY_CONFIG);
  const [loading, setLoading] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const getToken = () => localStorage.getItem('admin_token') || '';

  // Guard: if there is no admin token at all, bounce back to the login
  // page immediately instead of showing the settings form to anyone
  // who simply visits the URL.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/admin');
      return;
    }
    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (checkingAuth) return;
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setConfig({ ...EMPTY_CONFIG, ...d.data });
      })
      .finally(() => setLoading(false));
  }, [checkingAuth]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      // French date/location are derived automatically from the Arabic
      // text and saved alongside it, so the rest of the app (including
      // the invitation card) can read a ready-made string without
      // re-implementing the translation logic.
      const payload = {
        ...config,
        conf_date: `${config.conf_date_hijri} الموافق ${config.conf_date_gregorian}`,
        conf_date_fr: `${translateDateText(config.conf_date_hijri)} (${translateDateText(config.conf_date_gregorian)})`,
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
      } else if (response.status === 401) {
        router.replace('/admin');
        return;
      } else {
        setMessage('❌ حدث خطأ أثناء الحفظ');
      }
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  if (checkingAuth || loading) {
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
          {/* FREE-TEXT DATE FIELDS          */}
          {/* ============================= */}

          <FormField label="تاريخ المؤتمر (هجري)">
            <input
              type="text"
              value={config.conf_date_hijri}
              onChange={(e) => setConfig({ ...config, conf_date_hijri: e.target.value })}
              className="input-islamic w-full px-4 py-3 rounded-xl"
              placeholder="21 – 23 ربيع الأول 1448هـ"
            />
          </FormField>

          <FormField label="تاريخ المؤتمر (ميلادي)">
            <input
              type="text"
              value={config.conf_date_gregorian}
              onChange={(e) => setConfig({ ...config, conf_date_gregorian: e.target.value })}
              className="input-islamic w-full px-4 py-3 rounded-xl"
              placeholder="4 – 6 سبتمبر 2026م"
            />
          </FormField>

          {/* Live preview so the admin can verify before saving */}
          <div className="rounded-xl p-3 text-sm space-y-1" style={{ background: 'rgba(45,110,45,0.06)', border: '1px dashed var(--color-green)' }}>
            <p dir="rtl">🇦🇪 {config.conf_date_hijri} الموافق {config.conf_date_gregorian}</p>
            <p dir="ltr">🇫🇷 {translateDateText(config.conf_date_hijri)} ({translateDateText(config.conf_date_gregorian)})</p>
            <p className="text-xs" style={{ color: '#777' }} dir="rtl">
              معاينة تلقائية. إذا لم يُترجم اسم الشهر بشكل صحيح، تأكد من كتابته كما هو معتاد (مثال: ربيع الأول، سبتمبر).
            </p>
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