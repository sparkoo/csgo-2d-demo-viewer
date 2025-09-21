# CS2 Demo Viewer - FACEIT Integration Extension

## Installation Instructions

1. **Open Chrome/Edge Extensions Page**

   - Chrome: Navigate to `chrome://extensions/`
   - Edge: Navigate to `edge://extensions/`

2. **Enable Developer Mode**

   - Toggle the "Developer mode" switch in the top-right corner

3. **Load the Extension**

   - Click "Load unpacked"
   - Select the `browserplugin` folder from this project

4. **Verify Installation**
   - The extension should appear in your extensions list
   - You should see "CS2 Demo Viewer - FACEIT Integration" with version 1.0.0

## Testing the Extension

### Method 1: Test with Local HTML File

1. Open the test file: `browserplugin/test-faceit-page.html` in your browser
2. You should see:
   - An orange "CS2 Extension Active" button in the top-right corner
   - An "ANALYZE DEMO" button below the "WATCH DEMO" button

### Method 2: Test on Real FACEIT Pages

1. Navigate to any FACEIT match room URL (format: `https://www.faceit.com/en/cs2/room/[match-id]`)
2. The extension will automatically:
   - Detect it's a match room page
   - Look for "WATCH DEMO" buttons
   - Inject "ANALYZE DEMO" buttons below them

## Features

- **Automatic Detection**: Detects FACEIT match room pages by URL pattern
- **Smart Injection**: Finds div elements with name="info" and places our button inside them
- **Responsive Design**: Button styling matches FACEIT's design language
- **Dynamic Loading**: Works with FACEIT's single-page application navigation
- **Debug Mode**: Shows test button and console logs for troubleshooting

## Troubleshooting

If the extension isn't working:

1. **Check Console Logs**

   - Open Developer Tools (F12)
   - Look for messages starting with "🔧 [CS2 Extension]"

2. **Verify URL Pattern**

   - Extension only works on `faceit.com` domains
   - Match room URLs should contain `/cs2/room/`

3. **Check Extension Status**

   - Ensure the extension is enabled in your browser
   - Look for the orange test button in the top-right corner

4. **Reload the Page**
   - Sometimes FACEIT's dynamic content loading requires a page refresh

## Button Functionality

When you click the "ANALYZE DEMO" button:

- It opens `http://localhost:3000` (your local CS2 Demo Viewer)
- Shows loading state with spinner
- Provides visual feedback (success/error states)
- Automatically resets after 2 seconds

## Customization

To modify the demo viewer URL, edit `browserplugin/content-script.js`:

```javascript
this.demoViewerUrl = "http://localhost:3000"; // Change this URL
```
