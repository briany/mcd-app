# Repository Guidelines

## Project Structure & Module Organization
- `apps/web`: Next.js 16 + TypeScript web app (`src/app`, `src/components`, `src/hooks`, `src/lib`).
- `apps/ios/MCD-iOS`: iOS SwiftUI app (Xcode project).
- `apps/macos/MCD-macOS`: macOS SwiftUI app (Swift Package).
- `packages/MCDCore`: shared models, services, and view models.
- `packages/MCDSharedUI`: shared SwiftUI components.
- `docs/`: architecture and developer guides.

## Build, Test, and Development Commands
- Web:
  - `cd apps/web && npm install`
  - `npm run dev` (local server)
  - `npm run lint` (ESLint, zero warnings)
  - `npm test` (Vitest unit tests)
  - `npm run test:e2e` (Playwright E2E)
  - `npm run build` (production build)
- Shared Swift packages:
  - `swift test --package-path packages/MCDCore`
  - `swift test --package-path packages/MCDSharedUI`
- macOS app: `swift build --package-path apps/macos/MCD-macOS`
- iOS app: `xcodebuild build -project apps/ios/MCD-iOS/MCD-iOS.xcodeproj -scheme MCD-iOS -destination 'generic/platform=iOS Simulator'`

## Coding Style & Naming Conventions
- TypeScript/React: 2-space indentation, strict TypeScript, ES modules, `PascalCase` components, `camelCase` functions/variables, hooks named `useX`.
- Swift: 4-space indentation, `PascalCase` types, `camelCase` members.
- Prefer shared logic in `packages/MCDCore` and shared UI in `packages/MCDSharedUI` before app-specific duplication.
- Pre-commit hook runs `lint-staged` in `apps/web` (`eslint --fix` + related Vitest tests on changed `*.ts`/`*.tsx`).

## Testing Guidelines
- Web unit/component/lib tests: `apps/web/tests/**/*.test.ts(x)`.
- Web E2E tests: `apps/web/e2e/*.spec.ts`.
- Swift tests: `packages/*/Tests/*Tests`.
- Add or update tests with behavior changes; keep live API tests skipped by default unless intentionally enabled.
- Before PR: ensure CI-critical checks pass (Swift package tests, iOS/macOS build, web lint, unit tests, E2E, and build).

## Commit & Pull Request Guidelines
- Follow Conventional Commits used in history: `feat(web): ...`, `fix(ios): ...`, `chore: ...`.
- Keep commits focused; reference issue/PR IDs when relevant (for example, `Fixes #27` or `(#27)`).
- PRs should include:
  - short summary and affected area(s): `web`, `ios`, `macos`, `core`, or `shared-ui`
  - test evidence (commands run)
  - screenshots for UI changes
  - notes for config/auth/security changes

## Security & Configuration Tips
- Never commit secrets (`.env.local`, token values, real `Config.plist` credentials).
- For web, keep MCP token usage server-side (API routes) and do not expose `MCD_MCP_TOKEN` to client code.
