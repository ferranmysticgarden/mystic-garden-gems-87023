import type { Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDwPa1a7RIBIEXUwoEnWi2qXF9zI4TCup0",
  authDomain: "mystic-garden-pro-d49ba.firebaseapp.com",
  projectId: "mystic-garden-pro-d49ba",
  storageBucket: "mystic-garden-pro-d49ba.firebasestorage.app",
  messagingSenderId: "601918949398",
  appId: "1:601918949398:web:a87cced1d3ab1d9c074d37",
  measurementId: "G-Q7E8266574"
};

let analytics: Analytics | null = null;
let _initPromise: Promise<void> | null = null;

/**
 * Lazy initialization — Firebase se carga SOLO cuando se necesita,
 * nunca al arrancar la app. Esto evita crashes en Android WebView.
 */
const ensureFirebase = async (): Promise<Analytics | null> => {
  if (analytics) return analytics;
  if (_initPromise) {
    await _initPromise;
    return analytics;
  }

  _initPromise = (async () => {
    try {
      const { initializeApp } = await import("firebase/app");
      const { getAnalytics } = await import("firebase/analytics");
      const app = initializeApp(firebaseConfig);
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("[Firebase] Firebase/Analytics not available in this environment", e);
      analytics = null;
    }
  })();

  await _initPromise;
  return analytics;
};

export { analytics, ensureFirebase };
