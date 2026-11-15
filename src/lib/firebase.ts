import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json' with { type: 'json' };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

let inMemoryIdToken: string | null = null;
let currentUser: User | null = null;
const listeners = new Set<(user: User | null) => void>();

onAuthStateChanged(auth, async (user) => {
  currentUser = user;
  if (user) {
    try {
      inMemoryIdToken = await user.getIdToken();
    } catch {
      inMemoryIdToken = null;
    }
  } else {
    inMemoryIdToken = null;
  }
  listeners.forEach((cb) => {
    try {
      cb(user);
    } catch {}
  });
});

export async function signInWithGoogle(): Promise<User | null> {
  const result = await signInWithPopup(auth, googleAuthProvider);
  currentUser = result.user;
  inMemoryIdToken = await result.user.getIdToken();
  return result.user;
}

export async function signOutScholar(): Promise<void> {
  inMemoryIdToken = null;
  currentUser = null;
  await signOut(auth);
}

export async function getFreshIdToken(forceRefresh = false): Promise<string | null> {
  const user = auth.currentUser || currentUser;
  if (!user) {
    inMemoryIdToken = null;
    return null;
  }
  try {
    inMemoryIdToken = await user.getIdToken(forceRefresh);
    return inMemoryIdToken;
  } catch {
    return inMemoryIdToken;
  }
}

export const ScholarAuth = {
  getUser: () => auth.currentUser || currentUser,
  getToken: () => inMemoryIdToken,
  getFreshIdToken,
  signInWithGoogle,
  signOut: signOutScholar,
  onChange: (cb: (user: User | null) => void) => {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
};

declare global {
  interface Window {
    ScholarAuth?: typeof ScholarAuth;
  }
}

if (typeof window !== 'undefined') {
  window.ScholarAuth = ScholarAuth;
}
