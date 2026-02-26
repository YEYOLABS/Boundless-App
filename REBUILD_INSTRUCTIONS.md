# Quick Rebuild Instructions

## What Was Fixed
1. ✅ Fixed `post-tour.tsx` - Added permission checks and corrected mediaTypes syntax
2. ✅ Updated `app.json` - Added Android 13+ permission (READ_MEDIA_IMAGES)
3. ✅ `pre-tour.tsx` - Already had correct implementation

## Rebuild Steps

### Option 1: Development Build (Fastest for Testing)

```bash
# Navigate to the app directory
cd Boundless-App

# Clear cache and restart
npx expo start --clear

# If that doesn't work, do a clean prebuild
npx expo prebuild --clean

# Then run on your device
npx expo run:android
# or
npx expo run:ios
```

### Option 2: EAS Build (For Production/Distribution)

```bash
cd Boundless-App

# Build for Android
eas build --platform android --profile preview

# Build for iOS
eas build --platform ios --profile preview

# Or build both
eas build --platform all --profile preview
```

### Option 3: Quick Test Without Full Rebuild

If you're already running the app in development mode:

1. Stop the current Expo server (Ctrl+C)
2. Clear the app data on your device:
   - **Android**: Settings > Apps > Boundless Driver > Storage > Clear Data
   - **iOS**: Delete and reinstall the app
3. Restart Expo:
   ```bash
   npx expo start --clear
   ```
4. Reload the app (shake device > Reload)

## After Rebuild

1. **Grant Permissions Manually** (if not prompted):
   - Go to device Settings > Apps > Boundless Driver > Permissions
   - Enable Camera and Photos/Storage

2. **Test the Image Picker**:
   - Go to Pre-Tour Inspection
   - Try uploading odometer photo (both camera and gallery)
   - Try uploading oil level photo (both camera and gallery)
   - Go to Post-Tour Inspection
   - Try uploading odometer and fuel photos

## Troubleshooting

### If permissions still don't work:
```bash
# Completely remove and reinstall
cd Boundless-App
rm -rf node_modules
rm -rf .expo
npm install
npx expo prebuild --clean
npx expo run:android
```

### Check current permissions:
```bash
# Android
adb shell dumpsys package com.anonymous.Natively | grep permission

# iOS - check in Xcode or device settings
```

### View logs while testing:
```bash
npx expo start
# Then press 'j' to open debugger
# Or use React Native Debugger
```

## Expected Behavior After Fix

When you tap "Upload Photo" or "Add Photo":
1. ✅ Alert shows with options: "Take Photo", "Choose from Library", "Cancel"
2. ✅ If permission not granted, shows permission request dialog
3. ✅ Camera opens successfully when "Take Photo" selected
4. ✅ Gallery opens successfully when "Choose from Library" selected
5. ✅ Photo displays in preview after selection
6. ✅ Can remove photo and select a different one

## Notes

- The fixes are backward compatible with older Android versions
- iOS permissions were already correctly configured
- The `expo-image-picker` plugin configuration in app.json is correct
- All permission strings are properly set for both platforms
