#!/bin/bash

pm2 stop backend-logiciel

echo "📦 Pulling latest changes from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🚀 Restarting PM2 service..."
pm2 restart backend-logiciel || pm2 start server.js --name backend-logiciel

echo "✅ Deployment complete!"