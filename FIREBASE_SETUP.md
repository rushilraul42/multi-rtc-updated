# Firebase Setup Guide

## 🔥 Firebase Configuration

Your Firebase credentials have been added to the `.env` file. Follow these steps to complete the setup:

### 1. Firebase Realtime Database Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **videocall-2baaf**
3. Navigate to **Build** → **Realtime Database**
4. Click **Create Database**
5. Choose a location (e.g., `us-central1`)
6. Start in **Test mode** (or use the rules below)

**Security Rules for Realtime Database:**
```json
{
  "rules": {
    "flowofwords": {
      "$callId": {
        ".read": true,
        ".write": true
      }
    }
  }
}
```

### 2. Firestore Database Setup

1. In Firebase Console, navigate to **Build** → **Firestore Database**
2. Click **Create database**
3. Start in **Production mode**
4. Choose a location (same as Realtime Database)

**Security Rules for Firestore:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /calls/{callId} {
      allow read, write: if true;
      match /{document=**} {
        allow read, write: if true;
      }
    }
  }
}
```

### 3. Firebase Storage Setup

1. Navigate to **Build** → **Storage**
2. Click **Get started**
3. Start in **Production mode**

**Security Rules for Storage:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /audio/{date}/{filename} {
      allow read, write: if true;
    }
  }
}
```

### 4. Firebase Authentication Setup

1. Navigate to **Build** → **Authentication**
2. Click **Get started**
3. Enable **Email/Password** sign-in method
4. Create an admin user:
   - Email: `admin@gmail.com`
   - Password: (your secure password)

### 5. Firebase Admin SDK Setup (for Screenshot Analysis)

1. In Firebase Console, go to **Project Settings** → **Service Accounts**
2. Click **Generate new private key**
3. Save the JSON file as `serviceAccount.json` in your project root
4. Convert it to Base64:

**On Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("serviceAccount.json"))
```

**On Mac/Linux:**
```bash
cat serviceAccount.json | base64
```

5. Copy the Base64 output and update `.env`:
```
FIREBASE_SERVICE_ACCOUNT_BASE64=<your_base64_string_here>
```

### 6. Get API Keys

#### OpenAI API Key:
1. Go to [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create a new API key
3. Add to `.env`:
```
NEXT_PUBLIC_OPENAI_API_KEY=sk-...
NEXT_GPT_4O_KEY=sk-...
```

#### Groq API Key (for Mixtral):
1. Go to [Groq Console](https://console.groq.com/keys)
2. Create a new API key
3. Add to `.env`:
```
NEXT_PUBLIC_GROK_API_KEY=gsk_...
```

### 7. Update Database URL

Your Realtime Database URL should be in the format:
```
https://videocall-2baaf-default-rtdb.firebaseio.com
```

If it's different, update the `.env` file:
```
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://your-actual-db-url.firebaseio.com
```

### 8. Enable Firebase Services

Make sure these services are enabled in your Firebase project:
- ✅ Authentication (Email/Password)
- ✅ Realtime Database
- ✅ Firestore
- ✅ Storage
- ✅ Analytics (optional)

## 🚀 Running the Project

After completing the setup:

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 🔒 Security Notes

- **Never commit** `.env` or `.env.local` files to Git
- Use environment variables for all sensitive keys
- Update Firebase security rules for production
- Restrict API keys to specific domains in production

## 📝 Testing Firebase Connection

To verify Firebase is connected:
1. Start the dev server
2. Open the browser console
3. You should see: "user state changed" (from authContext)
4. No Firebase errors should appear

## 🆘 Troubleshooting

**Issue: "Firebase: Error (auth/api-key-not-valid-please-pass-a-valid-api-key)"**
- Check that API key in `.env` matches Firebase Console
- Restart dev server after changing `.env`

**Issue: "Permission denied" in Realtime Database**
- Update security rules to allow read/write
- Check database URL is correct

**Issue: Screenshot analysis not working**
- Verify `FIREBASE_SERVICE_ACCOUNT_BASE64` is set
- Ensure service account has proper permissions
- Check `NEXT_GPT_4O_KEY` is valid

## 📞 Support

If you encounter issues, check:
1. Firebase Console for service status
2. Browser console for JavaScript errors
3. Terminal for server errors
