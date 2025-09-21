import { initializeApp, getApps } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

type RuntimeCfg = {
  FIREBASE_API_KEY?: string;
  FIREBASE_AUTH_DOMAIN?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_STORAGE_BUCKET?: string;
  FIREBASE_MESSAGING_SENDER_ID?: string;
  FIREBASE_APP_ID?: string;
  FIREBASE_MEASUREMENT_ID?: string;
};

declare global {
  interface Window { __RUNTIME_CONFIG__?: RuntimeCfg }
}

const rc = (typeof window !== 'undefined' ? window.__RUNTIME_CONFIG__ : undefined) || {};

const firebaseConfig = {
  apiKey: rc.FIREBASE_API_KEY,
  authDomain: rc.FIREBASE_AUTH_DOMAIN,
  projectId: rc.FIREBASE_PROJECT_ID,
  storageBucket: rc.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: rc.FIREBASE_MESSAGING_SENDER_ID,
  appId: rc.FIREBASE_APP_ID,
};

const isConfigured = [firebaseConfig.apiKey, firebaseConfig.authDomain, firebaseConfig.projectId, firebaseConfig.appId].every(Boolean);

let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

if (isConfigured) {
  app = getApps()[0] ?? initializeApp(firebaseConfig);
  auth = getAuth(app);
}

export const firebaseAuth = auth;

export const signIn = (email: string, password: string) => {
  if (!auth) throw new Error('Auth not configured');
  return signInWithEmailAndPassword(auth, email, password);
};
export const signUp = (email: string, password: string) => {
  if (!auth) throw new Error('Auth not configured');
  return createUserWithEmailAndPassword(auth, email, password);
};
export const signOut = () => {
  if (!auth) return Promise.resolve();
  return firebaseSignOut(auth);
};
export const onAuthChange = (cb: (user: User | null) => void) => {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
};
export const signInWithGoogle = async () => {
  if (!auth) throw new Error('Auth not configured');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
};

export type FirebaseUser = User | null;

export default app;
