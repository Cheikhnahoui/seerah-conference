'use client';

import { useState } from 'react';
import { Attendee, AttendeeFormData } from '@/types';
import { validateName } from '@/lib/utils';
import { toE164, isValidPhoneForCountry, DEFAULT_COUNTRY, type CountryCode } from '@/lib/phone';
import { PhoneInput } from '@/components/PhoneInput';
import { useLang } from '@/lib/i18n';

interface RegistrationFormProps {
  onSuccess: (attendee: Attendee) => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const { t, lang } = useLang();
  const [formData, setFormData] = useState<AttendeeFormData>({
    full_name: '', phone_number: '', city: '', occupation: '',
  });
  const [phoneLocal, setPhoneLocal] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [errors, setErrors] = useState<Partial<AttendeeFormData & { phone_number: string }>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const validate = (): boolean => {
    const newErrors: Partial<AttendeeFormData & { phone_number: string }> = {};
    if (!validateName(formData.full_name)) newErrors.full_name = t('full_name_error');
    if (!isValidPhoneForCountry(phoneLocal, phoneCountry)) {
      newErrors.phone_number = t('phone_error');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNameChange = (value: string) => {
    setFormData({ ...formData, full_name: value.replace(/[0-9]/g, '') });
  };

  const handlePhoneChange = (value: string, country: CountryCode) => {
    setPhoneLocal(value);
    setPhoneCountry(country);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const e164 = toE164(phoneLocal, phoneCountry);
    if (!e164) {
      setErrors((prev) => ({ ...prev, phone_number: t('phone_error') }));
      return;
    }

    setLoading(true);
    setServerError('');
    try {
      const response = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, phone_number: e164 }),
      });
      const result = await response.json();
      if (result.success) {
        // Original behavior: the invitation card is issued immediately,
        // no pending/approval step.
        onSuccess(result.data);
      } else {
        setServerError(result.error || t('error_connection'));
      }
    } catch {
      setServerError(t('error_connection'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl p-6 md:p-10 max-w-xl mx-auto animate-[slideUp_0.6s_ease-out]"
      style={{ background: '#ffffff', border: '1px solid rgba(184, 134, 11, 0.25)', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-green-dark)', fontFamily: 'Cairo, sans-serif' }}>
          {t('register_now')}
        </h3>
        <p className="text-sm" style={{ color: '#555555' }}>{t('register_subtitle')}</p>
      </div>

      {serverError && (
        <div className="alert-error rounded-xl p-4 mb-6 text-center text-sm">{serverError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
            {t('full_name')} <span style={{ color: 'var(--color-gold)' }}>*</span>
          </label>
          <input type="text" value={formData.full_name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t('full_name_placeholder')}
            className="input-islamic w-full px-4 py-3 rounded-xl text-base"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
            disabled={loading} />
          {errors.full_name && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.full_name}</p>}
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
            {t('phone')} <span style={{ color: 'var(--color-gold)' }}>*</span>
          </label>
          <PhoneInput
            value={phoneLocal}
            country={phoneCountry}
            onChange={handlePhoneChange}
            lang={lang}
            disabled={loading}
          />
          {errors.phone_number && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.phone_number}</p>}
        </div>

        {/* City */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
            {t('city')} <span style={{ color: '#888888', fontSize: '0.75rem' }}>{t('city_optional')}</span>
          </label>
          <input type="text" value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder={t('city_placeholder')}
            className="input-islamic w-full px-4 py-3 rounded-xl text-base"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
            disabled={loading} />
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#1a1a1a' }}>
            {t('occupation')} <span style={{ color: '#888888', fontSize: '0.75rem' }}>{t('city_optional')}</span>
          </label>
          <input type="text" value={formData.occupation}
            onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
            placeholder={t('occupation_placeholder')}
            className="input-islamic w-full px-4 py-3 rounded-xl text-base"
            style={{ fontFamily: 'Cairo, sans-serif', color: '#1a1a1a' }}
            disabled={loading} />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="btn-gold w-full py-4 rounded-xl text-lg font-bold mt-4 flex items-center justify-center gap-3"
          style={{ fontFamily: 'Cairo, sans-serif', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? (
            <><span className="spinner w-5 h-5" style={{ borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} /><span>{t('submitting')}</span></>
          ) : (
            <><span>{t('submit')}</span><span>🎫</span></>
          )}
        </button>
      </form>

      <p className="text-center text-xs mt-6" style={{ color: '#888888', fontFamily: 'Cairo, sans-serif', lineHeight: '1.8' }}>
        {t('slogan')}
      </p>
    </div>
  );
}