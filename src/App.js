import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import {
  User,
  Send,
  Bell,
  LogOut,
  Users,
  Search,
  X,
  Plus,
  Phone,
  Check,
  CheckCheck,
} from "lucide-react";
import { supabase } from "./config/supabase";

// Disable Firebase for now - notifications won't work but app will function
const messaging = null;
const getToken = null;
const VAPID_KEY = null;

// Phone Number Setup Modal
function PhoneSetupModal({ user, onComplete }) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phoneNumber.trim()) {
      alert("Please enter your phone number");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ phone_number: phoneNumber })
        .eq("id", user.id);

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error("Error saving phone number:", error);
      alert(
        "Failed to save phone number. It might already be used by another user.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Phone className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Add Your Phone Number
          </h2>
          <p className="text-gray-600">
            Let your friends find you by phone number
          </p>
        </div>

        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="+1234567890"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 mb-4"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 transition"
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}

// Search Users Modal
function SearchUsersModal({ currentUser, onClose, onSelectUser }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, email, phone_number, display_name, avatar_url, is_online, last_seen",
        )
        .or(
          `email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`,
        )
        .neq("id", currentUser.id)
        .limit(10);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error("Search error:", error);
      alert("Failed to search users");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, currentUser.id]);

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(handleSearch, 500);
      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, handleSearch]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Find Users</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email or phone..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-8 text-gray-500">Searching...</div>
          )}

          {!loading && searchResults.length === 0 && searchQuery.length > 2 && (
            <div className="text-center py-8 text-gray-500">No users found</div>
          )}

          {!loading && searchQuery.length <= 2 && (
            <div className="text-center py-8 text-gray-500">
              Type at least 3 characters to search
            </div>
          )}

          {searchResults.map((user) => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user);
                onClose();
              }}
              className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition mb-2"
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.display_name?.charAt(0) || user.email?.charAt(0) || "?"}
                </div>
                {user.is_online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">
                  {user.display_name || "Unknown User"}
                </div>
                <div className="text-sm text-gray-500">
                  {user.email || user.phone_number}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Login Page Component
function LoginPage({ onSignIn }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">ChatApp</h1>
          <p className="text-gray-600">Connect with friends instantly</p>
        </div>

        <button
          onClick={onSignIn}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition duration-200 flex items-center justify-center gap-3"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign in with Google
        </button>

        <p className="text-sm text-gray-500 mt-6">
          Click to sign in with your Google account
        </p>
      </div>
    </div>
  );
}

