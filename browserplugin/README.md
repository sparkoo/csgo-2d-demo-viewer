# CS2 Demo Viewer - FACEIT Integration

A Chrome extension that adds an "Analyze Demo" button to FACEIT match room pages, allowing you to quickly open CS2 demos in the CS2 2D Demo Viewer.

## Features

- 🎯 **Targeted Placement**: Adds "Analyze Demo" button inside div[name="info"] elements on match room pages
- 🚀 **One-Click Analysis**: Opens your CS2 2D Demo Viewer with a single click
- 🔄 **SPA Support**: Works with FACEIT's single-page application navigation
- 🎨 **Clean Integration**: Button integrates seamlessly with FACEIT's design
- ⚡ **Lightweight**: Minimal performance impact with focused functionality

## Installation

### Method 1: Load Unpacked (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the `browserplugin` directory
4. The extension will appear in your extensions list

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once published.

## Usage

1. **Install the extension** using one of the methods above
2. **Navigate to FACEIT.com** and browse to a match room page:
   - Match room pages (`/cs2/room/{room-id}`)
3. **Look for the "Analyze Demo" button** inside div[name="info"] elements
4. **Click the button** to open the CS2 2D Demo Viewer in a new tab
5. **Upload your demo file** manually in the demo viewer

## Supported Pages

The extension works specifically on:

- ✅ CS2 Match room pages (`/cs2/room/{room-id}`)

The extension only injects buttons into div elements with name="info" attribute.

## Configuration

### Demo Viewer URL

By default, the extension opens `http://localhost:3000`. To change this:

1. Open the extension's popup by clicking the extension icon
2. The current demo viewer URL is displayed in the popup
3. For now, you can modify the URL in the source code (`popup.js` and `content-script.js`)

_Note: A settings page for easy configuration will be added in a future version._

## How It Works

1. **Content Script Injection**: The extension injects a content script into FACEIT pages
2. **Match Room Detection**: Checks if the current URL matches the CS2 room pattern (`/cs2/room/`)
3. **Info Div Detection**: Searches for div elements with name="info" attribute
4. **Button Injection**: Adds a single "Analyze Demo" button inside the info div
5. **Demo Viewer Integration**: Opens the CS2 2D Demo Viewer when the button is clicked

## Development

### File Structure

```
browserplugin/
├── manifest.json          # Extension configuration
├── content-script.js      # Main content script
├── content-styles.css     # Button and UI styles
├── popup.html            # Extension popup interface
├── popup.js              # Popup functionality
├── popup.css             # Popup styling
├── icons/
│   └── icon.svg          # Extension icon
└── README.md             # This file
```

### Key Components

- **Content Script**: Handles button injection and FACEIT page interaction
- **Popup Interface**: Provides quick access to demo viewer and extension info
- **CSS Styles**: Ensures buttons integrate well with FACEIT's design
- **Manifest V3**: Uses the latest Chrome extension manifest format

### Customization

#### Changing the Demo Viewer URL

Edit this file to change the default demo viewer URL:

1. `content-script.js` - Line 9: `this.demoViewerUrl = 'http://localhost:3000';`

#### Modifying Button Appearance

Edit `content-styles.css` to customize the button design:

- Colors: Modify the gradient in `.cs2-demo-viewer-btn`
- Size: Adjust padding and font-size
- Position: Change positioning logic in the content script

#### Modifying Target Elements

To change which elements the button gets injected into:

1. Update the selector in `injectIntoInfoDiv()` method in `content-script.js`
2. Modify the observer in `observePageChanges()` to watch for different elements
3. Update the `isMatchRoomPage()` method if targeting different URL patterns

## Troubleshooting

### Button Not Appearing

1. **Check Console**: Open Chrome DevTools and look for error messages
2. **Verify Page Type**: Ensure you're on a CS2 match room page (`/cs2/room/`)
3. **Check for Info Div**: Verify the page has a div with name="info" attribute
4. **Reload Extension**: Go to `chrome://extensions/` and reload the extension
5. **Clear Cache**: Clear browser cache and reload FACEIT

### Demo Viewer Not Opening

1. **Check URL**: Verify the demo viewer is running at `http://localhost:3000`
2. **Popup Blockers**: Ensure popup blockers aren't preventing new tabs
3. **Network Issues**: Check if the demo viewer URL is accessible

### Extension Not Loading

1. **Manifest Errors**: Check for syntax errors in `manifest.json`
2. **File Permissions**: Ensure all files are readable
3. **Chrome Version**: Verify you're using a recent version of Chrome

## Permissions

The extension requests minimal permissions:

- `activeTab`: Access to the current FACEIT tab only
- `https://www.faceit.com/*`: Permission to run on FACEIT pages

## Privacy

- **No Data Collection**: The extension doesn't collect or store any personal data
- **Local Operation**: All functionality runs locally in your browser
- **No External Requests**: Only opens your local demo viewer, no external API calls

## Future Enhancements

- 🔧 **Settings Page**: Easy configuration of demo viewer URL and preferences
- 🔍 **Auto Demo Detection**: Automatic detection and extraction of demo URLs
- 📊 **Enhanced Integration**: Direct demo file passing to the viewer
- 🎨 **Theme Support**: Better integration with FACEIT's dark/light themes
- 🌐 **Multi-Platform**: Support for other gaming platforms

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on FACEIT pages
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter issues or have suggestions:

1. Check the troubleshooting section above
2. Open an issue in the project repository
3. Provide details about your Chrome version and the specific FACEIT page

---

**Note**: This extension is not affiliated with FACEIT. It's a community tool designed to enhance the CS2 demo analysis workflow.
