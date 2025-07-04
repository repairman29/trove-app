# Firebase Setup Guide for Trove Production

## 🚀 Setting Up Firebase for Beta Testing

This guide will help you set up a real Firebase project to move beyond demo mode and get your beta testers into the app.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project"
3. Enter project name: `trove-production` (or your preferred name)
4. Enable Google Analytics (recommended for tracking user engagement)
5. Choose or create a Google Analytics account
6. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project, go to **Authentication** > **Sign-in method**
2. Enable the following providers:
   - **Email/Password**: Click "Enable" → Save
   - **Google**: Click "Enable" → Add your support email → Save

## Step 3: Set Up Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Choose "Start in test mode" (we'll configure security rules later)
3. Select a location (choose closest to your users)
4. Click "Done"

## Step 4: Configure Storage

1. Go to **Storage** > **Get started**
2. Start in test mode
3. Choose the same location as Firestore
4. Click "Done"

## Step 5: Get Your Config Keys

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll down to "Your apps"
3. Click **Web app icon** (</>) to add a web app
4. Enter app nickname: "Trove Web App"
5. Check "Also set up Firebase Hosting" (optional)
6. Click "Register app"
7. **Copy the firebaseConfig object** - you'll need this!

## Step 6: Set Up Security Rules

### Firestore Rules
Go to **Firestore Database** > **Rules** and replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Users can only access their own collections
    match /collections/{collectionId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId;
    }
    
    // Users can only access items in their own collections
    match /collections/{collectionId}/items/{itemId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == get(/databases/$(database)/documents/collections/$(collectionId)).data.userId;
    }
  }
}
```

### Storage Rules
Go to **Storage** > **Rules** and replace with:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Step 7: Update Your App Configuration

1. Open `firebase-config.js` in your project
2. Replace the demo config with your real Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

3. Set `DEMO_MODE = false` in `demo-mode.js`

## Step 8: Test Your Setup

1. Start your local server
2. Try creating an account with email/password
3. Try signing in with Google
4. Create a test collection
5. Upload a test photo

## Step 9: Prepare for Beta Testing

### Set Up User Management
1. Go to **Authentication** > **Users** to monitor signups
2. Set up email templates in **Authentication** > **Templates**

### Monitor Usage
1. Go to **Analytics** > **Dashboard** to track user engagement
2. Set up **Firestore** usage monitoring
3. Monitor **Storage** usage

### Set Up Billing (Important!)
1. Go to **Project Settings** > **Usage and billing**
2. Set up billing account to avoid service interruptions
3. Set up budget alerts

## Step 10: Deploy (Optional)

### Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Custom Domain
1. Go to **Hosting** > **Add custom domain**
2. Follow the DNS configuration steps

## 🔒 Security Checklist

- [ ] Firestore security rules configured
- [ ] Storage security rules configured
- [ ] Authentication providers properly configured
- [ ] Billing account set up
- [ ] Budget alerts configured
- [ ] User email templates customized

## 🎯 Beta Testing Checklist

- [ ] Test user registration flow
- [ ] Test Google Sign-In
- [ ] Test collection creation
- [ ] Test photo upload
- [ ] Test tier limits enforcement
- [ ] Test data persistence
- [ ] Test error handling

## 📊 Monitoring & Analytics

### Key Metrics to Track
- User signups
- Daily/Monthly active users
- Collection creation rate
- Photo upload volume
- Error rates
- Performance metrics

### Useful Firebase Extensions
- **Authentication** → User management
- **Firestore** → Data export/import
- **Storage** → Image optimization
- **Analytics** → Custom events

## 🚨 Common Issues

### Authentication Issues
- Check domain authorization in Firebase Console
- Verify API keys are correct
- Check browser console for CORS errors

### Firestore Issues
- Verify security rules allow your operations
- Check quotas and limits
- Monitor for failed writes

### Storage Issues
- Check file size limits
- Verify CORS configuration
- Monitor storage quotas

## 🔄 Migration from Demo Mode

1. Update `firebase-config.js` with real config
2. Set `DEMO_MODE = false` in `demo-mode.js`
3. Test all authentication flows
4. Verify data persistence
5. Test tier limits enforcement
6. Deploy to production environment

## 📞 Support

If you encounter issues:
1. Check Firebase Console for errors
2. Review browser console logs
3. Check Firebase status page
4. Consult Firebase documentation
5. Contact Firebase support if needed

---

**Ready to launch?** Follow this guide step by step, and you'll have a production-ready Firebase setup for your beta testers! 🎉 