'use client';

import { useRef, useState, useEffect } from 'react';
import { Attendee } from '@/types';
import { useLang } from '@/lib/i18n';

interface InvitationCardProps {
  attendee: Attendee;
}

let configCache: { conf_date?: string; conf_location?: string; conf_name?: string } | null = null;
let configPromise: Promise<void> | null = null;

async function loadConfig() {
  if (configCache) return;
  if (!configPromise) {
    configPromise = fetch('/api/config')
      .then(res => res.json())
      .then(result => { if (result.success) configCache = result.data; })
      .catch(() => { configCache = {}; });
  }
  await configPromise;
}

// SVG Mosque — renders perfectly in html2canvas unlike emojis
function MosqueSVG({ size = 80 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Main dome */}
      <ellipse cx="40" cy="28" rx="18" ry="16" fill="#2d6e2d" />
      {/* Side domes */}
      <ellipse cx="18" cy="36" rx="10" ry="9" fill="#3d8a3d" />
      <ellipse cx="62" cy="36" rx="10" ry="9" fill="#3d8a3d" />
      {/* Minaret left */}
      <rect x="4" y="20" width="6" height="28" rx="1" fill="#1a5c1a" />
      <ellipse cx="7" cy="20" rx="4" ry="5" fill="#2d6e2d" />
      <rect x="5.5" y="14" width="3" height="6" fill="#1a5c1a" />
      {/* Minaret right */}
      <rect x="70" y="20" width="6" height="28" rx="1" fill="#1a5c1a" />
      <ellipse cx="73" cy="20" rx="4" ry="5" fill="#2d6e2d" />
      <rect x="71.5" y="14" width="3" height="6" fill="#1a5c1a" />
      {/* Body */}
      <rect x="10" y="44" width="60" height="22" rx="2" fill="#1a5c1a" />
      {/* Door */}
      <rect x="33" y="50" width="14" height="16" rx="7" fill="#c9a84c" />
      {/* Windows */}
      <rect x="16" y="50" width="10" height="8" rx="5" fill="#c9a84c" opacity="0.7" />
      <rect x="54" y="50" width="10" height="8" rx="5" fill="#c9a84c" opacity="0.7" />
      {/* Ground */}
      <rect x="0" y="66" width="80" height="4" rx="2" fill="#c9a84c" opacity="0.4" />
      {/* Crescent on top */}
      <path d="M37 10 Q40 6 43 10 Q40 8 37 10Z" fill="#c9a84c" />
    </svg>
  );
}

// SVG Globe
function GlobeSVG({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="16" stroke="#2d6e2d" strokeWidth="2" fill="rgba(45,110,45,0.1)" />
      <ellipse cx="18" cy="18" rx="7" ry="16" stroke="#2d6e2d" strokeWidth="1.5" fill="none" />
      <line x1="2" y1="18" x2="34" y2="18" stroke="#2d6e2d" strokeWidth="1.5" />
      <path d="M5 10 Q18 14 31 10" stroke="#2d6e2d" strokeWidth="1" fill="none" />
      <path d="M5 26 Q18 22 31 26" stroke="#2d6e2d" strokeWidth="1" fill="none" />
    </svg>
  );
}

// SVG Crescent
function CrescentSVG({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="18" r="14" fill="rgba(45,110,45,0.1)" stroke="#2d6e2d" strokeWidth="2" />
      <path d="M22 10 Q14 18 22 26 Q10 24 10 18 Q10 12 22 10Z" fill="#2d6e2d" />
    </svg>
  );
}

