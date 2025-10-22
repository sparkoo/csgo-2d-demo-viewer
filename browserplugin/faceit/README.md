# FACEIT 2D Replay Browser Extension

This browser extension adds 2D replay functionality to FACEIT matches, allowing users to view CS2 demo replays directly from the FACEIT website.

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm

### Setup

```bash
npm install
```

### Build Tasks

#### Development Builds

```bash
# Build for Chrome (development)
npm run dev:chrome

# Build for Firefox (development)
npm run dev:firefox
```

#### Production Builds

```bash
# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox
```

#### Packaging

```bash
# Package for Chrome (creates zip file)
npm run package:chrome

# Package for Firefox (creates zip file)
npm run package:firefox

# Package both Chrome and Firefox
npm run package

# Package and sign for Firefox (requires API credentials)
npm run package:firefox:signed
```

### Firefox Signing

To sign the Firefox extension for distribution through Mozilla Add-ons:

1. Get your API credentials from [Mozilla Add-ons](https://addons.mozilla.org/en-US/developers/addon/api/key/)
2. Set environment variables:
    - For Unix-like systems (Linux/macOS):
        ```bash
        export FIREFOX_API_KEY="your-api-key"
        export FIREFOX_API_SECRET="your-api-secret"
        ```
    - For Windows (Command Prompt):
        ```cmd
        set FIREFOX_API_KEY=your-api-key
        set FIREFOX_API_SECRET=your-api-secret
        ```
    - For Windows (PowerShell):
        ```powershell
        $env:FIREFOX_API_KEY="your-api-key"
        $env:FIREFOX_API_SECRET="your-api-secret"
        ```
3. Run the signed packaging:
    ```bash
    npm run package:firefox:signed
    ```

The signed extension will be available in `dist/signed/`.

### File Structure

```
dist/
├── chrome/           # Chrome extension files
├── firefox/          # Firefox extension files
├── faceit_2d_replay-chrome-{version}.zip     # Chrome package
├── faceit_2d_replay-firefox-{version}.zip    # Firefox package
└── signed/           # Signed Firefox packages (when using sign:firefox)
```

### Browser Compatibility

- **Chrome**: Full support (Manifest V3)
- **Firefox**: Full support with webextension-polyfill
- **Edge**: Should work (Chromium-based)

### Technologies Used

- **Webpack**: Module bundling and asset management
- **Babel**: JavaScript transpilation with core-js polyfills
- **web-ext**: Firefox extension signing and packaging
- **webextension-polyfill**: Cross-browser API compatibility

### Extension Settings

The extension allows configuration of the demo viewer URL through the extension popup. Users can customize where demos are opened by changing the viewer URL in the settings.

### Features

- Adds 2D replay buttons to FACEIT match pages
- Integrates with CS2 Demo Viewer (2d.sparko.cz)
- Cross-browser compatible (Chrome/Firefox)
- Automatic demo download and player opening
- Configurable demo viewer URL via extension settings
- Supports latest FACEIT website updates
