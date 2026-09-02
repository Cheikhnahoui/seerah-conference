import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

/**
 * Public (no auth) endpoint to fetch a single attendee by ID, used by
 * app/invitation/[id]/page.tsx — the direct card link the admin
 * manually sends over WhatsApp after verifying the person's identity.
 *
 * This is intentionally public: the ID is an unguessable UUID and
 * only ever shared by the admin with the specific person it belongs
 * to. Unlike /api/attendees/[id] (which requires an admin token and
 * exposes full record management), this route only returns the
 * fields needed to render the invitation card — nothing else.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabase();

    const { data, error } = await supabase
      .from('attendees')
      .select(
        'id, registration_number, qr_token, full_name, phone_number, city, attendance_status, registration_date'
      )
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على بطاقة الدعوة' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Public invitation fetch error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}