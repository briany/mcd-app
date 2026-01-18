import "@testing-library/jest-dom/vitest";

// Provide a basic fetch mock fallback for tests that forget to stub it.
beforeEach(() => {
  vi.restoreAllMocks();
});
