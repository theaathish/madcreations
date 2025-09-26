#!/bin/bash

# Firebase Storage CORS Configuration Script
# Run this script to fix CORS issues with Firebase Storage

echo "🔧 Setting up Firebase Storage CORS configuration..."

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if user is logged in
echo "🔐 Checking Firebase authentication..."
if ! firebase projects:list &> /dev/null; then
    echo "❌ Please login to Firebase first:"
    echo "firebase login"
    exit 1
fi

# Set CORS configuration
echo "🌐 Configuring CORS for Firebase Storage..."
firebase storage:cors:set cors.json

if [ $? -eq 0 ]; then
    echo "✅ CORS configuration updated successfully!"
    echo "🔄 Deploying storage rules..."
    firebase deploy --only storage

    if [ $? -eq 0 ]; then
        echo "✅ Storage rules deployed successfully!"
        echo "🎉 Firebase Storage is now configured for your web app."
        echo "You can now upload images without CORS errors."
    else
        echo "⚠️ CORS set but storage rules deployment failed."
        echo "Please run: firebase deploy --only storage"
    fi
else
    echo "❌ Failed to set CORS configuration."
    echo "Please check your Firebase project permissions."
fi
