// Server-side PDF document built with @react-pdf/renderer.
// This produces a real vector PDF (searchable, crisp at any zoom) instead of
// embedding a rasterized PNG screenshot like the old html2canvas+jsPDF path.
//
// IMPORTANT — fonts you must add yourself:
//   public/fonts/Cairo-Regular.ttf
//   public/fonts/Cairo-Bold.ttf
//   public/fonts/Amiri-Regular.ttf
//   public/fonts/Amiri-Bold.ttf
// Download these from Google Fonts (fonts.google.com/specimen/Cairo and
// fonts.google.com/specimen/Amiri) and place them at the paths above.
// @react-pdf/renderer needs real embedded font files — it cannot use
// @font-face/Google Fonts CSS like the browser does.
//
// @react-pdf/renderer has its own text layout engine (Yoga) which correctly
// shapes Arabic (letter joining) and handles RTL paragraphs natively, so the
// html2canvas/canvas-fillText class of bugs (broken letter joining, mixed
// RTL/LTR runs like "ISNA-XXXX" breaking) does not apply here.

import { Document, Page, View, Text, Image, Font, StyleSheet } from '@react-pdf/renderer';
import path from 'path';

// Register fonts from the local filesystem (server-side only).
// path.join + process.cwd() resolves correctly both in `next dev` and in the
// Vercel serverless function bundle, as long as the files are inside /public
// and therefore included in the deployment.
const fontsDir = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Cairo',
  fonts: [
    { src: path.join(fontsDir, 'Cairo-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(fontsDir, 'Cairo-Bold.ttf'), fontWeight: 'bold' },
  ],
});

Font.register({
  family: 'Amiri',
  fonts: [
    { src: path.join(fontsDir, 'Amiri-Regular.ttf'), fontWeight: 'normal' },
    { src: path.join(fontsDir, 'Amiri-Bold.ttf'), fontWeight: 'bold' },
  ],
});

