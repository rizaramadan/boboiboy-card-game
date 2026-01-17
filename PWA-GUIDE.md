# PWA Guide - BoBoiBoy Card Game

## Offline Support & Android App Installation

The BoBoiBoy Card Game is now a **Progressive Web App (PWA)** that can be installed on Android devices and played completely offline!

## Features

### Install as Android App
- Add the game to your Android home screen
- Launch it like a native app (no browser UI)
- Standalone full-screen experience

### Full Offline Support
- Play the entire game without internet connection (after first load)
- All game assets cached locally
- OCR functionality works offline (Tesseract.js files cached)
- AI features require internet (OpenRouter API)

## How to Install on Android

### Method 1: Chrome "Add to Home Screen"
1. Open the game in **Chrome** browser on your Android device
2. Tap the **menu** (⋮) in the top right
3. Select **"Add to Home Screen"** or **"Install App"**
4. Tap **"Add"** or **"Install"** in the confirmation dialog
5. The app icon will appear on your home screen

### Method 2: Chrome Banner Prompt
1. Open the game in Chrome
2. Wait for the automatic install banner to appear at the bottom
3. Tap **"Install"** on the banner
4. The app will be added to your home screen

### Method 3: Other Browsers
- **Firefox**: Menu → Install (home screen icon)
- **Samsung Internet**: Menu → Add page to → Home screen
- **Edge**: Menu → Apps → Install this site as an app

## First-Time Setup (Requires Internet)

On your first visit:
1. The game will download all assets (monsters, heroes, UI elements)
2. Service worker will cache Tesseract.js files for OCR
3. App icons and manifest will be stored
4. Total download: ~2-3 MB

**After first load, the game works 100% offline!**

## What Works Offline

- Full gameplay (runner mechanics, lane switching, combat)
- Card scanning with camera
- OCR text recognition (Tesseract.js)
- All visual assets and monsters
- Game state persistence (localStorage)

## What Requires Internet

- AI-powered card analysis (OpenRouter API)
- AI character extraction from cards
- Initial app installation/updates

## Technical Details

### PWA Configuration
- **Service Worker**: Caches all game assets for offline use
- **Web App Manifest**: Enables "Add to Home Screen" functionality
- **Cache Strategy**: Cache-first for assets, network-first for API calls
- **App Icons**: SVG icons in multiple sizes (72px - 512px)

### Offline Asset Caching
The service worker caches:
- Game HTML, CSS, and JavaScript
- All SVG/PNG monsters and heroes
- UI elements (buttons, hearts, stars, etc.)
- Tesseract.js worker files and language data
- App icons and manifest

### Storage
- **Cache API**: ~50MB for game assets
- **LocalStorage**: Player data, scanned cards, API keys
- **IndexedDB**: Not currently used (future expansion)

## Development

### Testing PWA Locally
```bash
# Development mode (with hot reload)
npm run dev

# Production build
npm run build

# Preview production build (tests service worker)
npm run preview
```

### Checking PWA Status
1. Open **Chrome DevTools** (F12)
2. Go to **Application** tab
3. Check:
   - **Manifest**: Should show app name, icons, colors
   - **Service Workers**: Should show "activated and running"
   - **Cache Storage**: Should show cached assets

### Updating the PWA
When you update the game:
1. Build new version: `npm run build`
2. Deploy to server
3. Users will get update notification on next visit
4. Refresh to load new version

## Troubleshooting

### "Add to Home Screen" not showing
- Make sure you're using **HTTPS** (or localhost for testing)
- Check that `manifest.webmanifest` is loading correctly
- Verify icons exist in `/public/icons/`
- Try visiting the site 2-3 times (some browsers have engagement requirements)

### Service Worker not registering
- Open DevTools Console and check for errors
- Verify `/sw.js` is accessible
- Make sure you're on HTTPS (required for service workers)
- Clear cache and reload

### Game not working offline
- Check Service Worker status in DevTools → Application
- Verify cache contains all assets in DevTools → Cache Storage
- Ensure you visited the site while online at least once
- Check browser console for network errors

### Clearing Cache (for testing)
```javascript
// Run in browser console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(r => r.unregister());
});
caches.keys().then(names => names.forEach(name => caches.delete(name)));
```

## Browser Support

### Fully Supported
- Chrome/Chromium 67+ (Android, Desktop)
- Edge 79+ (Android, Desktop)
- Samsung Internet 8.2+
- Opera 55+ (Android, Desktop)

### Partial Support
- Firefox 79+ (supports PWA but limited install prompt)
- Safari 11.1+ (iOS has limited PWA support)

### Not Supported
- Internet Explorer (any version)
- Older mobile browsers

## Future Enhancements

Potential improvements:
- [ ] Background sync for API requests when back online
- [ ] Push notifications for game updates
- [ ] Periodic background sync for new content
- [ ] Share API integration for sharing scores
- [ ] Web Share Target (share cards to the app)
- [ ] Better offline fallback UI
- [ ] Install prompts and onboarding

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
