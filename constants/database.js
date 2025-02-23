import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase, ref, set, onValue } from "firebase/database"; 
import { getAnalytics, isSupported } from "firebase/analytics";
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage'; 
import { Platform } from "react-native";

const firebaseConfig = {
  apiKey: "AIzaSyDQJ-amic1aPwLp1B-XyctBgcMRd6ogYwM",
  authDomain: "sense-bell.firebaseapp.com",
  databaseURL: "https://sense-bell-default-rtdb.firebaseio.com",
  projectId: "sense-bell",
  storageBucket: "sense-bell.firebasestorage.app",
  messagingSenderId: "874279177046",
  appId: "1:874279177046:android:ac17fb2f8bc7e6522224f7",
  measurementId: "G-D0VE0JN5KQ"
};

let app;
let analytics;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

if (Platform.OS === "web") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);
const realtimeDb = getDatabase(app); 

const signIn = (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

const sendNotificationToFirebase = (message) => {
  const notificationsRef = ref(realtimeDb, "/notifications");
  set(notificationsRef, {
    message: message,
    timestamp: Date.now(),
  }).then(() => {
    console.log("Message sent to Firebase:", message);
  }).catch(error => {
    console.error("Error sending message:", error);
  });
};

const listenForNotifications = (callback) => {
  const notificationsRef = ref(realtimeDb, "/notifications");
  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
};

const URL_API = "https://sense-bell-default-rtdb.firebaseio.com/";
const URL_AUTH_SIGNUP = "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDQJ-amic1aPwLp1B-XyctBgcMRd6ogYwM";
const URL_AUTH_SIGNIN = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=AIzaSyDQJ-amic1aPwLp1B-XyctBgcMRd6ogYwM";

export {
  app,
  db,
  auth,
  signIn,
  analytics,
  storage,
  sendPasswordResetEmail,
  sendNotificationToFirebase,
  listenForNotifications,
  realtimeDb,
  URL_API,
  URL_AUTH_SIGNUP,
  URL_AUTH_SIGNIN
};
