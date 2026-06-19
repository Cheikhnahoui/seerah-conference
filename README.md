# 🕌 المؤتمر الدولي للسيرة النبوية
## منصة التسجيل والدعوات والحضور

---

## 📁 هيكل المشروع

```
seerah-conference/
├── app/
│   ├── layout.tsx                    # Layout رئيسي RTL
│   ├── globals.css                   # CSS عربي إسلامي
│   ├── page.tsx                      # صفحة التسجيل الرئيسية
│   ├── retrieve/page.tsx             # استرجاع الدعوة
│   ├── attendance/page.tsx           # مسح QR للحضور
│   ├── invitation/[id]/page.tsx      # عرض البطاقة مباشرة
│   ├── admin/
│   │   ├── page.tsx                  # تسجيل دخول الإدارة
│   │   ├── layout.tsx                # layout لوحة الإدارة
│   │   ├── dashboard/page.tsx        # إحصائيات ورسوم بيانية
│   │   ├── attendees/page.tsx        # إدارة المشاركين
│   │   └── settings/page.tsx        # إعدادات المؤتمر
│   └── api/
│       ├── attendees/route.ts        # GET/POST المشاركين
│       ├── attendees/[id]/route.ts   # GET/PUT/DELETE مشارك
│       ├── attendance/route.ts       # تسجيل الحضور عبر QR
│       ├── auth/route.ts             # تسجيل دخول المدير
│       ├── config/route.ts           # إعدادات المؤتمر
│       └── stats/route.ts            # الإحصائيات
├── components/
│   ├── RegistrationForm.tsx          # نموذج التسجيل
│   ├── InvitationCard.tsx            # بطاقة الدعوة + تحميل
│   └── ui/
│       └── IslamicPattern.tsx        # خلفية إسلامية SVG
├── lib/
│   ├── supabase.ts                   # Supabase client
│   └── utils.ts                     # دوال مساعدة
├── types/index.ts                    # TypeScript types
├── supabase/schema.sql               # قاعدة البيانات كاملة
├── .env.example                      # متغيرات البيئة
└── README.md
```

---

## ⚙️ متطلبات التشغيل

- Node.js 18+
- حساب Supabase (مجاني)
- حساب Vercel للنشر (اختياري)

---

## 🚀 التثبيت والتشغيل

### 1. استخرج وافتح المشروع

```bash
unzip seerah-conference.zip
cd seerah-conference
```

### 2. تثبيت الحزم

```bash
npm install
```

### 3. إنشاء قاعدة البيانات في Supabase

1. اذهب إلى [supabase.com](https://supabase.com) وأنشئ مشروعاً جديداً
2. افتح **SQL Editor**
3. انسخ محتوى ملف `supabase/schema.sql` والصقه ثم اضغط **Run**

### 4. إعداد متغيرات البيئة

انسخ ملف `.env.example` إلى `.env.local`:

```bash
cp .env.example .env.local
```

ثم عدّل القيم:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
ADMIN_EMAIL=admin@yourconf.com
ADMIN_PASSWORD=YourStrongPassword123
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**أين تجد مفاتيح Supabase:**
- Dashboard → Settings → API → Project URL + anon key + service_role key

### 5. تشغيل المشروع محلياً

```bash
npm run dev
```

افتح المتصفح على: **http://localhost:3000**

---

## 📄 صفحات الموقع

| الصفحة | الرابط | الوصف |
|--------|--------|-------|
| التسجيل | `/` | صفحة التسجيل الرئيسية |
| استرجاع الدعوة | `/retrieve` | استرجاع بطاقة برقم الهاتف |
| عرض الدعوة | `/invitation/[id]` | عرض البطاقة مباشرة |
| الحضور (QR) | `/attendance` | مسح QR لموظف الاستقبال |
| لوحة الإدارة | `/admin` | تسجيل دخول المدير |
| الإحصائيات | `/admin/dashboard` | لوحة الإحصائيات |
| المشاركون | `/admin/attendees` | إدارة كاملة |
| الإعدادات | `/admin/settings` | إعدادات المؤتمر |

---

## 🌐 النشر على Vercel

```bash
# تثبيت Vercel CLI
npm i -g vercel

# النشر
vercel

# النشر للإنتاج
vercel --prod
```

**في لوحة Vercel، أضف متغيرات البيئة:**
Settings → Environment Variables → أضف جميع القيم من `.env.local`

---

## 🔒 الأمان

- لوحة الإدارة محمية بـ token مشفر (صالح 24 ساعة)
- API routes محمية بـ Authorization header
- قاعدة البيانات محمية بـ Row Level Security (RLS) في Supabase
- التحقق من المدخلات في كل API
- منع التسجيل المزدوج برقم الهاتف
- منع تسجيل الحضور مرتين بنفس الـ QR

---

## 🛠️ أوامر مفيدة

```bash
npm run dev      # تشغيل بيئة التطوير
npm run build    # بناء المشروع للإنتاج
npm run start    # تشغيل نسخة الإنتاج
npm run lint     # فحص الكود
```