// Main Chat Component
function ChatPage({ user, onSignOut, needsPhoneSetup, onPhoneSetupComplete }) {
  const [notificationPermission, setNotificationPermission] = useState(
    Notification.permission,
  );
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [conversations, setConversations] = useState([]);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Set user online status
  useEffect(() => {
    const setOnlineStatus = async (isOnline) => {
      try {
        await supabase
          .from("profiles")
          .update({
            is_online: isOnline,
            last_seen: new Date().toISOString(),
          })
          .eq("id", user.id);
      } catch (error) {
        // Silently fail - not critical
      }
    };

    setOnlineStatus(true);

    const handleBeforeUnload = () => {
      setOnlineStatus(false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    const heartbeat = setInterval(() => {
      setOnlineStatus(true);
    }, 30000);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearInterval(heartbeat);
      setOnlineStatus(false);
    };
  }, [user.id]);

  const loadConversations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const conversationIds = data.map((cp) => cp.conversation_id);

      if (conversationIds.length === 0) {
        setConversations([]);
        return;
      }

      const { data: participants } = await supabase
        .from("conversation_participants")
        .select(
          `
          conversation_id,
          profiles:user_id (
            id,
            email,
            display_name,
            phone_number,
            avatar_url,
            is_online,
            last_seen
          )
        `,
        )
        .in("conversation_id", conversationIds)
        .neq("user_id", user.id);

      const { data: unreadMessages } = await supabase
        .from("messages")
        .select("conversation_id, id")
        .in("conversation_id", conversationIds)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      const unreadCounts = {};
      unreadMessages?.forEach((msg) => {
        unreadCounts[msg.conversation_id] =
          (unreadCounts[msg.conversation_id] || 0) + 1;
      });

      const { data: lastMessages } = await supabase
        .from("messages")
        .select("conversation_id, content, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false });

      const lastMessageMap = {};
      lastMessages?.forEach((msg) => {
        if (!lastMessageMap[msg.conversation_id]) {
          lastMessageMap[msg.conversation_id] = msg;
        }
      });

      const conversationsWithUsers = conversationIds.map((convId) => {
        const participant = participants?.find(
          (p) => p.conversation_id === convId,
        );
        return {
          id: convId,
          otherUser: participant?.profiles,
          unreadCount: unreadCounts[convId] || 0,
          lastMessage: lastMessageMap[convId],
        };
      });

      setConversations(
        conversationsWithUsers
          .filter((c) => c.otherUser)
          .sort((a, b) => {
            const aTime = a.lastMessage?.created_at || 0;
            const bTime = b.lastMessage?.created_at || 0;
            return new Date(bTime) - new Date(aTime);
          }),
      );
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, [user.id]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Subscribe to new messages in real-time
  useEffect(() => {
    const channel = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new;

          if (
            activeChat &&
            newMsg.conversation_id === activeChat.conversationId
          ) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });

            if (newMsg.sender_id !== user.id) {
              supabase
                .from("messages")
                .update({ is_read: true })
                .eq("id", newMsg.id)
                .then();
            }
          }

          loadConversations();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const updatedMsg = payload.new;

          if (
            activeChat &&
            updatedMsg.conversation_id === activeChat.conversationId
          ) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg)),
            );
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat, user.id, loadConversations]);

  // Subscribe to online status changes
  useEffect(() => {
    const channel = supabase
      .channel("profiles")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        (payload) => {
          const updatedProfile = payload.new;

          setConversations((prev) =>
            prev.map((conv) =>
              conv.otherUser.id === updatedProfile.id
                ? {
                    ...conv,
                    otherUser: {
                      ...conv.otherUser,
                      is_online: updatedProfile.is_online,
                      last_seen: updatedProfile.last_seen,
                    },
                  }
                : conv,
            ),
          );

          if (activeChat && activeChat.otherUser.id === updatedProfile.id) {
            setActiveChat((prev) => ({
              ...prev,
              otherUser: {
                ...prev.otherUser,
                is_online: updatedProfile.is_online,
                last_seen: updatedProfile.last_seen,
              },
            }));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChat]);

  const handleRequestNotifications = async () => {
    if (!messaging || !getToken) {
      alert(
        "Firebase messaging is not configured. Please set up Firebase to enable notifications.",
      );
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        setNotificationPermission("granted");

        await supabase
          .from("profiles")
          .update({ fcm_token: token })
          .eq("id", user.id);

        alert("Notifications enabled!");
      }
    } catch (error) {
      console.error("Notification error:", error);
      alert(
        "Failed to enable notifications. Please check your Firebase configuration.",
      );
    }
  };

  const startNewConversation = async (selectedUser) => {
    try {
      console.log("Starting conversation with:", selectedUser);

      const { data: existingConversations, error: existingError } =
        await supabase
          .from("conversation_participants")
          .select("conversation_id")
          .eq("user_id", user.id);

      if (existingError) {
        console.error("Error checking existing conversations:", existingError);
        throw new Error(
          "Failed to check existing conversations: " + existingError.message,
        );
      }

      if (existingConversations && existingConversations.length > 0) {
        const conversationIds = existingConversations.map(
          (c) => c.conversation_id,
        );

        const { data: otherParticipants, error: participantsError } =
          await supabase
            .from("conversation_participants")
            .select("conversation_id")
            .in("conversation_id", conversationIds)
            .eq("user_id", selectedUser.id);

        if (participantsError) {
          console.error(
            "Error checking other participants:",
            participantsError,
          );
        }

        if (otherParticipants && otherParticipants.length > 0) {
          const existingConvId = otherParticipants[0].conversation_id;
          console.log("Found existing conversation:", existingConvId);

          setActiveChat({
            conversationId: existingConvId,
            otherUser: selectedUser,
          });

          const { data: msgs } = await supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", existingConvId)
            .order("created_at", { ascending: true });

          setMessages(msgs || []);

          await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("conversation_id", existingConvId)
            .eq("is_read", false)
            .neq("sender_id", user.id);

          loadConversations();
          return;
        }
      }

      console.log("Creating new conversation...");
      const { data: conversation, error: convError } = await supabase
        .from("conversations")
        .insert({})
        .select()
        .single();

      if (convError) {
        console.error("Error creating conversation:", convError);
        throw new Error("Failed to create conversation: " + convError.message);
      }

      console.log("Created conversation:", conversation);

      console.log("Adding participants...");
      const { data: participants, error: participantsError } = await supabase
        .from("conversation_participants")
        .insert([
          { conversation_id: conversation.id, user_id: user.id },
          { conversation_id: conversation.id, user_id: selectedUser.id },
        ])
        .select();

      if (participantsError) {
        console.error("Error adding participants:", participantsError);
        throw new Error(
          "Failed to add participants: " + participantsError.message,
        );
      }

      console.log("Added participants:", participants);

      setActiveChat({
        conversationId: conversation.id,
        otherUser: selectedUser,
      });
      setMessages([]);
      loadConversations();

      console.log("Conversation started successfully!");
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert(
        "Failed to start conversation: " +
          error.message +
          "\n\nPlease make sure you've run the best-fix-rls-policies.sql file.",
      );
    }
  };

  const handleTyping = () => {
    if (!isTyping && activeChat) {
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;

    const message = {
      id: "temp-" + Date.now(),
      sender_id: user.id,
      conversation_id: activeChat.conversationId,
      content: newMessage,
      created_at: new Date().toISOString(),
      is_read: false,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");
    setIsTyping(false);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          conversation_id: activeChat.conversationId,
          content: message.content,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === message.id ? data : msg)),
      );

      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", activeChat.conversationId);

      loadConversations();
    } catch (error) {
      console.error("Send message error:", error);
      alert("Failed to send message");
      setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
    }
  };

  const handleSelectConversation = async (conv) => {
    setActiveChat({ conversationId: conv.id, otherUser: conv.otherUser });

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);

      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conv.id)
        .eq("is_read", false)
        .neq("sender_id", user.id);

      loadConversations();
    } else {
      setMessages([]);
    }
  };

  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return "";
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (needsPhoneSetup) {
    return <PhoneSetupModal user={user} onComplete={onPhoneSetupComplete} />;
  }

  return (
    <>
      {showSearchModal && (
        <SearchUsersModal
          currentUser={user}
          onClose={() => setShowSearchModal(false)}
          onSelectUser={startNewConversation}
        />
      )}

      <div className="h-screen flex bg-gray-100">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 bg-green-600 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">
                    {user.user_metadata?.full_name ||
                      user.user_metadata?.name ||
                      user.email}
                  </div>
                  <div className="text-xs text-green-100">{user.email}</div>
                </div>
              </div>
              <button
                onClick={onSignOut}
                className="p-2 hover:bg-green-700 rounded-full transition"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>

            {notificationPermission !== "granted" && (
              <button
                onClick={handleRequestNotifications}
                className="w-full bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition mb-2"
              >
                <Bell className="w-4 h-4" />
                Enable Notifications
              </button>
            )}

            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition"
            >
              <Plus className="w-4 h-4" />
              New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span className="text-sm font-semibold">Conversations</span>
              </div>
            </div>
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No conversations yet</p>
                <p className="text-sm mt-2">Start a new chat to begin</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                    activeChat?.conversationId === conv.id ? "bg-green-50" : ""
                  }`}
                >
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {conv.otherUser.display_name?.charAt(0) || "?"}
                    </div>
                    {conv.otherUser.is_online && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-gray-800 truncate">
                        {conv.otherUser.display_name || "Unknown User"}
                      </div>
                      {conv.unreadCount > 0 && (
                        <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
                          {conv.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {conv.lastMessage?.content || "No messages yet"}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {activeChat ? (
            <>
              <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    {activeChat.otherUser.display_name?.charAt(0) || "?"}
                  </div>
                  {activeChat.otherUser.is_online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                <div>
                  <div className="font-semibold text-gray-800">
                    {activeChat.otherUser.display_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {activeChat.otherUser.is_online
                      ? "Online"
                      : `Last seen ${formatLastSeen(activeChat.otherUser.last_seen)}`}
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                        msg.sender_id === user.id
                          ? "bg-green-500 text-white rounded-br-none"
                          : "bg-white text-gray-800 rounded-bl-none shadow"
                      }`}
                    >
                      <div className="break-words">{msg.content}</div>
                      <div
                        className={`text-xs mt-1 flex items-center gap-1 ${
                          msg.sender_id === user.id
                            ? "text-green-100 justify-end"
                            : "text-gray-500"
                        }`}
                      >
                        <span>
                          {new Date(msg.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.sender_id === user.id && (
                          <span>
                            {msg.is_read ? (
                              <CheckCheck className="w-4 h-4" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {otherUserTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl rounded-bl-none shadow">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-400">
                <Send className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-xl font-semibold">
                  Select a chat to start messaging
                </p>
                <p className="text-sm mt-2">
                  Or click "New Chat" to find someone
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsPhoneSetup, setNeedsPhoneSetup] = useState(false);
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;
    let authSubscription = null;

    const checkProfile = async (user) => {
      if (!user || !mounted) {
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("phone_number")
          .eq("id", user.id)
          .single();

        if (!mounted) return;

        if (error) {
          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              display_name:
                user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email?.split("@")[0] ||
                "User",
              avatar_url: user.user_metadata?.avatar_url,
            })
            .select()
            .single();

          if (!insertError && newProfile && mounted) {
            setNeedsPhoneSetup(!newProfile.phone_number);
          } else if (mounted) {
            setNeedsPhoneSetup(true);
          }
        } else if (mounted) {
          setNeedsPhoneSetup(!profile?.phone_number);
        }
      } catch (err) {
        if (err.name !== "AbortError" && mounted) {
          console.error("Error in checkProfile:", err);
          setNeedsPhoneSetup(true);
        }
      }
    };

    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setUser(session?.user ?? null);

        if (session?.user) {
          await checkProfile(session.user);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          console.error("Error getting session:", err);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      setUser(session?.user ?? null);

      if (
        session?.user &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        await checkProfile(session.user);
      }

      if (mounted) {
        setLoading(false);
      }
    });

    authSubscription = subscription;

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/chat`,
      },
    });

    if (error) {
      console.error("Sign in error:", error);
      alert("Sign in failed: " + error.message);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const handlePhoneSetupComplete = () => {
    setNeedsPhoneSetup(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
        <div className="text-white text-2xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            user ? (
              <Navigate to="/chat" replace />
            ) : (
              <LoginPage onSignIn={handleSignIn} />
            )
          }
        />
        <Route
          path="/chat"
          element={
            user ? (
              <ChatPage
                user={user}
                onSignOut={handleSignOut}
                needsPhoneSetup={needsPhoneSetup}
                onPhoneSetupComplete={handlePhoneSetupComplete}
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

// // Suppress AbortError warnings in development
// const originalError = console.error;
// console.error = (...args) => {
//   if (typeof args[0] === "string" && args[0].includes("AbortError")) {
//     return;
//   }
//   originalError.apply(console, args);
// };

// import React, { useState, useEffect, useRef, useCallback } from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";
// import {
//   User,
//   Send,
//   Bell,
//   LogOut,
//   Users,
//   Search,
//   X,
//   Plus,
//   Phone,
//   Check,
//   CheckCheck,
// } from "lucide-react";
// import { supabase } from "./config/supabase";

// // Disable Firebase for now - notifications won't work but app will function
// const messaging = null;
// const getToken = null;
// const VAPID_KEY = null;

// // Phone Number Setup Modal
// function PhoneSetupModal({ user, onComplete }) {
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [loading, setLoading] = useState(false);

//   const handleSubmit = async () => {
//     if (!phoneNumber.trim()) {
//       alert("Please enter your phone number");
//       return;
//     }

//     setLoading(true);
//     try {
//       const { error } = await supabase
//         .from("profiles")
//         .update({ phone_number: phoneNumber })
//         .eq("id", user.id);

//       if (error) throw error;
//       onComplete();
//     } catch (error) {
//       console.error("Error saving phone number:", error);
//       alert(
//         "Failed to save phone number. It might already be used by another user.",
//       );
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
//         <div className="text-center mb-6">
//           <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Phone className="w-8 h-8 text-white" />
//           </div>
//           <h2 className="text-2xl font-bold text-gray-800 mb-2">
//             Add Your Phone Number
//           </h2>
//           <p className="text-gray-600">
//             Let your friends find you by phone number
//           </p>
//         </div>

//         <input
//           type="tel"
//           value={phoneNumber}
//           onChange={(e) => setPhoneNumber(e.target.value)}
//           placeholder="+1234567890"
//           className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 mb-4"
//         />

//         <button
//           onClick={handleSubmit}
//           disabled={loading}
//           className="w-full bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 disabled:bg-gray-300 transition"
//         >
//           {loading ? "Saving..." : "Continue"}
//         </button>
//       </div>
//     </div>
//   );
// }

// // Search Users Modal
// function SearchUsersModal({ currentUser, onClose, onSelectUser }) {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [searchResults, setSearchResults] = useState([]);
//   const [loading, setLoading] = useState(false);

//   const handleSearch = useCallback(async () => {
//     if (!searchQuery.trim()) return;

//     setLoading(true);
//     try {
//       const { data, error } = await supabase
//         .from("profiles")
//         .select(
//           "id, email, phone_number, display_name, avatar_url, is_online, last_seen",
//         )
//         .or(
//           `email.ilike.%${searchQuery}%,phone_number.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`,
//         )
//         .neq("id", currentUser.id)
//         .limit(10);

//       if (error) throw error;
//       setSearchResults(data || []);
//     } catch (error) {
//       console.error("Search error:", error);
//       alert("Failed to search users");
//     } finally {
//       setLoading(false);
//     }
//   }, [searchQuery, currentUser.id]);

//   useEffect(() => {
//     if (searchQuery.length > 2) {
//       const timer = setTimeout(handleSearch, 500);
//       return () => clearTimeout(timer);
//     } else {
//       setSearchResults([]);
//     }
//   }, [searchQuery, handleSearch]);

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-2xl w-full max-w-md mx-4 max-h-[80vh] flex flex-col">
//         <div className="p-4 border-b border-gray-200 flex items-center justify-between">
//           <h2 className="text-xl font-bold text-gray-800">Find Users</h2>
//           <button
//             onClick={onClose}
//             className="p-2 hover:bg-gray-100 rounded-full transition"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>

//         <div className="p-4 border-b border-gray-200">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               placeholder="Search by name, email or phone..."
//               className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200"
//               autoFocus
//             />
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4">
//           {loading && (
//             <div className="text-center py-8 text-gray-500">Searching...</div>
//           )}

//           {!loading && searchResults.length === 0 && searchQuery.length > 2 && (
//             <div className="text-center py-8 text-gray-500">No users found</div>
//           )}

//           {!loading && searchQuery.length <= 2 && (
//             <div className="text-center py-8 text-gray-500">
//               Type at least 3 characters to search
//             </div>
//           )}

//           {searchResults.map((user) => (
//             <button
//               key={user.id}
//               onClick={() => {
//                 onSelectUser(user);
//                 onClose();
//               }}
//               className="w-full p-4 flex items-center gap-3 hover:bg-gray-50 rounded-lg transition mb-2"
//             >
//               <div className="relative">
//                 <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
//                   {user.display_name?.charAt(0) || user.email?.charAt(0) || "?"}
//                 </div>
//                 {user.is_online && (
//                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
//                 )}
//               </div>
//               <div className="flex-1 text-left">
//                 <div className="font-semibold text-gray-800">
//                   {user.display_name || "Unknown User"}
//                 </div>
//                 <div className="text-sm text-gray-500">
//                   {user.email || user.phone_number}
//                 </div>
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }

// // Login Page Component
// function LoginPage({ onSignIn }) {
//   return (
//     <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
//       <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
//         <div className="mb-6">
//           <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Send className="w-10 h-10 text-white" />
//           </div>
//           <h1 className="text-3xl font-bold text-gray-800 mb-2">ChatApp</h1>
//           <p className="text-gray-600">Connect with friends instantly</p>
//         </div>

//         <button
//           onClick={onSignIn}
//           className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition duration-200 flex items-center justify-center gap-3"
//         >
//           <svg className="w-6 h-6" viewBox="0 0 24 24">
//             <path
//               fill="#4285F4"
//               d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//             />
//             <path
//               fill="#34A853"
//               d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//             />
//             <path
//               fill="#FBBC05"
//               d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//             />
//             <path
//               fill="#EA4335"
//               d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//             />
//           </svg>
//           Sign in with Google
//         </button>

//         <p className="text-sm text-gray-500 mt-6">
//           Click to sign in with your Google account
//         </p>
//       </div>
//     </div>
//   );
// }

// // Main Chat Component
// function ChatPage({ user, onSignOut, needsPhoneSetup, onPhoneSetupComplete }) {
//   const [notificationPermission, setNotificationPermission] = useState(
//     Notification.permission,
//   );
//   const [activeChat, setActiveChat] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [conversations, setConversations] = useState([]);
//   const [showSearchModal, setShowSearchModal] = useState(false);
//   const [isTyping, setIsTyping] = useState(false);
//   const [otherUserTyping, setOtherUserTyping] = useState(false);
//   const messagesEndRef = useRef(null);
//   const typingTimeoutRef = useRef(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   // Set user online status
//   useEffect(() => {
//     const setOnlineStatus = async (isOnline) => {
//       await supabase
//         .from("profiles")
//         .update({
//           is_online: isOnline,
//           last_seen: new Date().toISOString(),
//         })
//         .eq("id", user.id);
//     };

//     setOnlineStatus(true);

//     // Set offline when user leaves
//     const handleBeforeUnload = () => {
//       setOnlineStatus(false);
//     };

//     window.addEventListener("beforeunload", handleBeforeUnload);

//     // Heartbeat to keep online status updated
//     const heartbeat = setInterval(() => {
//       setOnlineStatus(true);
//     }, 30000); // Every 30 seconds

//     return () => {
//       window.removeEventListener("beforeunload", handleBeforeUnload);
//       clearInterval(heartbeat);
//       setOnlineStatus(false);
//     };
//   }, [user.id]);

//   const loadConversations = useCallback(async () => {
//     try {
//       const { data, error } = await supabase
//         .from("conversation_participants")
//         .select(
//           `
//           conversation_id,
//           conversations:conversation_id (
//             id,
//             updated_at
//           )
//         `,
//         )
//         .eq("user_id", user.id);

//       if (error) throw error;

//       const conversationIds = data.map((cp) => cp.conversation_id);

//       if (conversationIds.length === 0) {
//         setConversations([]);
//         return;
//       }

//       const { data: participants } = await supabase
//         .from("conversation_participants")
//         .select(
//           `
//           conversation_id,
//           profiles:user_id (
//             id,
//             email,
//             display_name,
//             phone_number,
//             avatar_url,
//             is_online,
//             last_seen
//           )
//         `,
//         )
//         .in("conversation_id", conversationIds)
//         .neq("user_id", user.id);

//       // Get unread counts for each conversation
//       const { data: unreadMessages } = await supabase
//         .from("messages")
//         .select("conversation_id, id")
//         .in("conversation_id", conversationIds)
//         .eq("is_read", false)
//         .neq("sender_id", user.id);

//       const unreadCounts = {};
//       unreadMessages?.forEach((msg) => {
//         unreadCounts[msg.conversation_id] =
//           (unreadCounts[msg.conversation_id] || 0) + 1;
//       });

//       // Get last message for each conversation
//       const { data: lastMessages } = await supabase
//         .from("messages")
//         .select("conversation_id, content, created_at")
//         .in("conversation_id", conversationIds)
//         .order("created_at", { ascending: false });

//       const lastMessageMap = {};
//       lastMessages?.forEach((msg) => {
//         if (!lastMessageMap[msg.conversation_id]) {
//           lastMessageMap[msg.conversation_id] = msg;
//         }
//       });

//       const conversationsWithUsers = conversationIds.map((convId) => {
//         const participant = participants?.find(
//           (p) => p.conversation_id === convId,
//         );
//         return {
//           id: convId,
//           otherUser: participant?.profiles,
//           unreadCount: unreadCounts[convId] || 0,
//           lastMessage: lastMessageMap[convId],
//         };
//       });

//       setConversations(
//         conversationsWithUsers
//           .filter((c) => c.otherUser)
//           .sort((a, b) => {
//             const aTime = a.lastMessage?.created_at || 0;
//             const bTime = b.lastMessage?.created_at || 0;
//             return new Date(bTime) - new Date(aTime);
//           }),
//       );
//     } catch (error) {
//       console.error("Error loading conversations:", error);
//     }
//   }, [user.id]);

//   useEffect(() => {
//     loadConversations();
//   }, [loadConversations]);

//   useEffect(() => {
//     let mounted = true;
//     let authSubscription = null;

//     const initAuth = async () => {
//       try {
//         console.log("Initializing auth...");
//         const {
//           data: { session },
//           error,
//         } = await supabase.auth.getSession();

//         if (!mounted) return;

//         console.log(
//           "Initial session:",
//           session?.user?.email || "No session",
//           "Error:",
//           error,
//         );

//         setUser(session?.user ?? null);

//         if (session?.user) {
//           await checkProfile(session.user);
//         }
//       } catch (err) {
//         // Ignore AbortErrors - they're harmless in dev mode
//         if (err.name !== "AbortError") {
//           console.error("Error getting session:", err);
//         }
//       } finally {
//         if (mounted) {
//           console.log("Setting loading to false");
//           setLoading(false);
//         }
//       }
//     };

//     initAuth();

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       console.log(
//         "Auth state changed - Event:",
//         event,
//         "User:",
//         session?.user?.email || "No user",
//       );

//       if (!mounted) return;

//       setUser(session?.user ?? null);

//       if (
//         session?.user &&
//         (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
//       ) {
//         await checkProfile(session.user);
//       }

//       if (mounted) {
//         console.log("Auth change - Setting loading to false");
//         setLoading(false);
//       }
//     });

//     authSubscription = subscription;

//     return () => {
//       mounted = false;
//       authSubscription?.unsubscribe();
//     };
//   }, []);

//   // Subscribe to new messages in real-time
//   useEffect(() => {
//     const channel = supabase
//       .channel("messages")
//       .on(
//         "postgres_changes",
//         {
//           event: "INSERT",
//           schema: "public",
//           table: "messages",
//         },
//         (payload) => {
//           const newMsg = payload.new;

//           // If message is in active chat, add it
//           if (
//             activeChat &&
//             newMsg.conversation_id === activeChat.conversationId
//           ) {
//             setMessages((prev) => {
//               // Avoid duplicates
//               if (prev.find((m) => m.id === newMsg.id)) return prev;
//               return [...prev, newMsg];
//             });

//             // Mark as read if it's from other user
//             if (newMsg.sender_id !== user.id) {
//               supabase
//                 .from("messages")
//                 .update({ is_read: true })
//                 .eq("id", newMsg.id)
//                 .then();
//             }
//           }

//           // Reload conversations to update unread counts and last message
//           loadConversations();
//         },
//       )
//       .on(
//         "postgres_changes",
//         {
//           event: "UPDATE",
//           schema: "public",
//           table: "messages",
//         },
//         (payload) => {
//           const updatedMsg = payload.new;

//           // Update message in current chat if it exists
//           if (
//             activeChat &&
//             updatedMsg.conversation_id === activeChat.conversationId
//           ) {
//             setMessages((prev) =>
//               prev.map((msg) => (msg.id === updatedMsg.id ? updatedMsg : msg)),
//             );
//           }
//         },
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [activeChat, user.id, loadConversations]);

//   // Subscribe to online status changes
//   useEffect(() => {
//     const channel = supabase
//       .channel("profiles")
//       .on(
//         "postgres_changes",
//         {
//           event: "UPDATE",
//           schema: "public",
//           table: "profiles",
//         },
//         (payload) => {
//           const updatedProfile = payload.new;

//           // Update conversations list with new online status
//           setConversations((prev) =>
//             prev.map((conv) =>
//               conv.otherUser.id === updatedProfile.id
//                 ? {
//                     ...conv,
//                     otherUser: {
//                       ...conv.otherUser,
//                       is_online: updatedProfile.is_online,
//                       last_seen: updatedProfile.last_seen,
//                     },
//                   }
//                 : conv,
//             ),
//           );

//           // Update active chat if it's the same user
//           if (activeChat && activeChat.otherUser.id === updatedProfile.id) {
//             setActiveChat((prev) => ({
//               ...prev,
//               otherUser: {
//                 ...prev.otherUser,
//                 is_online: updatedProfile.is_online,
//                 last_seen: updatedProfile.last_seen,
//               },
//             }));
//           }
//         },
//       )
//       .subscribe();

//     return () => {
//       supabase.removeChannel(channel);
//     };
//   }, [activeChat, conversations]);

//   const handleRequestNotifications = async () => {
//     if (!messaging || !getToken) {
//       alert(
//         "Firebase messaging is not configured. Please set up Firebase to enable notifications.",
//       );
//       return;
//     }

//     try {
//       const permission = await Notification.requestPermission();
//       if (permission === "granted") {
//         const token = await getToken(messaging, { vapidKey: VAPID_KEY });
//         setNotificationPermission("granted");

//         await supabase
//           .from("profiles")
//           .update({ fcm_token: token })
//           .eq("id", user.id);

//         alert("Notifications enabled!");
//       }
//     } catch (error) {
//       console.error("Notification error:", error);
//       alert(
//         "Failed to enable notifications. Please check your Firebase configuration.",
//       );
//     }
//   };

//   const startNewConversation = async (selectedUser) => {
//     try {
//       console.log("Starting conversation with:", selectedUser);

//       // Check if conversation already exists
//       const { data: existingConversations, error: existingError } =
//         await supabase
//           .from("conversation_participants")
//           .select("conversation_id")
//           .eq("user_id", user.id);

//       if (existingError) {
//         console.error("Error checking existing conversations:", existingError);
//         throw new Error(
//           "Failed to check existing conversations: " + existingError.message,
//         );
//       }

//       if (existingConversations && existingConversations.length > 0) {
//         const conversationIds = existingConversations.map(
//           (c) => c.conversation_id,
//         );

//         const { data: otherParticipants, error: participantsError } =
//           await supabase
//             .from("conversation_participants")
//             .select("conversation_id")
//             .in("conversation_id", conversationIds)
//             .eq("user_id", selectedUser.id);

//         if (participantsError) {
//           console.error(
//             "Error checking other participants:",
//             participantsError,
//           );
//         }

//         if (otherParticipants && otherParticipants.length > 0) {
//           // Conversation already exists, open it
//           const existingConvId = otherParticipants[0].conversation_id;
//           console.log("Found existing conversation:", existingConvId);

//           setActiveChat({
//             conversationId: existingConvId,
//             otherUser: selectedUser,
//           });

//           // Load messages for existing conversation
//           const { data: msgs } = await supabase
//             .from("messages")
//             .select("*")
//             .eq("conversation_id", existingConvId)
//             .order("created_at", { ascending: true });

//           setMessages(msgs || []);

//           // Mark messages as read
//           await supabase
//             .from("messages")
//             .update({ is_read: true })
//             .eq("conversation_id", existingConvId)
//             .eq("is_read", false)
//             .neq("sender_id", user.id);

//           loadConversations();
//           return;
//         }
//       }

//       // Create new conversation
//       console.log("Creating new conversation...");
//       const { data: conversation, error: convError } = await supabase
//         .from("conversations")
//         .insert({})
//         .select()
//         .single();

//       if (convError) {
//         console.error("Error creating conversation:", convError);
//         throw new Error("Failed to create conversation: " + convError.message);
//       }

//       console.log("Created conversation:", conversation);

//       // Add both participants
//       console.log("Adding participants...");
//       const { data: participants, error: participantsError } = await supabase
//         .from("conversation_participants")
//         .insert([
//           { conversation_id: conversation.id, user_id: user.id },
//           { conversation_id: conversation.id, user_id: selectedUser.id },
//         ])
//         .select();

//       if (participantsError) {
//         console.error("Error adding participants:", participantsError);
//         throw new Error(
//           "Failed to add participants: " + participantsError.message,
//         );
//       }

//       console.log("Added participants:", participants);

//       setActiveChat({
//         conversationId: conversation.id,
//         otherUser: selectedUser,
//       });
//       setMessages([]);
//       loadConversations();

//       console.log("Conversation started successfully!");
//     } catch (error) {
//       console.error("Error starting conversation:", error);
//       alert(
//         "Failed to start conversation: " +
//           error.message +
//           "\n\nPlease check the console for details and make sure you've run the fix-conversation-permissions.sql file.",
//       );
//     }
//   };

//   const handleTyping = () => {
//     if (!isTyping && activeChat) {
//       setIsTyping(true);
//       // In a real app, you'd broadcast typing status to other user
//     }

//     // Clear existing timeout
//     if (typingTimeoutRef.current) {
//       clearTimeout(typingTimeoutRef.current);
//     }

//     // Set new timeout
//     typingTimeoutRef.current = setTimeout(() => {
//       setIsTyping(false);
//     }, 1000);
//   };

//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !activeChat) return;

//     const message = {
//       id: "temp-" + Date.now(),
//       sender_id: user.id,
//       conversation_id: activeChat.conversationId,
//       content: newMessage,
//       created_at: new Date().toISOString(),
//       is_read: false,
//     };

//     setMessages((prev) => [...prev, message]);
//     setNewMessage("");
//     setIsTyping(false);

//     try {
//       const { data, error } = await supabase
//         .from("messages")
//         .insert({
//           sender_id: user.id,
//           conversation_id: activeChat.conversationId,
//           content: message.content,
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       // Update the temporary message with the real one
//       setMessages((prev) =>
//         prev.map((msg) => (msg.id === message.id ? data : msg)),
//       );

//       await supabase
//         .from("conversations")
//         .update({ updated_at: new Date().toISOString() })
//         .eq("id", activeChat.conversationId);

//       loadConversations();
//     } catch (error) {
//       console.error("Send message error:", error);
//       alert("Failed to send message");
//       // Remove the failed message
//       setMessages((prev) => prev.filter((msg) => msg.id !== message.id));
//     }
//   };

//   const handleSelectConversation = async (conv) => {
//     setActiveChat({ conversationId: conv.id, otherUser: conv.otherUser });

//     const { data, error } = await supabase
//       .from("messages")
//       .select("*")
//       .eq("conversation_id", conv.id)
//       .order("created_at", { ascending: true });

//     if (!error && data) {
//       setMessages(data);

//       // Mark all messages as read
//       await supabase
//         .from("messages")
//         .update({ is_read: true })
//         .eq("conversation_id", conv.id)
//         .eq("is_read", false)
//         .neq("sender_id", user.id);

//       loadConversations();
//     } else {
//       setMessages([]);
//     }
//   };

//   const formatLastSeen = (lastSeen) => {
//     if (!lastSeen) return "";
//     const date = new Date(lastSeen);
//     const now = new Date();
//     const diffMs = now - date;
//     const diffMins = Math.floor(diffMs / 60000);

//     if (diffMins < 1) return "just now";
//     if (diffMins < 60) return `${diffMins}m ago`;
//     const diffHours = Math.floor(diffMins / 60);
//     if (diffHours < 24) return `${diffHours}h ago`;
//     const diffDays = Math.floor(diffHours / 24);
//     return `${diffDays}d ago`;
//   };

//   if (needsPhoneSetup) {
//     return <PhoneSetupModal user={user} onComplete={onPhoneSetupComplete} />;
//   }

//   return (
//     <>
//       {showSearchModal && (
//         <SearchUsersModal
//           currentUser={user}
//           onClose={() => setShowSearchModal(false)}
//           onSelectUser={startNewConversation}
//         />
//       )}

//       <div className="h-screen flex bg-gray-100">
//         {/* Sidebar */}
//         <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//           <div className="p-4 bg-green-600 text-white">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
//                   <User className="w-6 h-6 text-green-600" />
//                 </div>
//                 <div>
//                   <div className="font-semibold">
//                     {user.user_metadata?.full_name ||
//                       user.user_metadata?.name ||
//                       user.email}
//                   </div>
//                   <div className="text-xs text-green-100">{user.email}</div>
//                 </div>
//               </div>
//               <button
//                 onClick={onSignOut}
//                 className="p-2 hover:bg-green-700 rounded-full transition"
//                 title="Sign out"
//               >
//                 <LogOut className="w-5 h-5" />
//               </button>
//             </div>

//             {notificationPermission !== "granted" && (
//               <button
//                 onClick={handleRequestNotifications}
//                 className="w-full bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition mb-2"
//               >
//                 <Bell className="w-4 h-4" />
//                 Enable Notifications
//               </button>
//             )}

//             <button
//               onClick={() => setShowSearchModal(true)}
//               className="w-full bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition"
//             >
//               <Plus className="w-4 h-4" />
//               New Chat
//             </button>
//           </div>

//           <div className="flex-1 overflow-y-auto">
//             <div className="p-3 bg-gray-50 border-b border-gray-200">
//               <div className="flex items-center gap-2 text-gray-600">
//                 <Users className="w-4 h-4" />
//                 <span className="text-sm font-semibold">Conversations</span>
//               </div>
//             </div>
//             {conversations.length === 0 ? (
//               <div className="p-8 text-center text-gray-400">
//                 <p>No conversations yet</p>
//                 <p className="text-sm mt-2">Start a new chat to begin</p>
//               </div>
//             ) : (
//               conversations.map((conv) => (
//                 <button
//                   key={conv.id}
//                   onClick={() => handleSelectConversation(conv)}
//                   className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
//                     activeChat?.conversationId === conv.id ? "bg-green-50" : ""
//                   }`}
//                 >
//                   <div className="relative">
//                     <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
//                       {conv.otherUser.display_name?.charAt(0) || "?"}
//                     </div>
//                     {conv.otherUser.is_online && (
//                       <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
//                     )}
//                   </div>
//                   <div className="flex-1 text-left min-w-0">
//                     <div className="flex items-center justify-between">
//                       <div className="font-semibold text-gray-800 truncate">
//                         {conv.otherUser.display_name || "Unknown User"}
//                       </div>
//                       {conv.unreadCount > 0 && (
//                         <div className="bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2 flex-shrink-0">
//                           {conv.unreadCount}
//                         </div>
//                       )}
//                     </div>
//                     <div className="text-sm text-gray-500 truncate">
//                       {conv.lastMessage?.content || "No messages yet"}
//                     </div>
//                   </div>
//                 </button>
//               ))
//             )}
//           </div>
//         </div>

//         {/* Chat Area */}
//         <div className="flex-1 flex flex-col">
//           {activeChat ? (
//             <>
//               <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
//                 <div className="relative">
//                   <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
//                     {activeChat.otherUser.display_name?.charAt(0) || "?"}
//                   </div>
//                   {activeChat.otherUser.is_online && (
//                     <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
//                   )}
//                 </div>
//                 <div>
//                   <div className="font-semibold text-gray-800">
//                     {activeChat.otherUser.display_name}
//                   </div>
//                   <div className="text-sm text-gray-500">
//                     {activeChat.otherUser.is_online
//                       ? "Online"
//                       : `Last seen ${formatLastSeen(activeChat.otherUser.last_seen)}`}
//                   </div>
//                 </div>
//               </div>

//               <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
//                 {messages.map((msg) => (
//                   <div
//                     key={msg.id}
//                     className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
//                   >
//                     <div
//                       className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
//                         msg.sender_id === user.id
//                           ? "bg-green-500 text-white rounded-br-none"
//                           : "bg-white text-gray-800 rounded-bl-none shadow"
//                       }`}
//                     >
//                       <div className="break-words">{msg.content}</div>
//                       <div
//                         className={`text-xs mt-1 flex items-center gap-1 ${
//                           msg.sender_id === user.id
//                             ? "text-green-100 justify-end"
//                             : "text-gray-500"
//                         }`}
//                       >
//                         <span>
//                           {new Date(msg.created_at).toLocaleTimeString([], {
//                             hour: "2-digit",
//                             minute: "2-digit",
//                           })}
//                         </span>
//                         {msg.sender_id === user.id && (
//                           <span>
//                             {msg.is_read ? (
//                               <CheckCheck className="w-4 h-4" />
//                             ) : (
//                               <Check className="w-4 h-4" />
//                             )}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//                 {otherUserTyping && (
//                   <div className="flex justify-start">
//                     <div className="bg-white text-gray-500 px-4 py-2 rounded-2xl rounded-bl-none shadow">
//                       <div className="flex gap-1">
//                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
//                         <div
//                           className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                           style={{ animationDelay: "0.2s" }}
//                         ></div>
//                         <div
//                           className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
//                           style={{ animationDelay: "0.4s" }}
//                         ></div>
//                       </div>
//                     </div>
//                   </div>
//                 )}
//                 <div ref={messagesEndRef} />
//               </div>

//               <div className="bg-white border-t border-gray-200 p-4">
//                 <div className="flex gap-2">
//                   <input
//                     type="text"
//                     value={newMessage}
//                     onChange={(e) => {
//                       setNewMessage(e.target.value);
//                       handleTyping();
//                     }}
//                     onKeyPress={(e) => {
//                       if (e.key === "Enter") {
//                         e.preventDefault();
//                         handleSendMessage();
//                       }
//                     }}
//                     placeholder="Type a message..."
//                     className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
//                   />
//                   <button
//                     onClick={handleSendMessage}
//                     disabled={!newMessage.trim()}
//                     className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
//                   >
//                     <Send className="w-5 h-5" />
//                   </button>
//                 </div>
//               </div>
//             </>
//           ) : (
//             <div className="flex-1 flex items-center justify-center bg-gray-50">
//               <div className="text-center text-gray-400">
//                 <Send className="w-16 h-16 mx-auto mb-4 opacity-50" />
//                 <p className="text-xl font-semibold">
//                   Select a chat to start messaging
//                 </p>
//                 <p className="text-sm mt-2">
//                   Or click "New Chat" to find someone
//                 </p>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </>
//   );
// }

// function App() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [needsPhoneSetup, setNeedsPhoneSetup] = useState(false);

//   useEffect(() => {
//     let mounted = true;

//     const checkProfile = async (user) => {
//       if (!user || !mounted) {
//         return;
//       }

//       try {
//         console.log("Checking profile for user:", user.id);

//         const { data: profile, error } = await supabase
//           .from("profiles")
//           .select("phone_number")
//           .eq("id", user.id)
//           .single();

//         console.log("Profile query result:", { profile, error });

//         if (!mounted) return;

//         if (error) {
//           console.error("Error fetching profile:", error);
//           // If profile doesn't exist, create it
//           const { data: newProfile, error: insertError } = await supabase
//             .from("profiles")
//             .insert({
//               id: user.id,
//               email: user.email,
//               display_name:
//                 user.user_metadata?.full_name ||
//                 user.user_metadata?.name ||
//                 user.email?.split("@")[0] ||
//                 "User",
//               avatar_url: user.user_metadata?.avatar_url,
//             })
//             .select()
//             .single();

//           if (!insertError && newProfile) {
//             console.log("Profile created:", newProfile);
//             setNeedsPhoneSetup(!newProfile.phone_number);
//           } else {
//             console.error("Error creating profile:", insertError);
//             setNeedsPhoneSetup(true);
//           }
//         } else {
//           console.log("Profile found:", profile);
//           setNeedsPhoneSetup(!profile?.phone_number);
//         }
//       } catch (err) {
//         console.error("Error in checkProfile:", err);
//         if (mounted) {
//           setNeedsPhoneSetup(true);
//         }
//       }
//     };

//     const initAuth = async () => {
//       try {
//         console.log("Initializing auth...");
//         const {
//           data: { session },
//           error,
//         } = await supabase.auth.getSession();
//         console.log(
//           "Initial session:",
//           session?.user?.email || "No session",
//           "Error:",
//           error,
//         );

//         if (!mounted) return;

//         setUser(session?.user ?? null);

//         if (session?.user) {
//           await checkProfile(session.user);
//         }
//       } catch (err) {
//         console.error("Error getting session:", err);
//       } finally {
//         if (mounted) {
//           console.log("Setting loading to false");
//           setLoading(false);
//         }
//       }
//     };

//     initAuth();

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       console.log(
//         "Auth state changed - Event:",
//         event,
//         "User:",
//         session?.user?.email || "No user",
//       );

//       if (!mounted) return;

//       setUser(session?.user ?? null);

//       if (
//         session?.user &&
//         (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
//       ) {
//         await checkProfile(session.user);
//       }

//       // Ensure loading is set to false
//       if (mounted) {
//         console.log("Auth change - Setting loading to false");
//         setLoading(false);
//       }
//     });

//     return () => {
//       mounted = false;
//       subscription.unsubscribe();
//     };
//   }, []);

//   const handleSignIn = async () => {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo: `${window.location.origin}/chat`,
//       },
//     });

//     if (error) {
//       console.error("Sign in error:", error);
//       alert("Sign in failed: " + error.message);
//     }
//   };

//   const handleSignOut = async () => {
//     await supabase.auth.signOut();
//     setUser(null);
//   };

//   const handlePhoneSetupComplete = () => {
//     setNeedsPhoneSetup(false);
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
//         <div className="text-white text-2xl font-semibold">Loading...</div>
//       </div>
//     );
//   }

//   return (
//     <Router>
//       <Routes>
//         <Route
//           path="/"
//           element={
//             user ? (
//               <Navigate to="/chat" replace />
//             ) : (
//               <LoginPage onSignIn={handleSignIn} />
//             )
//           }
//         />
//         <Route
//           path="/chat"
//           element={
//             user ? (
//               <ChatPage
//                 user={user}
//                 onSignOut={handleSignOut}
//                 needsPhoneSetup={needsPhoneSetup}
//                 onPhoneSetupComplete={handlePhoneSetupComplete}
//               />
//             ) : (
//               <Navigate to="/" replace />
//             )
//           }
//         />
//       </Routes>
//     </Router>
//   );
// }

// export default App;
