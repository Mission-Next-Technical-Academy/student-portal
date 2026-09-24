# M360 gate regression check — Randy

## Fix

The browser regression check was targeting the wrong local server shape:

- old default: `http://127.0.0.1:4173/portal/m360/week.html`
- correct local target: `http://localhost:8768/m360/week.html`

The portal server serves `portal/` as its document root on port `8768`, so
`/portal` must not be repeated in the request path. The check still supports
`M360_TEST_BASE_URL` for CI or another test server.

## Scope

Only `tests/m360-runtime.spec.js` was changed. No M360 UI, backend, auth,
navigation, or data flow was modified.

## Run

With the portal serving on port `8768`:

```bash
M360_TEST_BASE_URL=http://localhost:8768 npx playwright test tests/m360-runtime.spec.js
```

The default now already resolves to `http://localhost:8768`, so the variable
can be omitted locally.
