This Next.js workspace mirrors the functionality of the macOS and iOS MCP clients, providing a browser UI for coupons, campaigns, and discovery flows.

## Setup

```bash
cd web
nvm use   # installs/uses Node 20.11.1 per .nvmrc
npm install
```

Environment variables live in `.env.local` (see `.env.example`, added later in the plan). The development server runs with:

```bash
npm run dev
```

Other useful scripts:

- `npm run lint` – Next.js + ESLint rules
- `npm run test` / `npm run test:watch` – Vitest unit tests
- `npm run test:e2e` – Playwright smoke suite

## Development Notes

- The project uses the App Router and colocated route directories inside `src/app`.
- Tailwind CSS is configured globally in `src/app/globals.css`.
- MCP API tokens stay server-side; never expose `MCD_MCP_TOKEN` to the client bundle.
