import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCs8Lp-WvLVJKXqvPhjwESGr4rnpORXbUY",
  authDomain: "kialiao.firebaseapp.com",
  projectId: "kialiao",
  storageBucket: "kialiao.firebasestorage.app",
  messagingSenderId: "717522106958",
  appId: "1:717522106958:web:f794d392de7759a083211f",
};
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const VAPID_KEY =
  "BHehw-VpmcURUVmYVlyzhR3UXkzG36Vc8YiFbms39kAFo4sypu5iDBjjmiGoomfmqLfEY0uBbz1YY26KKDWJfHA";
export { messaging, getToken, onMessage };
