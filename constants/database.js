import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase, ref, get, set, onValue, push } from "firebase/database"; 
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

const sendNotificationToFirebase = (message, pattern) => {
  const notificationsRef = ref(realtimeDb, "/notifications");
  const currentDate = new Date();

  const options = {
    timeZone: 'America/Argentina/Buenos_Aires', 
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false, 
  };

  const formattedDate = currentDate.toLocaleString('es-AR', options);

  const notificationData = {
    message: message || "", 
    pattern: pattern || "", 
    date: formattedDate, 
  };

  push(notificationsRef, notificationData)
    .then(() => console.log("🔔 Notificación enviada a Firebase"))
    .catch(error => console.error("❌ Error al enviar notificación:", error));
};

const initializeFlashNode = async () => {
  const flashRef = ref(realtimeDb, "/flash");
  try {
    const snapshot = await get(flashRef);
    if (snapshot.exists()) {
      console.log("El nodo /flash ya existe.");
    } else {
      await set(flashRef, false);
      console.log("Nodo /flash inicializado en false");
    }
  } catch (error) {
    console.error("Error al inicializar el nodo /flash:", error);
  }
};

const toggleFlash = async () => {
  const flashRef = ref(realtimeDb, "/flash");
  try {
    const snapshot = await get(flashRef);
    const currentValue = snapshot.val();
    const newValue = !currentValue;

    console.log("Valor actual:", currentValue);
    console.log("Nuevo valor:", newValue);

    await set(flashRef, newValue);
    console.log(newValue ? "🔦 Flash activado" : "💡 Flash desactivado");
  } catch (error) {
    console.error("Error al cambiar el estado del flash:", error);
  }
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
  getDatabase,
  sendPasswordResetEmail,
  sendNotificationToFirebase,
  initializeFlashNode,
  toggleFlash,
  realtimeDb,
  URL_API,
  URL_AUTH_SIGNUP,
  URL_AUTH_SIGNIN
};
