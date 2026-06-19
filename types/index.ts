export interface Attendee {
  id: string;
  registration_number: string;
  full_name: string;
  phone_number: string;
  city: string | null;
  occupation: string | null;
  qr_code: string;
  attendance_status: 'registered' | 'attended';
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
  total_attended: number;
  attendance_rate: number;
  by_city: { city: string; count: number }[];
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