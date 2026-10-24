# Repository instructions

## UI themes

- When adding or changing UI, implement and review the result in both light and dark themes. Do not stop after styling the dark theme.
- Add theme-specific colors for every affected state and component, including status text, icons, backgrounds, borders, overlays, dialogs, hover/focus states, and disabled/loading states.
- Keep text and icons readable against each theme's background. Check the light and dark selectors together so later theme rules do not override the intended state colors.
- Before finishing UI work, inspect the light- and dark-theme rules for the changed components and confirm the two themes remain visually consistent with their existing palettes.

## Commit titles and pushes

- Use Conventional Commit titles for commits that will be pushed, because semantic-release determines releases from commit messages. Start titles with a recognized type such as `feat:`, `fix:`, `perf:`, `docs:`, `refactor:`, `test:`, `build:`, `ci:`, `chore:`, `style:`, or `revert:`; optional scopes are allowed, for example `feat(firefox): ...`.
- Use `feat` for a user-facing feature and `fix` for a bug fix. These prefixes trigger the expected minor and patch releases. Add `!` after the type or scope, or include a `BREAKING CHANGE:` footer, when a change is breaking.