export function InvitationCard({ attendee }: InvitationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLang();
  const [downloading, setDownloading] = useState(false);
  const [confDate, setConfDate] = useState('١٥-١٧ ربيع الأول ١٤٤٦');
  const [confLocation, setConfLocation] = useState('نواكشوط - موريتانيا');
  const [confName, setConfName] = useState('المؤتمر الدولي للسيرة النبوية');

  useEffect(() => {
    loadConfig().then(() => {
      if (configCache) {
        if (configCache.conf_date) setConfDate(configCache.conf_date);
        if (configCache.conf_location) setConfLocation(configCache.conf_location);
        if (configCache.conf_name) setConfName(configCache.conf_name);
      }
    });
  }, []);

  useEffect(() => {
    if (!qrCanvasRef.current || !attendee.registration_number) return;
    import('qrcode').then(QRCode => {
      const qrData = JSON.stringify({ reg: attendee.registration_number, app: 'seerah-conf' });
      QRCode.toCanvas(qrCanvasRef.current, qrData, {
        width: 200,
        margin: 1,
        color: { dark: '#1a4a1a', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
    });
  }, [attendee.registration_number]);

  const captureCard = async (scale: number) => {
    const html2canvas = (await import('html2canvas')).default;

    // Wait for fonts to be fully loaded (with safety timeout for slow networks)
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 2000)),
    ]);
    try {
      await Promise.all([
        document.fonts.load('700 16px Cairo'),
        document.fonts.load('400 16px Cairo'),
        document.fonts.load('700 16px Amiri'),
        document.fonts.load('400 16px Amiri'),
      ]);
    } catch {
      // Ignore — fonts may already be loaded or unavailable; proceed regardless
    }

    return html2canvas(cardRef.current!, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      allowTaint: true,
      foreignObjectRendering: false,
    });
  };

  const downloadAsPNG = async () => {
    setDownloading(true);
    try {
      const canvas = await captureCard(3);
      const link = document.createElement('a');
      link.download = `invitation-${attendee.registration_number}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(false);
    }
  };

  const downloadAsPDF = async () => {
    setDownloading(true);
    try {
      const url = `/api/invitation-pdf?reg=${encodeURIComponent(attendee.registration_number)}`;
      // Mobile browsers (especially in-app browsers like WhatsApp/Instagram webviews)
      // frequently block or silently fail on blob-URL + programmatic-click downloads.
      // Opening the PDF URL directly in a new tab is far more reliable across devices —
      // the browser's native PDF viewer/download handler takes over from there.
      window.open(url, '_blank');
    } catch (error) {
      console.error('PDF error:', error);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Success message */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full mb-4 alert-success">
          <span>✅</span>
          <span className="font-semibold">{t('success_registered')}</span>
        </div>
        <p style={{ color: 'var(--color-text-muted)' }}>{t('card_ready')}</p>
      </div>

      {/* ===== THE CARD ===== */}
      <div
        id="invitation-card"
        ref={cardRef}
        style={{
          background: '#ffffff',
          fontFamily: 'Cairo, Amiri, serif',
          direction: 'rtl',
          border: '3px solid #2d6e2d',
          borderRadius: '4px',
          overflow: 'hidden',
          boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
          maxWidth: '340px',
          margin: '0 auto',
        }}>

        {/* TOP SECTION */}
        <div style={{
          background: 'linear-gradient(180deg, #f5f0e0 0%, #ede8d0 100%)',
          position: 'relative',
          borderBottom: '3px solid #2d6e2d',
        }}>
          {/* Gold top border */}
          <div style={{
            height: '6px',
            background: 'linear-gradient(90deg, #8B6914, #c9a84c, #f0d080, #c9a84c, #8B6914)',
          }} />

          {/* === THREE IMAGES BANNER === */}
          {/* DOM order matches visual order explicitly (left-to-right) instead of
              relying on RTL flex-direction reversal, because html2canvas does not
              always respect inherited `direction: rtl` when capturing flex layouts. */}
          <div style={{
            display: 'flex',
            gap: '8px',
            padding: '8px',
            height: '110px',
            background: '#1a5c2a',
            borderBottom: '2px solid #c9a84c',
            direction: 'ltr',
          }}>
            {/* Left: Conference Logo */}
            <div style={{
              flex: 1,
              height: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid #c9a84c',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src="/conf-logo.png" alt="شعار المؤتمر"
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            </div>
            {/* Right: GCI Logo */}
            <div style={{
              flex: 1,
              height: '100%',
              borderRadius: '10px',
              overflow: 'hidden',
              border: '2px solid #c9a84c',
              background: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <img src="/gci-logo-new.jpeg" alt="GCI"
                style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'high-quality' as any }} />
            </div>
          </div>
        </div>

        {/* BOTTOM SECTION */}
        <div style={{ background: '#ffffff', padding: '10px 12px 10px', position: 'relative' }}>

          {/* Attendee name box */}
          <div style={{
            textAlign: 'center',
            background: 'linear-gradient(135deg, #f0fff0, #e8f5e8)',
            border: '2px solid #2d6e2d',
            borderRadius: '6px',
            padding: '8px 14px',
            marginBottom: '8px',
          }}>
            <p dir="rtl" style={{
              color: '#1a5c1a', fontSize: '11px', fontFamily: 'Cairo, sans-serif',
              marginBottom: '6px', fontWeight: '600', lineHeight: 1.7,
            }}>
             {t('honor_text')}
            </p>
            <p style={{
              color: '#1a1a1a', fontSize: '18px', fontWeight: 'bold',
              fontFamily: 'Cairo, sans-serif', lineHeight: 1.2,
              wordBreak: 'break-word', marginBottom: '6px',
            }}>
              {attendee.full_name}
            </p>
            <p dir="rtl" style={{
              color: '#2d6e2d', fontSize: '11px', fontFamily: 'Cairo, sans-serif',
              lineHeight: 1.7, fontWeight: '600',
            }}>
              {t('invitation_body')}
            </p>
          </div>

          {/* 3 columns: المكان | QR | الزمان والتوقيت */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '6px', marginBottom: '8px', direction: 'ltr' }}>
            {/* المكان */}
            <div style={{
              background: 'linear-gradient(135deg, #fffde7, #fff8e1)',
              border: '1px solid #c9a84c', borderRadius: '6px',
              padding: '6px 8px', textAlign: 'center',
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #c9a84c, #f0d080)',
                color: '#fff', fontFamily: 'Cairo, sans-serif', fontSize: '10px',
                fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px 4px 0 0',
                display: 'block', textAlign: 'center',
                margin: '-6px -8px 8px -8px',
              }}>
                المكان
              </div>
              <p dir="rtl" style={{ color: '#1a1a1a', fontSize: '9px', fontFamily: 'Cairo, sans-serif', lineHeight: 1.8, paddingTop: '2px' }}>
                ساحة الولاية<br />(كرفور المعرض)
              </p>
            </div>

            {/* QR في الوسط */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{
                background: '#fff', padding: '4px', borderRadius: '6px',
                border: '2px solid #2d6e2d', flexShrink: 0,
              }}>
                <canvas ref={qrCanvasRef} width={200} height={200} style={{ display: 'block', width: '80px', height: '80px' }} />
              </div>
            </div>

            {/* الزمان والتوقيت */}
            <div style={{
              background: 'linear-gradient(135deg, #f0fff0, #e8f5e8)',
              border: '1px solid #2d6e2d', borderRadius: '6px',
              padding: '6px 8px', textAlign: 'center',
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #1a5c1a, #2d8a2d)',
                color: '#fff', fontFamily: 'Cairo, sans-serif', fontSize: '10px',
                fontWeight: 'bold', padding: '4px 8px', borderRadius: '4px 4px 0 0',
                display: 'block', textAlign: 'center',
                margin: '-6px -8px 8px -8px',
              }}>
                الزمان والتوقيت
              </div>
              <p dir="rtl" style={{ color: '#1a1a1a', fontSize: '9px', fontFamily: 'Cairo, sans-serif', lineHeight: 1.8, paddingTop: '2px' }}>
                مساء الأحد القادم<br />16 أغسطس - السابعة مساءً
              </p>
            </div>
          </div>
        </div>

        {/* Bottom message */}
        <div dir="rtl" style={{
          background: 'linear-gradient(90deg, #1a5c1a, #2d8a2d, #1a5c1a)',
          padding: '8px 16px', textAlign: 'center',
          color: '#fff', fontSize: '11px',
          fontFamily: 'Amiri, serif', lineHeight: 1.6,
        }}>
          {t("card_footer")}
        </div>

        {/* Bottom gold bar */}
        <div style={{
          height: '6px',
          background: 'linear-gradient(90deg, #8B6914, #c9a84c, #f0d080, #c9a84c, #8B6914)',
        }} />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mt-6 no-print">
        <button onClick={downloadAsPNG} disabled={downloading}
          className="btn-gold flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2">
          <span>⬇️</span>
          <span>{downloading ? t('downloading') : t('download_png')}</span>
        </button>
        <button onClick={downloadAsPDF} disabled={downloading}
          className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: 'rgba(184,134,11,0.1)', border: '1.5px solid rgba(184,134,11,0.4)', color: 'var(--color-gold-dark)' }}>
          <span>📄</span>
          <span>{downloading ? t('downloading') : t('download_pdf')}</span>
        </button>
      </div>
    </div>
  );
}