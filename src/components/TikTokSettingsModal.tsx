import { useState } from "react";
import { X, Zap, AlertCircle, CheckCircle, Settings } from "lucide-react";
import { useTikTokConnection } from "../hooks/useTikTokConnection";
import toast from "react-hot-toast";

interface TikTokSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TikTokSettingsModal({
  isOpen,
  onClose,
}: TikTokSettingsModalProps) {
  const {
    isConnected,
    tikTokAccounts,
    setPrimaryAccount,
    refreshConnection,
    disconnectAllAccounts,
    connectWithVideoPermissions,
    isLoading,
    isReconnecting,
  } = useTikTokConnection();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [forceAccountSelection, setForceAccountSelection] = useState(false);
  const [switchingAccount, setSwitchingAccount] = useState<string | null>(null);

  console.log("🔍 TikTokSettingsModal render - isOpen:", isOpen);

  if (!isOpen) return null;

  // Don't show the modal if user is not connected to TikTok
  // This modal is primarily for managing existing TikTok connections
  if (!isConnected) return null;

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectAllAccounts();
      toast.success("All TikTok accounts disconnected successfully!");
    } catch (error) {
      console.error("Error disconnecting TikTok:", error);
      toast.error("Failed to disconnect TikTok accounts");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleReconnect = async () => {
    try {
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
              // Proceed with normal reconnection after logout
              connectWithVideoPermissions();
            }
          }, 1000);

          // Auto-close popup and proceed after 10 seconds
          setTimeout(() => {
            if (!logoutPopup.closed) {
              logoutPopup.close();
              clearInterval(checkClosed);
              toast.success("Proceeding with OAuth...");
              connectWithVideoPermissions();
            }
          }, 10000);
        } else {
          // Fallback if popup is blocked
          toast.error("Popup blocked. Please allow popups and try again.");
        }
      } else {
        await connectWithVideoPermissions();
        toast.success("Reconnecting to TikTok...");
      }
    } catch (error) {
      console.error("Error reconnecting TikTok:", error);
      toast.error("Failed to reconnect TikTok account");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-lg">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-white">
              TikTok Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Connection Status */}
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-400" />
              )}
              <div>
                <h3 className="font-medium text-white">Connection Status</h3>
                <p className="text-sm text-white/60">
                  {isConnected ? "Connected" : "Not Connected"}
                </p>
              </div>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                isConnected
                  ? "bg-green-400/20 text-green-400"
                  : "bg-red-400/20 text-red-400"
              }`}
            >
              {isConnected ? "Active" : "Inactive"}
            </div>
          </div>

          {/* Profile Info */}
          {isConnected && tikTokAccounts.length > 0 && (
            <div className="p-4 bg-black/20 rounded-lg border border-white/10">
              <h3 className="font-medium text-white mb-2">
                Connected Accounts ({tikTokAccounts.length})
              </h3>
              <div className="space-y-3">
                {tikTokAccounts.map((account) => (
                  <div
                    key={account.id}
                    className="p-3 bg-black/40 rounded-lg border border-white/5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {account.avatar_url ? (
                          <img
                            src={account.avatar_url}
                            alt={`${account.username} profile`}
                            className="w-8 h-8 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center border border-white/10">
                            <span className="text-white text-xs font-medium">
                              {account.display_name?.charAt(0) ||
                                account.username?.charAt(0) ||
                                "T"}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="text-white font-medium text-sm">
                            @{account.username || "N/A"}
                          </div>
                          {account.display_name && (
                            <div className="text-white/60 text-xs">
                              {account.display_name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {account.is_primary && (
                          <div className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                            Primary
                          </div>
                        )}
                        {switchingAccount === account.id && (
                          <div className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs flex items-center gap-1">
                            <div className="w-3 h-3 border border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                            Switching...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Set as Active Button */}
                    {!account.is_primary && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <button
                          onClick={async () => {
                            if (switchingAccount) return; // Prevent multiple clicks

                            console.log(
                              "🔄 TikTokSettingsModal - Set as Active clicked:",
                              account.id
                            );
                            setSwitchingAccount(account.id);
                            try {
                              await setPrimaryAccount(account.id);
                              console.log(
                                "✅ TikTokSettingsModal - Switch successful"
                              );
                              // Force refresh to ensure UI updates
                              refreshConnection();
                              toast.success(
                                `Switched to @${account.username} successfully!`
                              );
                            } catch (error: any) {
                              console.error(
                                "❌ TikTokSettingsModal - Failed to switch primary account:",
                                error
                              );
                              toast.error(
                                error.message ||
                                  "Failed to switch account. Please try again."
                              );
                            } finally {
                              setSwitchingAccount(null);
                            }
                          }}
                          disabled={
                            switchingAccount === account.id || isLoading
                          }
                          className={`w-full px-3 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 hover:from-blue-500/30 hover:to-purple-500/30 rounded-lg transition-all text-sm font-medium flex items-center justify-center gap-2 ${
                            switchingAccount === account.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <Settings className="h-4 w-4" />
                          {switchingAccount === account.id
                            ? "Switching..."
                            : "Set as Active"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Force Account Selection Option */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
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
                  {isConnected && tikTokAccounts.length > 0 ? (
                    <>
                      You have {tikTokAccounts.length} TikTok account{tikTokAccounts.length === 1 ? '' : 's'}
                      connected. Check this to connect a different account.
                    </>
                  ) : (
                    "Check this if you want to select a different TikTok account or create a new connection"
                  )}
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {isConnected ? (
              <>
                <button
                  onClick={handleReconnect}
                  disabled={isReconnecting}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {isReconnecting ? "Reconnecting..." : "Reconnect Account"}
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isDisconnecting || !forceAccountSelection}
                  className="w-full px-4 py-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDisconnecting
                    ? "Disconnecting..."
                    : !forceAccountSelection
                    ? "Check the box above to disconnect"
                    : `Disconnect ${tikTokAccounts.length === 1 ? 'Account' : `All Accounts (${tikTokAccounts.length})`}`}
                </button>
              </>
            ) : (
              <button
                onClick={handleReconnect}
                disabled={isReconnecting}
                className="w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {isReconnecting ? "Connecting..." : "Connect TikTok Account"}
              </button>
            )}
          </div>

          {/* Help Text */}
          <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-400 font-medium mb-1">Need Help?</p>
                <p className="text-blue-300/80">
                  {isConnected
                    ? "If you're having issues with video loading, try reconnecting your account with fresh permissions."
                    : "Connect your TikTok account to participate in contests and submit your videos."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
