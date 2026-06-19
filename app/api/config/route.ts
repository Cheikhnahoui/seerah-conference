import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from('conference_config')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      return NextResponse.json({
        success: true,
        data: {
          conf_name: 'المؤتمر الدولي للسيرة النبوية',
          conf_date: '١٥-١٧ ربيع الأول ١٤٤٦',
          conf_location: 'نواكشوط - موريتانيا',
          conf_description: 'يسعدنا دعوتكم للمشاركة في المؤتمر الدولي للسيرة النبوية',
          welcome_text: 'أهلاً وسهلاً بكم',
          logo_url: null,
          country: 'موريتانيا',
          country_code: '+222',
        },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const supabase = createServerSupabase();

    const { data: existing } = await supabase
      .from('conference_config')
      .select('id')
      .limit(1)
      .single();

    let result;
    if (existing) {
      result = await supabase
        .from('conference_config')
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      result = await supabase
        .from('conference_config')
        .insert(body)
        .select()
        .single();
    }

    if (result.error) {
      return NextResponse.json({ success: false, error: 'خطأ في التحديث' }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch {
    return NextResponse.json({ success: false, error: 'خطأ داخلي' }, { status: 500 });
  }
}
