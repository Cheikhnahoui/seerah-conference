'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type Lang = 'ar' | 'fr';

const translations = {
  ar: {
    // General
    bismillah: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
    lang_ar: 'العربية',
    lang_fr: 'Français',

    // Home page
    register_another: 'تسجيل مشارك آخر',
    footer_retrieve: 'استرجاع الدعوة',
    footer_reception: 'موظف الاستقبال',
    footer_admin: 'لوحة الإدارة',

    // Registration form
    register_now: 'سجّل الآن',
    register_subtitle: 'أدخل بياناتك للحصول على بطاقة دعوتك الإلكترونية',
    full_name: 'الاسم الكامل',
    full_name_placeholder: 'أدخل اسمك الكامل',
    full_name_error: 'الرجاء إدخال الاسم الكامل (3 أحرف على الأقل)',
    phone: 'رقم الهاتف',
    phone_example: 'مثال: 49717504',
    phone_error: 'رقم هاتف موريتاني غير صالح',
    city: 'المدينة / الولاية',
    city_optional: '(اختياري)',
    city_placeholder: 'أدخل مدينتك أو ولايتك...',
    occupation: 'الصفة أو الوظيفة',
    occupation_placeholder: 'مثال: طالب، دكتور، أستاذ...',
    submit: 'الحصول على بطاقة الدعوة',
    submitting: 'جاري التسجيل...',
    slogan: 'معًا لنصرة الحبيب المصطفى ﷺ، وترسيخ محبته في القلوب، ونصرة الأشقاء في فلسطين',
    error_connection: 'حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى',

    // Invitation card
    success_registered: 'تم التسجيل بنجاح!',
    card_ready: 'بطاقة دعوتك جاهزة للتحميل',
    honor_text: 'تحت الرعاية السامية لفخامة رئيس الجمهورية السيد محمد ولد الشيخ الغزواني، يتشرف فضيلة الشيخ محمد الحافظ النحوي رئيس التجمع الثقافي الإسلامي بدعوة\u00A0:',
    invitation_title: '',
    invitation_body: 'لحضور افتتاح المؤتمر الدولي الـ 39 لسيرة ونصرة الحبيب المصطفى صلى الله عليه وسلم',
    opening: 'الافتتاح',
    closing: 'الأمسية الختامية الكبرى',
    location_label: 'المكان',
    datetime_label: 'الزمان والتوقيت',
    location_value: 'ساحة الولاية\n(كرفور المعرض)',
    datetime_value: 'مساء الأحد القادم\n16 أغسطس - السابعة مساءً',
    qr_title: 'بطاقة الدخول الإلكترونية',
    qr_scan: 'امسح رمز QR عند الدخول',
    download_png: 'تحميل PNG',
    download_pdf: 'تحميل PDF',
    downloading: 'جاري التحميل...',
    card_footer: 'معًا لنصرة الحبيب المصطفى ﷺ، وترسيخ محبته في القلوب، ونصرة الأشقاء في فلسطين',

    // Retrieve page
    retrieve_title: 'استرجاع بطاقة الدعوة',
    retrieve_subtitle: 'أدخل رقم هاتفك الموريتاني لاسترجاع بطاقة دعوتك',
    retrieve_phone_label: 'رقم الهاتف المسجل',
    retrieve_search: 'بحث عن دعوتي',
    retrieve_searching: 'جاري البحث...',
    retrieve_not_found: 'لم يتم العثور على تسجيل بهذا الرقم',
    retrieve_error: 'حدث خطأ أثناء البحث',
    retrieve_another: 'البحث برقم آخر',
    back_home: 'العودة للصفحة الرئيسية',
  },
  fr: {
    // General
    bismillah: 'Au nom d\'Allah, le Tout Miséricordieux',
    lang_ar: 'العربية',
    lang_fr: 'Français',

    // Home page
    register_another: 'Inscrire un autre participant',
    footer_retrieve: 'Récupérer l\'invitation',
    footer_reception: 'Agent d\'accueil',
    footer_admin: 'Administration',

    // Registration form
    register_now: 'S\'inscrire',
    register_subtitle: 'Entrez vos informations pour obtenir votre carte d\'invitation électronique',
    full_name: 'Nom complet',
    full_name_placeholder: 'Entrez votre nom complet',
    full_name_error: 'Veuillez entrer votre nom complet (au moins 3 caractères)',
    phone: 'Numéro de téléphone',
    phone_example: 'Exemple: 49717504',
    phone_error: 'Numéro de téléphone mauritanien invalide',
    city: 'Ville / Wilaya',
    city_optional: '(optionnel)',
    city_placeholder: 'Entrez votre ville ou wilaya...',
    occupation: 'Fonction ou profession',
    occupation_placeholder: 'Ex: étudiant, docteur, professeur...',
    submit: 'Obtenir la carte d\'invitation',
    submitting: 'Inscription en cours...',
    slogan: 'Ensemble pour l\'amour du Prophète ﷺ et la solidarité avec nos frères en Palestine',
    error_connection: 'Erreur de connexion, veuillez réessayer',

    // Invitation card
    success_registered: 'Inscription réussie !',
    card_ready: 'Votre carte d\'invitation est prête à télécharger',
    honor_text: 'Cheikh Mohamed Al-Hafidh An-Nahoui a l\'honneur de vous inviter',
    invitation_title: 'Chers amis du Prophète ﷺ',
    invitation_body: "Vous êtes invités à une soirée de louanges sous le patronage du Maire d'Arafat, dans le cadre de la saison de la Sîra organisée par le Groupement Culturel Islamique, à l'occasion de la commémoration de la naissance du Prophète de la miséricorde Muhammad ﷺ.",
    opening: 'Ouverture',
    closing: 'Grande Soirée de Clôture',
    location_label: 'Lieu',
    datetime_label: 'Date et Heure',
    location_value: 'Place de la Wilaya\n(Carrefour de l\'Exposition)',
    datetime_value: 'Dimanche soir prochain\n16 août - 19h00',
    qr_title: 'Carte d\'entrée électronique',
    qr_scan: 'Scannez le QR code à l\'entrée',
    download_png: 'Télécharger PNG',
    download_pdf: 'Télécharger PDF',
    downloading: 'Téléchargement...',
    card_footer: 'Ensemble pour l\'amour du Prophète ﷺ et la solidarité avec nos frères en Palestine',

    // Retrieve page
    retrieve_title: 'Récupérer la carte d\'invitation',
    retrieve_subtitle: 'Entrez votre numéro mauritanien pour récupérer votre carte',
    retrieve_phone_label: 'Numéro de téléphone enregistré',
    retrieve_search: 'Rechercher mon invitation',
    retrieve_searching: 'Recherche en cours...',
    retrieve_not_found: 'Aucune inscription trouvée avec ce numéro',
    retrieve_error: 'Erreur lors de la recherche',
    retrieve_another: 'Rechercher avec un autre numéro',
    back_home: 'Retour à la page d\'accueil',
  },
};

export type TranslationKey = keyof typeof translations.ar;

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}>({
  lang: 'ar',
  setLang: () => {},
  t: (key) => translations.ar[key],
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('ar');
  const t = (key: TranslationKey) => translations[lang][key] ?? translations.ar[key];
  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}

export function LangToggle() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="flex justify-center gap-2">
      <button
        onClick={() => setLang('ar')}
        className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
        style={{
          background: lang === 'ar' ? '#1a5c1a' : 'rgba(26,92,26,0.1)',
          color: lang === 'ar' ? '#fff' : '#1a5c1a',
          border: '1.5px solid #1a5c1a',
        }}>
        {t('lang_ar')}
      </button>
      <button
        onClick={() => setLang('fr')}
        className="px-4 py-1.5 rounded-lg text-sm font-bold transition-all"
        style={{
          background: lang === 'fr' ? '#1a5c1a' : 'rgba(26,92,26,0.1)',
          color: lang === 'fr' ? '#fff' : '#1a5c1a',
          border: '1.5px solid #1a5c1a',
        }}>
        {t('lang_fr')}
      </button>
    </div>
  );
}