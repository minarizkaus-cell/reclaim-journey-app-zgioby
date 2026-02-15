
import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from "react";
import { Platform } from "react-native";
import * as Linking from "expo-linking";
import { authClient, setBearerToken, clearAuthTokens } from "@/lib/auth";

interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function openOAuthPopup(provider: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const popupUrl = `${window.location.origin}/auth-popup?provider=${provider}`;
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;

    const popup = window.open(
      popupUrl,
      "oauth-popup",
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
    );

    if (!popup) {
      reject(new Error("Failed to open popup. Please allow popups."));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "oauth-success" && event.data?.token) {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        resolve(event.data.token);
      } else if (event.data?.type === "oauth-error") {
        window.removeEventListener("message", handleMessage);
        clearInterval(checkClosed);
        reject(new Error(event.data.error || "OAuth failed"));
      }
    };

    window.addEventListener("message", handleMessage);

    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener("message", handleMessage);
        reject(new Error("Authentication cancelled"));
      }
    }, 500);
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const deepLinkTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoadRef = useRef(true);

  useEffect(() => {
    console.log('[AuthContext] Initializing, fetching user...');
    fetchUser();

    // CRITICAL: Disable deep link listener on web to prevent infinite loops
    // On web, URL changes (navigation) trigger the listener, causing constant re-fetches
    if (Platform.OS === 'web') {
      console.log('[AuthContext] Web platform detected, deep link listener disabled');
      return;
    }

    // Mark initial load as complete after 2 seconds (native only)
    const initialLoadTimer = setTimeout(() => {
      isInitialLoadRef.current = false;
      console.log('[AuthContext] Initial load complete, deep link listener now active');
    }, 2000);

    // Listen for deep links (e.g. from social auth redirects) - NATIVE ONLY
    const subscription = Linking.addEventListener("url", (event) => {
      // Ignore deep links during initial load to prevent infinite loops
      if (isInitialLoadRef.current) {
        console.log("[AuthContext] Ignoring deep link during initial load");
        return;
      }

      console.log("[AuthContext] Deep link received, refreshing user session");
      
      // Debounce: Clear any pending refresh and schedule a new one
      if (deepLinkTimeoutRef.current) {
        clearTimeout(deepLinkTimeoutRef.current);
      }
      
      deepLinkTimeoutRef.current = setTimeout(() => {
        fetchUser();
        deepLinkTimeoutRef.current = null;
      }, 1000);
    });

    // POLLING: Refresh session every 10 minutes to keep SecureStore token in sync
    const intervalId = setInterval(() => {
      console.log("[AuthContext] Auto-refreshing user session to sync token...");
      fetchUser();
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      subscription.remove();
      clearInterval(intervalId);
      clearTimeout(initialLoadTimer);
      if (deepLinkTimeoutRef.current) {
        clearTimeout(deepLinkTimeoutRef.current);
      }
    };
  }, []);

  const fetchUser = async () => {
    try {
      console.log('[AuthContext] Fetching user session...');
      setLoading(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Session fetch timeout')), 8000);
      });

      const sessionPromise = authClient.getSession();
      const session = await Promise.race([sessionPromise, timeoutPromise]);

      if (session?.data?.user) {
        console.log('[AuthContext] User session found:', session.data.user.id);
        setUser(session.data.user as User);
        // Sync token to SecureStore for utils/api.ts
        if (session.data.session?.token) {
          await setBearerToken(session.data.session.token);
        }
      } else {
        console.log('[AuthContext] No user session found');
        setUser(null);
        await clearAuthTokens();
      }
    } catch (error) {
      console.error("[AuthContext] Failed to fetch user:", error);
      setUser(null);
    } finally {
      console.log('[AuthContext] Fetch user complete, setting loading to false');
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Signing in with email...');
      await authClient.signIn.email({ email, password });
      await fetchUser();
    } catch (error) {
      console.error("[AuthContext] Email sign in failed:", error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string, name?: string) => {
    try {
      console.log('[AuthContext] Signing up with email...');
      await authClient.signUp.email({
        email,
        password,
        name,
      });
      await fetchUser();
    } catch (error) {
      console.error("[AuthContext] Email sign up failed:", error);
      throw error;
    }
  };

  const signInWithSocial = async (provider: "google" | "apple" | "github") => {
    try {
      console.log(`[AuthContext] Signing in with ${provider}...`);
      if (Platform.OS === "web") {
        const token = await openOAuthPopup(provider);
        await setBearerToken(token);
        await fetchUser();
      } else {
        // Native: Use expo-linking to generate a proper deep link
        const callbackURL = Linking.createURL("/");
        await authClient.signIn.social({
          provider,
          callbackURL,
        });
        await fetchUser();
      }
    } catch (error) {
      console.error(`[AuthContext] ${provider} sign in failed:`, error);
      throw error;
    }
  };

  const signInWithGoogle = () => signInWithSocial("google");
  const signInWithApple = () => signInWithSocial("apple");
  const signInWithGitHub = () => signInWithSocial("github");

  const signOut = async () => {
    try {
      console.log('[AuthContext] Signing out...');
      await authClient.signOut();
    } catch (error) {
      console.error("[AuthContext] Sign out failed (API):", error);
    } finally {
       // Always clear local state
       console.log('[AuthContext] Clearing local auth state');
       setUser(null);
       await clearAuthTokens();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signInWithGitHub,
        signOut,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
