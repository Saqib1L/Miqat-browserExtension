import {
  TRANSLATIONS,
  RTL_LANGS,
  DEFAULT_LANG,
  getLanguage,
  setLanguage,
  applyTranslations,
} from "../../../scripts/translation.js";

const LANG_OPTIONS = ["en", "ar", "ur", "fr", "tr", "id", "ms", "bn"];

const group = document.getElementById("langGroup");
const backBtn = document.getElementById("backBtn");

const CHECK_SVG = `
  <svg
    class="option__check"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
`;

function renderOptions(active) {
  group.innerHTML = "";

  for (const code of LANG_OPTIONS) {
    const btn = document.createElement("button");

    btn.type = "button";
    btn.className = "option";
    btn.dataset.lang = code;
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", String(code === active));
    btn.tabIndex = code === active ? 0 : -1;

    const label = document.createElement("span");

    label.className = "option__native";
    label.textContent = TRANSLATIONS[code].langName;
    label.lang = code;
    label.dir = RTL_LANGS.includes(code) ? "rtl" : "ltr";

    btn.appendChild(label);
    btn.insertAdjacentHTML("beforeend", CHECK_SVG);

    group.appendChild(btn);
  }
}

async function selectLanguage(lang) {
  try {
    await setLanguage(lang);
    renderOptions(lang);
    applyTranslations(lang);
  } catch (err) {
    console.warn("Could not save language:", err);
  }
}

group.addEventListener("click", (event) => {
  const btn = event.target.closest(".option");

  if (!btn) return;

  if (btn.getAttribute("aria-checked") === "true") {
    return;
  }

  selectLanguage(btn.dataset.lang);
});

group.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "ArrowUp"].includes(event.key)) {
    return;
  }

  event.preventDefault();

  const currentBtn = group.querySelector('[aria-checked="true"]');

  if (!currentBtn) return;

  const current = LANG_OPTIONS.indexOf(currentBtn.dataset.lang);

  const step = event.key === "ArrowDown" ? 1 : -1;

  const next = (current + step + LANG_OPTIONS.length) % LANG_OPTIONS.length;

  selectLanguage(LANG_OPTIONS[next]).then(() => {
    const nextButton = group.children[next];

    if (!nextButton) return;

    nextButton.focus();
    nextButton.scrollIntoView({
      block: "nearest",
    });
  });
});

backBtn.addEventListener("click", () => {
  if (history.length > 1) {
    history.back();
    return;
  }

  window.location.href = chrome.runtime.getURL("pages/popup/popup.html");
});

async function applyTheme() {
  try {
    const { theme } = await chrome.storage.local.get("theme");

    document.body.dataset.theme = theme === "light" ? "light" : "dark";
  } catch {
    document.body.dataset.theme = "dark";
  }
}

async function init() {
  await applyTheme();

  try {
    const lang = await getLanguage();

    renderOptions(lang);
    applyTranslations(lang);
  } catch (err) {
    console.warn("Could not read saved language:", err);

    renderOptions(DEFAULT_LANG);
    applyTranslations(DEFAULT_LANG);
  }
}

init();
