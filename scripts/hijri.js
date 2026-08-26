export const HIJRI_LIMITS = { min: -3, max: 3 };

/** Gregorian date shifted by the user's Hijri offset. */
export function hijriShiftedDate(date, adjustment = 0) {
  const d = new Date(date);
  d.setDate(d.getDate() + (adjustment ?? 0));
  return d;
}

export function formatHijriDate(date, adjustment = 0, locale = "en") {
  const shifted = hijriShiftedDate(date, adjustment);
  try {
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(shifted);
  } catch {
    return new Intl.DateTimeFormat("en-US-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(shifted);
  }
}

export function formatHijriOffset(adjustment = 0) {
  if (!adjustment) return "No adjustment";
  const abs = Math.abs(adjustment);
  return `${adjustment > 0 ? "+" : "\u2212"}${abs} day${abs !== 1 ? "s" : ""}`;
}
