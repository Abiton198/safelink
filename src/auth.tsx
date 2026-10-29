/**
 * auth.tsx
 * ---------------------------------------------------------------------------
 * Firebase authentication for the whole app.
 *
 * - <AuthProvider> wraps the app (in main.tsx) and keeps track of who is
 *   signed in.
 * - useAuth() lets any component read `user` and call the actions below.
 *
 * Sign-in options: email + password, and Google (popup).
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth } from "./firebase";

type AuthContextValue = {
  user: User | null;
  /** True until Firebase has told us whether someone is signed in. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  /** One-click Google sign-in (creates the account on first use). */
  signInWithGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
  sendVerification: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Firebase calls this whenever someone signs in or out.
  // Returning the unsubscribe function cleans up when the provider unmounts.
  useEffect(
    () =>
      onAuthStateChanged(auth, (nextUser) => {
        setUser(nextUser);
        setLoading(false);
      }),
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,

      signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      },

      signUp: async (name, email, password) => {
        const result = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        await updateProfile(result.user, { displayName: name.trim() });
        await sendEmailVerification(result.user);
      },

      // Defined INSIDE the memo so it is part of the context value.
      // (Before, it sat outside `value`, so AuthPage could not see it.)
      signInWithGoogle: async () => {
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
      },

      logOut: async () => {
        await signOut(auth);
      },

      sendVerification: async () => {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser);
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}