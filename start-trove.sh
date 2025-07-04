#!/bin/bash
echo "🏺 Starting Trove Application..."
echo "================================"

# Kill any existing processes
pkill -f "node.*server.js" 2>/dev/null
pkill -f "python3.*http.server" 2>/dev/null
sleep 2

# Start backend server
echo "🚀 Starting backend server..."
cd /Users/annaadkins/Projects/trove-app/backend
node src/server.js &
BACKEND_PID=$!

# Start frontend server
echo "🌐 Starting frontend server..."
cd /Users/annaadkins/Projects/trove-app
python3 -m http.server 8000 &
FRONTEND_PID=$!

# Wait for servers to start
sleep 3

# Test servers
echo "🔍 Testing servers..."
if curl -s "http://localhost:3001/health" > /dev/null; then
    echo "✅ Backend server running on http://localhost:3001"
else
    echo "❌ Backend server failed to start"
fi

if curl -s "http://localhost:8000/" > /dev/null; then
    echo "✅ Frontend server running on http://localhost:8000"
else
    echo "❌ Frontend server failed to start"
fi

echo ""
echo "🎉 Trove is ready!"
echo "================================"
echo "📱 Open your browser to: http://localhost:8000"
echo "🛑 To stop servers: pkill -f 'node.*server.js' && pkill -f 'python3.*http.server'"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for interrupt
trap 'echo ""; echo "🛑 Stopping Trove servers..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0' INT
wait
