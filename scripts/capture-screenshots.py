#!/usr/bin/env python3
"""
Screenshot Capture Automation for MCD-App
Captures screenshots of web, macOS, and iOS applications.

Requirements:
- Python 3.8+
- Playwright: pip install playwright && playwright install chromium
- Xcode command-line tools (for macOS/iOS)
- Running web server at localhost:3000
- Valid MCD_MCP_TOKEN environment variable
"""

import os
import subprocess
import sys
import time
from pathlib import Path


def check_requirements():
    """Verify all dependencies are available."""
    print("🔍 Checking requirements...")

    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Python 3.8+ required")
        sys.exit(1)

    # Check Playwright
    try:
        from playwright.sync_api import sync_playwright
        print("✓ Playwright available")
    except ImportError:
        print("❌ Playwright not found. Install with:")
        print("   pip install playwright && playwright install chromium")
        sys.exit(1)

    # Check if web server is running
    try:
        import urllib.request
        urllib.request.urlopen('http://localhost:3000', timeout=2)
        print("✓ Web server running at localhost:3000")
    except Exception:
        print("⚠️  Warning: Web server not responding at localhost:3000")
        print("   Start server with: cd apps/web && npm run dev")
        print("   Attempting to continue...")

    # Check MCD_MCP_TOKEN
    if not os.getenv('MCD_MCP_TOKEN'):
        print("⚠️  Warning: MCD_MCP_TOKEN not set (screenshots may show loading states)")
        print("   Set with: export MCD_MCP_TOKEN=your_token")
    else:
        print("✓ MCD_MCP_TOKEN configured")


def capture_web_screenshots():
    """Phase 1: Capture web application screenshots using Playwright."""
    print("\n📸 Phase 1: Capturing web screenshots...")

    from playwright.sync_api import sync_playwright

    # Ensure output directory exists
    output_dir = Path('docs/images/web')
    output_dir.mkdir(parents=True, exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 1440, 'height': 900})

        try:
            # Screenshot 1: Dashboard
            print("  📷 Capturing dashboard...")
            page.goto('http://localhost:3000', wait_until='networkidle', timeout=30000)
            page.screenshot(
                path=str(output_dir / 'dashboard.png'),
                full_page=True
            )
            print(f"  ✓ Saved: {output_dir / 'dashboard.png'}")

            # Screenshot 2: Coupons (optional)
            try:
                print("  📷 Capturing coupons page...")
                page.goto('http://localhost:3000/coupons', wait_until='networkidle', timeout=30000)
                page.screenshot(
                    path=str(output_dir / 'coupons.png'),
                    full_page=True
                )
                print(f"  ✓ Saved: {output_dir / 'coupons.png'}")
            except Exception as e:
                print(f"  ⚠️  Skipped coupons page: {e}")

        finally:
            browser.close()

    print("✅ Web screenshots complete")


def capture_macos_screenshot():
    """Phase 2: Capture macOS application screenshot."""
    print("\n📸 Phase 2: Capturing macOS screenshot...")

    # Check if on macOS
    if sys.platform != 'darwin':
        print("  ⚠️  Skipping: Not running on macOS")
        return

    # Ensure output directory exists
    output_dir = Path('docs/images/macos')
    output_dir.mkdir(parents=True, exist_ok=True)

    # Navigate to macOS app directory
    macos_app_path = Path('apps/macos/MCD-macOS')
    if not macos_app_path.exists():
        print(f"  ⚠️  Skipping: {macos_app_path} not found")
        return

    # Build and launch app in background
    try:
        # Build first
        print("  🔨 Building macOS app...")
        build_result = subprocess.run(
            ['swift', 'build', '--package-path', str(macos_app_path)],
            capture_output=True,
            text=True,
            timeout=60
        )

        if build_result.returncode != 0:
            print(f"  ❌ Build failed:\n{build_result.stderr}")
            return

        print("  ✓ Build complete")

        # Launch app in background
        print("  🚀 Launching macOS app...")
        app_process = subprocess.Popen(
            ['swift', 'run', '--package-path', str(macos_app_path)],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )

        # Wait for app to launch and render
        print("  ⏳ Waiting 8 seconds for app to launch and render...")
        time.sleep(8)

        # Use screencapture with timed capture of active window
        # -T 1 = delay 1 second, -o = capture only main window
        output_path = output_dir / 'app-overview.png'
        print("  📷 Capturing screenshot...")

        # First try to get window ID of our app
        try:
            # Get list of windows
            window_info = subprocess.run(
                ['osascript', '-e', 'tell application "System Events" to get name of (processes where background only is false)'],
                capture_output=True,
                text=True,
                timeout=5
            )

            # Capture with a slight delay
            result = subprocess.run(
                ['screencapture', '-T', '1', '-o', str(output_path)],
                timeout=10
            )

            if result.returncode == 0 and output_path.exists():
                print(f"  ✓ Saved: {output_path}")
            else:
                print("  ⚠️  Screenshot capture failed")
                print("  ℹ️  To capture manually:")
                print(f"     1. Run: swift run --package-path {macos_app_path}")
                print(f"     2. Run: screencapture -w {output_path}")
                print("     3. Click on the app window")
        except Exception as e:
            print(f"  ⚠️  Screenshot capture error: {e}")

    except subprocess.TimeoutExpired:
        print("  ❌ Timeout during build/launch")
    except FileNotFoundError:
        print("  ❌ Swift toolchain not found. Install Xcode command-line tools.")
    finally:
        # Terminate app process
        try:
            app_process.terminate()
            app_process.wait(timeout=5)
        except:
            try:
                app_process.kill()
            except:
                pass

    print("✅ macOS screenshot complete")


