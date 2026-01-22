importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyCs8Lp-WvLVJKXqvPhjwESGr4rnpORXbUY",
  authDomain: "kialiao.firebaseapp.com",
  projectId: "kialiao",
  storageBucket: "kialiao.firebasestorage.app",
  messagingSenderId: "717522106958",
  appId: "1:717522106958:web:f794d392de7759a083211f",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/logo192.png",
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});
