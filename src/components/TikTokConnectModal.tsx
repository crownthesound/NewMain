import React, { useState } from "react";
import { X, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useTikTokConnection } from "../hooks/useTikTokConnection";
import toast from "react-hot-toast";

interface TikTokConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const TikTokConnectModal: React.FC<TikTokConnectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [forceAccountSelection, setForceAccountSelection] = useState(false);
  const { isConnected, tikTokProfile } = useTikTokConnection();

  if (!isOpen) return null;

  const handleConnectTikTok = async () => {
    setIsConnecting(true);
    try {
      // Get the backend URL from environment or use default
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

      // Get current session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in first");
        return;
      }

      if (forceAccountSelection) {
        // Clear local storage first
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

        toast.success("Opening TikTok logout...");

        // Open TikTok logout in a popup window
        const logoutPopup = window.open(
          "https://www.tiktok.com/logout",
          "tiktok_logout",
          "width=600,height=600,scrollbars=yes,resizable=yes"
        );

        if (logoutPopup) {
          // Wait for popup to close or timeout
          const checkClosed = setInterval(() => {
            if (logoutPopup.closed) {
              clearInterval(checkClosed);
              toast.success("TikTok session cleared! Proceeding with OAuth...");

              // Proceed with OAuth after logout in a popup
              const authUrl = `${backendUrl}/api/v1/tiktok/auth?token=${session.access_token}`;
              const authPopup = window.open(
                authUrl,
                "tiktok_auth",
                "width=600,height=700,scrollbars=yes,resizable=yes"
              );

              if (authPopup) {
                // Monitor the auth popup
                const checkAuthClosed = setInterval(() => {
                  if (authPopup.closed) {
                    clearInterval(checkAuthClosed);
                    toast.success("TikTok connection completed!");
                    setIsConnecting(false);
                    onSuccess();
                  }
                }, 1000);

                // Auto-close auth popup after 5 minutes
                setTimeout(() => {
                  if (!authPopup.closed) {
                    authPopup.close();
                    clearInterval(checkAuthClosed);
                    toast.error(
                      "TikTok connection timed out. Please try again."
                    );
                    setIsConnecting(false);
                  }
                }, 300000);
              } else {
                toast.error(
                  "Popup blocked. Please allow popups and try again."
                );
                setIsConnecting(false);
              }
            }
          }, 1000);

          // Auto-close popup and proceed after 10 seconds
          setTimeout(() => {
            if (!logoutPopup.closed) {
              logoutPopup.close();
              clearInterval(checkClosed);
              toast.success("Proceeding with OAuth...");

              // Proceed with OAuth after logout in a popup
              const authUrl = `${backendUrl}/api/v1/tiktok/auth?token=${session.access_token}`;
              const authPopup = window.open(
                authUrl,
                "tiktok_auth",
                "width=600,height=700,scrollbars=yes,resizable=yes"
              );

              if (authPopup) {
                // Monitor the auth popup
                const checkAuthClosed = setInterval(() => {
                  if (authPopup.closed) {
                    clearInterval(checkAuthClosed);
                    toast.success("TikTok connection completed!");
                    setIsConnecting(false);
                    onSuccess();
                  }
                }, 1000);

                // Auto-close auth popup after 5 minutes
                setTimeout(() => {
                  if (!authPopup.closed) {
                    authPopup.close();
                    clearInterval(checkAuthClosed);
                    toast.error(
                      "TikTok connection timed out. Please try again."
                    );
                    setIsConnecting(false);
                  }
                }, 300000);
              } else {
                toast.error(
                  "Popup blocked. Please allow popups and try again."
                );
                setIsConnecting(false);
              }
            }
          }, 10000);
        } else {
          // Fallback if popup is blocked
          toast.error("Popup blocked. Please allow popups and try again.");
          setIsConnecting(false);
        }
      } else {
        // Normal OAuth flow in popup
        const authUrl = `${backendUrl}/api/v1/tiktok/auth?token=${session.access_token}`;
        const authPopup = window.open(
          authUrl,
          "tiktok_auth",
          "width=600,height=700,scrollbars=yes,resizable=yes"
        );

        if (authPopup) {
          // Monitor the auth popup
          const checkAuthClosed = setInterval(() => {
            if (authPopup.closed) {
              clearInterval(checkAuthClosed);
              toast.success("TikTok connection completed!");
              setIsConnecting(false);
              onSuccess();
            }
          }, 1000);

          // Auto-close auth popup after 5 minutes
          setTimeout(() => {
            if (!authPopup.closed) {
              authPopup.close();
              clearInterval(checkAuthClosed);
              toast.error("TikTok connection timed out. Please try again.");
              setIsConnecting(false);
            }
          }, 300000);
        } else {
          toast.error("Popup blocked. Please allow popups and try again.");
          setIsConnecting(false);
        }
      }
    } catch (error) {
      console.error("Error connecting to TikTok:", error);
      toast.error("Failed to connect to TikTok");
      setIsConnecting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Connect TikTok</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Connect your TikTok account
            </h3>
            <p className="text-white/60 text-sm mb-6">
              To participate in contests, you need to connect your TikTok
              account. This allows you to:
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm text-white/80">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Select videos from your TikTok profile</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-white/80">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Submit videos to contests</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-white/80">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Track your video performance</span>
            </div>
          </div>

          {/* Show connection info if we have any TikTok profile data */}
          {(isConnected || tikTokProfile) && (
            <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-400 text-sm font-medium">
                  Currently connected to TikTok
                </span>
              </div>
              <p className="text-green-300/80 text-sm mt-1">
                {tikTokProfile ? (
                  <>
                    @
                    {tikTokProfile.username ||
                      tikTokProfile.display_name ||
                      tikTokProfile.tiktok_user_id ||
                      "TikTok User"}
                    {tikTokProfile.display_name &&
                      tikTokProfile.username !== tikTokProfile.display_name &&
                      tikTokProfile.username && (
                        <span className="text-green-300/60">
                          {" "}
                          ({tikTokProfile.display_name})
                        </span>
                      )}
                  </>
                ) : (
                  "TikTok Account Connected"
                )}
              </p>
            </div>
          )}

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mt-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={forceAccountSelection}
                onChange={(e) => setForceAccountSelection(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-transparent border-2 border-blue-500 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div>
                <span className="text-blue-200 text-sm font-medium">
                  Choose a different TikTok account
                </span>
                <p className="text-blue-200/60 text-xs mt-1">
                  Check this if you want to select a different TikTok account or
                  create a new connection
                </p>
              </div>
            </label>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 mt-3">
            <p className="text-yellow-200 text-xs">
              <strong>Note:</strong> You'll be redirected to TikTok to authorize
              the connection. This is secure and we only access your public
              profile and videos.
            </p>
          </div>

          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConnectTikTok}
              disabled={isConnecting}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  <span>Connect TikTok</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
