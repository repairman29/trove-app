#!/bin/bash

echo "🏺 Checking Trove Deployment Status..."
echo "====================================="

# Check Frontend
echo "🌐 Testing Frontend..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://collectors-hub-app-464902.web.app)
if [ "$FRONTEND_STATUS" = "200" ]; then
    echo "✅ Frontend: Online"
else
    echo "❌ Frontend: Error (HTTP $FRONTEND_STATUS)"
fi

# Check API
echo "⚡ Testing API..."
API_RESPONSE=$(curl -s https://us-central1-collectors-hub-app-464902.cloudfunctions.net/api/health)
if [[ $API_RESPONSE == *"healthy"* ]]; then
    echo "✅ API: Online"
    echo "   Response: $API_RESPONSE"
else
    echo "❌ API: Error"
    echo "   Response: $API_RESPONSE"
fi

echo ""
echo "🎉 Trove Production URLs:"
echo "================================"
echo "🌍 Frontend: https://collectors-hub-app-464902.web.app"
echo "⚡ API: https://us-central1-collectors-hub-app-464902.cloudfunctions.net/api"
echo "📊 Firebase Console: https://console.firebase.google.com/project/collectors-hub-app-464902"
echo ""
echo "✨ Your collection management app is live and ready for users worldwide!" 