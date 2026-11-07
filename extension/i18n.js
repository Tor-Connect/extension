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

  // Allowed inline tags for data-i18n-html translations (tag → [allowed attrs]).
  const ALLOWED_TAGS = { strong: [], em: [], code: [], br: [], a: ["href", "target", "rel"] };

  function sanitizeHref(value) {
    const v = value.trim();
    if (v.startsWith("/") || v.startsWith("#")) return v;
    const lower = v.toLowerCase();
    if (lower.startsWith("http://") || lower.startsWith("https://") || lower.startsWith("mailto:")) return v;
    return null; // reject javascript:, data:, etc.
  }

  function sanitizeAttr(tagLC, attr, value) {
    if (tagLC === "a" && attr === "href") return sanitizeHref(value);
    if (tagLC === "a" && attr === "target") {
      const v = value.trim().toLowerCase();
      return (v === "_blank" || v === "_self") ? v : null;
    }
    if (tagLC === "a" && attr === "rel") return value.trim();
    return value;
  }

  // Regex that tokenises a restricted-HTML string into text runs and simple tags.
  // Matches either an opening tag with optional attrs, a closing tag, or a text chunk.
  // No innerHTML or DOMParser is used — the string is never interpreted as live HTML.
  const TAG_RE = /<(\/?)([\w]+)((?:\s+[\w-]+=(?:"[^"]*"|'[^']*'|[^\s>"']*))*)\s*\/?>|([^<]+)/g;

  function setTranslatedHTML(el, html) {
    const nodes = [];
    const stack = []; // tracks open allowed elements
    let match;
    TAG_RE.lastIndex = 0;
    while ((match = TAG_RE.exec(html)) !== null) {
      const [, slash, tagName, attrsStr, text] = match;
      if (text !== undefined) {
        // Plain text — append to current open element or root
        const tn = document.createTextNode(text);
        (stack[stack.length - 1] ?? { append: (n) => nodes.push(n) }).append(tn);
      } else if (!slash) {
        // Opening tag
        const tagLC = tagName.toLowerCase();
        const allowedAttrs = ALLOWED_TAGS[tagLC];
        if (allowedAttrs) {
          const el2 = document.createElement(tagLC);
          // Extract only explicitly allowed attributes via regex (no innerHTML)
          allowedAttrs.forEach((attr) => {
            const m = new RegExp(`\\s${attr}="([^"]*)"`, "i").exec(attrsStr);
            if (!m) return;
            const safeValue = sanitizeAttr(tagLC, attr, m[1]);
            if (safeValue !== null) el2.setAttribute(attr, safeValue);
          });
          // Ensure _blank links have a safe rel
          if (tagLC === "a" && el2.getAttribute("target") === "_blank" && !el2.hasAttribute("rel")) {
            el2.setAttribute("rel", "noopener noreferrer");
          }
          stack.push(el2);
          if (tagLC === "br") stack.pop(), nodes.push(el2);
        }
      } else {
        // Closing tag — pop stack and attach to parent or root
        const tagLC = tagName.toLowerCase();
        const idx = stack.map((e) => e.localName).lastIndexOf(tagLC);
        if (idx !== -1) {
          const closed = stack.splice(idx)[0];
          (stack[stack.length - 1] ?? { append: (n) => nodes.push(n) }).append(closed);
        }
      }
    }
    // Flush anything left open
    stack.forEach((e) => nodes.push(e));
    el.replaceChildren(...nodes);
  }

  function translateElement(el) {
    if (el.hasAttribute("data-i18n-html")) {
      const key = el.getAttribute("data-i18n-html");
      const translated = t(key);
      if (translated !== key) setTranslatedHTML(el, translated);
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
