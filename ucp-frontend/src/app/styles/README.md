# CSS Structure (Professional + maintainable)

This project keeps legacy visual design but organizes styles by responsibility.

## Folders

- `base/`
  - `globals.css`: reset, variables, global utilities, global imports.
- `components/`
  - `app-ui.css`: entry point for application UI styles.
  - `app-ui-01-layout-table.css`: dashboard/table/layout core.
  - `app-ui-02-nav-shell.css`: shell/top navigation/theme hard-fixes.
  - `app-ui-03-form-overrides.css`: formulaire/table action/modal overrides.
  - `app-ui-04-status-login.css`: status pills + login-specific styles.
- `pages/`
  - `dashboard.css`: dashboard page-specific visualizations.

## Import flow

1. `src/app/layout.tsx` imports `styles/base/globals.css`
2. `globals.css` imports `../components/app-ui.css`
3. `app-ui.css` imports component chunks in fixed order
4. `dashboard/page.tsx` imports `styles/pages/dashboard.css`

## Editing rules

- If change affects all pages: edit `base/globals.css`.
- If change affects shared UI (header/table/modal/sidebar): edit `components/*`.
- If change affects dashboard only: edit `pages/dashboard.css`.
- Keep selector order stable to avoid cascade regressions.
- Prefer adding small, scoped blocks over appending random overrides.
