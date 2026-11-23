const globals = require("globals");

module.exports = [
  {
    ignores: ["extension/.setup-design-preview/**"]
  },
  {
    files: ["extension/**/*.js"],
    ignores: ["extension/i18n/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.browser,
        browser: "readonly",
        chrome: "readonly"
      }
    },
    rules: {
      "no-undef": "error"
    }
  },
  {
    files: ["extension/i18n/**/*.js", "scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.node
    },
    rules: {
      "no-undef": "error"
    }
  }
];
