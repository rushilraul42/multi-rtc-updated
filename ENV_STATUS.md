# 🔑 Environment Variables Quick Reference

## ✅ Current Configuration Status

| Variable | Status | Description |
|----------|--------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | ✅ Configured | Firebase Web API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ Configured | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | ⚠️ **Need to verify** | Realtime Database URL |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | ✅ Configured | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ Configured | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ Configured | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | ✅ Configured | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | ✅ Configured | Firebase Analytics ID |
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | ❌ **Required** | Base64 Service Account (for screenshot analysis) |
| `NEXT_PUBLIC_OPENAI_API_KEY` | ❌ **Required** | OpenAI API Key (for transcription) |
| `NEXT_GPT_4O_KEY` | ❌ **Required** | OpenAI GPT-4 API Key (for Q&A) |
| `NEXT_PUBLIC_GROK_API_KEY` | ❌ **Required** | Groq API Key (for Mixtral AI) |

## 🚨 Action Items

### 1. Get Realtime Database URL
```bash
# Go to Firebase Console → Realtime Database
# Copy the URL (format: https://[project-id]-default-rtdb.firebaseio.com)
```

### 2. Generate Firebase Service Account Base64
```powershell
# Download service account JSON from Firebase Console
# Then run:
[Convert]::ToBase64String([System.IO.File]::ReadAllBytes("serviceAccount.json"))
```

### 3. Get OpenAI API Keys
- Visit: https://platform.openai.com/api-keys
- Create new API key
- Copy and paste into `.env`

### 4. Get Groq API Key
- Visit: https://console.groq.com/keys
- Create new API key
- Copy and paste into `.env`

## 🔄 After Adding Keys

```powershell
# Restart the development server
# Press Ctrl+C in the terminal, then:
npm run dev
```

## 📦 Features by Environment Variable

| Feature | Required Variables |
|---------|-------------------|
| **Basic Video Calls** | All `NEXT_PUBLIC_FIREBASE_*` |
| **Real-time Transcription** | `NEXT_PUBLIC_OPENAI_API_KEY` |
| **AI Q&A Generation** | `NEXT_GPT_4O_KEY` or `NEXT_PUBLIC_GROK_API_KEY` |
| **Screenshot Analysis** | `FIREBASE_SERVICE_ACCOUNT_BASE64` + `NEXT_GPT_4O_KEY` |
| **Audio Recording** | `NEXT_PUBLIC_OPENAI_API_KEY` + `NEXT_PUBLIC_GROK_API_KEY` |

## 🎯 Current Working Features

With current configuration:
- ✅ Video conferencing (WebRTC)
- ✅ Firebase Authentication
- ✅ User management
- ⚠️ Realtime Database (verify URL)

**Not yet working** (need API keys):
- ❌ Real-time transcription
- ❌ AI question detection
- ❌ AI answer generation
- ❌ Screenshot analysis

## 🔐 Security Reminder

Never share or commit these files:
- `.env`
- `.env.local`
- `serviceAccount.json`
