# CS:GO Demo Viewer Chrome Extension

A Chrome extension that adds a "View in Demo Viewer" button to Faceit match pages, allowing you to easily open CS:GO demos in your demo viewer application.

## Features

- 🎯 **Smart Detection**: Automatically detects Faceit match pages with available demos
- 🔗 **One-Click Integration**: Adds a button to open demos directly in your viewer
- ⚙️ **Configurable**: Set your demo viewer URL (localhost or production)
- 🎨 **Clean UI**: Seamlessly integrates with Faceit's design
- 📱 **Responsive**: Works on desktop and mobile layouts

## Installation

### Method 1: Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" button
4. Select the `browserplugin` folder from this project
5. The extension should now appear in your extensions list

### Method 2: Chrome Web Store (Coming Soon)

The extension will be available on the Chrome Web Store once published.

## Configuration

### Setting Your Demo Viewer URL

1. Click the extension icon in your Chrome toolbar
2. Enter your demo viewer URL in the popup (default: `http://localhost:3000`)
3. Click "Save" or the settings will auto-save after 1 second

### Advanced Options

1. Right-click the extension icon and select "Options"
2. Configure advanced settings:
   - **Auto-inject**: Automatically add button on page load
   - **Button position**: Choose where the button appears
   - **Button text**: Customize the button text
   - **Debug mode**: Enable for troubleshooting
   - **Custom selectors**: Advanced CSS selectors for demo detection

## Usage

1. **Navigate to a Faceit match page** that has a demo available
2. **Look for the orange "View in Demo Viewer" button** - it will appear automatically
3. **Click the button** to open the demo in your configured viewer
4. **Your demo viewer will open** in a new tab with the demo loaded

### Supported Pages

- Faceit match room pages (`*.faceit.com/*/room/*`)
- Pages with `.dem.gz` download links
- Match history pages with demo availability

## Demo Viewer Integration

The extension works with your existing CS:GO demo viewer by passing the demo URL as a parameter:

```
{viewerUrl}/player?platform=upload&matchId={demoUrl}
```

Make sure your demo viewer supports this URL format and can handle `.dem.gz` files.

## Troubleshooting

### Button Not Appearing

1. **Check if you're on a supported page**: The extension only works on Faceit match pages
2. **Verify demo availability**: The button only appears when a demo is detected
3. **Try manual injection**: Click the extension icon and press "Test Current Page"
4. **Check console**: Enable debug mode in options for detailed logs

### Demo Not Loading

1. **Verify viewer URL**: Make sure your demo viewer URL is correct in settings
2. **Check viewer status**: Ensure your demo viewer is running (if using localhost)
3. **Test configuration**: Use the "Test Configuration" button in options

### Extension Not Working

1. **Reload the extension**: Go to `chrome://extensions/` and click the reload button
2. **Check permissions**: Ensure the extension has permission to access Faceit pages
3. **Update Chrome**: Make sure you're using a recent version of Chrome
4. **Check console errors**: Open Developer Tools and check for JavaScript errors

## Development

### File Structure

```
browserplugin/
├── manifest.json          # Extension configuration
├── content-script.js      # Faceit page interaction
├── content-styles.css     # Button styling
├── background.js          # Service worker
├── popup.html/js/css      # Extension popup
├── options.html/js/css    # Settings page
├── icons/                 # Extension icons
└── README.md             # This file
```

### Building

The extension is ready to use as-is. For production:

1. Update version in `manifest.json`
2. Add proper icons to the `icons/` directory
3. Test thoroughly on various Faceit pages
4. Package as ZIP for Chrome Web Store submission

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the extension thoroughly
5. Submit a pull request

## Permissions

The extension requires these permissions:

- `activeTab`: To interact with the current Faceit page
- `storage`: To save your configuration settings
- `*://*.faceit.com/*`: To access Faceit pages and inject the button

## Privacy

- **No data collection**: The extension doesn't collect or transmit any personal data
- **Local storage only**: Settings are stored locally in your browser
- **No external requests**: Only communicates with your configured demo viewer

## Version History

### v1.0.0

- Initial release
- Basic Faceit integration
- Configurable demo viewer URL
- Auto-detection of demo availability
- Options page for advanced settings

## Support

For issues, feature requests, or questions:

1. Check the troubleshooting section above
2. Enable debug mode for detailed logs
3. Check browser console for error messages
4. Create an issue in the project repository

## License

This project is licensed under the MIT License - see the LICENSE file for details.
