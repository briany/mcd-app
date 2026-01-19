# Screenshot Documentation Design

**Date:** 2026-01-19
**Goal:** Capture and document screenshots of macOS, iOS, and web apps in project READMEs

---

## Overview

Create an automated screenshot capture system that generates high-quality screenshots of all three platform applications (web, macOS, iOS) and inserts them into both the root README and individual app READMEs.

**Target Deliverables:**
- 4-6 high-quality screenshots (2 web, 1-2 macOS, 1-2 iOS)
- Automated Python script for repeatable capture
- Updated README documentation with embedded images

---

## File Organization

```
mcd-app/
├── docs/
│   └── images/           # NEW: Screenshot storage
│       ├── web/
│       │   ├── dashboard.png
│       │   └── coupons.png (optional)
│       ├── macos/
│       │   └── app-overview.png
│       └── ios/
│           └── my-coupons.png
├── scripts/
│   └── capture-screenshots.py  # NEW: Automation script
├── README.md                     # UPDATED: Add screenshots section
├── apps/web/README.md           # UPDATED: Add screenshot
├── apps/macos/README.md         # UPDATED: Add screenshot
└── apps/ios/README.md           # UPDATED: Replace screenshots section
```

---

## Screenshot Specifications

### Highlight Reel Approach
Capture the most visually impressive 1-2 screenshots per platform.

### Web App (2 screenshots)

**1. Dashboard Overview** (`docs/images/web/dashboard.png`)
- **View:** Homepage at http://localhost:3000
- **Content:** Shows My Coupons preview, Available Coupons grid, Campaign Radar
- **Purpose:** Demonstrates complete feature set at a glance
- **Viewport:** 1440x900px (standard laptop)

**2. Coupons Detail View** (`docs/images/web/coupons.png`) - Optional
- **View:** /coupons page
- **Content:** Full coupon cards with McDonald's images
- **Purpose:** Shows visual richness and real data
- **Viewport:** 1440x900px

### macOS App (1 screenshot)

**1. Main Window** (`docs/images/macos/app-overview.png`)
- **View:** Tab-based interface showing My Coupons
- **Content:** Native macOS design with SwiftUI controls
- **Purpose:** Demonstrates native app look and feel
- **Size:** Full window capture (natural proportions)

### iOS App (1 screenshot)

**1. My Coupons View** (`docs/images/ios/my-coupons.png`)
- **View:** My Coupons list on iPhone simulator
- **Content:** Mobile-optimized coupon list with expiry warnings
- **Purpose:** Shows iOS-specific design and color coding
- **Device:** iPhone 15 Pro (393x852 @3x)

### Technical Specifications

- **Format:** PNG (lossless)
- **Naming:** Descriptive kebab-case
- **Quality:** No compression, native resolution
- **Data:** Use real MCP server data (requires valid token)

---

## Automation Script Design

### Script: `scripts/capture-screenshots.py`

**Three-Phase Execution:**

#### Phase 1: Web Screenshots (Playwright)
```python
# Use Playwright in headless mode
# Navigate to localhost:3000 (assumes server running)
# Wait for networkidle (data loaded)
# Set viewport to 1440x900
# Screenshot: page.screenshot(path='docs/images/web/dashboard.png', full_page=True)
# Navigate to /coupons if capturing detail view
# Take second screenshot
```

#### Phase 2: macOS Screenshots
```python
# Build and launch: subprocess 'swift run' in background
# Wait 5 seconds for app window to appear
# Use AppleScript to bring window to front and focus
# Capture: subprocess 'screencapture -w docs/images/macos/app-overview.png'
# User clicks the window when prompted by screencapture -w
# Terminate swift run process
```

#### Phase 3: iOS Screenshots
```python
# Boot simulator: 'xcrun simctl boot "iPhone 15 Pro"'
# Build and install: xcodebuild with simulator destination
# Launch app on simulator
# Wait 5 seconds for data to load
# Capture: 'xcrun simctl io booted screenshot docs/images/ios/my-coupons.png'
# Shutdown simulator: 'xcrun simctl shutdown booted'
```

