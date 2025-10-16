# Mystic Garden Pro - Next Steps to Production

## 🎯 You have a fully functional Match-3 game!

This project is **100% playable** in the Lovable preview. All game mechanics work:
- ✅ 8x8 Match-3 board with real match detection
- ✅ 50 complete levels with varied objectives
- ✅ Lives system with 25-minute refill timer
- ✅ Gems and leaves currency
- ✅ Power-ups (hammer & bomb)
- ✅ Shop with 6 products
- ✅ Multi-language support (ES/EN/PT)
- ✅ Animations and confetti effects
- ✅ Persistent save data

## 📱 Export to Mobile (Android/iOS)

### Prerequisites
- Node.js 18+ installed
- Git installed
- Android Studio (for Android)
- Xcode (for iOS, Mac only)

### Step 1: Export to GitHub
1. Click "Export to GitHub" in Lovable
2. Clone your repository locally:
   ```bash
   git clone YOUR_GITHUB_URL
   cd mystic-garden-pro
   ```

### Step 2: Install Dependencies
```bash
npm install
npm install @capacitor/core @capacitor/cli
npm install @capacitor/android @capacitor/ios
```

### Step 3: Initialize Capacitor
Capacitor config is already included! Just sync:
```bash
npm run build
npx cap sync
```

### Step 4A: Run on Android
```bash
# Add Android platform (first time only)
npx cap add android

# Open in Android Studio
npx cap open android

# Or run directly
npx cap run android
```

**In Android Studio:**
1. Wait for Gradle sync to complete
2. Select a device/emulator
3. Click Run ▶️

### Step 4B: Run on iOS (Mac only)
```bash
# Add iOS platform (first time only)
npx cap add ios

# Open in Xcode
npx cap open ios

# Or run directly
npx cap run ios
```

**In Xcode:**
1. Select a simulator or connected device
2. Click Run ▶️

## 🔄 Development Workflow

### Hot Reload During Development
The app is configured to load from the Lovable preview URL for instant updates:
```typescript
server: {
  url: 'https://b75f0079-34c1-44bf-8ca4-240270ce38b2.lovableproject.com',
  cleartext: true
}
```

When you edit code in Lovable, the mobile app updates automatically!

### For Production Build
1. Remove the `server` block from `capacitor.config.ts`
2. Build the project:
   ```bash
   npm run build
   npx cap sync
   ```

## 📦 Generate Production APK/AAB

### Android APK (for testing)
1. Open project in Android Studio
2. Build > Build Bundle(s) / APK(s) > Build APK(s)
3. Find APK in `android/app/build/outputs/apk/release/`

### Android App Bundle (for Play Store)
1. Generate signing key:
   ```bash
   keytool -genkey -v -keystore mystic-garden.keystore \
     -alias mysticgarden -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Create `android/key.properties`:
   ```properties
   storePassword=YOUR_PASSWORD
   keyPassword=YOUR_PASSWORD
   keyAlias=mysticgarden
   storeFile=../mystic-garden.keystore
   ```

3. Edit `android/app/build.gradle`:
   ```gradle
   android {
     ...
     signingConfigs {
       release {
         def keystorePropertiesFile = rootProject.file("key.properties")
         def keystoreProperties = new Properties()
         keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
         
         keyAlias keystoreProperties['keyAlias']
         keyPassword keystoreProperties['keyPassword']
         storeFile file(keystoreProperties['storeFile'])
         storePassword keystoreProperties['storePassword']
       }
     }
     buildTypes {
       release {
         signingConfig signingConfigs.release
         minifyEnabled true
         proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
       }
     }
   }
   ```

4. Build AAB:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

5. Find AAB in `android/app/build/outputs/bundle/release/app-release.aab`

### iOS IPA (for App Store)
1. Open in Xcode: `npx cap open ios`
2. Select "Generic iOS Device" as target
3. Product > Archive
4. Distribute App > App Store Connect
5. Follow Xcode's upload wizard

## 💰 Integrate Real Payments

### Google Play Billing (Android)
1. Install plugin:
   ```bash
   npm install @capacitor-community/in-app-purchases
   ```

2. Replace simulated purchases in `src/pages/Index.tsx`:
   ```typescript
   import { InAppPurchases } from '@capacitor-community/in-app-purchases';
   
   const handlePurchase = async (productId: string) => {
     try {
       await InAppPurchases.purchaseProduct({ productId });
       // Handle success
     } catch (error) {
       console.error('Purchase failed:', error);
     }
   };
   ```

3. Configure products in Google Play Console

### Apple In-App Purchases (iOS)
1. Same plugin works for both platforms!
2. Configure products in App Store Connect
3. Enable In-App Purchase capability in Xcode

## 📊 Add Analytics

### Firebase Analytics (Recommended)
```bash
npm install @capacitor-firebase/analytics
```

Track key events:
```typescript
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

FirebaseAnalytics.logEvent({
  name: 'level_complete',
  params: { level_id: levelId, score: score }
});
```

## 🎮 Add AdMob (Rewarded Ads)

```bash
npm install @capacitor-community/admob
```

Replace simulated ad in `src/pages/Index.tsx`:
```typescript
import { AdMob, RewardedAdPluginEvents } from '@capacitor-community/admob';

const showRewardedAd = async () => {
  await AdMob.showRewardedVideo();
  // User gets reward in event listener
};

AdMob.addListener(RewardedAdPluginEvents.Rewarded, () => {
  addLives(1);
});
```

## 🚀 Publish to Stores

### Google Play Store
1. Create developer account ($25 one-time fee)
2. Create new app in Play Console
3. Upload AAB file
4. Fill out store listing:
   - Title: Mystic Garden Pro
   - Short description: Match-3 puzzle adventure
   - Category: Puzzle
   - Content rating: Everyone
5. Set up pricing & distribution
6. Submit for review (1-3 days)

### Apple App Store
1. Create developer account ($99/year)
2. Create new app in App Store Connect
3. Upload IPA via Xcode or Transporter
4. Fill out app information
5. Submit for review (1-2 days)

## 🎨 Customize Further

### Change App Icon & Splash Screen
1. Generate icons: https://icon.kitchen/
2. Place in:
   - Android: `android/app/src/main/res/`
   - iOS: `ios/App/App/Assets.xcassets/`

### Modify Color Scheme
Edit `src/index.css` - all colors are HSL variables:
```css
--game-purple: 270 60% 50%;  /* Main theme */
--game-green: 150 50% 50%;   /* Secondary */
--game-gold: 45 100% 50%;    /* Accents */
```

### Add More Levels
Edit `src/data/levels.ts` - just add more objects to the array!

## 🐛 Troubleshooting

### Build fails on Android
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### App won't load assets
Make sure you ran `npm run build` before `npx cap sync`

### TypeScript errors
```bash
npm install --save-dev @types/canvas-confetti
```

### Hot reload not working
Check that the URL in `capacitor.config.ts` matches your Lovable project URL

## 📚 Resources

- [Capacitor Docs](https://capacitorjs.com/)
- [Android Publishing Guide](https://developer.android.com/studio/publish)
- [iOS Publishing Guide](https://developer.apple.com/app-store/submissions/)
- [Google Play Console](https://play.google.com/console)
- [App Store Connect](https://appstoreconnect.apple.com/)

## 🎉 You're Ready!

Your game is production-ready. Just follow these steps to get it on the stores!

Need help? Check out:
- Lovable Discord: https://lovable.dev/discord
- Capacitor Community: https://ionic.io/community
