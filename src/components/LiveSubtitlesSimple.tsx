"use client";
import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { FaMicrophone } from "react-icons/fa";

interface LiveSubtitlesSimpleProps {
  remoteStreams: MediaStream[];
  names: string[];
  className?: string;
}

interface Subtitle {
  name: string;
  text: string;
  timestamp: number;
}

const LiveSubtitlesSimple: React.FC<LiveSubtitlesSimpleProps> = ({ 
  remoteStreams, 
  names, 
  className 
}) => {
  const [showUserList, setShowUserList] = useState(false);
  const [enabledUsers, setEnabledUsers] = useState<Set<number>>(new Set());
  const [subtitles, setSubtitles] = useState<Subtitle[]>([]);
  const audioAnalyzersRef = useRef<Map<number, { context: AudioContext; analyzer: AnalyserNode }>>(new Map());
  const recognitionsRef = useRef<Map<number, any>>(new Map());
  const audioElementsRef = useRef<Map<number, HTMLAudioElement>>(new Map());

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

  const startRecognitionForUser = async (userIndex: number) => {
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported. Use Chrome/Edge.");
      return;
    }

    const stream = remoteStreams[userIndex];
    if (!stream) {
      console.log("No stream for user", userIndex);
      return;
    }

    try {
      console.log(`Starting subtitles for ${names[userIndex]}`);

      // Method: Route remote audio through system and let Speech Recognition pick it up
      // This requires the remote audio to be played (but can be at low volume)
      
      const audioElement = document.createElement('audio');
      audioElement.srcObject = stream;
      audioElement.autoplay = true;
      audioElement.volume = 0.01; // Very low but not muted (required for recognition)
      document.body.appendChild(audioElement);
      
      audioElementsRef.current.set(userIndex, audioElement);

      // Start speech recognition (it will listen to system audio including our audio element)
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      let interimTimeout: NodeJS.Timeout;

      recognition.onresult = (event: any) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + " ";
          } else {
            interimTranscript = transcript;
          }
        }

        const displayText = (finalTranscript || interimTranscript).trim();

        if (displayText) {
          clearTimeout(interimTimeout);
          
          setSubtitles(prev => {
            const filtered = prev.filter(s => s.name !== names[userIndex]);
            return [
              ...filtered,
              {
                name: names[userIndex],
                text: displayText,
                timestamp: Date.now()
              }
            ];
          });

          // Save final transcript to panel
          if (finalTranscript && typeof window !== 'undefined') {
            const addTranscriptEntry = (window as any).addTranscriptEntry;
            if (addTranscriptEntry) {
              addTranscriptEntry(names[userIndex], finalTranscript.trim());
            }
          }

          // Clear interim results after a delay if no new results come
          if (!finalTranscript && interimTranscript) {
            interimTimeout = setTimeout(() => {
              setSubtitles(prev => prev.filter(s => s.name !== names[userIndex]));
            }, 2000);
          }
        }
      };

      recognition.onerror = (event: any) => {
        // Ignore common errors that don't need user notification
        if (event.error === "no-speech" || event.error === "aborted" || event.error === "audio-capture") {
          return;
        }
        
        console.log(`Recognition error for ${names[userIndex]}:`, event.error);
        
        if (event.error === "not-allowed") {
          toast.error("Microphone permission needed for subtitles");
          stopRecognitionForUser(userIndex);
          const newEnabled = new Set(enabledUsers);
          newEnabled.delete(userIndex);
          setEnabledUsers(newEnabled);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still enabled
        if (enabledUsers.has(userIndex)) {
          setTimeout(() => {
            try {
              recognition.start();
            } catch (e) {
              console.log("Restart error:", e);
            }
          }, 100);
        }
      };

      await recognition.start();
      recognitionsRef.current.set(userIndex, recognition);

      console.log(`Recognition started for ${names[userIndex]}`);
      
    } catch (error) {
      console.error("Failed to start recognition:", error);
      toast.error(`Failed to enable subtitles for ${names[userIndex]}`);
    }
  };

  const stopRecognitionForUser = (userIndex: number) => {
    // Stop recognition
    const recognition = recognitionsRef.current.get(userIndex);
    if (recognition) {
      try {
        recognition.stop();
      } catch (e) {
        console.log("Stop error:", e);
      }
      recognitionsRef.current.delete(userIndex);
    }

    // Remove audio element
    const audioElement = audioElementsRef.current.get(userIndex);
    if (audioElement) {
      audioElement.srcObject = null;
      audioElement.remove();
      audioElementsRef.current.delete(userIndex);
    }

    // Clean up audio analyzer
    const analyzer = audioAnalyzersRef.current.get(userIndex);
    if (analyzer) {
      analyzer.context.close();
      audioAnalyzersRef.current.delete(userIndex);
    }

    // Remove subtitles for this user
    setSubtitles(prev => prev.filter(s => s.name !== names[userIndex]));
  };

  // Clean up old subtitles
  useEffect(() => {
    const interval = setInterval(() => {
      setSubtitles(prev => prev.filter(s => Date.now() - s.timestamp < 4000));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      recognitionsRef.current.forEach((recognition) => {
        try {
          recognition.stop();
        } catch (e) {}
      });
      audioElementsRef.current.forEach((audio) => {
        audio.srcObject = null;
        audio.remove();
      });
      audioAnalyzersRef.current.forEach((analyzer) => analyzer.context.close());
    };
  }, []);

  // Auto-disable subtitles for users who left
  useEffect(() => {
    const currentUserIndices = new Set(remoteStreams.map((_, i) => i));
    enabledUsers.forEach(userIndex => {
      if (!currentUserIndices.has(userIndex)) {
        stopRecognitionForUser(userIndex);
        const newEnabled = new Set(enabledUsers);
        newEnabled.delete(userIndex);
        setEnabledUsers(newEnabled);
      }
    });
  }, [remoteStreams.length]);

  const handleToggleUserList = () => {
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported in this browser. Please use Chrome or Edge.");
      return;
    }
    setShowUserList(!showUserList);
  };

  return (
    <>
      {/* User List Toggle Button */}
      <button
        onClick={handleToggleUserList}
        className="fixed bottom-36 right-4 bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="Manage Subtitles"
      >
        <FaMicrophone className="w-5 h-5" />
        {enabledUsers.size > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {enabledUsers.size}
          </span>
        )}
      </button>

      {/* User List Panel */}
      {showUserList && (
        <div className="fixed bottom-52 right-4 bg-white rounded-lg shadow-2xl p-4 w-72 max-h-96 overflow-y-auto z-50 animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Subtitle Controls</h3>
            <button
              onClick={() => setShowUserList(false)}
              className="text-gray-500 hover:text-gray-700 text-xl leading-none"
            >
              ×
            </button>
          </div>
          
          <p className="text-xs text-gray-500 mb-3">
            Note: Audio must be playing for recognition to work
          </p>
          
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
        <div className="fixed bottom-56 right-4 max-w-lg space-y-2 z-40">
          {subtitles.map((subtitle) => (
            <div
              key={`${subtitle.name}-${subtitle.timestamp}`}
              className="bg-black/90 text-white px-4 py-3 rounded-lg shadow-2xl backdrop-blur-sm animate-fade-in border border-yellow-400/30"
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider">
                  {subtitle.name}
                </span>
                <p className="text-base leading-relaxed">{subtitle.text}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default LiveSubtitlesSimple;