### Dependencies

**Required:**
- Python 3.8+
- Playwright: `pip install playwright && playwright install chromium`
- Xcode command-line tools (macOS/iOS)
- Running web server at localhost:3000
- Valid MCD_MCP_TOKEN environment variable

**Platform Requirements:**
- macOS with Xcode 15+ (for iOS screenshots)
- Swift 5.9+ (for macOS app)

### Error Handling

- Timeout checks for app launches (10-second max wait)
- Validate image files created successfully
- Provide helpful error messages with manual fallback instructions
- Skip phases gracefully if platform unavailable

---

## README Documentation Updates

### Root README.md

**Add new section after "Overview":**

```markdown
## Screenshots

See the MCD-App suite in action across all platforms:

### Web Application
<img src="docs/images/web/dashboard.png" width="800" alt="Web Dashboard">

*Dashboard showing My Coupons, Available Coupons, and Campaign Radar*

### macOS Application
<img src="docs/images/macos/app-overview.png" width="600" alt="macOS App">

*Native macOS app with SwiftUI interface*

### iOS Application
<img src="docs/images/ios/my-coupons.png" width="300" alt="iOS My Coupons">

*iOS app showing coupon list with expiry tracking*
```

### apps/web/README.md

**Add after introduction paragraph:**

```markdown
## Screenshot

<img src="../../docs/images/web/dashboard.png" width="800" alt="Web Dashboard">

*Dashboard showing My Coupons, Available Coupons, and Campaign Radar with real-time MCP data*
```

### apps/macos/README.md

**Add after Features section:**

```markdown
## Screenshot

<img src="../../docs/images/macos/app-overview.png" width="700" alt="macOS App">

*Native macOS application showing the My Coupons view*
```

### apps/ios/README.md

**Replace existing "## Screenshots" section (lines 11-28) with:**

```markdown
## Screenshot

<img src="../../docs/images/ios/my-coupons.png" width="300" alt="iOS My Coupons">

*My Coupons view with expiry tracking and color-coded warnings (Red: <3 days, Orange: <7 days)*
```

### Image Sizing Strategy

- **Web:** 800px wide (readable without overwhelming)
- **macOS:** 600-700px wide (native window proportions)
- **iOS:** 300px wide (mobile device scale)
- All images maintain aspect ratio

---

## Implementation Steps

1. **Create directory structure**
   ```bash
   mkdir -p docs/images/{web,macos,ios}
   ```

2. **Write automation script**
   - Create `scripts/capture-screenshots.py`
   - Implement three phases (web, macOS, iOS)
   - Add error handling and validation

3. **Run screenshot capture**
   ```bash
   # Ensure web server running at localhost:3000
   # Ensure MCD_MCP_TOKEN configured
   python scripts/capture-screenshots.py
   ```

4. **Update README files**
   - Root README.md
   - apps/web/README.md
   - apps/macos/README.md
   - apps/ios/README.md

5. **Verify and commit**
   - Check all images rendered correctly
   - Verify image sizes appropriate
   - Commit screenshots and README updates

---

## Success Criteria

- ✅ All screenshots captured successfully (4-6 images)
- ✅ Images stored in `docs/images/` with clear organization
- ✅ Root README displays all three platforms
- ✅ Each app README shows platform-specific screenshot
- ✅ Images display correctly in GitHub markdown preview
- ✅ Script is reusable for future UI updates
- ✅ All changes committed to git

---

## Benefits

1. **Visual Documentation** - Users see what the app looks like before running it
2. **Platform Showcase** - Highlights multi-platform nature of the project
3. **Consistency** - Automated capture ensures screenshots stay current
4. **Professionalism** - Polished READMEs improve project presentation
5. **Reusability** - Script can be re-run when UI changes

---

## Future Enhancements

- Add animated GIFs for key interactions (auto-claim, refresh)
- Capture different app states (loading, error, empty)
- Add dark mode screenshots
- Include terminal output examples for CLI usage
- Create a screenshots gallery page in docs/
