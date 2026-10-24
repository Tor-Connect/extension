(() => {
  if (typeof browser === "undefined" || typeof browser.runtime?.getBrowserInfo !== "function") return;

  function localizeBrowserCopy(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement?.closest("script, style")) continue;
      if (node.nodeValue.includes("chrome://extensions")) {
        node.nodeValue = node.nodeValue.replaceAll("chrome://extensions", "about:debugging");
      }
      if (node.nodeValue.includes("Chrome")) node.nodeValue = node.nodeValue.replaceAll("Chrome", "Firefox");
    }
    if (root.nodeType === Node.ELEMENT_NODE) {
      for (const element of [root, ...root.querySelectorAll("*")]) {
        for (const attribute of ["aria-label", "title", "placeholder"]) {
          const value = element.getAttribute(attribute);
          if (!value) continue;
          const updated = value.replaceAll("Chrome", "Firefox").replaceAll("chrome://extensions", "about:debugging");
          if (updated !== value) element.setAttribute(attribute, updated);
        }
      }
    }
  }

  localizeBrowserCopy(document.body);
  new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === "characterData") localizeBrowserCopy(record.target.parentElement || document.body);
      else if (record.type === "attributes") localizeBrowserCopy(record.target);
      else record.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) localizeBrowserCopy(node);
      });
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "title", "placeholder"] });
})();
