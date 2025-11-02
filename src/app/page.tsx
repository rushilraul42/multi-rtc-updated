"use client";
import Login from "@/components/Login";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/authContext";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "./firebaseConfig";
import { 
  FaVideo, 
  FaUsers, 
  FaChalkboardTeacher, 
  FaListAlt, 
  FaEye, 
  FaClipboardList,
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

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Platform Features
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Host Meeting */}
          <div 
            onClick={() => navigateTo("/host")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-blue-500"
          >
            <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FaChalkboardTeacher className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Host Meeting</h4>
            <p className="text-gray-600 mb-4">
              Start a new conference, control settings, and manage participants
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Screen Share</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Recording</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Subtitles</span>
            </div>
          </div>

          {/* Answer Pane */}
          <div 
            onClick={() => navigateTo("/answerPane")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-purple-500"
          >
            <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FaClipboardList className="w-6 h-6 text-purple-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Answer Pane</h4>
            <p className="text-gray-600 mb-4">
              Interactive Q&A and response management system
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Q&A</span>
              <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded">Responses</span>
            </div>
          </div>

          {/* Call List */}
          <div 
            onClick={() => navigateTo("/callList")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-indigo-500"
          >
            <div className="bg-indigo-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FaListAlt className="w-6 h-6 text-indigo-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Call List</h4>
            <p className="text-gray-600 mb-4">
              View and manage all your conference calls
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">History</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Management</span>
            </div>
          </div>

          {/* View Answers */}
          <div 
            onClick={() => navigateTo("/viewAnswers")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-teal-500"
          >
            <div className="bg-teal-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FaEye className="w-6 h-6 text-teal-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">View Answers</h4>
            <p className="text-gray-600 mb-4">
              Review submitted answers and participant responses
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded">Analytics</span>
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Insights</span>
            </div>
          </div>

          {/* Moderator */}
          <div 
            onClick={() => navigateTo("/moderator")}
            className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 border-2 border-transparent hover:border-orange-500"
          >
            <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
              <FaUsers className="w-6 h-6 text-orange-600" />
            </div>
            <h4 className="text-xl font-semibold text-gray-900 mb-2">Moderator</h4>
            <p className="text-gray-600 mb-4">
              Moderate discussions and manage meeting flow
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">Control</span>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Moderation</span>
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