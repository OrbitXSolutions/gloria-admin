import { useCallback, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { usePathname } from "next/navigation";

/**
 * Custom hook to fetch and manage the Supabase user on the client side.
 * @returns An object containing the Supabase user object (or null) and a loading state.
 */
export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);

    const supabase = createClient();
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        // Optionally handle the error, e.g., setUser(null)
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        // Potentially set loading to false here as well if the initial fetch hasn't completed
        // or if you want to indicate a change in auth state has resolved.
        // However, for the initial load, the fetchUser's finally block handles it.
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [pathname]);

  const logout = useCallback(async () => {
    const supabase = createClient();
    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error.message);
        // Potentially show a toast notification for the error
      } else {
        setUser(null); // Clear user state locally immediately
      }
    } catch (e) {
      console.error("Exception during sign out:", e);
      // Potentially show a toast notification for the error
    } finally {
      setIsLoggingOut(false);
    }
  }, []);
  return { user, loading, mounted, logout, isLoggingOut };
}
