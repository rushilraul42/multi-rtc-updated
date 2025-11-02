"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaFileAlt, FaDownload, FaTrash, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

interface TranscriptEntry {
  id: string;
  name: string;
  text: string;
  timestamp: Date;
}

interface TranscriptPanelProps {
  onTranscriptEntry?: (entry: TranscriptEntry) => void;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ onTranscriptEntry }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // Load transcript from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("meeting-transcript");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const entries = parsed.map((e: any) => ({
          ...e,
          timestamp: new Date(e.timestamp)
        }));
        setTranscript(entries);
      } catch (error) {
        console.error("Failed to load transcript:", error);
      }
    }
  }, []);

  // Save transcript to localStorage whenever it changes
  useEffect(() => {
    if (transcript.length > 0) {
      localStorage.setItem("meeting-transcript", JSON.stringify(transcript));
    }
  }, [transcript]);

  // Function to add new transcript entry
  const addTranscriptEntry = (name: string, text: string) => {
    const entry: TranscriptEntry = {
      id: `${Date.now()}-${Math.random()}`,
      name,
      text,
      timestamp: new Date(),
    };

    setTranscript((prev) => [...prev, entry]);
    
    if (onTranscriptEntry) {
      onTranscriptEntry(entry);
    }

    // Auto-scroll to bottom
    setTimeout(() => {
      transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Expose function globally so LiveSubtitles can use it
  useEffect(() => {
    (window as any).addTranscriptEntry = addTranscriptEntry;
    
    return () => {
      delete (window as any).addTranscriptEntry;
    };
  }, []);

  const downloadTranscript = () => {
    if (transcript.length === 0) {
      toast.error("No transcript to download");
      return;
    }

    const content = transcript
      .map((entry) => {
        const time = entry.timestamp.toLocaleTimeString();
        return `[${time}] ${entry.name}: ${entry.text}`;
      })
      .join("\n\n");

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    const filename = `meeting-transcript-${new Date().toISOString().slice(0, 10)}.txt`;
    a.download = filename;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Transcript downloaded!");
  };

  const clearTranscript = () => {
    if (transcript.length === 0) {
      toast("Transcript is already empty", { icon: "ℹ️" });
      return;
    }

    if (window.confirm("Are you sure you want to clear the transcript?")) {
      setTranscript([]);
      localStorage.removeItem("meeting-transcript");
      toast.success("Transcript cleared");
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full shadow-lg transition-colors z-50"
        title="View Transcript"
      >
        <FaFileAlt className="w-5 h-5" />
        {transcript.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {transcript.length}
          </span>
        )}
      </button>

      {/* Transcript Panel */}
      {isOpen && (
        <div className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
          {/* Header */}
          <div className="bg-purple-500 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaFileAlt className="w-5 h-5" />
              <h2 className="font-semibold text-lg">Meeting Transcript</h2>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-purple-600 p-1 rounded transition-colors"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-2 p-3 bg-gray-50 border-b">
            <button
              onClick={downloadTranscript}
              disabled={transcript.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FaDownload className="w-4 h-4" />
              Download
            </button>
            <button
              onClick={clearTranscript}
              disabled={transcript.length === 0}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <FaTrash className="w-4 h-4" />
              Clear
            </button>
          </div>

          {/* Transcript Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcript.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <FaFileAlt className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No transcript yet</p>
                <p className="text-xs mt-1">Enable subtitles to start recording</p>
              </div>
            ) : (
              <>
                {transcript.map((entry) => (
                  <div key={entry.id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-purple-600 text-sm">
                        {entry.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(entry.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-800 text-sm leading-relaxed">
                      {entry.text}
                    </p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </>
            )}
          </div>

          {/* Footer Stats */}
          <div className="p-3 bg-gray-50 border-t text-center text-xs text-gray-600">
            {transcript.length} {transcript.length === 1 ? "entry" : "entries"} recorded
          </div>
        </div>
      )}
    </>
  );
};

export default TranscriptPanel;
