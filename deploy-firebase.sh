#!/bin/bash

# Firebase Deploy Script for MadCreations
# This script deploys Firebase Storage and Firestore rules to fix CORS issues

echo "🔥 Deploying Firebase Rules..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
echo "📝 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please login to Firebase first:"
    echo "firebase login"
    exit 1
fi

# Deploy rules
echo "🚀 Deploying Firebase Storage and Firestore rules..."
firebase deploy --only storage,firestore:rules,firestore:indexes

if [ $? -eq 0 ]; then
    echo "✅ Firebase rules deployed successfully!"
    echo ""
    echo "🎉 CORS issue should now be resolved!"
    echo ""
    echo "📝 Next steps:"
    echo "1. Try uploading images in your admin panel"
    echo "2. The CORS errors should be gone"
    echo "3. Images should upload successfully to Firebase Storage"
else
    echo "❌ Failed to deploy Firebase rules"
    exit 1
fi
