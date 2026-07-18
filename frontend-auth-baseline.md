# Frontend Auth Baseline

Task: A2-T1 - Inspect frontend routing, API service layer, auth state, styling, and test setup.

## Findings

- Login page: no login route or login page exists in the current app.
- Route ownership: `src/App.jsx` currently owns the top-level routes. A future login route should be added there, likely as `/login`.
- API integration point: `src/api/` is the existing client/service layer. New auth API code should live beside `registrationApi.js` and `usersApi.js`.
- Auth state: no shared auth state, session store, context, or protected-route pattern exists yet. Current screens are self-contained and use only local component state.
- Styling pattern: the app uses Vite + React + MUI with a shared theme in `src/main.jsx`, global styles in `src/index.css`, and page-specific layout/styles in feature components.
- Test setup: there is no test framework configured in `package.json`, and no `*.test.*` or `__tests__` files are present.

## Validation Commands Identified

- `npm run build`
- `npm run lint`

## Notes

- `package.json` does not currently define `typecheck` or `test` scripts.
- The frontend is already configured with `VITE_API_BASE_URL` support in the API layer.
