import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';

/**
 * Exports ONLY manually-created (is_manual = true) and approved
 * (approval_status = 'approved') attendees to an .xlsx file with two
 * columns: Name and a real, scannable QR code image per row.
 *
 * The QR payload encoded here is IDENTICAL to what InvitationCard.tsx
 * and the attendance scanner (/api/attendance) already use —
 * { token: qr_token, app: 'seerah-conf' } — so every exported QR
 * remains fully compatible with the existing check-in system. No new
 * or incompatible QR format is introduced.
 */
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'));
    // Capped at 500 per request — generating & embedding QR images for
    // more than that in a single serverless invocation risks hitting
    // the platform's execution time limit. Large lists are exported
    // as multiple sequential files instead (handled by the client).
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '100')));

    const supabase = createServerSupabase();

    // First, get the total count so the client knows how many pages/files to request.
    const { count: totalCount, error: countError } = await supabase
      .from('attendees')
      .select('*', { count: 'exact', head: true })
      .eq('is_manual', true)
      .eq('approval_status', 'approved');

    if (countError) {
      console.error('Export count error:', countError);
      return NextResponse.json({ success: false, error: 'خطأ في جلب العدد' }, { status: 500 });
    }

    const { data: attendees, error } = await supabase
      .from('attendees')
      .select('full_name, qr_token, registration_number')
      .eq('is_manual', true)
      .eq('approval_status', 'approved')
      .order('full_name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Export query error:', error);
      return NextResponse.json({ success: false, error: 'خطأ في جلب البيانات' }, { status: 500 });
    }

    if (!attendees || attendees.length === 0) {
      return NextResponse.json({ success: false, error: 'لا يوجد أشخاص يدويون مقبولون للتصدير' }, { status: 404 });
    }

    const ExcelJS = (await import('exceljs')).default;
    const QRCode = await import('qrcode');

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('المقبولون');

    sheet.columns = [
      { header: 'الاسم', key: 'name', width: 32 },
      { header: 'رمز QR', key: 'qr', width: 22 },
    ];

    sheet.getRow(1).font = { bold: true, size: 13 };
    sheet.getRow(1).height = 24;
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    const QR_PX = 130; // square QR image size in pixels
    const QR_PT = QR_PX * 0.75; // px -> points, for row height

    // Generate all QR PNGs in parallel first — much faster than
    // awaiting each one sequentially inside the sheet-building loop,
    // which matters a lot when we're racing the platform's execution
    // time limit.
    const qrBuffers = await Promise.all(
      attendees.map((a) => {
        const qrPayload = a.qr_token
          ? JSON.stringify({ token: a.qr_token, app: 'seerah-conf' })
          : JSON.stringify({ reg: a.registration_number, app: 'seerah-conf' });

        return QRCode.toBuffer(qrPayload, {
          width: QR_PX,
          margin: 1,
          color: { dark: '#1a4a1a', light: '#ffffff' },
          errorCorrectionLevel: 'H',
          type: 'png',
        });
      })
    );

    for (let i = 0; i < attendees.length; i++) {
      const a = attendees[i];
      const rowNumber = i + 2; // header is row 1
      const pngBuffer = qrBuffers[i];

      const row = sheet.getRow(rowNumber);
      row.getCell(1).value = a.full_name;
      row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell(1).font = { size: 12 };
      row.height = QR_PT;

      const imageId = workbook.addImage({ buffer: Buffer.from(pngBuffer) as any, extension: 'png' });

      // Same width/height as the source image preserves aspect ratio
      // exactly (it's already square) and fills the cell fully —
      // effectively centered with no cropping or distortion.
      sheet.addImage(imageId, {
        tl: { col: 1, row: rowNumber - 1 },
        ext: { width: QR_PX, height: QR_PX },
        editAs: 'oneCell',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="المقبولون-يدوياً-${new Date().toISOString().slice(0, 10)}.xlsx"`,
        'X-Total-Count': String(totalCount ?? attendees.length),
        'X-Offset': String(offset),
        'X-Returned-Count': String(attendees.length),
      },
    });
  } catch (error) {
    console.error('Excel export error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي أثناء التصدير' }, { status: 500 });
  }
}