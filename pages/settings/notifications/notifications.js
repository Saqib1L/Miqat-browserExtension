import { initTheme } from "../../../scripts/theme.js";
import {
  NOTIFIABLE_PRAYERS,
  LEAD_TIMES,
  getNotificationSettings,
  updateNotificationSettings,
} from "../../../scripts/notification-settings.js";

initTheme();

const masterToggle = document.getElementById("masterToggle");
const detailSection = document.getElementById("detailSection");
const prayerToggles = document.getElementById("prayerToggles");
const leadTimeGroup = document.getElementById("leadTimeGroup");

document.getElementById("backBtn").addEventListener("click", () => {
  window.location.href = "../settings.html";
});

const CHECK_SVG = `<svg class="option__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

function leadTimeLabel(minutes) {
  return minutes === 0 ? "At prayer time" : `${minutes} minutes before`;
}

function renderPrayerToggles(prayers) {
  prayerToggles.innerHTML = "";
  for (const { key, label } of NOTIFIABLE_PRAYERS) {
    const row = document.createElement("div");
    row.className = "toggle-row";
    row.innerHTML = `
      <span class="toggle-row__label">${label}</span>
      <label class="toggle">
        <input type="checkbox" data-prayer="${key}" ${prayers[key] ? "checked" : ""}>
        <span class="toggle__track"></span>
      </label>`;
    prayerToggles.appendChild(row);
  }
}

function renderLeadTimes(active) {
  leadTimeGroup.innerHTML = "";
  for (const minutes of LEAD_TIMES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "option";
    btn.dataset.value = String(minutes);
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(minutes === active));

    const inner = document.createElement("span");
    inner.className = "option__native";
    inner.textContent = leadTimeLabel(minutes);

    btn.appendChild(inner);
    btn.insertAdjacentHTML("beforeend", CHECK_SVG);
    leadTimeGroup.appendChild(btn);
  }
}

function applyEnabledState(enabled) {
  detailSection.style.opacity = enabled ? "1" : "0.4";
  detailSection.style.pointerEvents = enabled ? "" : "none";
  detailSection.setAttribute("aria-disabled", String(!enabled));
}

async function requestPermission() {
  if (!chrome.permissions) return true;
  return new Promise((resolve) => {
    chrome.notifications.getPermissionLevel((level) => {
      resolve(level === "granted");
    });
  });
}

masterToggle.addEventListener("change", async () => {
  const enabled = masterToggle.checked;

  if (enabled) {
    const granted = await requestPermission();
    if (!granted) {
      masterToggle.checked = false;
      applyEnabledState(false);
      alert("Notifications are blocked for this browser. Enable them in your browser and system notification settings, then try again.");
      return;
    }
  }

  applyEnabledState(enabled);
  await updateNotificationSettings({ enabled });
});

prayerToggles.addEventListener("change", async (e) => {
  const input = e.target.closest("input[data-prayer]");
  if (!input) return;
  await updateNotificationSettings({ prayers: { [input.dataset.prayer]: input.checked } });
});

leadTimeGroup.addEventListener("click", async (e) => {
  const btn = e.target.closest(".option");
  if (!btn || btn.getAttribute("aria-checked") === "true") return;
  const minutes = Number(btn.dataset.value);
  await updateNotificationSettings({ leadTime: minutes });
  renderLeadTimes(minutes);
});

(async function init() {
  const settings = await getNotificationSettings();
  masterToggle.checked = settings.enabled;
  applyEnabledState(settings.enabled);
  renderPrayerToggles(settings.prayers);
  renderLeadTimes(settings.leadTime);
})();