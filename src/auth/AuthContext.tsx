import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthState>({ user: null, loading: true });

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => alert('getRedirectResult: ' + (result ? result.user.email : 'null')))
      .catch((err) => alert('getRedirectResult 에러: ' + err));
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      alert('onAuthStateChanged: ' + (u ? u.email : 'null'));
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function signInWithGoogle() {
  return isMobile()
    ? signInWithRedirect(auth, googleProvider)
    : signInWithPopup(auth, googleProvider);
}

export function signOutUser() {
  return signOut(auth);
}
