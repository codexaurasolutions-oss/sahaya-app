# iOS Google Sign-In Fix Guide 🚀

Bhai, maine code mein placeholders add kar diye hain. Ab aapko ye steps follow karne hain taake ye issue permanently theek ho jaye:

## 1. Firebase Console Se Configuration Lena
1. [Firebase Console](https://console.firebase.google.com/) par jayen.
2. Apne project ke **iOS App** settings mein jayen.
3. **GoogleService-Info.plist** file download karein.
4. Us file ko open karein (Text editor mein) aur ye do cheezein dhoondein:
   - `CLIENT_ID`: Ye aapki **iosClientId** hai.
   - `REVERSED_CLIENT_ID`: Ye aapke **URL Scheme** ke liye use hogi.

## 2. Xcode Mein Setup (Zarori Step)
Sirf file folder mein rakhne se kaam nahi chalega, Xcode ko batana padega:
1. **File Add Karein**: Xcode open karein, apne project folder par right-click karein aur `Add Files to "Sahayya"` select karke `GoogleService-Info.plist` add karein.
2. **URL Types Setup**:
   - Xcode mein `Sahayya` target par click karein.
   - **Info** tab mein jayen.
   - Sab se neeche **URL Types** section mein `+` dabayen.
   - **URL Schemes** wale box mein apna `REVERSED_CLIENT_ID` paste kar dein (e.g., `com.googleusercontent.apps.12345...`).

## 3. Code Mein IDs Update Karein
Maine `src/Screens/Auth/SocialLogin.js` mein placeholders dal diye hain. Aapko bas wahan apni real IDs paste karni hain:

```javascript
// src/Screens/Auth/SocialLogin.js

GoogleSignin.configure({
  webClientId: 'APNI_WEB_CLIENT_ID_PASTE_KAREIN', // Firebase console se milegi
  iosClientId: 'APNI_IOS_CLIENT_ID_PASTE_KAREIN', // .plist file se CLIENT_ID uthayen
  offlineAccess: true,
});
```

## 4. App Re-Build Karein
Sari changes karne ke baad, terminal mein ye command chalayein:
```bash
cd ios
pod install
cd ..
npx react-native run-ios
```

---
**Note:** Agar aap simulator use kar rahe hain, toh ensure karein ke us mein Google account logged in ho.
