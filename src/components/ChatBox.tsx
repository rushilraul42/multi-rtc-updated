"use client";
import React, { useState, useEffect, useRef } from "react";
import { firestore } from "@/app/firebaseConfig";
import { FaPaperPlane, FaTimes, FaComments } from "react-icons/fa";
import toast from "react-hot-toast";

interface Message {
  id: string;
  text: string;
  senderName: string;
  timestamp: number;
}

interface ChatBoxProps {
  callId: string;
  myName: string;
}

const ChatBox: React.FC<ChatBoxProps> = ({ callId, myName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Listen to chat messages from Firestore
  useEffect(() => {
    if (!callId) return;

    const chatRef = firestore
      .collection("calls")
      .doc(callId)
      .collection("chat")
      .orderBy("timestamp", "asc");

    const unsubscribe = chatRef.onSnapshot((snapshot) => {
      const newMessages: Message[] = [];
      snapshot.forEach((doc) => {
        newMessages.push({
          id: doc.id,
          ...doc.data(),
        } as Message);
      });
      
      // Count unread messages if chat is closed
      if (!isOpen && newMessages.length > messages.length) {
        const newCount = newMessages.length - messages.length;
        setUnreadCount(prev => prev + newCount);
      }
      
      setMessages(newMessages);
    });

    return () => unsubscribe();
  }, [callId, isOpen, messages.length]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !callId) return;

    try {
      await firestore
        .collection("calls")
        .doc(callId)
        .collection("chat")
        .add({
          text: newMessage.trim(),
          senderName: myName,
          timestamp: Date.now(),
        });

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 left-6 z-50 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-all"
          title="Open Chat"
        >
          <FaComments size={24} />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat Box */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <FaComments size={20} />
              <h3 className="font-semibold">Chat</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
              title="Close Chat"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50"
          >
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm mt-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((message) => {
                const isMe = message.senderName === myName;
                return (
                  <div
                    key={message.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        isMe
                          ? "bg-blue-600 text-white"
                          : "bg-white text-gray-800 border border-gray-200"
                      }`}
                    >
                      {!isMe && (
                        <div className="text-xs font-semibold mb-1 opacity-75">
                          {message.senderName}
                        </div>
                      )}
                      <div className="text-sm break-words">{message.text}</div>
                      <div
                        className={`text-xs mt-1 ${
                          isMe ? "text-blue-100" : "text-gray-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            className="p-4 border-t border-gray-200 bg-white rounded-b-lg"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Send Message"
              >
                <FaPaperPlane size={18} />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBox;
