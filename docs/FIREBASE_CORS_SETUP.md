# Firebase Storage CORS Configuration Guide

## Problem
When uploading or deleting photos from the browser, you see CORS errors in the console:
```
Access to XMLHttpRequest from origin 'http://localhost:3000' 
has been blocked by CORS policy: Response to preflight request 
doesn't pass access control check.
```

This happens because Firebase Storage bucket doesn't allow requests from your development or production domain.

## Solution: Apply CORS Configuration

### Prerequisites
1. **Google Cloud SDK** installed on your machine
   - Install: https://cloud.google.com/sdk/docs/install
   
2. **Authentication with Google Cloud**
   ```bash
   gcloud auth login
   ```
   
3. **Project ID set correctly**
   ```bash
   gcloud config set project trip-noute
   ```

### Step 1: Verify CORS Configuration File
The file `cors.json` should exist in your project root with:

```json
[
  {
    "origin": ["http://localhost:3000", "http://localhost:3001"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST", "OPTIONS"],
    "responseHeader": ["Content-Type", "x-goog-meta-*"],
    "maxAgeSeconds": 3600
  },
  {
    "origin": ["https://*.vercel.app", "https://*.firebaseapp.com"],
    "method": ["GET", "HEAD", "DELETE", "PUT", "POST", "OPTIONS"],
    "responseHeader": ["Content-Type", "x-goog-meta-*"],
    "maxAgeSeconds": 3600
  }
]
```

### Step 2: Apply Configuration with gsutil
Run this command from your project root:

```bash
# Single-line command
gsutil cors set cors.json gs://trip-noute.appspot.com
```

### Step 3: Verify Configuration
```bash
# View current CORS settings
gsutil cors get gs://trip-noute.appspot.com
```

You should see output matching the `cors.json` file.

### Step 4: Restart Development Server
```bash
# Kill current dev server (Ctrl+C)
# Then restart
npm run dev
```

### Step 5: Test
1. Open http://localhost:3000
2. Go to Edit Place modal
3. Try uploading a photo - should work without CORS errors
4. Try deleting a photo - should work without CORS errors

## Troubleshooting

### Error: "command not found: gsutil"
- Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install
- Verify: `gcloud --version`

### Error: "gcloud: command not found"
- Google Cloud SDK may not be in PATH
- On macOS: `/usr/local/Caskroom/google-cloud-sdk/latest/google-cloud-sdk/bin/gsutil`

### Error: "Access denied" or "403"
- Run `gcloud auth login` again
- Verify project: `gcloud config get-value project`
- Should return `trip-noute`

### Error: "Bucket not found"
- Verify bucket name: `gsutil ls`
- Should list `gs://trip-noute.appspot.com`
- If not found, contact Firebase support

## What This Configuration Does

| Method | Purpose | Allowed |
|--------|---------|---------|
| GET | Download photos | ✅ Yes |
| HEAD | Check file exists | ✅ Yes |
| PUT | Upload photos | ✅ Yes |
| POST | Create/upload | ✅ Yes |
| DELETE | Remove photos | ✅ Yes |
| OPTIONS | CORS preflight | ✅ Yes |

## CORS Headers Added
- `Content-Type`: Allows specifying file type (image/jpeg, etc.)
- `x-goog-meta-*`: Allows custom metadata

## Origins Configured

### Development
- `http://localhost:3000` - Main dev port
- `http://localhost:3001` - Alternative dev port

### Production
- `https://*.vercel.app` - Vercel deployments
- `https://*.firebaseapp.com` - Firebase Hosting

**Note:** Using wildcard (`*`) for production not recommended. Replace with your specific domain before going live.

## Cache Duration
- `maxAgeSeconds: 3600` = 1 hour
- After 1 hour, browser re-validates CORS headers with server
- Safe default for development and production

## Next Steps
1. After applying CORS, test photo upload/delete
2. Once working, push code to develop branch
3. Deploy to Firebase Hosting with same CORS settings
4. Production deployment will also respect these settings

## Reference
- Firebase Storage Security: https://firebase.google.com/docs/storage/security
- CORS documentation: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- gsutil CORS: https://cloud.google.com/storage/docs/configuring-cors
