#!/bin/bash
# TripNoute v2 - Firebase Storage CORS Configuration Setup
# 
# This script applies CORS configuration to your Firebase Storage bucket
# to allow DELETE, PUT, POST requests from localhost:3000 and production domains
#
# Prerequisites:
# 1. Google Cloud SDK installed: https://cloud.google.com/sdk/docs/install
# 2. gcloud auth login (already done if you have Firebase deployed)
# 3. Your Firebase project ID: trip-noute

# Your Firebase Storage bucket name
BUCKET_NAME="trip-noute.appspot.com"

# Verify bucket name
echo "=========================================="
echo "Firebase Storage CORS Configuration Setup"
echo "=========================================="
echo ""
echo "Bucket: $BUCKET_NAME"
echo ""
echo "This will allow:"
echo "  ✓ GET, HEAD, DELETE, PUT, POST, OPTIONS"
echo "  ✓ From http://localhost:3000 (development)"
echo "  ✓ From https://*.vercel.app (production)"
echo "  ✓ From https://*.firebaseapp.com (Firebase Hosting)"
echo ""

# Check if cors.json exists
if [ ! -f "cors.json" ]; then
    echo "ERROR: cors.json not found in current directory!"
    echo "Make sure you're in the project root directory."
    exit 1
fi

echo "Applying CORS configuration..."
echo ""

# Apply CORS configuration
gsutil cors set cors.json gs://$BUCKET_NAME

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ SUCCESS! CORS configuration applied."
    echo ""
    echo "Verifying configuration..."
    gsutil cors get gs://$BUCKET_NAME
    echo ""
    echo "=========================================="
    echo "Next Steps:"
    echo "=========================================="
    echo "1. Restart your Next.js dev server"
    echo "2. Try photo upload/delete again"
    echo "3. Check browser console - CORS errors should be gone"
    echo ""
else
    echo ""
    echo "❌ FAILED! CORS configuration not applied."
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you have Google Cloud SDK installed"
    echo "2. Run: gcloud auth login"
    echo "3. Run: gcloud config set project trip-noute"
    echo "4. Try again: gsutil cors set cors.json gs://$BUCKET_NAME"
    echo ""
    exit 1
fi
