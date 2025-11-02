"use client";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { FaMicrophone } from "react-icons/fa";

// Note: For production use, integrate with APIs like:
// - Deepgram (https://deepgram.com/)
// - AssemblyAI (https://www.assemblyai.com/)
// - Google Cloud Speech-to-Text
// - Azure Speech Services
// Current implementation uses Web Speech API which has limitations

interface LiveSubtitlesProps {
  remoteStreams: MediaStream[];
  names: string[];
  className?: string;
}

interface Subtitle {
  name: string;
  text: string;
  timestamp: number;
}

const LiveSubtitles: React.FC<LiveSubtitlesProps> = ({ remoteStreams, names, className }) => {
  const [showUserList, setShowUserList] = useState(false);
  const [enabledUsers, setEnabledUsers] = useState<Set<number>>(new Set());
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const recognitionsRef = useRef<Map<number, any>>(new Map());
  const audioContextsRef = useRef<Map<number, AudioContext>>(new Map());

  // Check browser support
  const SpeechRecognition = typeof window !== 'undefined' 
    ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
    : null;

  const toggleUserSubtitle = (userIndex: number) => {
    const newEnabled = new Set(enabledUsers);
    
    if (newEnabled.has(userIndex)) {
      // Disable
      newEnabled.delete(userIndex);
      stopRecognitionForUser(userIndex);
      toast(`Subtitles disabled for ${names[userIndex]}`, { icon: "🔇" });
    } else {
      // Enable
      newEnabled.add(userIndex);
      startRecognitionForUser(userIndex);
      toast.success(`Subtitles enabled for ${names[userIndex]}`);
    }
    
    setEnabledUsers(newEnabled);
  };

  const startRecognitionForUser = (userIndex: number) => {
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported in this browser");
      return;
    }

    const stream = remoteStreams[userIndex];
    if (!stream) {
      console.log("No stream available for user", userIndex);
      return;
    }

    try {
      console.log(`Starting recognition for ${names[userIndex]}`);
      
      // Create a new audio element to play the remote stream (silent)
      const audio = new Audio();
      audio.muted = false; // Don't mute - we need the audio for recognition
      audio.srcObject = stream;
      audio.volume = 0; // Set volume to 0 so it doesn't actually play
      audio.play().catch(e => console.log("Audio play error:", e));

      // Create speech recognition instance that listens to system audio
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      let lastTranscript = "";
      
      recognition.onstart = () => {
        console.log(`Recognition started for ${names[userIndex]}`);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript.trim() && transcript !== lastTranscript) {
          lastTranscript = transcript;
          console.log(`Transcript for ${names[userIndex]}:`, transcript);
          
          setSubtitles(prev => {
            // Remove old subtitle for this user
            const filtered = prev.filter(s => s.name !== names[userIndex]);
            return [
              ...filtered,
              {
                name: names[userIndex],
                text: transcript.trim(),
                timestamp: Date.now()
              }
            ];
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.log(`Recognition error for ${names[userIndex]}:`, event.error);
        
        if (event.error === "not-allowed") {
          toast.error("Microphone permission needed for subtitles");
        }
      };

      recognition.onend = () => {
        console.log(`Recognition ended for ${names[userIndex]}`);
        // Auto-restart if still enabled
        if (enabledUsers.has(userIndex) && remoteStreams[userIndex]) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (error) {
              console.log("Recognition restart failed:", error);
            }
          }, 100);
        }
      };

      recognition.start();
      recognitionsRef.current.set(userIndex, recognition);
      
    } catch (error) {
      console.error("Failed to start recognition:", error);
      toast.error(`Failed to enable subtitles for ${names[userIndex]}`);
    }
  };

  const stopRecognitionForUser = (userIndex: number) => {
    const recognition = recognitionsRef.current.get(userIndex);
    if (recognition) {
      recognition.stop();
      recognitionsRef.current.delete(userIndex);
    }

    const audioContext = audioContextsRef.current.get(userIndex);
    if (audioContext) {
      audioContext.close();
      audioContextsRef.current.delete(userIndex);
    }

    // Remove subtitles for this user
    setSubtitles(prev => prev.filter(s => s.name !== names[userIndex]));
  };

  // Clean up old subtitles
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitles(prev => prev.filter(s => Date.now() - s.timestamp < 3000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionsRef.current.forEach((recognition) => recognition.stop());
      audioContextsRef.current.forEach((context) => context.close());
    };
  }, []);

  if (!SpeechRecognition) {
    return null;
  }

  return (
    <>
      {/* User List Toggle Button */}
      <button
        onClick={() => setShowUserList(!showUserList)}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Manage Subtitles"
      >
        <FaMicrophone className="w-5 h-5" />
        {enabledUsers.size > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {enabledUsers.size}
          </span>
        )}
      </button>

      {/* User List Panel */}
      {showUserList && (
        <div className="fixed bottom-20 right-4 bg-white rounded-lg shadow-2xl p-4 w-72 max-h-96 overflow-y-auto z-50 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Subtitle Controls</h3>
            <button
              onClick={() => setShowUserList(false)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          </div>
          
          {names.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">No users in meeting</p>
          ) : (
            <div className="space-y-2">
              {names.map((name, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span className="text-gray-700 text-sm font-medium truncate flex-1">
                    {name || `User ${index + 1}`}
                  </span>
                  <button
                    onClick={() => toggleUserSubtitle(index)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      enabledUsers.has(index)
                        ? "bg-green-500 hover:bg-green-600 text-white"
                        : "bg-gray-300 hover:bg-gray-400 text-gray-700"
                    }`}
                  >
                    {enabledUsers.has(index) ? "Enabled" : "Enable"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtitles Display */}
      {subtitles.length > 0 && (
        <div className="fixed bottom-20 right-20 max-w-md space-y-2 z-40">
          {subtitles.map((subtitle, index) => (
            <div
              key={`${subtitle.name}-${subtitle.timestamp}`}
              className="bg-black/80 text-white px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm animate-fade-in"
            >
              <div className="flex items-start gap-2">
                <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">
                  {subtitle.name}:
                </span>
                <p className="text-sm leading-relaxed flex-1">{subtitle.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default LiveSubtitles;
