import { NextRequest, NextResponse } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import path from 'path';
import fs from 'fs';
import { createServerSupabase } from '@/lib/supabase';
import { generateQRCode } from '@/lib/utils';
import { InvitationPDF } from '@/components/pdf/InvitationPDF';

// This route runs strictly on the Node.js serverless runtime (NOT edge),
// because @react-pdf/renderer and Node's `fs`/`path` modules require it.
export const runtime = 'nodejs';

function publicImageAsDataUrlIfExists(filename: string): string | undefined {
  const fullPath = path.join(process.cwd(), 'public', filename);
  if (!fs.existsSync(fullPath)) {
    console.error(`[invitation-pdf] image not found at: ${fullPath}`);
    return undefined;
  }
  try {
    const buffer = fs.readFileSync(fullPath);
    const ext = path.extname(filename).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch (err) {
    console.error(`[invitation-pdf] failed to read image ${fullPath}:`, err);
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const registrationNumber = searchParams.get('reg');

    if (!registrationNumber) {
      return NextResponse.json({ success: false, error: 'رقم التسجيل مطلوب' }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const { data: attendee, error } = await supabase
      .from('attendees')
      .select('full_name, registration_number')
      .eq('registration_number', registrationNumber)
      .single();

    if (error || !attendee) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على المشارك' }, { status: 404 });
    }

    // Conference config (with sane fallbacks, matching /api/config defaults)
    const { data: config } = await supabase
      .from('conference_config')
      .select('conf_name, conf_date, conf_location')
      .limit(1)
      .single();

    const confName = config?.conf_name || 'المؤتمر الدولي للسيرة النبوية';
    const confDate = config?.conf_date || '١٥-١٧ ربيع الأول ١٤٤٦';
    const confLocation = config?.conf_location || 'نواكشوط - موريتانيا';
    const dateParts = confDate.split('-');
    const dateStart = dateParts[0]?.trim() || confDate;
    const dateEnd = dateParts[1]?.trim() || confDate;

    // QR code generated server-side as a PNG data URL (no browser/canvas needed)
    const qrDataUrl = await generateQRCode(
      JSON.stringify({ reg: attendee.registration_number, app: 'seerah-conf' })
    );

    const pdfBuffer = await renderToBuffer(
      InvitationPDF({
        fullName: attendee.full_name,
        registrationNumber: attendee.registration_number,
        confName,
        confLocation,
        dateStart,
        dateEnd,
        qrDataUrl,
        domeImagePath: publicImageAsDataUrlIfExists('dome.jpeg'),
        greenDomeImagePath: publicImageAsDataUrlIfExists('green-dome.jpeg'),
        gciLogoImagePath: publicImageAsDataUrlIfExists('gci-logo.jpeg'),
      })
    );

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invitation-${attendee.registration_number}.pdf"`,
      },
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    return NextResponse.json({ success: false, error: 'فشل في توليد ملف PDF' }, { status: 500 });
  }
}