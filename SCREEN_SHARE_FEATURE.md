# Screen Share Feature Documentation

## Overview
The screen sharing feature allows both hosts and participants to share their screen with everyone in the meeting. When someone shares their screen, it replaces their video feed and is visible to all participants in real-time.

## Features

### For Host:
- ✅ Share screen with all participants
- ✅ Share system audio along with screen
- ✅ Screen share button in control panel
- ✅ Visual indicator when sharing (blue highlight)
- ✅ Auto-stop when closing screen share from system

### For Participants (Users):
- ✅ Share screen with host and other participants
- ✅ Share system audio along with screen
- ✅ Screen share button in control panel
- ✅ Visual indicator when sharing (blue highlight)
- ✅ Auto-stop when closing screen share from system

## How to Use

### Starting Screen Share:
1. **Click the screen share button** (monitor icon) in the control panel
2. **Select what to share**:
   - Entire screen
   - Application window
   - Browser tab
3. **Choose audio options**:
   - Check "Share system audio" to include computer sounds
4. **Click "Share"** to start broadcasting

### Stopping Screen Share:
- **Option 1**: Click the screen share button again
- **Option 2**: Click "Stop sharing" in the browser's screen share indicator
- **Automatic**: Screen sharing stops if you close the shared window/tab

## Technical Details

### Implementation:
- Uses WebRTC's `getDisplayMedia()` API
- Replaces video track in all peer connections
- Merges screen audio with microphone audio
- Updates Firestore to track who is sharing

### Browser Support:
- ✅ Chrome/Edge (best support)
- ✅ Firefox (good support)
- ⚠️ Safari (limited features)

### Audio Mixing:
When screen sharing with audio:
- Microphone audio continues
- System audio from shared screen is added
- Both audio sources are combined and sent to all participants

## What Gets Shared

When you share your screen, participants can see:
- ✅ Your entire screen or selected window
- ✅ System audio (if enabled)
- ✅ Video playback (YouTube, Netflix, etc.)
- ✅ Presentations and documents
- ✅ Any application you select

## Privacy & Security

### What Others CAN'T See:
- ❌ Other browser tabs (unless you share them)
- ❌ Notifications (automatically hidden by browser)
- ❌ Personal files (unless in shared window)

### Best Practices:
1. Close sensitive tabs before sharing
2. Check what's visible in the selected window
3. Disable notifications during screen share
4. Use "Share application window" instead of entire screen when possible

## Visual Indicators

### When You're Sharing:
- Screen share button turns **blue** with filled icon
- Browser shows "You are sharing" indicator
- Your video feed shows your screen instead of webcam

### When Someone Else is Sharing:
- Their video feed shows their screen
- Name label remains visible
- Connection indicator stays active

## Troubleshooting

### Screen share button disabled?
- Make sure you're **in a call** (connected to meeting)
- Check browser permissions for screen sharing

### No audio from shared screen?
- Make sure you checked "Share system audio" when starting
- Some browsers don't support system audio capture
- Try sharing a specific tab instead of entire screen

### Screen share stops automatically?
- Normal behavior when closing shared window
- Browser security feature
- Just click share again to restart

### Others can't see my screen?
- Check your internet connection
- Ensure peer connections are established
- Try stopping and starting screen share again

## Limitations

- Only **one person can share** their screen at a time (though the code supports multiple sharers, it's better UX to have one active sharer)
- System audio sharing **not available on all browsers**
- High-resolution screen sharing may require **good internet connection**
- Screen sharing uses **more bandwidth** than regular video

## Future Enhancements

Potential improvements:
- [ ] Whiteboard/annotation tools
- [ ] Pointer/cursor highlighting
- [ ] Screen share layout optimization
- [ ] Picture-in-picture mode
- [ ] Screen share recording
- [ ] Resolution/quality settings

---

**Note**: Screen sharing is bandwidth-intensive. For best performance, ensure all participants have stable internet connections.
