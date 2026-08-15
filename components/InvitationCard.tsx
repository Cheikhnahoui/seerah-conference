'use client';

import { useRef, useState, useEffect } from 'react';
import { Attendee } from '@/types';
import { useLang } from '@/lib/i18n';

interface InvitationCardProps {
  attendee: Attendee;
}

let configCache: {
  conf_date?: string;
  conf_location?: string;
  conf_name?: string;
} | null = null;

let configPromise: Promise<void> | null = null;

async function loadConfig() {
  if (configCache) return;

  if (!configPromise) {
    configPromise = fetch('/api/config')
      .then(res => res.json())
      .then(result => {
        if (result.success) configCache = result.data;
      })
      .catch(() => {
        configCache = {};
      });
  }

  await configPromise;
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
        if (configCache.conf_date) {
          setConfDate(configCache.conf_date);
        }

        if (configCache.conf_location) {
          setConfLocation(configCache.conf_location);
        }

        if (configCache.conf_name) {
          setConfName(configCache.conf_name);
        }
      }
    });
  }, []);

  useEffect(() => {
    if (!qrCanvasRef.current || !attendee.registration_number) return;

    import('qrcode').then(QRCode => {
      const qrData = JSON.stringify({
        reg: attendee.registration_number,
        app: 'seerah-conf',
      });

      QRCode.toCanvas(qrCanvasRef.current, qrData, {
        width: 160,
        margin: 1,
        color: {
          dark: '#1a4a1a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'H',
      });
    });
  }, [attendee.registration_number]);

  /*
   * Capture the EXACT card displayed in the browser.
   * This means the PDF uses the same:
   * - images
   * - Arabic fonts
   * - QR code
   * - spacing
   * - borders
   * - colors
   * - dimensions
   * - footer
   */
  const captureCard = async (scale: number) => {
    const html2canvas = (await import('html2canvas')).default;

    await Promise.race([
      document.fonts.ready,
      new Promise(resolve => setTimeout(resolve, 2000)),
    ]);

    try {
      await Promise.all([
        document.fonts.load('700 16px Cairo'),
        document.fonts.load('400 16px Cairo'),
        document.fonts.load('700 16px Amiri'),
        document.fonts.load('400 16px Amiri'),
      ]);
    } catch {
      // Continue even if fonts cannot be explicitly loaded.
    }

    /*
     * Make sure every image inside the card has finished loading
     * before html2canvas takes the screenshot.
     */
    const images = Array.from(
      cardRef.current?.querySelectorAll('img') ?? []
    );

    await Promise.all(
      images.map(async img => {
        if (img.complete && img.naturalWidth > 0) {
          try {
            await img.decode();
          } catch {
            // Image is already available.
          }

          return;
        }

        await new Promise<void>(resolve => {
          const done = () => {
            img.removeEventListener('load', done);
            img.removeEventListener('error', done);
            resolve();
          };

          img.addEventListener('load', done, { once: true });
          img.addEventListener('error', done, { once: true });
        });
      })
    );

    return html2canvas(cardRef.current!, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      allowTaint: true,
      foreignObjectRendering: false,
    });
  };

  /*
   * PNG download
   */
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

  /*
   * PDF download
   *
   * IMPORTANT:
   * We do NOT use A4.
   *
   * The PDF page gets exactly the same aspect ratio as the
   * invitation card. This removes the huge white space that
   * appeared in your previous PDF.
   */
  const downloadAsPDF = async () => {
    setDownloading(true);

    try {
      const canvas = await captureCard(3);

      const { jsPDF } = await import('jspdf');

      /*
       * html2canvas scale = 3.
       *
       * Convert the canvas dimensions back to CSS pixels.
       */
      const cardWidthPx = canvas.width / 3;
      const cardHeightPx = canvas.height / 3;

      /*
       * CSS pixels -> PDF points.
       *
       * 96 CSS pixels = 72 PDF points.
       */
      const pageWidthPt = (cardWidthPx * 72) / 96;
      const pageHeightPt = (cardHeightPx * 72) / 96;

      /*
       * Custom PDF page size.
       *
       * This is the key fix.
       * The PDF page is now the same size/proportion as the card.
       */
      const pdf = new jsPDF({
        orientation:
          pageHeightPt >= pageWidthPt
            ? 'portrait'
            : 'landscape',

        unit: 'pt',

        format: [
          pageWidthPt,
          pageHeightPt,
        ],

        compress: true,
      });

      const imageData = canvas.toDataURL(
        'image/png',
        1.0
      );

      /*
       * Put the captured card on the entire PDF page.
       */
      pdf.addImage(
        imageData,
        'PNG',
        0,
        0,
        pageWidthPt,
        pageHeightPt,
        undefined,
        'FAST'
      );

      pdf.save(
        `invitation-${attendee.registration_number}.pdf`
      );
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

          <span className="font-semibold">
            {t('success_registered')}
          </span>
        </div>

        <p style={{ color: 'var(--color-text-muted)' }}>
          {t('card_ready')}
        </p>
      </div>

      {/* ============================= */}
      {/* INVITATION CARD                */}
      {/* ============================= */}

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

          boxShadow:
            '0 8px 40px rgba(0,0,0,0.15)',

          maxWidth: '420px',

          margin: '0 auto',
        }}
      >

        {/* ============================= */}
        {/* TOP SECTION                    */}
        {/* ============================= */}

        <div
          style={{
            background:
              'linear-gradient(180deg, #f5f0e0 0%, #ede8d0 100%)',

            position: 'relative',

            borderBottom:
              '3px solid #2d6e2d',
          }}
        >

          {/* Gold top border */}
          <div
            style={{
              height: '6px',

              background:
                'linear-gradient(90deg, #8B6914, #c9a84c, #f0d080, #c9a84c, #8B6914)',
            }}
          />

          {/* ============================= */}
          {/* TWO LOGOS                      */}
          {/* ============================= */}

          <div
            style={{
              display: 'flex',

              gap: '8px',

              padding: '8px',

              height: '110px',

              background: '#1a5c2a',

              borderBottom:
                '2px solid #c9a84c',

              direction: 'ltr',
            }}
          >

            {/* Conference logo */}
            <div
              style={{
                flex: 1,

                height: '100%',

                borderRadius: '10px',

                overflow: 'hidden',

                border:
                  '2px solid #c9a84c',

                background: '#ffffff',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',
              }}
            >
              <img
                src="/conf-logo.png"
                alt="شعار المؤتمر"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  padding: '4px',
                }}
              />
            </div>

            {/* GCI logo */}
            <div
              style={{
                flex: 1,

                height: '100%',

                borderRadius: '10px',

                overflow: 'hidden',

                border:
                  '2px solid #c9a84c',

                background: '#ffffff',

                display: 'flex',

                alignItems: 'center',

                justifyContent: 'center',
              }}
            >
              <img
                src="/gci-logo-new.jpeg"
                alt="GCI"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  imageRendering:
                    'high-quality' as any,
                }}
              />
            </div>

          </div>
        </div>

        {/* ============================= */}
        {/* MAIN CONTENT                   */}
        {/* ============================= */}

        <div
          style={{
            background: '#ffffff',

            padding:
              '10px 12px 10px',

            position: 'relative',
          }}
        >

          {/* ============================= */}
          {/* ATTENDEE BOX                   */}
          {/* ============================= */}

          <div
            style={{
              textAlign: 'center',

              background:
                'linear-gradient(135deg, #f0fff0, #e8f5e8)',

              border:
                '2px solid #2d6e2d',

              borderRadius: '6px',

              padding:
                '8px 14px',

              marginBottom: '8px',
            }}
          >

            <p
              dir="rtl"
              style={{
                color: '#1a5c1a',

                fontSize: '11px',

                fontFamily:
                  'Cairo, sans-serif',

                marginBottom: '6px',

                fontWeight: '600',

                lineHeight: 1.7,
              }}
            >
              {t('honor_text')}
            </p>

            <p
              style={{
                color: '#1a1a1a',

                fontSize: '18px',

                fontWeight: 'bold',

                fontFamily:
                  'Cairo, sans-serif',

                lineHeight: 1.2,

                wordBreak:
                  'break-word',

                marginBottom: '6px',
              }}
            >
              {`السيد(ة) ${attendee.full_name}`}
            </p>

            <p
              dir="rtl"
              style={{
                color: '#2d6e2d',

                fontSize: '11px',

                fontFamily:
                  'Cairo, sans-serif',

                lineHeight: 1.7,

                fontWeight: '600',
              }}
            >
              {t('invitation_body')}
            </p>

          </div>

          {/* ============================= */}
          {/* DATE / LOCATION                */}
          {/* ============================= */}

          <div
            style={{
              display: 'grid',

              gridTemplateColumns:
                '1fr 1fr',

              gap: '6px',

              marginBottom: '8px',

              direction: 'ltr',
            }}
          >

            {/* LOCATION */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, #fffde7, #fff8e1)',

                border:
                  '1px solid #c9a84c',

                borderRadius: '6px',

                padding:
                  '6px 8px',

                textAlign: 'center',
              }}
            >

              <div
                style={{
                  background:
                    'linear-gradient(90deg, #c9a84c, #f0d080)',

                  color: '#fff',

                  fontFamily:
                    'Cairo, sans-serif',

                  fontSize: '10px',

                  fontWeight: 'bold',

                  padding:
                    '4px 8px',

                  borderRadius:
                    '4px 4px 0 0',

                  display: 'block',

                  textAlign: 'center',

                  margin:
                    '-6px -8px 8px -8px',
                }}
              >
                المكان
              </div>

              <p
                dir="rtl"
                style={{
                  color: '#1a1a1a',

                  fontSize: '9px',

                  fontFamily:
                    'Cairo, sans-serif',

                  lineHeight: 1.8,

                  paddingTop: '2px',
                }}
              >
                المركز الدولي للمؤتمرات
                <br />
                (المختار ولد داداه)
              </p>

            </div>

            {/* DATE / TIME */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, #f0fff0, #e8f5e8)',

                border:
                  '1px solid #2d6e2d',

                borderRadius: '6px',

                padding:
                  '6px 8px',

                textAlign: 'center',
              }}
            >

              <div
                style={{
                  background:
                    'linear-gradient(90deg, #1a5c1a, #2d8a2d)',

                  color: '#fff',

                  fontFamily:
                    'Cairo, sans-serif',

                  fontSize: '10px',

                  fontWeight: 'bold',

                  padding:
                    '4px 8px',

                  borderRadius:
                    '4px 4px 0 0',

                  display: 'block',

                  textAlign: 'center',

                  margin:
                    '-6px -8px 8px -8px',
                }}
              >
                التاريخ
              </div>

              <p
                dir="rtl"
                style={{
                  color: '#1a1a1a',

                  fontSize: '9px',

                  fontFamily:
                    'Cairo, sans-serif',

                  lineHeight: 1.8,

                  paddingTop: '2px',
                }}
              >
                21 – 23 ربيع الأول 1448هـ
                <br />
                الموافق 4 – 6 سبتمبر 2026م
              </p>

            </div>

          </div>

          {/* ============================= */}
          {/* QR CODE                        */}
          {/* ============================= */}

          <div
            style={{
              display: 'flex',

              flexDirection: 'column',

              alignItems: 'center',

              justifyContent: 'center',

              gap: '8px',

              padding: '10px',

              background:
                'linear-gradient(135deg, #f5f0e0, #ede8d0)',

              borderRadius: '8px',

              border:
                '1px solid #c9a84c',

              marginBottom: '8px',
            }}
          >

            {/* QR */}
            <div
              style={{
                background: '#fff',

                padding: '4px',

                borderRadius: '6px',

                border:
                  '2px solid #2d6e2d',

                flexShrink: 0,
              }}
            >
              <canvas
                ref={qrCanvasRef}
                width={160}
                height={160}
                style={{
                  display: 'block',

                  width: '110px',

                  height: '110px',
                }}
              />
            </div>

            {/* Registration code, centered below the QR */}
            <p
              style={{
                color: '#c9a84c',

                fontSize: '10px',

                fontFamily: 'monospace',

                textAlign: 'center',
              }}
            >
              {attendee.registration_number}
            </p>

          </div>

        </div>

        {/* ============================= */}
        {/* FOOTER                          */}
        {/* ============================= */}

        <div
          dir="rtl"
          style={{
            background:
              'linear-gradient(90deg, #1a5c1a, #2d8a2d, #1a5c1a)',

            padding:
              '8px 16px',

            textAlign: 'center',

            color: '#fff',

            fontSize: '11px',

            fontFamily:
              'Amiri, serif',

            lineHeight: 1.6,
          }}
        >
          {t('card_footer')}
        </div>

        {/* Gold bottom bar */}
        <div
          style={{
            height: '6px',

            background:
              'linear-gradient(90deg, #8B6914, #c9a84c, #f0d080, #c9a84c, #8B6914)',
          }}
        />

      </div>

      {/* ============================= */}
      {/* DOWNLOAD BUTTONS               */}
      {/* ============================= */}

      <div
        className="flex flex-col sm:flex-row gap-3 mt-6 no-print"
      >

        {/* PNG */}
        <button
          onClick={downloadAsPNG}
          disabled={downloading}
          className="btn-gold flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <span>⬇️</span>

          <span>
            {downloading
              ? t('downloading')
              : t('download_png')}
          </span>
        </button>

        {/* PDF */}
        <button
          onClick={downloadAsPDF}
          disabled={downloading}
          className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{
            background:
              'rgba(184,134,11,0.1)',

            border:
              '1.5px solid rgba(184,134,11,0.4)',

            color:
              'var(--color-gold-dark)',
          }}
        >
          <span>📄</span>

          <span>
            {downloading
              ? t('downloading')
              : t('download_pdf')}
          </span>
        </button>

      </div>

    </div>
  );
}