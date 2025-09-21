import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as firebaseSignOut, onAuthStateChanged, User, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const isConfigured = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId,
].every(Boolean);

let app: ReturnType<typeof initializeApp> | undefined;
let auth: ReturnType<typeof getAuth> | undefined;

if (isConfigured) {
  app = initializeApp(firebaseConfig);
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
