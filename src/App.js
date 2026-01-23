import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { User, Send, Bell, LogOut, Users } from "lucide-react";
import { supabase } from "./config/supabase";
import { messaging, getToken, VAPID_KEY } from "./config/firebase";

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
function ChatPage({ user, onSignOut }) {
  const [notificationPermission, setNotificationPermission] = useState(
    Notification.permission,
  );
  const [fcmToken, setFcmToken] = useState(null);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState([
    {
      id: "user-456",
      name: "Alice Johnson",
      email: "alice@example.com",
      online: true,
    },
    {
      id: "user-789",
      name: "Bob Smith",
      email: "bob@example.com",
      online: false,
    },
    {
      id: "user-012",
      name: "Carol Williams",
      email: "carol@example.com",
      online: true,
    },
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleRequestNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const token = await getToken(messaging, { vapidKey: VAPID_KEY });
        setFcmToken(token);
        setNotificationPermission("granted");

        // Save FCM token to Supabase
        await supabase
          .from("profiles")
          .update({ fcm_token: token })
          .eq("id", user.id);

        alert("Notifications enabled!");
      }
    } catch (error) {
      console.error("Notification error:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;

    const message = {
      id: "msg-" + Date.now(),
      sender_id: user.id,
      receiver_id: activeChat.id,
      content: newMessage,
      created_at: new Date().toISOString(),
      isSent: true,
    };

    setMessages((prev) => [...prev, message]);
    setNewMessage("");

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          sender_id: user.id,
          receiver_id: activeChat.id,
          content: message.content,
        })
        .select()
        .single();

      if (error) throw error;

      const { data: receiver } = await supabase
        .from("profiles")
        .select("fcm_token, display_name")
        .eq("id", activeChat.id)
        .single();

      if (receiver?.fcm_token) {
        await supabase.functions.invoke("send-notification", {
          body: {
            fcmToken: receiver.fcm_token,
            title: user.user_metadata?.name || user.email,
            body: message.content,
            data: { senderId: user.id, messageId: data.id },
          },
        });
      }
    } catch (error) {
      console.error("Send message error:", error);
    }
  };

  const handleSelectChat = async (selectedUser) => {
    setActiveChat(selectedUser);

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(
        `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`,
      )
      .order("created_at", { ascending: true });

    if (!error && data) {
      setMessages(data);
    } else {
      setMessages([]);
    }
  };

  return (
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
              className="w-full bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition"
            >
              <Bell className="w-4 h-4" />
              Enable Notifications
            </button>
          )}
          {notificationPermission === "granted" && (
            <div className="bg-green-500 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm">
              <Bell className="w-4 h-4" />
              Notifications Active
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-3 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-4 h-4" />
              <span className="text-sm font-semibold">Contacts</span>
            </div>
          </div>
          {users.map((contact) => (
            <button
              key={contact.id}
              onClick={() => handleSelectChat(contact)}
              className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
                activeChat?.id === contact.id ? "bg-green-50" : ""
              }`}
            >
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                  {contact.name.charAt(0)}
                </div>
                {contact.online && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-800">
                  {contact.name}
                </div>
                <div className="text-sm text-gray-500">{contact.email}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                {activeChat.name.charAt(0)}
              </div>
              <div>
                <div className="font-semibold text-gray-800">
                  {activeChat.name}
                </div>
                <div className="text-sm text-gray-500">
                  {activeChat.online ? "Online" : "Offline"}
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
                      className={`text-xs mt-1 ${
                        msg.sender_id === user.id
                          ? "text-green-100"
                          : "text-gray-500"
                      }`}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
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
              <p className="text-sm mt-2">Choose a contact from the sidebar</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Main App Component with Router
function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Session:", session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event, session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
              <ChatPage user={user} onSignOut={handleSignOut} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
// import React, { useState, useEffect, useRef } from "react";
// import { User, Send, Bell, LogOut, Users } from "lucide-react";
// import { supabase } from "./config/supabase";
// import { messaging, getToken, VAPID_KEY } from "./config/firebase";

// function App() {
//   const [user, setUser] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [notificationPermission, setNotificationPermission] = useState(
//     Notification.permission,
//   );
//   const [fcmToken, setFcmToken] = useState(null);
//   const [activeChat, setActiveChat] = useState(null);
//   const [messages, setMessages] = useState([]);
//   const [newMessage, setNewMessage] = useState("");
//   const [users, setUsers] = useState([
//     {
//       id: "user-456",
//       name: "Alice Johnson",
//       email: "alice@example.com",
//       online: true,
//     },
//     {
//       id: "user-789",
//       name: "Bob Smith",
//       email: "bob@example.com",
//       online: false,
//     },
//     {
//       id: "user-012",
//       name: "Carol Williams",
//       email: "carol@example.com",
//       online: true,
//     },
//   ]);
//   const messagesEndRef = useRef(null);

//   // THIS IS THE KEY FIX - Properly check for auth session
//   useEffect(() => {
//     // Check for existing session on mount
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       console.log("Session:", session); // Debug log
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });

//     // Listen for auth state changes (login/logout)
//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange(async (event, session) => {
//       console.log("Auth event:", event, session); // Debug log
//       setUser(session?.user ?? null);
//       setLoading(false);
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const handleSignIn = async () => {
//     const { error } = await supabase.auth.signInWithOAuth({
//       provider: "google",
//       options: {
//         redirectTo: `${window.location.origin}/`,
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
//     setActiveChat(null);
//     setMessages([]);
//     setFcmToken(null);
//   };

//   const handleRequestNotifications = async () => {
//     try {
//       const permission = await Notification.requestPermission();
//       if (permission === "granted") {
//         const token = await getToken(messaging, { vapidKey: VAPID_KEY });
//         setFcmToken(token);
//         setNotificationPermission("granted");

//         // Save FCM token to Supabase
//         await supabase
//           .from("profiles")
//           .update({ fcm_token: token })
//           .eq("id", user.id);

//         alert("Notifications enabled!");
//       }
//     } catch (error) {
//       console.error("Notification error:", error);
//     }
//   };

//   const handleSendMessage = async () => {
//     if (!newMessage.trim() || !activeChat) return;

//     const message = {
//       id: "msg-" + Date.now(),
//       sender_id: user.id,
//       receiver_id: activeChat.id,
//       content: newMessage,
//       created_at: new Date().toISOString(),
//       isSent: true,
//     };

//     setMessages((prev) => [...prev, message]);
//     setNewMessage("");

//     try {
//       // Insert message into Supabase
//       const { data, error } = await supabase
//         .from("messages")
//         .insert({
//           sender_id: user.id,
//           receiver_id: activeChat.id,
//           content: message.content,
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       // Get receiver's FCM token
//       const { data: receiver } = await supabase
//         .from("profiles")
//         .select("fcm_token, display_name")
//         .eq("id", activeChat.id)
//         .single();

//       // Send push notification
//       if (receiver?.fcm_token) {
//         await supabase.functions.invoke("send-notification", {
//           body: {
//             fcmToken: receiver.fcm_token,
//             title: user.user_metadata?.name || user.email,
//             body: message.content,
//             data: { senderId: user.id, messageId: data.id },
//           },
//         });
//       }
//     } catch (error) {
//       console.error("Send message error:", error);
//     }
//   };

//   const handleSelectChat = async (selectedUser) => {
//     setActiveChat(selectedUser);

//     // Load messages from Supabase
//     const { data, error } = await supabase
//       .from("messages")
//       .select("*")
//       .or(
//         `and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`,
//       )
//       .order("created_at", { ascending: true });

//     if (!error && data) {
//       setMessages(data);
//     } else {
//       setMessages([]);
//     }
//   };

//   // Show loading spinner while checking auth
//   if (loading) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center">
//         <div className="text-white text-2xl font-semibold">Loading...</div>
//       </div>
//     );
//   }

//   // Show login screen if not authenticated
//   if (!user) {
//     return (
//       <div className="min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center p-4">
//         <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
//           <div className="mb-6">
//             <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Send className="w-10 h-10 text-white" />
//             </div>
//             <h1 className="text-3xl font-bold text-gray-800 mb-2">ChatApp</h1>
//             <p className="text-gray-600">Connect with friends instantly</p>
//           </div>

//           <button
//             onClick={handleSignIn}
//             className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition duration-200 flex items-center justify-center gap-3"
//           >
//             <svg className="w-6 h-6" viewBox="0 0 24 24">
//               <path
//                 fill="#4285F4"
//                 d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//               />
//               <path
//                 fill="#34A853"
//                 d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//               />
//               <path
//                 fill="#FBBC05"
//                 d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//               />
//               <path
//                 fill="#EA4335"
//                 d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//               />
//             </svg>
//             Sign in with Google
//           </button>

//           <p className="text-sm text-gray-500 mt-6">
//             Click to sign in with your Google account
//           </p>
//         </div>
//       </div>
//     );
//   }

//   // Show chat interface if authenticated
//   return (
//     <div className="h-screen flex bg-gray-100">
//       {/* Sidebar */}
//       <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
//         <div className="p-4 bg-green-600 text-white">
//           <div className="flex items-center justify-between mb-3">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
//                 <User className="w-6 h-6 text-green-600" />
//               </div>
//               <div>
//                 <div className="font-semibold">
//                   {user.user_metadata?.full_name ||
//                     user.user_metadata?.name ||
//                     user.email}
//                 </div>
//                 <div className="text-xs text-green-100">{user.email}</div>
//               </div>
//             </div>
//             <button
//               onClick={handleSignOut}
//               className="p-2 hover:bg-green-700 rounded-full transition"
//               title="Sign out"
//             >
//               <LogOut className="w-5 h-5" />
//             </button>
//           </div>

//           {notificationPermission !== "granted" && (
//             <button
//               onClick={handleRequestNotifications}
//               className="w-full bg-green-500 hover:bg-green-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm transition"
//             >
//               <Bell className="w-4 h-4" />
//               Enable Notifications
//             </button>
//           )}
//           {notificationPermission === "granted" && (
//             <div className="bg-green-500 py-2 px-4 rounded-lg flex items-center justify-center gap-2 text-sm">
//               <Bell className="w-4 h-4" />
//               Notifications Active
//             </div>
//           )}
//         </div>

//         <div className="flex-1 overflow-y-auto">
//           <div className="p-3 bg-gray-50 border-b border-gray-200">
//             <div className="flex items-center gap-2 text-gray-600">
//               <Users className="w-4 h-4" />
//               <span className="text-sm font-semibold">Contacts</span>
//             </div>
//           </div>
//           {users.map((contact) => (
//             <button
//               key={contact.id}
//               onClick={() => handleSelectChat(contact)}
//               className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 transition border-b border-gray-100 ${
//                 activeChat?.id === contact.id ? "bg-green-50" : ""
//               }`}
//             >
//               <div className="relative">
//                 <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
//                   {contact.name.charAt(0)}
//                 </div>
//                 {contact.online && (
//                   <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
//                 )}
//               </div>
//               <div className="flex-1 text-left">
//                 <div className="font-semibold text-gray-800">
//                   {contact.name}
//                 </div>
//                 <div className="text-sm text-gray-500">{contact.email}</div>
//               </div>
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* Chat Area */}
//       <div className="flex-1 flex flex-col">
//         {activeChat ? (
//           <>
//             <div className="bg-white border-b border-gray-200 p-4 flex items-center gap-3">
//               <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
//                 {activeChat.name.charAt(0)}
//               </div>
//               <div>
//                 <div className="font-semibold text-gray-800">
//                   {activeChat.name}
//                 </div>
//                 <div className="text-sm text-gray-500">
//                   {activeChat.online ? "Online" : "Offline"}
//                 </div>
//               </div>
//             </div>

//             <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
//               {messages.map((msg) => (
//                 <div
//                   key={msg.id}
//                   className={`flex ${msg.sender_id === user.id ? "justify-end" : "justify-start"}`}
//                 >
//                   <div
//                     className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
//                       msg.sender_id === user.id
//                         ? "bg-green-500 text-white rounded-br-none"
//                         : "bg-white text-gray-800 rounded-bl-none shadow"
//                     }`}
//                   >
//                     <div className="break-words">{msg.content}</div>
//                     <div
//                       className={`text-xs mt-1 ${
//                         msg.sender_id === user.id
//                           ? "text-green-100"
//                           : "text-gray-500"
//                       }`}
//                     >
//                       {new Date(msg.created_at).toLocaleTimeString([], {
//                         hour: "2-digit",
//                         minute: "2-digit",
//                       })}
//                     </div>
//                   </div>
//                 </div>
//               ))}
//               <div ref={messagesEndRef} />
//             </div>

//             <div className="bg-white border-t border-gray-200 p-4">
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   value={newMessage}
//                   onChange={(e) => setNewMessage(e.target.value)}
//                   onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
//                   placeholder="Type a message..."
//                   className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition"
//                 />
//                 <button
//                   onClick={handleSendMessage}
//                   disabled={!newMessage.trim()}
//                   className="bg-green-500 text-white p-3 rounded-full hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
//                 >
//                   <Send className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           </>
//         ) : (
//           <div className="flex-1 flex items-center justify-center bg-gray-50">
//             <div className="text-center text-gray-400">
//               <Send className="w-16 h-16 mx-auto mb-4 opacity-50" />
//               <p className="text-xl font-semibold">
//                 Select a chat to start messaging
//               </p>
//               <p className="text-sm mt-2">Choose a contact from the sidebar</p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default App;
