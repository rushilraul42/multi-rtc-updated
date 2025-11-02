"use client";
import React, { useEffect, useRef, useState } from "react";
import { firestore } from "../app/firebaseConfig";
import { FaTimes, FaExpand, FaCompress } from "react-icons/fa";

interface ScreenShareViewerProps {
  callId: string;
  remoteStreams: (MediaStream | null)[];
  nameList: string[];
}

const ScreenShareViewer: React.FC<ScreenShareViewerProps> = ({
  callId,
  remoteStreams,
  nameList,
}) => {
  const [screenShareActive, setScreenShareActive] = useState(false);
  const [screenSharerIndex, setScreenSharerIndex] = useState<number>(-1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const screenVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!callId) return;

    const callDoc = firestore.collection("calls").doc(callId);
    
    // Listen for screen sharing updates
    const unsubscribe = callDoc.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!data) return;

      // Check if anyone is screen sharing
      let isSharing = false;
      let sharerIdx = -1;

      Object.keys(data).forEach((key) => {
        if (key.startsWith("screenSharing_") && data[key] === true) {
          isSharing = true;
          sharerIdx = parseInt(key.replace("screenSharing_", ""));
        }
      });

      setScreenShareActive(isSharing);
      setScreenSharerIndex(sharerIdx);
    });

    return () => unsubscribe();
  }, [callId]);

  // Update screen share video when stream changes
  useEffect(() => {
    if (screenShareActive && screenSharerIndex >= 0 && remoteStreams[screenSharerIndex]) {
      const stream = remoteStreams[screenSharerIndex];
      
      // Find the screen share track (second video track)
      const videoTracks = stream?.getVideoTracks() || [];
      
      if (videoTracks.length > 0 && screenVideoRef.current) {
        // For now, show the same stream (will be screen when they share)
        screenVideoRef.current.srcObject = stream;
      }
    }
  }, [screenShareActive, screenSharerIndex, remoteStreams]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!screenShareActive || screenSharerIndex < 0) {
    return null;
  }

  const sharerName = nameList[screenSharerIndex] || `Participant ${screenSharerIndex + 1}`;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 bg-black/95 z-50 flex flex-col"
    >
      {/* Header */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-green-500 w-3 h-3 rounded-full animate-pulse"></div>
          <span className="text-white font-semibold text-lg">
            {sharerName}'s Screen
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <FaCompress size={20} /> : <FaExpand size={20} />}
          </button>
          <button
            onClick={() => setScreenShareActive(false)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            title="Minimize"
          >
            <FaTimes size={20} />
          </button>
        </div>
      </div>

      {/* Screen Share Video */}
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          ref={screenVideoRef}
          autoPlay
          playsInline
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Footer Info */}
      <div className="bg-gradient-to-t from-black/80 to-transparent p-4 text-center">
        <p className="text-white/70 text-sm">
          Press ESC or click × to minimize • {sharerName} is presenting
        </p>
      </div>
    </div>
  );
};

export default ScreenShareViewer;
