# Testing Guide

## Testing Strategy

MCD-App uses a comprehensive testing approach across all platforms:

- **Unit Tests:** Test individual components in isolation
- **Integration Tests:** Test component interactions
- **E2E Tests:** Test complete user workflows (web app only)

## Swift Package Tests

### MCDCore Package Tests

Location: `packages/MCDCore/Tests/MCDCoreTests/`

**Running Tests:**
```bash
cd packages/MCDCore
swift test
```

**Test Suites:**

1. **ModelTests.swift** - Data model encoding/decoding
   ```swift
   func testCouponDecoding() throws
   func testCampaignDecoding() throws
   ```

2. **MCPClientTests.swift** - Error handling
   ```swift
   func testMCPErrorDescription()
   ```

3. **ViewModelTests.swift** - ViewModel initialization
   ```swift
   @MainActor func testCouponViewModelInitialState()
   @MainActor func testCampaignViewModelInitialState()
   ```
   *Note:* These tests are skipped by default (require MCP token)

4. **IntegrationTests.swift** - Live API calls
   ```swift
   func testMCPClientCanMakeRequests() async throws
   ```
   *Note:* Skipped by default to avoid hitting live API

**Test Output:**
```
Test Suite 'MCDCorePackageTests.xctest' started
Test Suite 'ModelTests' passed
  ✓ testCouponDecoding (0.001 seconds)
  ✓ testCampaignDecoding (0.001 seconds)
Test Suite 'MCPClientTests' passed
  ✓ testMCPErrorDescription (0.001 seconds)
Test Suite 'ViewModelTests' passed
  ⊘ testCouponViewModelInitialState (skipped)
  ⊘ testCampaignViewModelInitialState (skipped)
Executed 3 tests, with 2 skipped and 0 failures
```

### MCDSharedUI Package Tests

Location: `packages/MCDSharedUI/Tests/MCDSharedUITests/`

Currently minimal - relies on app-level UI testing.

**Running Tests:**
```bash
cd packages/MCDSharedUI
swift test
```

## macOS App Tests

**Running Tests:**
```bash
cd apps/macos/MCD-macOS
swift test
```

Tests were moved to MCDCore package (see above).

## iOS App Tests

**Running Tests in Xcode:**
1. Open `apps/ios/MCD-iOS/MCD-iOS.xcodeproj`
2. Press Cmd+U to run tests
3. Or: Product → Test

Tests link to MCDCore package tests.

## Web App Tests

### Unit Tests (Vitest)

Location: `apps/web/tests/`

**Running Tests:**
```bash
cd apps/web
npm test              # Run once
npm run test:watch    # Watch mode
```

**Test Files:**
- `tests/components/CouponCard.test.tsx` - Component rendering
- `tests/hooks/useCoupons.test.ts` - Custom hooks
- `tests/setup.ts` - Test configuration

**Example Output:**
```
 ✓ tests/components/CouponCard.test.tsx (2)
   ✓ renders coupon information
   ✓ displays expiry warning for expiring coupons
 ✓ tests/hooks/useCoupons.test.ts (1)
   ✓ fetches coupons on mount

Tests: 3 passed (3)
```

### E2E Tests (Playwright)

Location: `apps/web/e2e/`

**Running E2E Tests:**
```bash
cd apps/web
npm run test:e2e              # Headless
npm run test:e2e:ui           # Interactive UI
npm run test:e2e:debug        # Debug mode
```

**Test Files:**
- `e2e/coupons.spec.ts` - Coupon management workflows

**Example:**
```typescript
test('displays coupons list', async ({ page }) => {
  await page.goto('/coupons');
  await expect(page.getByRole('heading', { name: 'My Coupons' })).toBeVisible();
});
```

## Writing Tests

### Swift Unit Test Template

```swift
import XCTest
@testable import MCDCore

final class MyTests: XCTestCase {
    func testSomething() throws {
        // Arrange
        let input = "test"

        // Act
        let result = myFunction(input)

        // Assert
        XCTAssertEqual(result, "expected")
    }
}
```

### Swift Async Test Template

```swift
func testAsync() async throws {
    let result = try await asyncFunction()
    XCTAssertNotNil(result)
}
```

### Web Component Test Template

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '@/components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Test Configuration

### Skipping Tests

**Swift:**
```swift
func testLiveAPI() async throws {
    try XCTSkipIf(true, "Skip live API tests by default")
    // Test code...
}
```

**Vitest:**
```typescript
it.skip('expensive test', () => {
  // Skipped
});
```

### Running Specific Tests

**Swift:**
```bash
swift test --filter ModelTests
swift test --filter testCouponDecoding
```

**Vitest:**
```bash
npm test -- CouponCard
npm test -- --run  # No watch mode
```

**Playwright:**
```bash
npm run test:e2e -- coupons.spec.ts
npm run test:e2e -- --grep "displays coupons"
```

## CI/CD Testing

### GitHub Actions Workflow

```yaml
jobs:
  test-swift:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - name: Test MCDCore
        run: swift test --package-path packages/MCDCore
      - name: Test MCDSharedUI
        run: swift test --package-path packages/MCDSharedUI
      - name: Test macOS app
        run: swift test --package-path apps/macos/MCD-macOS

  test-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - name: Install dependencies
        run: cd apps/web && npm ci
      - name: Run unit tests
        run: cd apps/web && npm test
      - name: Run E2E tests
        run: cd apps/web && npm run test:e2e
```

## Test Coverage

### Measuring Coverage

**Swift:**
```bash
swift test --enable-code-coverage
xcrun llvm-cov report .build/debug/MCDCorePackageTests.xctest/Contents/MacOS/MCDCorePackageTests
```

**Web:**
```bash
npm test -- --coverage
```

### Coverage Goals

- **MCDCore:** >80% coverage (models, services critical)
- **MCDSharedUI:** >60% coverage (visual components harder to test)
- **Web App:** >70% coverage

## Best Practices

### DO ✅
- Write tests for all new features
- Test edge cases and error paths
- Use descriptive test names
- Keep tests focused and independent
- Mock external dependencies (API calls)
- Run tests before committing

### DON'T ❌
- Skip tests for "simple" code
- Test implementation details
- Make tests depend on each other
- Hard-code test data
- Test third-party code
- Ignore failing tests

## Debugging Tests

### Swift Test Debugging

**Print debugging:**
```swift
func testSomething() {
    print("Debug: \(value)")
    XCTAssertEqual(value, expected)
}
```

**Xcode debugging:**
1. Set breakpoint in test
2. Cmd+U to run tests
3. Debugger pauses at breakpoint

### Web Test Debugging

**Vitest:**
```bash
npm test -- --reporter=verbose
```

**Playwright:**
```bash
npm run test:e2e:debug
# Opens browser with debugger
```

**Browser DevTools:**
```typescript
test('debug test', async ({ page }) => {
  await page.pause();  // Opens Playwright Inspector
});
```

## Troubleshooting

### "No tests found"

**Swift:**
- Ensure test file ends with `Tests.swift`
- Ensure test functions start with `test`
- Check test target is properly configured

**Web:**
- Check test file matches pattern in `vitest.config.ts`
- Verify test file extension (`.test.ts` or `.spec.ts`)

### "Module not found" in tests

**Swift:**
- Clean build: `rm -rf .build && swift build`
- Check `@testable import` is correct

**Web:**
- Check import paths use `@/` alias
- Verify `tsconfig.json` paths configuration

### Tests timeout

**Swift:**
- Async tests may need longer timeout
- Check for deadlocks in async code

**Playwright:**
- Increase timeout in `playwright.config.ts`
- Check for missing `await` keywords
