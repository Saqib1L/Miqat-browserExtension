export const CALCULATION_METHODS = [
  { value: "Auto",   label: "Auto Detect", description: "Pick the method used in your region automatically." },
  { value: "MuslimWorldLeague", label: "Muslim World League", adhan: "MuslimWorldLeague", fajrAngle: 18, ishaAngle: 17 },
  { value: "Egyptian", label: "Egyptian General Authority of Survey", adhan: "Egyptian", fajrAngle: 19.5, ishaAngle: 17.5 },
  { value: "Karachi", label: "University of Islamic Sciences, Karachi", adhan: "Karachi", fajrAngle: 18, ishaAngle: 18 },
  { value: "UmmAlQura", label: "Umm Al-Qura University, Makkah", adhan: "UmmAlQura", fajrAngle: 18.5, ishaInterval: 90 },
  { value: "Dubai", label: "Dubai", adhan: "Dubai", fajrAngle: 18.2, ishaAngle: 18.2 },
  { value: "Qatar", label: "Qatar", adhan: "Qatar", fajrAngle: 18, ishaInterval: 90 },
  { value: "Kuwait", label: "Kuwait", adhan: "Kuwait", fajrAngle: 18, ishaAngle: 17.5 },
  { value: "Gulf", label: "Gulf Region", fajrAngle: 19.5, ishaInterval: 90 },
  { value: "MoonsightingCommittee", label: "Moonsighting Committee Worldwide", adhan: "MoonsightingCommittee", fajrAngle: 18, ishaAngle: 18 },
  { value: "NorthAmerica", label: "Islamic Society of North America (ISNA)", adhan: "NorthAmerica", fajrAngle: 15, ishaAngle: 15 },
  { value: "Singapore", label: "Majlis Ugama Islam Singapura", adhan: "Singapore", fajrAngle: 20, ishaAngle: 18 },
  { value: "Malaysia", label: "JAKIM, Malaysia", fajrAngle: 20, ishaAngle: 18 },
  { value: "Indonesia", label: "Kemenag, Indonesia", fajrAngle: 20, ishaAngle: 18 },
  { value: "Turkey", label: "Diyanet, Turkey", adhan: "Turkey", fajrAngle: 18, ishaAngle: 17 },
  { value: "Tehran", label: "Institute of Geophysics, Tehran", adhan: "Tehran", fajrAngle: 17.7, ishaAngle: 14 },
  { value: "Jordan", label: "Ministry of Awqaf, Jordan", fajrAngle: 18, ishaAngle: 18 },
  { value: "Morocco", label: "Ministry of Habous, Morocco", fajrAngle: 19, ishaAngle: 17 },
  { value: "Tunisia", label: "Ministry of Religious Affairs, Tunisia", fajrAngle: 18, ishaAngle: 18 },
  { value: "Algeria", label: "Ministry of Religious Affairs, Algeria", fajrAngle: 18, ishaAngle: 17 },
  { value: "Libya", label: "Ministry of Endowments, Libya", fajrAngle: 19.5, ishaAngle: 17.5 },
  { value: "France12", label: "UOIF, France (12\u00b0)", fajrAngle: 12, ishaAngle: 12 },
  { value: "France15", label: "Grande Mosqu\u00e9e de Paris (15\u00b0)", fajrAngle: 15, ishaAngle: 15 },
  { value: "Russia", label: "Spiritual Administration of Muslims, Russia", fajrAngle: 16, ishaAngle: 15 },
  { value: "Custom", label: "Custom Angles", description: "Use the Fajr and Isha angles you set in Custom Angles." },
];

export const CALCULATION_METHOD_DEFAULT = "MuslimWorldLeague";

export function findMethod(value) {
  return (
    CALCULATION_METHODS.find((m) => m.value === value) ??
    CALCULATION_METHODS.find((m) => m.label === value) ??
    null
  );
}

/** Region-based auto detection from stored coordinates. */
export function detectMethod(location) {
  if (!location || typeof location.latitude !== "number") return CALCULATION_METHOD_DEFAULT;
  const lat = location.latitude;
  const lon = location.longitude;
  const inBox = (la1, la2, lo1, lo2) => lat >= la1 && lat <= la2 && lon >= lo1 && lon <= lo2;

  if (inBox(22.5, 26.5, 51.5, 56.5)) return "Dubai";
  if (inBox(24.4, 26.3, 50.7, 51.7)) return "Qatar";
  if (inBox(28.5, 30.2, 46.5, 48.5)) return "Kuwait";
  if (inBox(15.5, 32.5, 34.0, 55.7)) return "UmmAlQura";
  if (inBox(25.5, 42.0, 44.0, 63.5)) return "Tehran";
  if (inBox(35.5, 42.5, 25.5, 45.0)) return "Turkey";
  if (inBox(21.5, 32.0, 24.5, 37.0)) return "Egyptian";
  if (inBox(27.5, 34.0, 34.5, 39.5)) return "Jordan";
  if (inBox(27.0, 36.5, 8.0, 12.0)) return "Tunisia";
  if (inBox(19.0, 34.0, -13.5, -1.0)) return "Morocco";
  if (inBox(19.0, 37.5, -1.0, 8.0)) return "Algeria";
  if (inBox(19.0, 33.5, 12.0, 25.0)) return "Libya";
  if (inBox(5.0, 37.5, 60.5, 92.5)) return "Karachi";
  if (inBox(-11.5, 6.5, 94.5, 141.5)) return "Indonesia";
  if (inBox(0.5, 7.5, 99.0, 120.0)) return "Malaysia";
  if (inBox(1.0, 1.6, 103.5, 104.2)) return "Singapore";
  if (inBox(41.0, 82.0, 19.0, 180.0)) return "Russia";
  if (inBox(41.0, 52.0, -5.5, 9.6)) return "France15";
  if (inBox(14.0, 72.0, -170.0, -50.0)) return "NorthAmerica";
  return CALCULATION_METHOD_DEFAULT;
}

export const MADHAB_OPTIONS = [
  { value: "Shafi", label: "Standard (Shafi'i, Maliki, Hanbali)" },
  { value: "Hanafi", label: "Hanafi" },
];

export const HIGH_LATITUDE_RULES = [
  { value: "None", label: "None", description: "No adjustment applied." },
  { value: "NightMiddle", label: "Middle of the Night", description: "Prayer times based on the middle of the night." },
  { value: "SeventhOfNight", label: "Seventh of the Night", description: "Prayer times based on a seventh of the night." },
  { value: "TwilightAngle", label: "Twilight Angle", description: "Prayer times based on the twilight angle." },
];

export const PRAYERS_WITH_ADJUSTMENTS = [
  { key: "fajr", label: "Fajr" },
  { key: "sunrise", label: "Sunrise" },
  { key: "dhuhr", label: "Dhuhr" },
  { key: "asr", label: "Asr" },
  { key: "maghrib", label: "Maghrib" },
  { key: "isha", label: "Isha" },
];

export const ANGLE_LIMITS = { min: 8, max: 25, step: 0.5 };

export const DEFAULT_SETTINGS = {
  calculationMethod: "Auto",
  madhab: "Shafi",
  highLatitudeRule: "None",
  hijriAdjustment: 0,
  customAngles: {
    auto: true,
    fajrAngle: 18,
    ishaAngle: 17,
  },
  notifications: {
    fajr: true,
    sunrise: false,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  },
  prayerAdjustments: {
    fajr: 0,
    sunrise: 0,
    dhuhr: 0,
    asr: 0,
    maghrib: 0,
    isha: 0,
  },
};
