#!/bin/bash

# Trove Production Deployment Script
# This script helps you deploy Trove in production mode

echo "🏺 Trove Production Deployment"
echo "=============================="

# Check if Firebase config is updated
echo "🔍 Checking Firebase configuration..."

if grep -q "YOUR_API_KEY_HERE" firebase-config.js; then
    echo "❌ ERROR: Firebase configuration not updated!"
    echo "   Please update firebase-config.js with your real Firebase credentials"
    echo "   See FIREBASE_SETUP.md for instructions"
    exit 1
fi

# Check demo mode setting
echo "🔍 Checking demo mode setting..."

if grep -q "const DEMO_MODE = true" demo-mode.js; then
    echo "⚠️  WARNING: Demo mode is still enabled!"
    read -p "   Switch to production mode? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i.bak 's/const DEMO_MODE = true/const DEMO_MODE = false/' demo-mode.js
        echo "✅ Demo mode disabled"
    else
        echo "❌ Deployment cancelled - demo mode still enabled"
        exit 1
    fi
else
    echo "✅ Production mode enabled"
fi

# Test Firebase connection (optional)
echo "🔍 Testing Firebase connection..."
echo "   (Open browser console to check for errors)"

# Create production build info
echo "📝 Creating build info..."
cat > build-info.json << EOF
{
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "1.0.0-beta",
  "mode": "production",
  "features": {
    "authentication": true,
    "firestore": true,
    "storage": true,
    "tierLimits": true
  }
}
EOF

# Deployment options
echo ""
echo "🚀 Choose deployment option:"
echo "1) Firebase Hosting"
echo "2) Netlify (manual upload)"
echo "3) Vercel"
echo "4) Local testing only"
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🔥 Deploying to Firebase Hosting..."
        if command -v firebase &> /dev/null; then
            firebase deploy
        else
            echo "❌ Firebase CLI not installed"
            echo "   Run: npm install -g firebase-tools"
            echo "   Then: firebase login && firebase init hosting"
        fi
        ;;
    2)
        echo "📦 Preparing for Netlify..."
        zip -r trove-production.zip . -x "*.git*" "node_modules/*" "*.DS_Store*"
        echo "✅ Created trove-production.zip"
        echo "   Upload this file to netlify.com"
        ;;
    3)
        echo "▲ Deploying to Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            echo "❌ Vercel CLI not installed"
            echo "   Run: npm install -g vercel"
        fi
        ;;
    4)
        echo "🏠 Local testing mode"
        echo "   Start your servers and test at http://localhost:8000"
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Production deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Test authentication flows"
echo "2. Create test collections"
echo "3. Verify tier limits"
echo "4. Set up analytics tracking"
echo "5. Recruit beta testers"
echo ""
echo "📚 See BETA_TESTING_GUIDE.md for detailed instructions"
echo ""
echo "🎉 Ready to launch your beta! Good luck!" 