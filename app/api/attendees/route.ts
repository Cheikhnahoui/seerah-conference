import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { generateRegistrationNumber, validateName, validatePhone, formatPhoneNumber, verifyAdminToken } from '@/lib/utils';
import { AttendeeFormData } from '@/types';

// FIX 3: In-memory rate limiter — max 3 registrations per IP per 10 minutes
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 3;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((v, k) => { if (now > v.resetAt) rateLimitMap.delete(k); });
}, 60 * 60 * 1000);

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: 'لقد تجاوزت الحد المسموح به. يرجى الانتظار 10 دقائق قبل المحاولة مجدداً.' },
        { status: 429 }
      );
    }

    const body: AttendeeFormData = await request.json();
    const { full_name, phone_number, city, occupation } = body;

    if (!validateName(full_name)) {
      return NextResponse.json({ success: false, error: 'اسم غير صالح' }, { status: 400 });
    }
    if (!validatePhone(phone_number)) {
      return NextResponse.json({ success: false, error: 'رقم هاتف غير صالح' }, { status: 400 });
    }

    const cleanedPhone = formatPhoneNumber(phone_number);
    const supabase = createServerSupabase();

    const { data: existing } = await supabase
      .from('attendees')
      .select('id, registration_number')
      .eq('phone_number', cleanedPhone)
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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('attendees')
      .select('id, registration_number, full_name, phone_number, city, occupation, attendance_status, registration_date, attendance_date, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

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