# Repository instructions

## UI themes

- When adding or changing UI, implement and review the result in both light and dark themes. Do not stop after styling the dark theme.
- Add theme-specific colors for every affected state and component, including status text, icons, backgrounds, borders, overlays, dialogs, hover/focus states, and disabled/loading states.
- Keep text and icons readable against each theme's background. Check the light and dark selectors together so later theme rules do not override the intended state colors.
- Before finishing UI work, inspect the light- and dark-theme rules for the changed components and confirm the two themes remain visually consistent with their existing palettes.

## Commit titles and pushes

- Use Conventional Commit titles for commits that will be pushed, because semantic-release determines releases from commit messages. Start titles with a recognized type such as `feat:`, `fix:`, `perf:`, `docs:`, `refactor:`, `test:`, `build:`, `ci:`, `chore:`, `style:`, or `revert:`; optional scopes are allowed, for example `feat(firefox): ...`.
- Use `feat` for a user-facing feature and `fix` for a bug fix. These prefixes trigger the expected minor and patch releases. Add `!` after the type or scope, or include a `BREAKING CHANGE:` footer, when a change is breaking.

## When in doubt, ask — do not improvise

- If a task has multiple valid approaches and the right choice is not obvious, **stop and ask** before writing any code. Do not pick one and proceed.
- Do not add unrequested logic, fallbacks, error handling, or behaviour changes while implementing something else. Every line written must trace directly to an explicit request.
- If a decision made earlier in a task turns out to be wrong or incomplete, surface the problem and ask how to fix it rather than silently patching it in a way that changes behaviour.

## Native helper platform matrix

- `native/tor-chrome-helper.py` is the source for **all three platforms**: deployed as a script on Linux and macOS, and compiled into `tor-chrome-helper.exe` via PyInstaller for Windows (see `installer/windows/build-installer.ps1`).
- `native/tor-chrome-helper.swift` is **macOS-only** (compiled into the macOS installer `.app`).
- Any change to bridge parsing or validation in the Python file covers Linux, macOS, and Windows.

## UI text and translations

- Any change that adds or modifies user-visible text (labels, descriptions, tooltips, button text, status messages, aria-labels) **must** also update `extension/i18n-translations.js`.
- Add the new English string as a key in every non-`en` language block that already exists in the file, with an accurate translation for each language.
- Do not leave a language block missing a key that other blocks have. The `en` block stays empty (English strings are used as keys directly).
- If a string is only used as an `aria-label` or `title` attribute and never rendered as visible text, it still requires translation entries.
