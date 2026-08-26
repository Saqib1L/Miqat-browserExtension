export const TRANSLATIONS = {
  en: {
    langName: "English",
    settingsTitle: "Settings",
    languageLabel: "Language",
    languageHint: "Choose how Miqat is displayed.",
    back: "Back",
    today: "Today",
    countdown: "{time} until {prayer}",
    locating: "Locating…",
    locationDenied: "Location unavailable",
    fajr: "Fajr",
    sunrise: "Sunrise",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha"
  },

  ar: {
    langName: "العربية",
    settingsTitle: "الإعدادات",
    languageLabel: "اللغة",
    languageHint: "اختر طريقة عرض ميقات.",
    back: "رجوع",
    today: "اليوم",
    countdown: "{time} حتى {prayer}",
    locating: "جارٍ تحديد الموقع…",
    locationDenied: "الموقع غير متاح",
    fajr: "الفجر",
    sunrise: "الشروق",
    dhuhr: "الظهر",
    asr: "العصر",
    maghrib: "المغرب",
    isha: "العشاء"
  },

  ur: {
    langName: "اردو",
    settingsTitle: "ترتیبات",
    languageLabel: "زبان",
    languageHint: "منتخب کریں کہ میقات کیسے دکھایا جائے۔",
    back: "واپس",
    today: "آج",
    countdown: "{prayer} تک {time}",
    locating: "مقام تلاش کیا جا رہا ہے…",
    locationDenied: "مقام دستیاب نہیں",
    fajr: "فجر",
    sunrise: "طلوع آفتاب",
    dhuhr: "ظہر",
    asr: "عصر",
    maghrib: "مغرب",
    isha: "عشاء"
  },

  fr: {
    langName: "Français",
    settingsTitle: "Paramètres",
    languageLabel: "Langue",
    languageHint: "Choisissez l'affichage de Miqat.",
    back: "Retour",
    today: "Aujourd'hui",
    countdown: "{time} avant {prayer}",
    locating: "Localisation…",
    locationDenied: "Position indisponible",
    fajr: "Fajr",
    sunrise: "Lever du soleil",
    dhuhr: "Dhuhr",
    asr: "Asr",
    maghrib: "Maghrib",
    isha: "Isha"
  },

  tr: {
    langName: "Türkçe",
    settingsTitle: "Ayarlar",
    languageLabel: "Dil",
    languageHint: "Miqat'ın nasıl görüntüleneceğini seçin.",
    back: "Geri",
    today: "Bugün",
    countdown: "{prayer} vaktine {time}",
    locating: "Konum bulunuyor…",
    locationDenied: "Konum kullanılamıyor",
    fajr: "İmsak",
    sunrise: "Güneş",
    dhuhr: "Öğle",
    asr: "İkindi",
    maghrib: "Akşam",
    isha: "Yatsı"
  },

  id: {
    langName: "Bahasa Indonesia",
    settingsTitle: "Pengaturan",
    languageLabel: "Bahasa",
    languageHint: "Pilih tampilan Miqat.",
    back: "Kembali",
    today: "Hari Ini",
    countdown: "{time} menuju {prayer}",
    locating: "Mencari lokasi…",
    locationDenied: "Lokasi tidak tersedia",
    fajr: "Subuh",
    sunrise: "Terbit",
    dhuhr: "Zuhur",
    asr: "Asar",
    maghrib: "Magrib",
    isha: "Isya"
  },

  ms: {
    langName: "Bahasa Melayu",
    settingsTitle: "Tetapan",
    languageLabel: "Bahasa",
    languageHint: "Pilih cara Miqat dipaparkan.",
    back: "Kembali",
    today: "Hari Ini",
    countdown: "{time} sebelum {prayer}",
    locating: "Mencari lokasi…",
    locationDenied: "Lokasi tidak tersedia",
    fajr: "Subuh",
    sunrise: "Syuruk",
    dhuhr: "Zohor",
    asr: "Asar",
    maghrib: "Maghrib",
    isha: "Isyak"
  },

  bn: {
    langName: "বাংলা",
    settingsTitle: "সেটিংস",
    languageLabel: "ভাষা",
    languageHint: "মিকাত কীভাবে দেখানো হবে তা বাছুন।",
    back: "ফিরে যান",
    today: "আজ",
    countdown: "{prayer} পর্যন্ত {time}",
    locating: "অবস্থান খোঁজা হচ্ছে…",
    locationDenied: "অবস্থান পাওয়া যায়নি",
    fajr: "ফজর",
    sunrise: "সূর্যোদয়",
    dhuhr: "যোহর",
    asr: "আসর",
    maghrib: "মাগরিব",
    isha: "এশা"
  }
};

export const RTL_LANGS = ["ar", "ur", "fa", "he"];
export const DEFAULT_LANG = "en";

const hasStorage =
  typeof chrome !== "undefined" &&
  chrome.storage &&
  chrome.storage.local;

export async function getLanguage() {
  if (!hasStorage) return DEFAULT_LANG;

  const { language } = await chrome.storage.local.get("language");

  return TRANSLATIONS[language] ? language : DEFAULT_LANG;
}

export async function setLanguage(lang) {
  if (!TRANSLATIONS[lang] || !hasStorage) return;

  await chrome.storage.local.set({ language: lang });
}

export function t(key, lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS[DEFAULT_LANG];

  return (
    dict[key] ??
    TRANSLATIONS[DEFAULT_LANG][key] ??
    key
  );
}

export function tf(key, lang, vars) {
  let out = t(key, lang);

  for (const [keyName, value] of Object.entries(vars)) {
    out = out.replaceAll(`{${keyName}}`, value);
  }

  return out;
}

export function applyTranslations(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = RTL_LANGS.includes(lang)
    ? "rtl"
    : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.dataset.i18n, lang);
  });

  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    el.title = t(el.dataset.i18nTitle, lang);
  });

  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    el.setAttribute(
      "aria-label",
      t(el.dataset.i18nAria, lang)
    );
  });
}