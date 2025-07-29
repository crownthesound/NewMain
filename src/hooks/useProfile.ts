import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";

export type UserRole = "user" | "admin" | "organizer";

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: UserRole;
  created_at: string | null;
  updated_at: string | null;
}

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    async function fetchProfile() {
      if (!userId) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .maybeSingle();
        console.log({ data, error });

        if (error) {
          console.error("Error fetching profile:", error);
          // Don't throw error or show toast for profile not found
          setProfile(null);
          return;
        }

        if (!data) {
          console.log(
            "No profile found for user, this might be expected for new users"
          );

          // Retry a few times for new users whose profiles might still be creating
          if (retryCount < maxRetries) {
            retryCount++;
            console.log(
              `Retrying profile fetch (${retryCount}/${maxRetries})...`
            );
            setTimeout(fetchProfile, 1000 * retryCount); // Exponential backoff
            return;
          }

          setProfile(null);
          return;
        }

        // Validate and ensure proper role typing
        const validRoles: UserRole[] = ["user", "admin", "organizer"];
        const role = data.role as UserRole;

        // Create properly typed profile
        const typedProfile: Profile = {
          id: data.id,
          email: data.email,
          full_name: data.full_name,
          role: validRoles.includes(role) ? role : "user", // Fallback to 'user' if invalid role
          created_at: data.created_at,
          updated_at: data.updated_at,
        };

        setProfile(typedProfile);
      } catch (error: any) {
        console.error("Error fetching profile:", error);
        // Only show toast for unexpected errors, not for missing profiles
        if (error?.code !== "PGRST116") {
          toast.error("Failed to load user profile");
        }
        setProfile(null);
      } finally {
        setLoading(false);
      }
    }

    // Add a small delay for the initial fetch to give profile creation time
    const timer = setTimeout(fetchProfile, 100);

    return () => clearTimeout(timer);
  }, [userId]);

  return { profile, setProfile, loading };
}
