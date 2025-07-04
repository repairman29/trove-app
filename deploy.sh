#!/bin/bash

echo "🏺 Deploying Trove to Firebase..."
echo "================================"

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

# Check if user is logged in
if ! firebase projects:list &> /dev/null; then
    echo "🔐 Please log in to Firebase..."
    firebase login
fi

# Set the project
echo "🎯 Setting Firebase project..."
firebase use collectors-hub-app-464902

# Deploy functions first
echo "⚡ Deploying Firebase Functions..."
cd functions
npm install
cd ..
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Functions deployed successfully!"
else
    echo "❌ Functions deployment failed!"
    exit 1
fi

# Deploy hosting
echo "🌐 Deploying to Firebase Hosting..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ Hosting deployed successfully!"
    echo ""
    echo "🎉 Trove is live!"
    echo "================================"
    echo "🌍 Production URL: https://collectors-hub-app-464902.web.app"
    echo "🔗 Custom Domain: https://collectors-hub-app-464902.firebaseapp.com"
    echo ""
    echo "📊 Firebase Console: https://console.firebase.google.com/project/collectors-hub-app-464902"
    echo ""
    echo "✨ Your collection management app is now available to users worldwide!"
else
    echo "❌ Hosting deployment failed!"
    exit 1
fi 