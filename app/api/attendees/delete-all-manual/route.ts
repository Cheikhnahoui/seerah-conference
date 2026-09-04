import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken } from '@/lib/utils';

/**
 * Deletes EVERY manually-created attendee (is_manual = true) — used
 * for the "delete all manual invitations" admin action. Public
 * self-registrations (is_manual = false) are never touched by this
 * endpoint under any circumstance.
 */
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = createServerSupabase();

    const { error, count } = await supabase
      .from('attendees')
      .delete({ count: 'exact' })
      .eq('is_manual', true);

    if (error) {
      console.error('Delete all manual error:', error);
      return NextResponse.json({ success: false, error: 'خطأ أثناء الحذف' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedCount: count ?? 0 });
  } catch (error) {
    console.error('Delete all manual error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}