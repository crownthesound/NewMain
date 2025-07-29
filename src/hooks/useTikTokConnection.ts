import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

interface TikTokAccount {
  id: string;
  tiktok_user_id: string;
  username: string;
  display_name: string;
  account_name: string;
  avatar_url: string;
  is_primary: boolean;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
  is_verified: boolean;
  created_at: string;
}

export const useTikTokConnection = () => {
  const { session } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [tikTokAccounts, setTikTokAccounts] = useState<TikTokAccount[]>([]);
  const [primaryAccount, setPrimaryAccountState] = useState<TikTokAccount | null>(null);
  const [activeSessionAccount, setActiveSessionAccount] = useState<TikTokAccount | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(0);

  // Get backend URL from environment or default
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Debounce interval (5 seconds)
  const DEBOUNCE_INTERVAL = 5000;

  useEffect(() => {
    if (!session) {
      setIsConnected(false);
      setIsLoading(false);
      setTikTokAccounts([]);
      setPrimaryAccountState(null);
      setActiveSessionAccount(null);
      return;
    }

    // Only check if enough time has passed since last check
    const now = Date.now();
    if (now - lastCheckTime > DEBOUNCE_INTERVAL) {
      checkTikTokConnection();
    } else {
      // Use cached state, don't make new API call
      setIsLoading(false);
    }
  }, [session]);

  const checkTikTokConnection = async (force = false) => {
    if (!session) return;

    // Debounce: only check if forced or enough time has passed
    const now = Date.now();
    if (!force && now - lastCheckTime < DEBOUNCE_INTERVAL) {
      return;
    }

    setIsLoading(true);
    setLastCheckTime(now);
    
    try {
      // Check if we have a valid session and user
      if (!session.user?.id) {
        setIsConnected(false);
        setTikTokAccounts([]);
        setPrimaryAccount(null);
        return;
      }

      // Use the new backend API to get all TikTok accounts
      const response = await fetch(`${backendUrl}/api/v1/tiktok/accounts`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      const accounts = result.data?.accounts || [];
      const connected = accounts.length > 0;
      
      // Find explicitly marked primary account, warn if multiple or none found
      const primaryAccounts = accounts.filter((account: TikTokAccount) => account.is_primary);
      
      if (primaryAccounts.length > 1) {
        console.warn("Multiple primary TikTok accounts found, using first one:", primaryAccounts);
      }
      
      let primary = primaryAccounts[0] || null;
      
      // If no primary account is found but accounts exist, warn and use first account
      if (!primary && accounts.length > 0) {
        console.warn("No primary TikTok account found, defaulting to first account:", accounts[0]);
        primary = accounts[0];
      }

      setIsConnected(connected);
      setTikTokAccounts(accounts);
      setPrimaryAccountState(primary);
    } catch (error) {
      // On network errors, don't change the current state to avoid flickering
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network connectivity issue, keep current state
      } else {
        // For other errors, reset to disconnected state
        setIsConnected(false);
        setTikTokAccounts([]);
        setPrimaryAccountState(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const refreshConnection = () => {
    // Clear cache and force a fresh check
    setLastCheckTime(0);
    checkTikTokConnection(true); // Force check on manual refresh
  };

  const connectWithVideoPermissions = async () => {
    if (!session) return;

    // Prevent multiple simultaneous connection attempts
    if (isReconnecting) {
      console.warn("TikTok connection already in progress");
      return;
    }

    setIsReconnecting(true);
    try {
      // Clear any cached connection state to ensure fresh check
      setLastCheckTime(0);
      
      // Use the working session clearing approach from TikTokConnectModal
      // Step 1: Clear local storage
      try {
        Object.keys(localStorage).forEach((key) => {
          if (key.toLowerCase().includes("tiktok")) {
            localStorage.removeItem(key);
          }
        });
        localStorage.removeItem("tiktok_access_token");
      } catch (e) {
        console.log("Could not clear local storage:", e);
      }

      console.log("Opening TikTok logout for session clearing...");

      // Step 2: Open TikTok logout in a popup window with additional parameters
      const logoutPopup = window.open(
        "https://www.tiktok.com/logout?force=true",
        "tiktok_logout",
        "width=600,height=600,scrollbars=yes,resizable=yes"
      );
      
      console.log("🔍 Logout popup opened:", !!logoutPopup);

      if (!logoutPopup) {
        throw new Error("Failed to open logout window. Please check if popups are blocked.");
      }

      // Step 3: Wait for logout popup to close
      const checkLogoutClosed = setInterval(() => {
        if (logoutPopup.closed) {
          clearInterval(checkLogoutClosed);
          console.log("TikTok logout completed! Proceeding with OAuth...");

          // Step 4: Open OAuth popup after logout
          const authUrl = `${backendUrl}/api/v1/tiktok/auth?token=${session.access_token}`;
          console.log("🔍 Opening OAuth popup with URL:", authUrl);
          const authPopup = window.open(
            authUrl,
            "tiktok_auth",
            "width=600,height=700,scrollbars=yes,resizable=yes"
          );
          
          console.log("🔍 OAuth popup opened:", !!authPopup);

          if (authPopup) {
            // Monitor the auth popup
            const checkAuthClosed = setInterval(() => {
              if (authPopup.closed) {
                clearInterval(checkAuthClosed);
                console.log("TikTok OAuth completed!");
                // Add a small delay to ensure backend processing is complete
                setTimeout(() => {
                  refreshConnection();
                  setIsReconnecting(false);
                }, 1000);
              }
            }, 1000);

            // Auto-close auth popup after 5 minutes
            setTimeout(() => {
              if (!authPopup.closed) {
                authPopup.close();
                clearInterval(checkAuthClosed);
                console.warn("TikTok authentication timed out");
                setIsReconnecting(false);
              }
            }, 300000);
          } else {
            throw new Error("Failed to open authentication window. Please check if popups are blocked.");
          }
        }
      }, 1000);

      // Auto-close logout popup and proceed after 10 seconds (like in working implementation)
      setTimeout(() => {
        if (!logoutPopup.closed) {
          logoutPopup.close();
          clearInterval(checkLogoutClosed);
          console.log("Logout timeout reached, proceeding with OAuth...");

          // Proceed with OAuth after logout timeout
          const authUrl = `${backendUrl}/api/v1/tiktok/auth?token=${session.access_token}`;
          console.log("🔍 Opening OAuth popup after logout timeout with URL:", authUrl);
          const authPopup = window.open(
            authUrl,
            "tiktok_auth",
            "width=600,height=700,scrollbars=yes,resizable=yes"
          );
          
          console.log("🔍 OAuth popup opened after timeout:", !!authPopup);

          if (authPopup) {
            // Monitor the auth popup
            const checkAuthClosed = setInterval(() => {
              if (authPopup.closed) {
                clearInterval(checkAuthClosed);
                console.log("TikTok OAuth completed!");
                // Add a small delay to ensure backend processing is complete
                setTimeout(() => {
                  refreshConnection();
                  setIsReconnecting(false);
                }, 1000);
              }
            }, 1000);

            // Auto-close auth popup after 5 minutes
            setTimeout(() => {
              if (!authPopup.closed) {
                authPopup.close();
                clearInterval(checkAuthClosed);
                console.warn("TikTok authentication timed out");
                setIsReconnecting(false);
              }
            }, 300000);
          } else {
            throw new Error("Failed to open authentication window. Please check if popups are blocked.");
          }
        }
      }, 10000); // 10 second timeout like in working implementation
      
    } catch (error: any) {
      console.error("Error connecting to TikTok:", error);
      setIsReconnecting(false);
      
      // Re-throw with more specific error message for UI handling
      throw new Error(error.message || "Failed to connect TikTok account");
    }
  };

  const setPrimaryAccount = async (accountId: string) => {
    if (!session) return false;

    const startTime = Date.now();
    console.log("🔍 [Frontend] Starting setPrimaryAccount:", {
      accountId,
      sessionUser: session.user?.id,
      timestamp: new Date().toISOString(),
    });

    try {
      // Clear current state to avoid showing stale data
      setActiveSessionAccount(null);

      // Step 1: Set the account as primary in the backend
      console.log("🔍 [Frontend] Step 1: Setting primary account in backend");
      const setPrimaryResponse = await fetch(
        `${backendUrl}/api/v1/tiktok/accounts/set-primary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ accountId }),
        }
      );

      console.log("🔍 [Frontend] Set primary response:", {
        status: setPrimaryResponse.status,
        statusText: setPrimaryResponse.statusText,
        ok: setPrimaryResponse.ok,
      });

      if (!setPrimaryResponse.ok) {
        const errorData = await setPrimaryResponse.json();
        console.error("❌ [Frontend] Failed to set primary account:", errorData);
        throw new Error(errorData.message || "Failed to set primary TikTok account");
      }

      // Step 2: Force refresh the accounts list to get the updated state immediately
      console.log("🔍 [Frontend] Step 2: Refreshing accounts list");
      setLastCheckTime(0); // Clear cache
      await checkTikTokConnection(true);

      // Step 3: Establish TikTok session with the selected account
      console.log("🔍 [Frontend] Step 3: Establishing TikTok session");
      try {
        await establishTikTokSession(accountId);
        console.log("✅ TikTok session established successfully");
      } catch (sessionError) {
        console.warn("⚠️ Could not establish TikTok session:", sessionError);
        // Still proceed but session might not work for video access
      }

      const totalDuration = Date.now() - startTime;
      console.log("✅ [Frontend] setPrimaryAccount completed:", {
        duration: totalDuration,
        accountId,
      });

      return true;
    } catch (error) {
      const totalDuration = Date.now() - startTime;
      console.error("❌ [Frontend] Error setting primary TikTok account:", {
        error,
        duration: totalDuration,
        accountId,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const validateAccountSession = async (accountId: string) => {
    if (!session) return null;

    try {
      const response = await fetch(
        `${backendUrl}/api/v1/tiktok/accounts/${accountId}/validate`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to validate TikTok session for account:", accountId);
        return null;
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Error validating TikTok account session:", error);
      return null;
    }
  };

  const establishTikTokSession = async (accountId: string) => {
    if (!session) return null;

    const startTime = Date.now();
    console.log("🔍 [Frontend] Starting TikTok session establishment:", {
      accountId,
      backendUrl,
      sessionUser: session.user?.id,
      timestamp: new Date().toISOString(),
    });

    try {
      const requestUrl = `${backendUrl}/api/v1/tiktok/accounts/${accountId}/establish-session`;
      console.log("🔍 [Frontend] Making request to:", requestUrl);

      const response = await fetch(requestUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const duration = Date.now() - startTime;
      console.log("🔍 [Frontend] Response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        duration,
        headers: {
          'content-type': response.headers.get('content-type'),
          'content-length': response.headers.get('content-length'),
        },
      });

      const responseText = await response.text();
      console.log("🔍 [Frontend] Response body:", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText };
        }
        
        // Display backend debug logs even for errors
        if (errorData.debugLogs && errorData.debugLogs.length > 0) {
          console.log("🔍 [Backend Debug Logs - Error Response]:");
          errorData.debugLogs.forEach((log: string, index: number) => {
            console.log(`${index + 1}. ${log}`);
          });
        }
        
        console.error("❌ [Frontend] Request failed:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
        });
        
        // Handle token contamination specifically
        if (errorData.error_code === "TOKEN_CONTAMINATION") {
          console.error("❌ [Frontend] TOKEN CONTAMINATION DETECTED:", {
            accountId: errorData.details?.accountId,
            storedUser: errorData.details?.storedUser,
            tokenBelongsTo: errorData.details?.tokenBelongsTo,
            requiresReconnection: errorData.details?.requiresReconnection,
          });
          
          // Automatically refresh the accounts list to reflect the cleaned up state
          console.log("🔄 [Frontend] Refreshing accounts list after contamination cleanup");
          setTimeout(() => {
            checkTikTokConnection(true);
          }, 1000);
          
          // Throw a specific error for token contamination
          throw new Error(`Token contamination detected for account. The account has been reset and requires re-authentication. Please reconnect the account.`);
        }
        
        throw new Error(errorData.message || "Failed to establish TikTok session");
      }

      const data = JSON.parse(responseText);
      
      // IMPORTANT: Check if the returned account matches what we requested
      const returnedAccountId = data.data?.accountId;
      const isAccountMatch = returnedAccountId === accountId;
      
      console.log("✅ [Frontend] Session establishment response:", {
        duration,
        requestedAccountId: accountId,
        returnedAccountId: returnedAccountId,
        accountMatch: isAccountMatch,
        returnedUsername: data.data?.username,
        returnedTikTokUserId: data.data?.tiktokUserId,
        tokenRefreshed: data.data?.tokenRefreshed,
        scopeUsed: data.data?.scopeUsed,
        fullResponseData: data.data,
      });
      
      // Display backend debug logs in frontend for production debugging
      if (data.debugLogs && data.debugLogs.length > 0) {
        console.log("🔍 [Backend Debug Logs]:");
        data.debugLogs.forEach((log: string, index: number) => {
          console.log(`${index + 1}. ${log}`);
        });
      }
      
      if (!isAccountMatch) {
        console.error("❌ [Frontend] ACCOUNT MISMATCH! Requested:", accountId, "but got:", returnedAccountId);
        console.error("❌ [Frontend] This means the backend is returning wrong account data!");
      }
      
      // Update the active session account
      const account = tikTokAccounts.find(acc => acc.id === accountId);
      if (account) {
        setActiveSessionAccount(account);
        console.log("✅ TikTok session established for account:", account.username);
      }
      
      return data.data;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error("❌ [Frontend] Error establishing TikTok session:", {
        error,
        duration,
        accountId,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  };

  const deleteAccount = async (accountId: string) => {
    if (!session) return false;

    try {

      const response = await fetch(
        `${backendUrl}/api/v1/tiktok/accounts/${accountId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete TikTok account");
      }


      // Refresh the accounts list
      await checkTikTokConnection(true);
      return true;
    } catch (error) {
      console.error("Error deleting TikTok account:", error);
      throw error;
    }
  };

  const disconnectAllAccounts = async () => {
    if (!session) return false;

    setIsLoading(true);
    try {

      const response = await fetch(
        `${backendUrl}/api/v1/tiktok/profile/disconnect`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to disconnect TikTok accounts");
      }


      // Update local state
      setIsConnected(false);
      setTikTokAccounts([]);
      setPrimaryAccountState(null);

      return true;
    } catch (error) {
      console.error("Error disconnecting TikTok accounts:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    isLoading,
    tikTokAccounts,
    primaryAccount,
    activeSessionAccount,
    refreshConnection,
    connectWithVideoPermissions,
    setPrimaryAccount,
    validateAccountSession,
    establishTikTokSession,
    deleteAccount,
    disconnectAllAccounts,
    isReconnecting,
    // Legacy compatibility - return primary account as tikTokProfile, but prefer activeSessionAccount for video operations
    tikTokProfile: activeSessionAccount || primaryAccount,
  };
};