// @react-pdf/renderer ships its own bidi-aware text layout, but it still
// needs `direction: 'rtl'` set explicitly per-text-node to align Arabic runs
// correctly (it does not inherit direction from the page automatically).
const RTL = { direction: 'rtl' as const };

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    fontFamily: 'Cairo',
  },
  card: {
    margin: 16,
    border: '3pt solid #2d6e2d',
  },

  // Top image banner
  bannerRow: {
    flexDirection: 'row',
    height: 90,
    backgroundColor: '#1a5c2a',
    padding: 6,
    gap: 6,
  },
  bannerImageWrap: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  logoWrap: {
    width: 110,
    borderRadius: 6,
    overflow: 'hidden',
    border: '1.5pt solid #c9a84c',
    backgroundColor: '#0a0a0a',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  },

  goldBarTop: {
    height: 5,
    backgroundColor: '#c9a84c',
  },
  goldBarBottom: {
    height: 5,
    backgroundColor: '#c9a84c',
  },

  confTitleWrap: {
    backgroundColor: '#f5f0e0',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#2d6e2d',
  },
  confTitle: {
    ...RTL,
    fontFamily: 'Amiri',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#1a4a1a',
    textAlign: 'center',
  },

  bottomSection: {
    padding: 16,
  },
  patronLine: {
    ...RTL,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  inviteLine: {
    ...RTL,
    textAlign: 'center',
    fontSize: 10,
    color: '#333333',
    marginBottom: 12,
    lineHeight: 1.6,
  },

  attendeeBox: {
    textAlign: 'center',
    backgroundColor: '#eef8ee',
    border: '1.5pt solid #2d6e2d',
    borderRadius: 4,
    padding: 12,
    marginBottom: 14,
  },
  attendeeLabel: {
    ...RTL,
    color: '#1a5c1a',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  attendeeName: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  attendeeRegNo: {
    color: '#666666',
    fontSize: 9,
    textAlign: 'center',
  },

  columnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  column: {
    flex: 1,
    borderRadius: 4,
    padding: 8,
    textAlign: 'center',
  },
  columnOpen: {
    backgroundColor: '#eef8ee',
    border: '1pt solid #2d6e2d',
  },
  columnClose: {
    backgroundColor: '#fffaeb',
    border: '1pt solid #c9a84c',
  },
  columnBadgeOpen: {
    ...RTL,
    backgroundColor: '#1a5c1a',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    textAlign: 'center',
    marginBottom: 6,
    alignSelf: 'center',
  },
  columnBadgeClose: {
    ...RTL,
    backgroundColor: '#c9a84c',
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 3,
    textAlign: 'center',
    marginBottom: 6,
    alignSelf: 'center',
  },
  columnText: {
    ...RTL,
    fontSize: 9,
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 1.8,
  },
  columnSubText: {
    fontSize: 8,
    color: '#555555',
  },

  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 10,
    backgroundColor: '#f5f0e0',
    borderRadius: 6,
    border: '1pt solid #c9a84c',
  },
  qrTextWrap: {
    textAlign: 'center',
  },
  qrTitle: {
    ...RTL,
    color: '#1a5c1a',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  qrSub: {
    ...RTL,
    color: '#555555',
    fontSize: 8,
    textAlign: 'center',
    marginBottom: 3,
  },
  qrRegNo: {
    color: '#c9a84c',
    fontSize: 8,
    textAlign: 'center',
  },
  qrImageWrap: {
    backgroundColor: '#ffffff',
    padding: 4,
    borderRadius: 4,
    border: '1.5pt solid #2d6e2d',
  },
  qrImage: {
    width: 90,
    height: 90,
  },

  footerBar: {
    backgroundColor: '#1a5c2a',
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  footerText: {
    ...RTL,
    fontFamily: 'Amiri',
    color: '#ffffff',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 1.6,
  },
});

export interface InvitationPDFProps {
  fullName: string;
  registrationNumber: string;
  confName: string;
  confLocation: string;
  dateStart: string;
  dateEnd: string;
  qrDataUrl: string; // PNG data URL generated server-side (qrcode package)
  domeImagePath?: string; // absolute filesystem path to dome.jpeg
  greenDomeImagePath?: string; // absolute filesystem path to green-dome.jpeg
  gciLogoImagePath?: string; // absolute filesystem path to gci-logo.jpeg
}

export function InvitationPDF({
  fullName,
  registrationNumber,
  confName,
  confLocation,
  dateStart,
  dateEnd,
  qrDataUrl,
  domeImagePath,
  greenDomeImagePath,
  gciLogoImagePath,
}: InvitationPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.card}>
          <View style={styles.goldBarTop} />

          {/* Top image banner */}
          <View style={styles.bannerRow}>
            {domeImagePath && (
              <View style={styles.bannerImageWrap}>
                <Image src={domeImagePath} style={styles.bannerImage} />
              </View>
            )}
            {gciLogoImagePath && (
              <View style={styles.logoWrap}>
                <Image src={gciLogoImagePath} style={styles.logoImage} />
              </View>
            )}
            {greenDomeImagePath && (
              <View style={styles.bannerImageWrap}>
                <Image src={greenDomeImagePath} style={styles.bannerImage} />
              </View>
            )}
          </View>

          {/* Conference title */}
          <View style={styles.confTitleWrap}>
            <Text style={styles.confTitle}>{confName}</Text>
          </View>

          {/* Bottom section */}
          <View style={styles.bottomSection}>
            <Text style={styles.patronLine}>تحت الرعاية السامية لفخامة رئيس الجمهورية</Text>
            <Text style={styles.inviteLine}>
              يشرّفنا دعوتكم بحضور فعاليات {confName}{'\n'}لحضور حفلي الافتتاح والاختتام
            </Text>

            <View style={styles.attendeeBox}>
              <Text style={styles.attendeeLabel}>يتشرّف بحضوركم الكريم</Text>
              <Text style={styles.attendeeName}>{fullName}</Text>
              <Text style={styles.attendeeRegNo}>{registrationNumber}</Text>
            </View>

            <View style={styles.columnsRow}>
              <View style={[styles.column, styles.columnOpen]}>
                <Text style={styles.columnBadgeOpen}>الافتتاح</Text>
                <Text style={styles.columnText}>
                  الساعة الثامنة صباحاً{'\n'}
                  {dateStart}{'\n'}
                  <Text style={styles.columnSubText}>{confLocation}</Text>
                </Text>
              </View>
              <View style={[styles.column, styles.columnClose]}>
                <Text style={styles.columnBadgeClose}>الأمسية الختامية الكبرى</Text>
                <Text style={styles.columnText}>
                  الساعة السابعة مساءً{'\n'}
                  {dateEnd}{'\n'}
                  <Text style={styles.columnSubText}>{confLocation}</Text>
                </Text>
              </View>
            </View>

            <View style={styles.qrRow}>
              <View style={styles.qrTextWrap}>
                <Text style={styles.qrTitle}>بطاقة الدخول الإلكترونية</Text>
                <Text style={styles.qrSub}>امسح رمز QR عند الدخول</Text>
                <Text style={styles.qrRegNo}>{registrationNumber}</Text>
              </View>
              <View style={styles.qrImageWrap}>
                <Image src={qrDataUrl} style={styles.qrImage} />
              </View>
            </View>
          </View>

          {/* Footer message */}
          <View style={styles.footerBar}>
            <Text style={styles.footerText}>
              ❝ معًا لنصرة الحبيب المصطفى ﷺ، وترسيخ محبته في القلوب، ونصرة الأشقاء في فلسطين ❞
            </Text>
          </View>

          <View style={styles.goldBarBottom} />
        </View>
      </Page>
    </Document>
  );
}
