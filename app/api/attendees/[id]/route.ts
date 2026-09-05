import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { verifyAdminToken, validatePhone } from '@/lib/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }
    const { id } = await params;
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('attendees')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'لم يتم العثور على المشارك' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    if (body.phone_number && !validatePhone(body.phone_number)) {
      return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
    }

    if (
      body.approval_status &&
      !['pending', 'approved', 'rejected'].includes(body.approval_status)
    ) {
      return NextResponse.json({ success: false, error: 'حالة موافقة غير صالحة' }, { status: 400 });
    }

    if (
      body.delivery_status &&
      !['not_delivered', 'delivered'].includes(body.delivery_status)
    ) {
      return NextResponse.json({ success: false, error: 'حالة تسليم غير صالحة' }, { status: 400 });
    }

    const supabase = createServerSupabase();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.full_name !== undefined) updateData.full_name = body.full_name;
    if (body.phone_number !== undefined) updateData.phone_number = body.phone_number;
    if (body.city !== undefined) updateData.city = body.city;
    if (body.occupation !== undefined) updateData.occupation = body.occupation;
    if (body.approval_status !== undefined) updateData.approval_status = body.approval_status;
    if (body.delivery_status !== undefined) updateData.delivery_status = body.delivery_status;
    if (body.invitation_sent !== undefined) updateData.invitation_sent = body.invitation_sent;
    if (body.invitation_sent_at !== undefined) updateData.invitation_sent_at = body.invitation_sent_at;

    const { data, error } = await supabase
      .from('attendees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: 'خطأ في التحديث' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServerSupabase();
    const { error } = await supabase
      .from('attendees')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: 'خطأ في الحذف' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'تم الحذف بنجاح' });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}