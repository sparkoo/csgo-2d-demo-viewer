# Chrome Extension Debug Guide

## 🚨 Extension Not Loading? Follow These Steps

### Step 1: Verify Extension Installation

1. **Go to Chrome Extensions Page**

   - Open `chrome://extensions/` in Chrome
   - Ensure "Developer mode" is enabled (toggle in top right)
   - Look for "CS2 Demo Viewer - FACEIT Integration"

2. **Check Extension Status**
   - ✅ Extension should show as "Enabled"
   - ✅ No error messages should be visible
   - ❌ If you see errors, note them down

### Step 2: Check Extension Loading

1. **Reload the Extension**

   - Click the reload button (🔄) on the extension card
   - This refreshes the extension files

2. **Check for Manifest Errors**
   - Look for red error text under the extension
   - Common issues: JSON syntax errors, missing files

### Step 3: Test on FACEIT

1. **Navigate to FACEIT.com**

   - Go to `https://www.faceit.com` or `https://faceit.com`
   - You should see a **orange test button** in the top-right corner saying "🚀 CS2 Extension Active"

2. **If Test Button Appears**

   - ✅ Extension is loading correctly
   - Click the test button to confirm
   - Proceed to Step 4

3. **If Test Button Does NOT Appear**
   - ❌ Extension is not loading on FACEIT
   - Check browser console (F12 → Console tab)
   - Look for error messages or extension logs

### Step 4: Check Browser Console

1. **Open Developer Tools**

   - Press `F12` or right-click → "Inspect"
   - Go to the "Console" tab

2. **Look for Extension Logs**

   - You should see messages starting with:
     - `🚀 CS2 Demo Viewer extension loaded!`
     - `🔧 [CS2 Extension]`
   - These logs show what the extension is doing

3. **Common Log Messages**
   ```
   🚀 CS2 Demo Viewer extension loaded!
   📍 Current URL: https://www.faceit.com/...
   🔧 [CS2 Extension] Initializing extension...
   🔧 [CS2 Extension] ✅ Confirmed on FACEIT domain
   🔧 [CS2 Extension] 🧪 Adding test button...
   🔧 [CS2 Extension] 🔍 Starting button injection...
   ```

### Step 5: Debug Button Injection

1. **Check Page Structure Logs**

   - Look for logs like:
     ```
     📊 Page structure analysis:
     - Body classes: ...
     - All elements with 'match' in class: X
     ```

2. **Check Injection Results**

   - Look for logs like:
     ```
     🔍 Checking match history...
     - Selector "[data-testid*="match"]": found X elements
     Match history: added X buttons
     ```

3. **If No Buttons Are Added**
   - The logs will show `⚠️ No buttons were added`
   - This means FACEIT's page structure doesn't match our selectors

## 🔧 Common Issues & Solutions

### Issue 1: Extension Not Loading at All

**Symptoms**: No test button, no console logs

**Solutions**:

1. Check manifest.json syntax
2. Ensure all files exist in browserplugin folder
3. Try reloading the extension
4. Check Chrome version (needs recent version for Manifest V3)

### Issue 2: Extension Loads But No Buttons on FACEIT

**Symptoms**: Test button appears, console logs show extension loading, but no "Analyze Demo" buttons

**Solutions**:

1. Check if you're on the right FACEIT pages (player profiles, match history)
2. Look at the detailed page structure logs
3. FACEIT may have changed their HTML structure

### Issue 3: Buttons Appear But Don't Work

**Symptoms**: Orange "Analyze Demo" buttons visible but clicking doesn't open demo viewer

**Solutions**:

1. Check if demo viewer is running at `http://localhost:3000`
2. Check browser popup blockers
3. Look for JavaScript errors in console when clicking

### Issue 4: Permission Denied Errors

**Symptoms**: Console shows permission or CORS errors

**Solutions**:

1. Check extension permissions in `chrome://extensions/`
2. Ensure FACEIT is in the allowed sites
3. Try reloading the extension

## 📋 Debug Checklist

Use this checklist to systematically debug:

- [ ] Extension appears in `chrome://extensions/`
- [ ] Extension is enabled (not grayed out)
- [ ] No error messages under extension
- [ ] Navigated to `https://www.faceit.com`
- [ ] Orange test button appears in top-right
- [ ] Test button shows alert when clicked
- [ ] Browser console shows extension logs
- [ ] Console shows "🚀 CS2 Demo Viewer extension loaded!"
- [ ] Console shows "✅ Confirmed on FACEIT domain"
- [ ] Console shows page structure analysis
- [ ] Console shows button injection attempts
- [ ] Demo viewer is running at `http://localhost:3000`

## 🐛 Reporting Issues

If the extension still doesn't work, please provide:

1. **Chrome Version**: Help → About Google Chrome
2. **Extension Status**: Screenshot of `chrome://extensions/`
3. **Console Logs**: Copy all messages starting with "🚀" or "🔧"
4. **FACEIT Page URL**: Which specific FACEIT page you're testing
5. **Test Button**: Does the orange test button appear?

## 🔍 Advanced Debugging

### Check Extension Background Page

1. Go to `chrome://extensions/`
2. Click "Details" on the CS2 extension
3. Click "Inspect views: service worker" (if available)
4. Check for background script errors

### Check Content Script Injection

1. On FACEIT page, open DevTools
2. Go to Sources tab
3. Look for "Content scripts" section
4. Should see `content-script.js` listed

### Manual Testing

You can manually test selectors in the browser console:

```javascript
// Test if extension can find match elements
document.querySelectorAll('[class*="match"]').length;
document.querySelectorAll('[data-testid*="match"]').length;
document.querySelectorAll(".match-item").length;

// Test if extension loaded
document.getElementById("cs2-extension-test-button");
```

## 📞 Quick Fixes

### Fix 1: Reload Everything

1. Reload extension in `chrome://extensions/`
2. Hard refresh FACEIT page (Ctrl+Shift+R)
3. Check console for new logs

### Fix 2: Try Different FACEIT Pages

- Player profile: `https://www.faceit.com/en/players/{username}`
- Match history: `https://www.faceit.com/en/players/{username}/stats`
- Any match room page

### Fix 3: Check Demo Viewer

1. Open `http://localhost:3000` in new tab
2. Ensure it loads without errors
3. If not running, start your demo viewer

---

**Remember**: The orange test button should ALWAYS appear if the extension is working. If you don't see it, the issue is with extension loading, not button injection.
