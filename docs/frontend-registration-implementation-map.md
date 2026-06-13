# Frontend Registration Implementation Map

Current repo state:

- `src/App.jsx` is the entire application UI today.
- `src/main.jsx` mounts `<App />` directly with no router or provider tree.
- `src/index.css` and `src/App.css` hold all styling; there is no theme layer yet.
- `vite.config.js` has no dev proxy configuration.
- `package.json` has `dev`, `build`, `lint`, and `preview` scripts, but no test script.
- The project currently depends only on `react` and `react-dom`; MUI is not installed yet.

Planned insertion points:

- Registration page and form shell: `src/App.jsx` initially, or a future route component if routing is introduced.
- Shared MUI primitives: `src/components/common/*` or equivalent shared UI folder.
- API helper: `src/api/*` or equivalent central client module.
- Dev proxy: `vite.config.js`.
- Provider/theme setup, if added later: `src/main.jsx` plus a new theme/provider module under `src/theme/*`.

Observed structure constraints:

- There is no existing router, so adding route navigation will require a routing decision before feature decomposition.
- There is no shared component library yet, so the registration form will need a new common-component layer before page composition.
- There is no backend contract file in this repo, so the request payload and response shape must be imported from the backend handoff before the form is finalized.

