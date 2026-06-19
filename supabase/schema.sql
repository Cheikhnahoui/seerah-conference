-- =========================================
-- المؤتمر الدولي للسيرة النبوية
-- Database Schema for Supabase
-- =========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================
-- Table: attendees (المشاركون)
-- =========================================
CREATE TABLE IF NOT EXISTS attendees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  city VARCHAR(100),
  qr_code TEXT NOT NULL,
  attendance_status VARCHAR(20) DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'attended')),
  registration_date TIMESTAMPTZ DEFAULT NOW(),
  attendance_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_attendees_phone ON attendees(phone_number);
CREATE INDEX IF NOT EXISTS idx_attendees_reg_number ON attendees(registration_number);
CREATE INDEX IF NOT EXISTS idx_attendees_status ON attendees(attendance_status);
CREATE INDEX IF NOT EXISTS idx_attendees_city ON attendees(city);

-- =========================================
-- Table: conference_config (إعدادات المؤتمر)
-- =========================================
CREATE TABLE IF NOT EXISTS conference_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conf_name VARCHAR(300) DEFAULT 'المؤتمر الدولي للسيرة النبوية',
  conf_date VARCHAR(200) DEFAULT '١٥-١٧ ربيع الأول ١٤٤٦',
  conf_location VARCHAR(300) DEFAULT 'نواكشوط - موريتانيا',
  conf_description TEXT DEFAULT 'يسعدنا دعوتكم للمشاركة في المؤتمر الدولي للسيرة النبوية، الذي يجمع العلماء والباحثين والمهتمين من شتى أنحاء العالم للتباحث في سيرة خير الأنام ﷺ',
  logo_url TEXT,
  welcome_text VARCHAR(500) DEFAULT 'أهلاً وسهلاً بكم في المؤتمر الدولي للسيرة النبوية',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config if not exists
INSERT INTO conference_config (conf_name, conf_date, conf_location)
VALUES ('المؤتمر الدولي للسيرة النبوية', '١٥-١٧ ربيع الأول ١٤٤٦', 'نواكشوط - موريتانيا')
ON CONFLICT DO NOTHING;

-- =========================================
-- Table: admin_sessions (جلسات المدير)
-- =========================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  email VARCHAR(200) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

-- =========================================
-- Function: Update updated_at on row change
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for attendees
CREATE TRIGGER update_attendees_updated_at
  BEFORE UPDATE ON attendees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for conference_config
CREATE TRIGGER update_config_updated_at
  BEFORE UPDATE ON conference_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =========================================
-- Row Level Security (RLS)
-- =========================================

-- Enable RLS
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
ALTER TABLE conference_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Public can read conference_config
CREATE POLICY "Public can read conference config"
  ON conference_config FOR SELECT
  USING (true);

-- Public can insert attendees (for registration)
CREATE POLICY "Public can register"
  ON attendees FOR INSERT
  WITH CHECK (true);

-- Public can read their own attendee by phone
CREATE POLICY "Public can read attendees"
  ON attendees FOR SELECT
  USING (true);

-- Service role can do everything (for admin API)
CREATE POLICY "Service role has full access to attendees"
  ON attendees FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to config"
  ON conference_config FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to sessions"
  ON admin_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- =========================================
-- Useful Views
-- =========================================

-- Statistics view
CREATE OR REPLACE VIEW attendance_stats AS
SELECT
  COUNT(*) AS total_registered,
  COUNT(CASE WHEN attendance_status = 'attended' THEN 1 END) AS total_attended,
  ROUND(
    COUNT(CASE WHEN attendance_status = 'attended' THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0),
    2
  ) AS attendance_rate
FROM attendees;

-- City statistics view
CREATE OR REPLACE VIEW city_stats AS
SELECT
  COALESCE(city, 'غير محدد') AS city,
  COUNT(*) AS total,
  COUNT(CASE WHEN attendance_status = 'attended' THEN 1 END) AS attended
FROM attendees
GROUP BY city
ORDER BY total DESC;

-- =========================================
-- Sample Data (Optional - for testing)
-- =========================================
/*
INSERT INTO attendees (registration_number, full_name, phone_number, city, qr_code)
VALUES
  ('ISNA-TEST-0001', 'محمد أحمد علي', '0501234567', 'الرياض', 'ISNA-TEST-0001'),
  ('ISNA-TEST-0002', 'فاطمة عبد الله', '0507654321', 'جدة', 'ISNA-TEST-0002'),
  ('ISNA-TEST-0003', 'عبد الرحمن محمد', '0509876543', 'المدينة المنورة', 'ISNA-TEST-0003');
*/
