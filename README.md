# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

## Install

Install Node.js and npm, then open a terminal in the project root (the directory containing `package.json`) and install the dependencies:

```sh
npm ci
```

## Run locally

Start the development server:

```sh
npm run dev
```

Open the URL printed in the terminal (usually `http://localhost:5173`). The page reloads automatically when you edit the source files. Press `Ctrl+C` in the terminal to stop the server.

The frontend sends `/api` requests to the backend at `http://127.0.0.1:5249` through the development proxy. Start the backend separately to use registration and user management. To use a different backend address, create a `.env.local` file in the project root:

```dotenv
VITE_API_PROXY_TARGET=http://127.0.0.1:5249
```

Restart the development server after changing environment variables.

## Build

Create a production build:

```sh
npm run build
```

The generated files are written to `dist/`.

## Preview the build

After building, serve the production output locally:

```sh
npm run preview
```

Open the URL printed in the terminal (usually `http://localhost:4173`). Preview is for checking the build locally. The development API proxy does not apply to preview or production hosting; configure your host to forward `/api` to the backend, or set `VITE_API_BASE_URL` to the backend URL in `.env.local` before building. A backend on a different origin must allow requests from the frontend through CORS.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Smoke Validation

This repository does not currently include a UI test harness, so the registration page is validated with build/lint checks and manual smoke review.

- `npm run lint`
- `npm run build`

Manual checks to run in the browser:

- Load the registration page and confirm the layout renders cleanly on a narrow mobile viewport and a wide desktop viewport.
- Submit valid data and confirm the loading state and success feedback appear.
- Submit missing or invalid values and confirm inline field errors appear.
- Submit a duplicate email against the backend and confirm the conflict message is shown without breaking the form.
