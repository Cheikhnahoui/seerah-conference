import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { generateRegistrationNumber, validateName, validatePhone, formatPhoneNumber, verifyAdminToken } from '@/lib/utils';
import { AttendeeFormData } from '@/types';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Rate limit: max 3 registration attempts per IP+phone per 10 minutes
const registrationRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.fixedWindow(3, '10m'),
  prefix: 'ratelimit:registration',
});

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const body: AttendeeFormData = await request.json();
    const { full_name, phone_number, city, occupation } = body;

    if (!validateName(full_name)) {
      return NextResponse.json({ success: false, error: 'اسم غير صالح' }, { status: 400 });
    }
    if (!validatePhone(phone_number)) {
      return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
    }

    // Client sends E.164 (e.g. "+22222123456"); this is now stored as-is.
    const cleanedPhone = formatPhoneNumber(phone_number);

    // Rate limit key = IP + phone → each person blocked independently
    const rateLimitKey = `${ip}:${cleanedPhone}`;
    const { success, remaining, reset } = await registrationRatelimit.limit(rateLimitKey);

    if (!success) {
      const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `لقد تجاوزت الحد المسموح به. يرجى الانتظار ${Math.ceil(retryAfterSeconds / 60)} دقيقة قبل المحاولة مجدداً.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(retryAfterSeconds), 'X-RateLimit-Remaining': String(remaining) },
        }
      );
    }
    const supabase = createServerSupabase();

    // Check for a duplicate against both the modern E.164 form and the
    // legacy digits-only form (no leading "+") that older records may
    // still use, so we never miss an existing registration.
    const legacyDigits = cleanedPhone.replace(/^\+/, '');
    const { data: existing } = await supabase
      .from('attendees')
      .select('id, registration_number')
      .or(`phone_number.eq.${cleanedPhone},phone_number.eq.${legacyDigits}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'رقم الهاتف مسجل مسبقاً. يمكنك استرجاع دعوتك من صفحة الاسترجاع.' },
        { status: 409 }
      );
    }

    const registrationNumber = generateRegistrationNumber();

    const { data: attendee, error } = await supabase
      .from('attendees')
      .insert({
        registration_number: registrationNumber,
        full_name: full_name.trim(),
        phone_number: cleanedPhone,
        city: city?.trim() || null,
        occupation: occupation?.trim() || null,
        qr_code: null,
        attendance_status: 'registered',
        approval_status: 'pending',
        registration_date: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: attendee }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي في الخادم' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token || !verifyAdminToken(token)) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const supabase = createServerSupabase();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const city = searchParams.get('city') || '';
    const manualOnly = searchParams.get('manual') === 'true';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('attendees')
      .select('id, registration_number, full_name, phone_number, city, occupation, attendance_status, approval_status, is_manual, delivery_status, registration_date, attendance_date, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (manualOnly) {
      query = query.eq('is_manual', true);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,phone_number.ilike.%${search}%,registration_number.ilike.%${search}%`);
    }
    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ success: false, error: 'خطأ في جلب البيانات' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data, count });
  } catch (error) {
    console.error('GET attendees error:', error);
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}