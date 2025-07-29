import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useProfile } from "../hooks/useProfile";
import toast from "react-hot-toast";

interface AuthContextType {
  session: any;
  profile: any;
  loading: boolean;
  signOut: () => Promise<void>;
  checkSessionExpiry: () => Promise<boolean>;
}

// Session expiry constants
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 1 week in milliseconds
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const {
    profile,
    loading: profileLoading,
    setProfile,
  } = useProfile(session?.user?.id);
  const [sessionCheckInterval, setSessionCheckInterval] =
    useState<NodeJS.Timeout | null>(null);

  const checkSessionExpiry = async (): Promise<boolean> => {
    if (!session) return false;

    // Check different expiry rules based on user type
    const loginTime =
      localStorage.getItem("admin_login_time") ||
      localStorage.getItem("user_login_time");

    if (!loginTime) {
      // No login time found, this might be a legacy session
      console.log("No login time found, logging out for security");
      await handleSessionExpiry();
      return true;
    }

    const loginTimestamp = parseInt(loginTime);
    const currentTime = Date.now();
    const timeDiff = currentTime - loginTimestamp;

    if (timeDiff > SESSION_DURATION) {
      console.log("Session expired after 1 week, logging out");
      await handleSessionExpiry();
      return true;
    }

    // Update last activity time for admin/organizer sessions
    if (profile?.role === "admin" || profile?.role === "organizer") {
      localStorage.setItem("admin_login_time", currentTime.toString());
    }

    return false;
  };

  const handleSessionExpiry = async () => {
    try {
      await signOut();
      localStorage.removeItem("admin_login_time");
      localStorage.removeItem("user_login_time");
      toast.error("Your session has expired. Please sign in again.", {
        duration: 5000,
        icon: "⏰",
      });
    } catch (error) {
      console.error("Error during session expiry logout:", error);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);

      if (session) {
        // Check if session is expired on initial load
        const isExpired = await checkSessionExpiry();
        if (!isExpired) {
          // Set login time for regular users if not already set
          if (
            !localStorage.getItem("admin_login_time") &&
            !localStorage.getItem("user_login_time")
          ) {
            localStorage.setItem("user_login_time", Date.now().toString());
          }
        }
      }

      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setLoading(false);

      // Handle session changes
      if (event === "SIGNED_IN" && session) {
        // Set up session expiry checking
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval);
        }

        const interval = setInterval(async () => {
          await checkSessionExpiry();
        }, SESSION_CHECK_INTERVAL);

        setSessionCheckInterval(interval);
      } else if (event === "SIGNED_OUT") {
        // Clear session expiry checking
        if (sessionCheckInterval) {
          clearInterval(sessionCheckInterval);
          setSessionCheckInterval(null);
        }
        localStorage.removeItem("admin_login_time");
        localStorage.removeItem("user_login_time");
      }

      // Handle session refresh
      if (event === "TOKEN_REFRESHED" && session) {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user?.id)
            .single();

          if (error) throw error;

          if (data) {
            // Validate and ensure proper role typing
            const validRoles = ["user", "admin", "organizer"];
            const role = data.role;

            // Create properly typed profile
            const typedProfile = {
              id: data.id,
              email: data.email,
              full_name: data.full_name,
              role: (role && validRoles.includes(role) ? role : "user") as
                | "user"
                | "admin"
                | "organizer",
              created_at: data.created_at,
              updated_at: data.updated_at,
            };

            setProfile(typedProfile);
          }
        } catch (error) {
          console.error("Error refreshing profile:", error);
        }
      }
    });

    // Enable realtime subscriptions
    supabase
      .channel("public:video_links")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "video_links",
        },
        (payload) => {
          // Trigger a custom event that components can listen to
          window.dispatchEvent(
            new CustomEvent("videoUpdate", { detail: payload })
          );
        }
      )
      .subscribe();

    supabase
      .channel("public:contests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contests",
        },
        (payload) => {
          window.dispatchEvent(
            new CustomEvent("contestUpdate", { detail: payload })
          );
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setSession(null);
      setProfile(null);

      // Clear session tracking
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        setSessionCheckInterval(null);
      }
      localStorage.removeItem("admin_login_time");
      localStorage.removeItem("user_login_time");
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        loading: loading || profileLoading,
        signOut,
        checkSessionExpiry,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
