"use client";
import React, { useState, useRef } from "react";
import toast from "react-hot-toast";

interface ScreenRecorderProps {
  className?: string;
}

const ScreenRecorder: React.FC<ScreenRecorderProps> = ({ className }) => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      // Request screen capture with audio
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: "browser",
          cursor: "always",
        } as any,
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        } as any,
      });

      // Get system audio if available
      let audioStream: MediaStream | null = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        });
      } catch (audioError) {
        console.warn("Could not capture microphone audio:", audioError);
        toast("Recording screen without microphone audio", { icon: "⚠️" });
      }

      // Combine streams
      let combinedStream: MediaStream;
      if (audioStream) {
        const audioTracks = audioStream.getAudioTracks();
        const displayAudioTracks = displayStream.getAudioTracks();
        
        combinedStream = new MediaStream([
          ...displayStream.getVideoTracks(),
          ...displayAudioTracks,
          ...audioTracks,
        ]);
      } else {
        combinedStream = displayStream;
      }

      streamRef.current = combinedStream;
      recordedChunksRef.current = [];

      // Create MediaRecorder with optimal settings
      const options = {
        mimeType: "video/webm;codecs=vp9,opus",
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
      };

      // Fallback to vp8 if vp9 is not supported
      let mimeType = options.mimeType;
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "video/webm;codecs=vp8,opus";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "video/webm";
        }
      }

      const mediaRecorder = new MediaRecorder(combinedStream, {
        ...options,
        mimeType,
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        saveRecording();
      };

      // Handle when user stops screen sharing from browser UI
      displayStream.getVideoTracks()[0].onended = () => {
        if (isRecording) {
          stopRecording();
          toast("Screen recording stopped", { icon: "🛑" });
        }
      };

      mediaRecorder.start(100); // Collect data every 100ms
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success("Screen recording started!");
      
    } catch (error: any) {
      // Only log actual errors, not user cancellations
      if (error.name === "NotAllowedError") {
        // User cancelled the screen share dialog - this is normal
        console.log("User cancelled screen recording");
        toast("Screen recording cancelled", { icon: "ℹ️" });
      } else {
        console.error("Error starting screen recording:", error);
        toast.error("Failed to start screen recording");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    setIsRecording(false);
    toast.success("Screen recording stopped!");
  };

  const saveRecording = () => {
    if (recordedChunksRef.current.length === 0) {
      toast.error("No recording data available");
      return;
    }

    // Create blob from recorded chunks
    const blob = new Blob(recordedChunksRef.current, {
      type: "video/webm",
    });

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style.display = "none";
    a.href = url;
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `meeting-recording-${timestamp}.webm`;
    
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);

    toast.success("Recording saved successfully!");
    recordedChunksRef.current = [];
  };

  return (
    <div className={className}>
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
          isRecording
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-green-500 hover:bg-green-600 text-white"
        }`}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </button>
    </div>
  );
};

export default ScreenRecorder;
