# Image Picker Fix Guide

## Issue
The image picker in pre-tour and post-tour inspections fails with "Failed to pick image" error when trying to open gallery or take photos.

## Root Causes Fixed

### 1. **Post-Tour File - Missing Permission Checks & Wrong MediaTypes**
The `post-tour.tsx` file had two critical issues:
- Missing permission request checks before launching camera/gallery
- Incorrect `mediaTypes` syntax: `['images']` instead of `ImagePicker.MediaTypeOptions.Images`

**Fixed in:** `Boundless-App/app/post-tour.tsx`

### 2. **Pre-Tour File - Already Correct**
The `pre-tour.tsx` file already had proper permission handling and correct syntax.

## Additional Steps to Ensure It Works

### For Development/Testing:

1. **Clear App Data and Reinstall**
   ```bash
   # Stop the app completely
   # On Android: Go to Settings > Apps > Boundless Driver > Storage > Clear Data
   # On iOS: Delete the app and reinstall
   
   # Then rebuild
   cd Boundless-App
   npx expo start --clear
   ```

2. **Check Permissions in Device Settings**
   - **Android:** Settings > Apps > Boundless Driver > Permissions
     - Camera: Allow
     - Storage/Photos: Allow
   - **iOS:** Settings > Boundless Driver
     - Camera: Allow
     - Photos: Allow

3. **For Android API 33+ (Android 13+)**
   The app needs updated permissions. Update `app.json`:
   ```json
   "android": {
     "permissions": [
       "CAMERA",
       "READ_MEDIA_IMAGES",
       "READ_EXTERNAL_STORAGE",
       "WRITE_EXTERNAL_STORAGE"
     ]
   }
   ```

4. **Rebuild the App**
   ```bash
   # For development
   npx expo prebuild --clean
   npx expo run:android
   # or
   npx expo run:ios
   ```

5. **For Production Build (EAS)**
   ```bash
   eas build --platform android --profile production
   eas build --platform ios --profile production
   ```

### Testing Checklist:

- [ ] Pre-tour odometer photo (camera)
- [ ] Pre-tour odometer photo (gallery)
- [ ] Pre-tour oil level photo (camera)
- [ ] Pre-tour oil level photo (gallery)
- [ ] Post-tour odometer photo (camera)
- [ ] Post-tour odometer photo (gallery)
- [ ] Post-tour fuel level photo (camera)
- [ ] Post-tour fuel level photo (gallery)

## Code Changes Made

### post-tour.tsx - pickImage function
**Before:**
```typescript
const pickImage = async (type: 'odometer' | 'fuel') => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'], // ❌ Wrong syntax
    allowsEditing: true,
    quality: 0.8,
    base64: true,
  });
  // ... no permission check
}
```

**After:**
```typescript
const pickImage = async (type: 'odometer' | 'fuel') => {
  try {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // ✅ Correct syntax
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    // ... rest of code
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
  }
}
```

### post-tour.tsx - takePhoto function
**Before:**
```typescript
const takePhoto = async (type: 'odometer' | 'fuel') => {
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    quality: 0.8,
    base64: true,
  });
  // ... no permission check
}
```

**After:**
```typescript
const takePhoto = async (type: 'odometer' | 'fuel') => {
  try {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Please allow access to your camera to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
    // ... rest of code
  } catch (error) {
    console.error('Error taking photo:', error);
    Alert.alert('Error', 'Failed to take photo. Please try again.');
  }
}
```

## If Issues Persist

1. **Check Expo Image Picker Version**
   ```bash
   npm list expo-image-picker
   ```
   Should be: `^17.0.7` (as per package.json)

2. **Check Console Logs**
   When the error occurs, check the console for detailed error messages:
   ```bash
   npx expo start
   # Then check the terminal output when you try to pick an image
   ```

3. **Test on Different Device/Emulator**
   - Try on a physical device if using emulator
   - Try on emulator if using physical device
   - Test on both Android and iOS

4. **Verify Plugin Configuration**
   The `app.json` already has the correct plugin configuration:
   ```json
   [
     "expo-image-picker",
     {
       "photosPermission": "This app needs access to your photo library...",
       "cameraPermission": "This app needs access to your camera..."
     }
   ]
   ```

## Support
If the issue persists after these fixes:
1. Check device OS version (Android 13+ requires different permissions)
2. Verify the app has been rebuilt after changes
3. Check if other apps can access camera/gallery on the device
4. Review device-specific restrictions or MDM policies
