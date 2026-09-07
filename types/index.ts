export interface Attendee {
  id: string;
  registration_number: string;
  full_name: string;
  phone_number: string;
  city: string | null;
  occupation: string | null;
  qr_code: string;
  qr_token: string | null;
  attendance_status: 'registered' | 'attended';
  approval_status: 'pending' | 'approved' | 'rejected';
  is_manual: boolean;
  delivery_status: 'not_delivered' | 'delivered';
  invitation_sent: boolean;
  invitation_sent_at: string | null;
  registration_date: string;
  attendance_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendeeFormData {
  full_name: string;
  phone_number: string;
  city?: string;
  occupation?: string;
}

export interface ConferenceConfig {
  id: string;
  conf_name: string;
  conf_date: string;
  conf_location: string;
  conf_description: string;
  logo_url: string | null;
  welcome_text: string;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  total_registered: number;
  total_accepted: number;
  total_attended: number;
  attendance_rate: number;
  by_city: { city: string; count: number; attended: number }[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface QrScanResult {
  success: boolean;
  attendee?: Attendee;
  alreadyAttended?: boolean;
  message: string;
}

// ============================================================
// قسم "آخر المستجدات" — أخبار، إعلانات، إشعارات، علماء، فعاليات
// جدول مستقل تماماً عن attendees/conference_config
// ============================================================

export type UpdateType = 'news' | 'announcement' | 'notice' | 'scholar' | 'event';

export type ParticipationStatus = 'confirmed' | 'expected';

export interface UpdatePost {
  id: string;
  type: UpdateType;
  title: string;
  content: string | null;
  image_url: string | null;
  additional_images: string[] | null;
  // الحقول التالية ذات معنى فقط عندما type === 'scholar'
  country: string | null;
  role: string | null;
  participation_status: ParticipationStatus | null;
  is_published: boolean;
  is_pinned: boolean;
  is_important_notice: boolean;
  publish_date: string;
  created_at: string;
  updated_at: string;
}

export interface UpdatePostFormData {
  type: UpdateType;
  title: string;
  content?: string;
  image_url?: string;
  additional_images?: string[];
  country?: string;
  role?: string;
  participation_status?: ParticipationStatus;
  is_published?: boolean;
  is_pinned?: boolean;
  is_important_notice?: boolean;
  publish_date?: string;
}

// تسميات عرض عربية للأنواع، تُستخدَم في لوحة الإدارة والصفحات العامة
export const UPDATE_TYPE_LABELS: Record<UpdateType, string> = {
  news: 'خبر',
  announcement: 'إعلان',
  notice: 'إشعار مهم',
  scholar: 'عالم/شيخ مشارك',
  event: 'فعالية',
};

export const PARTICIPATION_STATUS_LABELS: Record<ParticipationStatus, string> = {
  confirmed: 'مؤكد الحضور',
  expected: 'سيشارك في المؤتمر',
};