def capture_ios_screenshot():
    """Phase 3: Capture iOS application screenshot."""
    print("\n📸 Phase 3: Capturing iOS screenshot...")

    # Check if on macOS
    if sys.platform != 'darwin':
        print("  ⚠️  Skipping: Not running on macOS")
        return

    # Ensure output directory exists
    output_dir = Path('docs/images/ios')
    output_dir.mkdir(parents=True, exist_ok=True)

    # Check for iOS app project
    ios_project_path = Path('apps/ios/MCD-iOS/MCD-iOS.xcodeproj')
    if not ios_project_path.exists():
        print(f"  ⚠️  Skipping: {ios_project_path} not found")
        return

    simulator_name = "iPhone 17 Pro"

    try:
        # Boot simulator
        print(f"  🚀 Booting {simulator_name} simulator...")
        subprocess.run(
            ['xcrun', 'simctl', 'boot', simulator_name],
            capture_output=True,
            timeout=30
        )
        # Don't fail if already booted

        print("  ⏳ Waiting for simulator to be ready...")
        time.sleep(3)

        # Build and install app
        print("  🔨 Building iOS app...")
        build_result = subprocess.run(
            [
                'xcodebuild',
                'build',
                '-project', str(ios_project_path),
                '-scheme', 'MCD-iOS',
                '-destination', f'platform=iOS Simulator,name={simulator_name}',
                '-derivedDataPath', '.build/ios'
            ],
            capture_output=True,
            text=True,
            timeout=120
        )

        if build_result.returncode != 0:
            print(f"  ❌ Build failed:\n{build_result.stderr}")
            return

        print("  ✓ Build complete")

        # Find the built app
        app_path = Path('.build/ios/Build/Products/Debug-iphonesimulator/MCD-iOS.app')
        if not app_path.exists():
            print(f"  ❌ Built app not found at {app_path}")
            return

        # Install app
        print("  📦 Installing app on simulator...")
        subprocess.run(
            ['xcrun', 'simctl', 'install', 'booted', str(app_path)],
            check=True,
            timeout=30
        )

        # Launch app
        print("  🚀 Launching app...")
        subprocess.run(
            ['xcrun', 'simctl', 'launch', 'booted', 'com.yangjiong.mcd.ios'],
            check=True,
            timeout=30
        )

        # Wait for app to load data
        print("  ⏳ Waiting 5 seconds for data to load...")
        time.sleep(5)

        # Capture screenshot
        output_path = output_dir / 'my-coupons.png'
        subprocess.run(
            ['xcrun', 'simctl', 'io', 'booted', 'screenshot', str(output_path)],
            check=True,
            timeout=30
        )

        print(f"  ✓ Saved: {output_path}")

        # Shutdown simulator
        print("  🛑 Shutting down simulator...")
        subprocess.run(
            ['xcrun', 'simctl', 'shutdown', 'booted'],
            capture_output=True,
            timeout=30
        )

    except subprocess.TimeoutExpired:
        print("  ❌ Timeout during iOS build/launch")
    except subprocess.CalledProcessError as e:
        print(f"  ❌ Command failed: {e}")
    except FileNotFoundError:
        print("  ❌ Xcode command-line tools not found. Install with:")
        print("     xcode-select --install")

    print("✅ iOS screenshot complete")


def verify_screenshots():
    """Verify all screenshots were created successfully."""
    print("\n🔍 Verifying screenshots...")

    expected_files = [
        'docs/images/web/dashboard.png',
        'docs/images/macos/app-overview.png',
        'docs/images/ios/my-coupons.png',
    ]

    success_count = 0
    for file_path in expected_files:
        path = Path(file_path)
        if path.exists():
            size_kb = path.stat().st_size / 1024
            print(f"  ✓ {file_path} ({size_kb:.1f} KB)")
            success_count += 1
        else:
            print(f"  ❌ Missing: {file_path}")

    print(f"\n📊 Result: {success_count}/{len(expected_files)} screenshots captured")

    if success_count > 0:
        print("\n✅ Next steps:")
        print("   1. Review screenshots in docs/images/")
        print("   2. Update README.md files with screenshot references")
        print("   3. Commit changes to git")

    return success_count == len(expected_files)


def main():
    """Main execution flow."""
    print("=" * 60)
    print("MCD-App Screenshot Capture Automation")
    print("=" * 60)

    check_requirements()

    # Execute three phases
    capture_web_screenshots()
    capture_macos_screenshot()
    capture_ios_screenshot()

    # Verify results
    all_success = verify_screenshots()

    print("\n" + "=" * 60)
    if all_success:
        print("🎉 All screenshots captured successfully!")
    else:
        print("⚠️  Some screenshots were not captured")
        print("   See messages above for details")
    print("=" * 60)

    return 0 if all_success else 1


if __name__ == '__main__':
    sys.exit(main())
