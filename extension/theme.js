const themeChoices = [...document.querySelectorAll("[data-theme-choice]")];
const themePreferenceKey = "torTheme";
const systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let savedThemePreference = "dark";

function applyTheme(theme) {
  savedThemePreference = ["light", "dark", "system"].includes(theme) ? theme : "dark";
  const resolvedTheme = savedThemePreference === "system"
    ? systemThemeQuery.matches ? "dark" : "light"
    : savedThemePreference;
  document.documentElement.dataset.theme = resolvedTheme;
  themeChoices.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === savedThemePreference));
  });
  document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
    const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
    button.setAttribute("aria-label", `Switch to ${nextTheme} theme`);
    button.title = `Switch to ${nextTheme} theme`;
  });
}

chrome.storage.local.get(themePreferenceKey, (stored) => {
  applyTheme(stored?.[themePreferenceKey]);
});

themeChoices.forEach((button) => {
  button.addEventListener("click", () => {
    const theme = button.dataset.themeChoice;
    applyTheme(theme);
    chrome.storage.local.set({ [themePreferenceKey]: theme });
  });
});

document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(theme);
    chrome.storage.local.set({ [themePreferenceKey]: theme });
  });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[themePreferenceKey]) return;
  applyTheme(changes[themePreferenceKey].newValue);
});

systemThemeQuery.addEventListener("change", () => {
  if (savedThemePreference === "system") applyTheme("system");
});
