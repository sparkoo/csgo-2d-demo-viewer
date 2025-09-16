# Installation Guide - CS:GO Demo Viewer Chrome Extension

## Quick Start

### 1. Load the Extension in Chrome

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer Mode** by clicking the toggle in the top-right corner
3. **Click "Load unpacked"** button
4. **Select the `browserplugin` folder** from your project directory
5. The extension should now appear in your extensions list with an orange play button icon

### 2. Configure Your Demo Viewer URL

1. **Click the extension icon** in your Chrome toolbar (orange play button)
2. **Enter your demo viewer URL** in the input field:
   - For local development: `http://localhost:3000`
   - For production: `https://your-domain.com`
3. **Click "Save"** or wait for auto-save

### 3. Test the Extension

1. **Navigate to a Faceit match page** with an available demo
2. **Look for the orange "View in Demo Viewer" button** - it should appear automatically
3. **Click the button** to test opening your demo viewer

## Troubleshooting

### Extension Not Loading

- Make sure you selected the correct `browserplugin` folder
- Check that all files are present in the folder
- Try refreshing the extensions page and reloading the extension

### Button Not Appearing

- Ensure you're on a Faceit match page with a demo available
- Try clicking the extension icon and press "Test Current Page"
- Enable debug mode in the extension options for detailed console logs

### Demo Viewer Not Opening

- Verify your demo viewer URL is correct in the extension popup
- Make sure your demo viewer is running (if using localhost)
- Check that your demo viewer supports the URL format: `/player?platform=upload&matchId=<demo_url>`

## Advanced Configuration

### Options Page

Right-click the extension icon and select "Options" to access:

- **Auto-inject settings**: Control when the button appears
- **Button customization**: Change button text and position
- **Debug mode**: Enable detailed logging
- **Custom selectors**: Advanced demo detection rules

### Debug Mode

1. Open extension options
2. Enable "Debug mode"
3. Open browser Developer Tools (F12)
4. Check the Console tab for detailed logs

## File Structure

Your `browserplugin` folder should contain:

```
browserplugin/
├── manifest.json          # Extension configuration
├── content-script.js      # Main functionality
├── content-styles.css     # Button styling
├── background.js          # Background service worker
├── popup.html/js/css      # Extension popup
├── options.html/js/css    # Settings page
├── icons/                 # Extension icons
├── README.md             # Documentation
└── INSTALL.md            # This file
```

## Next Steps

1. **Test thoroughly** on various Faceit match pages
2. **Customize settings** in the options page as needed
3. **Report any issues** or suggest improvements
4. **Consider publishing** to Chrome Web Store for easier distribution

## Support

If you encounter issues:

1. Enable debug mode and check browser console
2. Try disabling and re-enabling the extension
3. Verify all files are present and correctly formatted
4. Check that your demo viewer is compatible with the URL format

Happy demo viewing! 🎮
