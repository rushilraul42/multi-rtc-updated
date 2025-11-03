"use client";
import Login from "@/components/Login";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { 
  FaVideo, 
  FaChalkboardTeacher, 
  FaSignInAlt,
  FaSignOutAlt,
  FaRocket
} from "react-icons/fa";
import toast from "react-hot-toast";

const Page = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Sign out error:", error);
      toast.error("Failed to sign out");
    }
  };

  const navigateTo = (path: string) => {
    if (!user) {
      toast.error("Please sign in first");
      setShowLogin(true);
      return;
    }
    router.push(path);
  };

  // Prevent hydration mismatch by showing consistent loading state
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (showLogin && !user) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg">
                <FaVideo className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">
                Multi-RTC Conference
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-600">
                    Welcome, <span className="font-semibold">{user.email}</span>
                  </span>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <FaSignOutAlt />
                    Sign Out
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowLogin(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  <FaSignInAlt />
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="mb-8">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Professional Video Conferencing
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Host meetings, collaborate in real-time, and manage your conferences with powerful features
          </p>
        </div>

        {!user && (
          <button
            onClick={() => setShowLogin(true)}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all transform hover:scale-105 shadow-lg text-lg"
          >
            <FaRocket />
            Get Started Now
          </button>
        )}
      </section>

      {/* Main Feature */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-center">
          {/* Host Meeting - Centered */}
          <div 
            onClick={() => navigateTo("/host")}
            className="bg-white rounded-2xl shadow-xl p-10 hover:shadow-2xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-blue-500 max-w-2xl w-full"
          >
            <div className="flex flex-col items-center text-center">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                <FaChalkboardTeacher className="w-10 h-10 text-white" />
              </div>
              <h4 className="text-3xl font-bold text-gray-900 mb-4">Host Meeting</h4>
              <p className="text-lg text-gray-600 mb-6 max-w-lg">
                Start a new conference with real-time transcription, AI-powered interview assistance, screen sharing, and multi-participant support
              </p>
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                  🖥️ Screen Share
                </span>
                <span className="px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200">
                  🎙️ Recording
                </span>
                <span className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium border border-purple-200">
                  📝 AI Transcription
                </span>
              </div>
              <button className="w-full max-w-md bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg text-lg">
                Start Meeting Now
              </button>
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-16 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-10">
            Platform Capabilities
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-4xl mb-3">🎥</div>
              <h5 className="font-semibold text-gray-900 mb-2">Multi-Peer Video</h5>
              <p className="text-sm text-gray-600">Connect with multiple participants using WebRTC technology</p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md text-center">
              <div className="text-4xl mb-3">🎤</div>
              <h5 className="font-semibold text-gray-900 mb-2">Real-Time Transcription</h5>
              <p className="text-sm text-gray-600">Automatic speech-to-text powered by Whisper AI</p>
            </div>
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white mt-16 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-600">
          <p className="mb-2">Built with Next.js, WebRTC, Firebase, and TypeScript</p>
          <p className="text-sm">© 2025 Multi-RTC Conference. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Page;