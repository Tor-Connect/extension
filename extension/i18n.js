(() => {
  const languageKey = "torLanguage";
  const translations = window.torTranslations;

  let language = "en";

  // ---------------------------------------------------------------------------
  // t(key, params?) — core translation function
  //
  // Simple key:        t("Connect to Tor")
  // Named placeholder: t("Bridge {n}", { n: 3 })          → "Bridge 3"
  //                    t("Bridge {n} · {country}", { n, country })
  //
  // Falls back to the English key when no translation is found.
  // Firefox↔Chrome swap is preserved for Firefox builds.
  // ---------------------------------------------------------------------------
  function t(key, params) {
    const catalog = translations[language];
    let result = (catalog && catalog[key]) || key;

    // Firefox ↔ Chrome swap (Firefox build uses same catalog with Chrome keys)
    if (result === key && key.includes("Firefox")) {
      const chromeKey = key.replaceAll("Firefox", "Chrome");
      const chromeResult = catalog && catalog[chromeKey];
      if (chromeResult) result = chromeResult.replaceAll("Chrome", "Firefox");
    }

    // Named-placeholder substitution: {name} → params.name
    if (params) {
      result = result.replace(/\{(\w+)\}/g, (_, name) =>
        Object.prototype.hasOwnProperty.call(params, name) ? params[name] : `{${name}}`
      );
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // data-i18n — translate static HTML text nodes
  //
  // Any element with data-i18n has its trimmed textContent used as the key.
  // The English text stays in the HTML source; on load (and on language change)
  // we replace it with the translation.
  //
  //   <span data-i18n>Connect to Tor</span>
  //
  // For attributes, use data-i18n-title / data-i18n-aria-label etc:
  //   <button data-i18n-aria-label="Open settings">…</button>
  // ---------------------------------------------------------------------------
  const I18N_ATTRS = ["title", "aria-label", "aria-description", "placeholder", "alt"];

  function translateElement(el) {
    if (el.hasAttribute("data-i18n-html")) {
      const key = el.getAttribute("data-i18n-html");
      const translated = t(key);
      if (translated !== key) el.innerHTML = translated;
    }
    if (el.hasAttribute("data-i18n")) {
      const key = el.dataset.i18nKey || el.textContent.trim();
      if (!el.dataset.i18nKey) el.dataset.i18nKey = key;
      el.textContent = t(key);
    }
    for (const attr of I18N_ATTRS) {
      const dataAttr = `data-i18n-${attr}`;
      if (el.hasAttribute(dataAttr)) {
        el.setAttribute(attr, t(el.getAttribute(dataAttr)));
      }
    }
  }

  function translatePage() {
    document.querySelectorAll("[data-i18n-html], [data-i18n], " + I18N_ATTRS.map(a => `[data-i18n-${a}]`).join(", "))
      .forEach(translateElement);
  }

  // ---------------------------------------------------------------------------
  // MutationObserver — re-translate dynamically added [data-i18n] nodes
  // ---------------------------------------------------------------------------
  const observer = new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        if (node.hasAttribute?.("data-i18n-html") || node.hasAttribute?.("data-i18n") || I18N_ATTRS.some(a => node.hasAttribute?.(`data-i18n-${a}`))) {
          translateElement(node);
        }
        node.querySelectorAll?.("[data-i18n-html], [data-i18n], " + I18N_ATTRS.map(a => `[data-i18n-${a}]`).join(", "))
          .forEach(translateElement);
      }
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true });

  // ---------------------------------------------------------------------------
  // Language picker
  // ---------------------------------------------------------------------------
  const languageButton      = document.querySelector("#languageSelect");
  const languageMenu        = document.querySelector("#languageOptions");
  const languageOptions     = [...document.querySelectorAll("[data-language-option]")];
  const languageCurrent     = document.querySelector("#languageCurrent");
  const languageCurrentFlag = document.querySelector("#languageCurrentFlag");

  function updateLanguagePicker(open = false) {
    if (!languageButton || !languageMenu) return;
    languageButton.setAttribute("aria-expanded", String(open));
    languageButton.dataset.language = language;
    languageMenu.hidden = !open;
    let selectedOption = null;
    languageOptions.forEach((option) => {
      const selected = option.dataset.languageOption === language;
      option.setAttribute("aria-selected", String(selected));
      if (selected) selectedOption = option;
    });
    const selectedName = selectedOption?.querySelector(".language-option-name")?.textContent;
    const selectedFlag = selectedOption?.querySelector(".picker-code-badge, .language-flag")?.textContent;
    if (languageCurrent && selectedName && languageCurrent.textContent !== selectedName) {
      languageCurrent.textContent = selectedName;
    }
    if (languageCurrentFlag && selectedFlag && languageCurrentFlag.textContent !== selectedFlag) {
      languageCurrentFlag.textContent = selectedFlag;
    }
  }

  function applyLanguage(nextLanguage) {
    language = Object.hasOwn(translations, nextLanguage) ? nextLanguage : "en";
    document.documentElement.lang = language;
    document.documentElement.dir = ["fa", "ar", "ur"].includes(language) ? "rtl" : "ltr";
    document.documentElement.dataset.language = language;
    translatePage();
    updateLanguagePicker(false);
    document.dispatchEvent(new CustomEvent("tor-language-changed", { detail: { language } }));
  }

  function setLanguage(nextLanguage) {
    const selected = Object.hasOwn(translations, nextLanguage) ? nextLanguage : "en";
    applyLanguage(selected);
    chrome.storage.local.set({ [languageKey]: selected });
  }

  languageButton?.addEventListener("click", () => {
    const open = languageButton.getAttribute("aria-expanded") !== "true";
    updateLanguagePicker(open);
  });
  languageButton?.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    updateLanguagePicker(true);
    languageOptions.find((option) => option.dataset.languageOption === language)?.focus();
  });
  languageOptions.forEach((option, index) => {
    option.addEventListener("click", () => setLanguage(option.dataset.languageOption));
    option.addEventListener("keydown", (event) => {
      let targetIndex = null;
      if (event.key === "ArrowDown") targetIndex = (index + 1) % languageOptions.length;
      else if (event.key === "ArrowUp") targetIndex = (index - 1 + languageOptions.length) % languageOptions.length;
      else if (event.key === "Home") targetIndex = 0;
      else if (event.key === "End") targetIndex = languageOptions.length - 1;
      else if (event.key === "Escape") {
        event.preventDefault();
        updateLanguagePicker(false);
        languageButton?.focus();
      }
      if (targetIndex === null) return;
      event.preventDefault();
      languageOptions[targetIndex].focus();
    });
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".language-picker")) updateLanguagePicker(false);
  });

  chrome.storage.local.get(languageKey, (stored) => applyLanguage(stored?.[languageKey]));
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "local" && changes[languageKey]) applyLanguage(changes[languageKey].newValue);
  });

  globalThis.torI18n = {
    get language() { return language; },
    setLanguage,
    t,
  };
})();
