'use client';

import { useState } from 'react';
import { Attendee, AttendeeFormData } from '@/types';
import { validateName } from '@/lib/utils';
import { MAURITANIA_CONFIG, validateMauritanianPhone, formatMauritanianPhone } from '@/lib/mauritania';

interface RegistrationFormProps {
  onSuccess: (attendee: Attendee) => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [formData, setFormData] = useState<AttendeeFormData>({
    full_name: '',
    phone_number: '',
    city: '',
    occupation: '',
  });
  const [phoneLocal, setPhoneLocal] = useState('');
  const [errors, setErrors] = useState<Partial<AttendeeFormData & { phone_number: string }>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = (): boolean => {
    const newErrors: Partial<AttendeeFormData & { phone_number: string }> = {};
    if (!validateName(formData.full_name)) {
      newErrors.full_name = 'الرجاء إدخال الاسم الكامل (3 أحرف على الأقل)';
    }
    if (!validateMauritanianPhone(phoneLocal)) {
      newErrors.phone_number = `رقم هاتف موريتاني غير صالح — مثال: ${MAURITANIA_CONFIG.phoneExample}`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (value: string) => {
    const cleaned = value.replace(/[^\d+\s\-]/g, '');
    setPhoneLocal(cleaned);
    setFormData({ ...formData, phone_number: formatMauritanianPhone(cleaned) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setServerError('');
    try {
      const response = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone_number: formatMauritanianPhone(phoneLocal),
        }),
      });
      const result = await response.json();
      if (result.success) {
        onSuccess(result.data);
      } else {
        setServerError(result.error || 'حدث خطأ أثناء التسجيل');
      }
    } catch {
      setServerError('حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 md:p-10 max-w-xl mx-auto animate-[slideUp_0.6s_ease-out]"
      style={{ background: '#ffffff', border: '1px solid rgba(184, 134, 11, 0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          سجّل الآن
        </h3>
        <p className="text-sm" style={{ color: '#555555' }}>
          أدخل بياناتك للحصول على بطاقة دعوتك الإلكترونية
        </p>
      </div>

      {serverError && (
        <div className="alert-error rounded-xl p-4 mb-6 text-center text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
            الاسم الكامل <span style={{ color: 'var(--color-gold)' }}>*</span>
          </label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            placeholder="أدخل اسمك الكامل"
            className="input-islamic w-full px-4 py-3 rounded-xl text-base"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
            disabled={loading}
          />
          {errors.full_name && (
            <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.full_name}</p>
          )}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
            رقم الهاتف <span style={{ color: 'var(--color-gold)' }}>*</span>
          </label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phoneLocal}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="XX XX XX XX"
              className="input-islamic flex-1 px-4 py-3 rounded-xl text-base"
              dir="ltr"
              style={{ textAlign: 'left', fontFamily: 'monospace', letterSpacing: '0.05em', color: '#1a1a1a' }}
              disabled={loading}
              maxLength={12}
            />
            <div className="flex items-center gap-1.5 px-3 py-3 rounded-xl text-sm font-bold flex-shrink-0"
              style={{
                background: 'rgba(26, 92, 42, 0.1)',
                border: '1.5px solid rgba(26, 92, 42, 0.4)',
                color: 'var(--color-green)',
                fontFamily: 'monospace',
              }}>
              <span>222+</span>
              <span>MR</span>
            </div>
          </div>
          {errors.phone_number && (
            <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.phone_number}</p>
          )}
          <p className="text-xs mt-1" style={{ color: '#888888' }}>
            مثال: 49717504
          </p>
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
            المدينة / الولاية <span style={{ color: '#888888', fontSize: '0.75rem' }}>(اختياري)</span>
          </label>
          <select
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            className="input-islamic w-full px-4 py-3 rounded-xl text-base"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
            disabled={loading}>
            <option value="">اختر مدينتك...</option>
            {MAURITANIA_CONFIG.cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
            الصفة أو الوظيفة <span style={{ color: '#888888', fontSize: '0.75rem' }}>(اختياري)</span>
          </label>
          <input
            type="text"
            value={formData.occupation}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            placeholder="مثال: طالب، دكتور، أستاذ..."
            className="input-islamic w-full px-4 py-3 rounded-xl text-base"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
            disabled={loading}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="btn-gold w-full py-4 rounded-xl text-lg font-bold mt-4 flex items-center justify-center gap-3"
          style={{ fontFamily: 'Cairo, sans-serif', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? (
            <>
              <span className="spinner w-5 h-5" style={{ borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
              <span>جاري التسجيل...</span>
            </>
          ) : (
            <>
              <span>الحصول على بطاقة الدعوة</span>
              <span>🎫</span>
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs mt-6" style={{ color: '#888888', fontFamily: 'Cairo, sans-serif', lineHeight: '1.8' }}>
        معًا لنصرة الحبيب المصطفى ﷺ، وترسيخ محبته في القلوب، ونصرة الأشقاء في فلسطين
      </p>
    </div>
  );
}