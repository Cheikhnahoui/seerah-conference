'use client';

import { useState, useEffect } from 'react';

interface OrgContent {
  org_name: string;
  org_name_fr: string;
  logo_url: string;
  hero_description: string;
  hero_description_fr: string;
  about_text: string;
  about_text_fr: string;
  about_image_url: string;
  mission_text: string;
  mission_text_fr: string;
  vision_text: string;
  vision_text_fr: string;
  fields_text: string;
  fields_text_fr: string;
  history_text: string;
  history_text_fr: string;
}

const EMPTY: OrgContent = {
  org_name: '', org_name_fr: '', logo_url: '',
  hero_description: '', hero_description_fr: '',
  about_text: '', about_text_fr: '', about_image_url: '',
  mission_text: '', mission_text_fr: '',
  vision_text: '', vision_text_fr: '',
  fields_text: '', fields_text_fr: '',
  history_text: '', history_text_fr: '',
};

export default function OrgContentAdminPage() {
  const [data, setData] = useState<OrgContent>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const getToken = () => (typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null);

  useEffect(() => {
    fetch('/api/org-content')
      .then((r) => r.json())
      .then((result) => {
        if (result.success) setData({ ...EMPTY, ...result.data });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    const token = getToken();
    try {
      const res = await fetch('/api/org-content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      setMessage(result.success ? '✅ تم الحفظ بنجاح' : `❌ ${result.error || 'حدث خطأ'}`);
    } catch {
      setMessage('❌ حدث خطأ في الاتصال');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: '#fff', border: '1px solid var(--color-border)', color: 'var(--color-text)',
  };

  if (loading) {
    return <div className="px-4 py-6 text-sm" style={{ color: 'var(--color-text-light)' }}>جارٍ التحميل...</div>;
  }

  return (
    <div className="px-4 py-6 max-w-2xl mx-auto" dir="rtl">
      <h1 className="text-xl font-bold mb-6" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
        محتوى التجمّع — من نحن
      </h1>

      {message && (
        <p className="text-sm px-4 py-2.5 rounded-lg mb-4" style={{
          background: message.includes('✅') ? 'rgba(26,92,42,0.1)' : 'rgba(200,40,40,0.1)',
          color: message.includes('✅') ? 'var(--color-green-dark)' : '#b02a2a',
        }}>
          {message}
        </p>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <Section title="الهوية العامة">
          <Bilingual
            label="اسم التجمّع"
            valueAr={data.org_name} onAr={(v) => setData({ ...data, org_name: v })}
            valueFr={data.org_name_fr} onFr={(v) => setData({ ...data, org_name_fr: v })}
            inputStyle={inputStyle}
          />
          <FormField label="رابط الشعار (URL)">
            <input type="url" value={data.logo_url} onChange={(e) => setData({ ...data, logo_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} dir="ltr" placeholder="https://..." />
          </FormField>
        </Section>

        <Section title="وصف الصفحة الرئيسية (Hero)">
          <Bilingual
            label="الوصف المختصر تحت الاسم" multiline
            valueAr={data.hero_description} onAr={(v) => setData({ ...data, hero_description: v })}
            valueFr={data.hero_description_fr} onFr={(v) => setData({ ...data, hero_description_fr: v })}
            inputStyle={inputStyle}
          />
        </Section>

        <Section title="من نحن">
          <FormField label="صورة القسم (URL)">
            <input type="url" value={data.about_image_url} onChange={(e) => setData({ ...data, about_image_url: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none" style={inputStyle} dir="ltr" placeholder="https://..." />
          </FormField>
          <Bilingual
            label="نبذة عن التجمّع" multiline
            valueAr={data.about_text} onAr={(v) => setData({ ...data, about_text: v })}
            valueFr={data.about_text_fr} onFr={(v) => setData({ ...data, about_text_fr: v })}
            inputStyle={inputStyle}
          />
          <Bilingual
            label="الرسالة" multiline
            valueAr={data.mission_text} onAr={(v) => setData({ ...data, mission_text: v })}
            valueFr={data.mission_text_fr} onFr={(v) => setData({ ...data, mission_text_fr: v })}
            inputStyle={inputStyle}
          />
          <Bilingual
            label="الرؤية" multiline
            valueAr={data.vision_text} onAr={(v) => setData({ ...data, vision_text: v })}
            valueFr={data.vision_text_fr} onFr={(v) => setData({ ...data, vision_text_fr: v })}
            inputStyle={inputStyle}
          />
          <Bilingual
            label="مجالات العمل" multiline
            valueAr={data.fields_text} onAr={(v) => setData({ ...data, fields_text: v })}
            valueFr={data.fields_text_fr} onFr={(v) => setData({ ...data, fields_text_fr: v })}
            inputStyle={inputStyle}
          />
          <Bilingual
            label="تاريخه ومسيرته (نظرة عامة)" multiline
            valueAr={data.history_text} onAr={(v) => setData({ ...data, history_text: v })}
            valueFr={data.history_text_fr} onFr={(v) => setData({ ...data, history_text_fr: v })}
            inputStyle={inputStyle}
          />
        </Section>

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3 rounded-lg text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-green)', color: '#fff' }}
        >
          {saving ? 'جارٍ الحفظ...' : 'حفظ التعديلات'}
        </button>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: '#fff', border: '1px solid var(--color-border)' }}>
      <h2 className="font-semibold text-sm" style={{ color: 'var(--color-gold)' }}>{title}</h2>
      {children}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>{label}</label>
      {children}
    </div>
  );
}

function Bilingual({
  label, valueAr, onAr, valueFr, onFr, inputStyle, multiline,
}: {
  label: string;
  valueAr: string; onAr: (v: string) => void;
  valueFr: string; onFr: (v: string) => void;
  inputStyle: React.CSSProperties;
  multiline?: boolean;
}) {
  const Comp = multiline ? 'textarea' : 'input';
  return (
    <div className="grid sm:grid-cols-2 gap-3">
      <FormField label={`${label} (عربي)`}>
        <Comp
          value={valueAr}
          onChange={(e: any) => onAr(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-y"
          style={inputStyle}
          {...(multiline ? { rows: 3 } : {})}
        />
      </FormField>
      <FormField label={`${label} (فرنسي)`}>
        <Comp
          value={valueFr}
          onChange={(e: any) => onFr(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none resize-y"
          style={inputStyle}
          dir="ltr"
          {...(multiline ? { rows: 3 } : {})}
        />
      </FormField>
    </div>
  );
}