# Firebase Setup Instructions

## Step 1: Create Firebase Project

1. Go to https://firebase.google.com
2. Click "Get Started" → "Add Project"
3. Name: `anime-community`
4. Click "Continue" → "Create Project"

## Step 2: Enable Authentication

1. In Firebase Console, click "Authentication"
2. Click "Get Started"
3. Enable **Email/Password**:
   - Click "Email/Password"
   - Toggle "Enable"
   - Click "Save"
4. (Optional) Enable **Google**:
   - Click "Google"
   - Toggle "Enable"
   - Select project email
   - Click "Save"

## Step 3: Create Firestore Database

1. Click "Firestore Database" in sidebar
2. Click "Create Database"
3. Select "Start in **test mode**"
4. Choose location (closest to you)
5. Click "Enable"

## Step 4: Get Your Config

1. Go to Project Settings (⚙️ icon)
2. Scroll to "Your apps"
3. Click Web icon `</>`
4. Register app: `AnimeStream`
5. **COPY** the firebaseConfig object

## Step 5: Add Config to Your Site

1. Open `js/firebase-config.js`
2. Replace the placeholder config with YOUR config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_ACTUAL_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

3. Save the file
4. Push to GitHub:
```bash
cd /root/anime-search-site
git add .
git commit -m "Add Firebase authentication"
git push origin main
```

## Features Enabled

Once Firebase is configured, users can:

✅ **Sign Up** - Create account with email/password
✅ **Login** - Sign in to existing account
✅ **Google Sign-In** - One-click with Google
✅ **User Profile** - View profile and stats
✅ **Watchlist** - Save across devices (cloud sync)
✅ **Reviews** - Write and read community reviews
✅ **Progress Tracking** - Track what you've watched

## Security Rules (Optional)

After setup, go to Firestore Database → Rules and add:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /watchlist/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /reviews/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

This allows:
- Anyone can read
- Only logged-in users can write
- Users can only edit their own data

## Testing

After adding config:
1. Visit your site
2. Click "Login" button
3. Try "Sign Up"
4. Check Firebase Console → Authentication to see new user!

Need help? Check the Firebase docs: https://firebase.google.com/docs
