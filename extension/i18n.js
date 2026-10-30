(() => {
  const languageKey = "torLanguage";
  const translations = window.torTranslations;
  const dynamicTranslations = window.torDynamicTranslations;

  let language = "en";
  const textState = new WeakMap();
  const attributeState = new WeakMap();

  function translate(source) {
    const catalog = translations[language];
    if (!catalog) return source;
    const exact = catalog[source];
    if (exact) return exact;
    if (source.includes("Firefox")) {
      const chromeSource = source.replaceAll("Firefox", "Chrome");
      const chromeTranslation = catalog[chromeSource];
      if (chromeTranslation) return chromeTranslation.replaceAll("Chrome", "Firefox");
    }
    for (const [pattern, replace] of dynamicTranslations[language] || []) {
      const match = source.match(pattern);
      if (match) return replace(...match);
    }
    return source;
  }

  function isExcluded(node) {
    const parent = node.parentElement;
    return !parent || Boolean(parent.closest("script, style, pre, code, [data-no-translate]"));
  }

  function translateTextNode(node) {
    if (isExcluded(node)) return;
    const current = node.nodeValue;
    const previous = textState.get(node);
    const source = previous && current === previous.rendered ? previous.source : current;
    const leading = source.match(/^\s*/)?.[0] || "";
    const trailing = source.match(/\s*$/)?.[0] || "";
    const content = source.slice(leading.length, trailing ? -trailing.length : undefined);
    const rendered = leading + translate(content) + trailing;
    textState.set(node, { source, rendered });
    if (current !== rendered) node.nodeValue = rendered;
  }

  const translatableAttributes = ["title", "aria-label", "aria-description", "placeholder", "alt"];
  function translateAttributes(element) {
    const state = attributeState.get(element) || new Map();
    for (const name of translatableAttributes) {
      if (!element.hasAttribute(name)) continue;
      const current = element.getAttribute(name);
      const previous = state.get(name);
      const source = previous && current === previous.rendered ? previous.source : current;
      const rendered = translate(source);
      state.set(name, { source, rendered });
      if (current !== rendered) element.setAttribute(name, rendered);
    }
    attributeState.set(element, state);
  }

  function translateSubtree(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      translateTextNode(root);
      return;
    }
    if (root.nodeType === Node.ELEMENT_NODE) translateAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) translateTextNode(walker.currentNode);
    if (root.nodeType === Node.ELEMENT_NODE) {
      root.querySelectorAll("*").forEach(translateAttributes);
    }
  }

  const languageButton = document.querySelector("#languageSelect");
  const languageMenu = document.querySelector("#languageOptions");
  const languageOptions = [...document.querySelectorAll("[data-language-option]")];
  const languageCurrent = document.querySelector("#languageCurrent");
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
    document.documentElement.dir = ["fa", "ar"].includes(language) ? "rtl" : "ltr";
    document.documentElement.dataset.language = language;
    translateSubtree(document.documentElement);
    updateLanguagePicker(false);
    document.dispatchEvent(new CustomEvent("tor-language-changed", { detail: { language } }));
  }

  function setLanguage(nextLanguage) {
    const selected = Object.hasOwn(translations, nextLanguage) ? nextLanguage : "en";
    applyLanguage(selected);
    chrome.storage.local.set({ [languageKey]: selected });
  }

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") translateTextNode(record.target);
      else if (record.type === "attributes") translateAttributes(record.target);
      else record.addedNodes.forEach(translateSubtree);
    }
  });
  observer.observe(document.documentElement, {
    subtree: true,
    childList: true,
    characterData: true,
    attributes: true,
    attributeFilter: translatableAttributes
  });

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
    t: translate
  };
})();
