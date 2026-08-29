import { initTheme } from "../../../scripts/theme.js";

initTheme();

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});