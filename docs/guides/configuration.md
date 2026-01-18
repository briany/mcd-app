# Configuration Guide

All MCD-App platforms require an MCP API token to communicate with the McDonald's MCP server.

## Getting an MCP Token

Contact your McDonald's API administrator to obtain an MCP token for your development environment.

## Platform-Specific Configuration

### macOS App

**Option 1: Environment Variable (Recommended for Development)**

```bash
export MCD_MCP_TOKEN="your-token-here"
swift run --package-path apps/macos/MCD-macOS
```

**Option 2: Config.plist File**

1. Copy the example file:
   ```bash
   cd apps/macos
   cp Config.plist.example MCD-macOS/MCDApp/Config.plist
   ```

2. Edit `apps/macos/MCD-macOS/MCDApp/Config.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>MCD_MCP_TOKEN</key>
       <string>your-token-here</string>
   </dict>
   </plist>
   ```

3. **Important:** `Config.plist` is gitignored to prevent committing secrets

### iOS App

**Option 1: Config.plist File (Recommended)**

1. Copy the example file:
   ```bash
   cd apps/ios
   cp Config.plist.example MCD-iOS/Config.plist
   ```

2. Edit `apps/ios/MCD-iOS/Config.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>MCD_MCP_TOKEN</key>
       <string>your-token-here</string>
   </dict>
   </plist>
   ```

3. In Xcode, add Config.plist to the project:
   - Right-click on the MCD-iOS group
   - Add Files to "MCD-iOS"...
   - Select Config.plist
   - Ensure "Copy items if needed" is checked
   - Add to MCD-iOS target

**Option 2: Environment Variable**

Add to your Xcode scheme:
1. Product → Scheme → Edit Scheme...
2. Run → Arguments tab
3. Environment Variables section → Click +
4. Add: `MCD_MCP_TOKEN` = `your-token-here`

### Web App

**Environment File (Recommended)**

1. Copy the example file:
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```

2. Edit `.env.local`:
   ```env
   MCP_TOKEN=your-token-here
   MCP_BASE_URL=https://mcp.mcd.cn/mcp-servers/mcd-mcp
   ```

3. **Important:** `.env.local` is gitignored to prevent committing secrets

**Environment Variables (Production)**

For deployment, set environment variables in your hosting platform:

**Vercel:**
```bash
vercel env add MCP_TOKEN
# Enter your token when prompted
```

**Docker:**
```bash
docker run -e MCP_TOKEN=your-token-here ...
```

## Configuration Hierarchy

### Swift Apps (macOS/iOS)

The configuration system checks sources in this order:

1. **Environment Variable:** `MCD_MCP_TOKEN`
2. **Config.plist:** `Config.plist` in app bundle
3. **Fatal Error:** If neither is found

This is implemented in `MCDConfiguration` (shared package):

```swift
public static var mcpToken: String {
    // 1. Try environment variable
    if let token = ProcessInfo.processInfo.environment["MCD_MCP_TOKEN"], !token.isEmpty {
        return token
    }

    // 2. Try Config.plist
    if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
       let configDict = NSDictionary(contentsOfFile: configPath),
       let token = configDict["MCD_MCP_TOKEN"] as? String, !token.isEmpty {
        return token
    }

    // 3. Fatal error
    fatalError("MCP Token not configured!")
}
```

### Web App

Next.js environment variables:

- `.env.local` - Local development (gitignored)
- `.env` - Default values (committed)
- Process environment - Runtime override

## Security Best Practices

### DO ✅
- Use environment variables for CI/CD
- Use Config.plist for local development
- Add Config.plist and .env.local to .gitignore
- Rotate tokens regularly
- Use different tokens for dev/staging/prod

### DON'T ❌
- Commit tokens to git
- Share tokens in public channels
- Use production tokens in development
- Hard-code tokens in source files
- Log tokens in console output

## Verification

### Test macOS Configuration

```bash
# With environment variable
export MCD_MCP_TOKEN="test-token"
cd apps/macos/MCD-macOS
swift run

# Should show: MCP Token configured successfully
```

### Test iOS Configuration

1. Build and run in Xcode (Cmd+R)
2. App should launch without fatal error
3. Check Xcode console for "MCP Token configured"

### Test Web Configuration

```bash
cd apps/web
npm run dev
# Visit http://localhost:3000
# Should load without 500 error
```

## Troubleshooting

### "MCP Token not configured!" Fatal Error

**Swift Apps:**
- Verify environment variable is set: `echo $MCD_MCP_TOKEN`
- Check Config.plist exists and has correct key
- Ensure Config.plist is in app bundle (Xcode: Build Phases → Copy Bundle Resources)

**Web App:**
- Verify `.env.local` exists: `ls -la apps/web/.env.local`
- Check file has `MCP_TOKEN=...` line
- Restart dev server after changing .env files

### Token Authentication Failures

- Verify token is correct (no extra whitespace)
- Check token hasn't expired
- Confirm token has correct permissions for MCP API
- Test token with curl:
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       https://mcp.mcd.cn/mcp-servers/mcd-mcp
  ```

## CI/CD Configuration

### GitHub Actions

```yaml
- name: Run tests
  env:
    MCD_MCP_TOKEN: ${{ secrets.MCD_MCP_TOKEN }}
  run: swift test
```

Add secret in GitHub: Settings → Secrets and variables → Actions → New repository secret

### Xcode Cloud

Add environment variable in App Store Connect:
- Xcode Cloud → Settings → Environment → Add Variable
- Name: `MCD_MCP_TOKEN`
- Value: Your token
