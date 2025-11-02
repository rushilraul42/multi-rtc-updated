# Chat Feature Documentation

## ✨ Real-Time Chat Feature

A real-time chat feature has been added to the video calling application. All participants in a meeting can see and send messages instantly.

### Features:

✅ **Real-time messaging** - Messages appear instantly for all participants
✅ **Unread message counter** - Shows number of unread messages when chat is closed
✅ **Message timestamps** - Each message shows when it was sent
✅ **Sender identification** - Shows who sent each message
✅ **Responsive design** - Chat box positioned at bottom-left corner
✅ **Minimize/Maximize** - Can be opened/closed as needed
✅ **Smooth animations** - Scrolls to latest messages automatically

### Location:

- **Bottom-left corner** of the screen
- **Floats above the video grid**
- **Always accessible** when in a call

## 🔧 Firebase Firestore Rules

To make the chat work, update your Firestore security rules in Firebase Console:

### Steps to Update Rules:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **videocall-2baaf**
3. Navigate to **Firestore Database**
4. Click the **Rules** tab
5. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write calls and subcollections
    match /calls/{callId} {
      allow read, write: if request.auth != null;
      
      // Allow chat messages within a call
      match /chat/{messageId} {
        allow read, write: if request.auth != null;
      }
      
      // Allow other subcollections
      match /{document=**} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

6. Click **Publish**

### OR for Testing Only (Less Secure):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

⚠️ **Note**: The second option allows anyone to read/write. Only use for testing!

## 🎯 How to Use:

### For Host:
1. Start a meeting from `/host` page
2. Click the chat icon (💬) in the bottom-left corner
3. Type a message and press Enter or click Send
4. Messages are visible to all participants

### For Users:
1. Join a meeting from `/meet` page
2. Enter your name
3. Click the chat icon (💬) in the bottom-left corner
4. Send and receive messages in real-time

## 📊 Data Structure:

Messages are stored in Firestore:
```
calls/{callId}/chat/{messageId}
  ├── text: string (message content)
  ├── senderName: string (who sent it)
  └── timestamp: number (when it was sent)
```

## 🎨 UI Features:

- **Blue bubble** for your messages (right-aligned)
- **White bubble** for others' messages (left-aligned)
- **Unread badge** shows on chat icon when closed
- **Auto-scroll** to latest messages
- **500 character limit** per message
- **Smooth animations** when opening/closing

## 🔥 Technologies Used:

- **Firestore** - Real-time database
- **React Hooks** - State management
- **Tailwind CSS** - Styling
- **React Icons** - Chat icons
- **React Hot Toast** - Error notifications

## 🐛 Troubleshooting:

**Chat not showing:**
- Ensure `callId` is set (meeting must be started/joined)
- Check browser console for errors

**Messages not sending:**
- Verify Firestore rules are updated
- Check Firebase credentials in `.env`
- Ensure you're authenticated

**Messages not appearing in real-time:**
- Check internet connection
- Verify Firestore is enabled in Firebase Console
- Check browser console for permission errors

## 🚀 Future Enhancements (Optional):

- [ ] Message reactions (👍, ❤️, etc.)
- [ ] File/image sharing
- [ ] Message editing/deletion
- [ ] Typing indicators
- [ ] Message search
- [ ] Chat history export
- [ ] Private messages between participants
