import { initTheme } from "../../../scripts/theme.js";
import { getLanguage, applyTranslations } from "../../../scripts/translation.js";

initTheme();

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

(async () => applyTranslations(await getLanguage()))();