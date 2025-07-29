import React, { useState } from "react";
import {
  X,
  Loader2,
  Check,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useTikTokConnection } from "../hooks/useTikTokConnection";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

interface TikTokVideo {
  id: string;
  title: string;
  cover_image_url: string;
  share_url: string;
  video_description: string;
  duration: number;
  create_time: number;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  height?: number;
  width?: number;
}

interface Contest {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  submission_deadline?: string | null;
  hashtags?: string[] | null;
  rules?: string | null;
  guidelines?: string | null;
}

interface ContestJoinModalProps {
  isOpen: boolean;
  onClose: () => void;
  contest: Contest | null;
  onSuccess: () => void;
}

export const ContestJoinModal: React.FC<ContestJoinModalProps> = ({
  isOpen,
  onClose,
  contest,
  onSuccess,
}) => {
  const { session } = useAuth();
  const {
    isConnected: isTikTokConnected,
    isLoading: isTikTokLoading,
    refreshConnection,
    connectWithVideoPermissions,
    tikTokAccounts,
    primaryAccount,
    setPrimaryAccount
  } = useTikTokConnection();
  type Step = "join" | "select-video" | "post-video";
  const [step, setStep] = useState<Step>("join");
  const [isJoining, setIsJoining] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [videos, setVideos] = useState<TikTokVideo[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<TikTokVideo | null>(null);
  const [agreedGuidelines, setAgreedGuidelines] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingVideo, setIsDownloadingVideo] = useState(false);
  const [isConnectingTikTok, setIsConnectingTikTok] = useState(false);
  const [tikTokConnectionError, setTikTokConnectionError] = useState<
    string | null
  >(null);
  const [forceAccountSelection, setForceAccountSelection] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [switchingAccount, setSwitchingAccount] = useState<string | null>(null);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Auto-select primary account when accounts are loaded or primary changes
  React.useEffect(() => {
    if (tikTokAccounts.length > 0) {
      const primaryAccountId = tikTokAccounts.find(acc => acc.is_primary)?.id || tikTokAccounts[0]?.id;
      if (primaryAccountId && primaryAccountId !== selectedAccount) {
        console.log('🔄 ContestJoinModal - Updating selectedAccount to primary:', primaryAccountId);
        setSelectedAccount(primaryAccountId);
      }
    }
  }, [tikTokAccounts, primaryAccount]);


  // Fetch leaderboard data (only when join step is active)
  const { data: leaderboardResponse, isLoading: isLeaderboardLoading } =
    useQuery({
      queryKey: ["leaderboard", contest?.id],
      queryFn: async (): Promise<any> => {
        const res = await fetch(
          `${backendUrl}/api/v1/contests/${contest?.id}/leaderboard?limit=100`
        );
        if (!res.ok) {
          throw new Error("Failed to fetch leaderboard");
        }
        return res.json();
      },
      enabled: step === "join" && !!contest?.id,
      refetchInterval: 30000, // 30 seconds
    });

  const leaderboard: any[] = leaderboardResponse?.data?.leaderboard || [];

  if (!isOpen || !contest) return null;

  const handleConnectTikTok = async () => {
    if (!session) {
      toast.error("Please sign in first");
      return;
    }

    setIsConnectingTikTok(true);
    try {
      if (tikTokConnectionError === "permissions") {
        await connectWithVideoPermissions();
      } else if (forceAccountSelection) {
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
                    // Refresh connection status
                    refreshConnection();
                    setIsConnectingTikTok(false);
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
                    setIsConnectingTikTok(false);
                  }
                }, 300000);
              } else {
                toast.error(
                  "Popup blocked. Please allow popups and try again."
                );
                setIsConnectingTikTok(false);
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
                    // Refresh connection status
                    refreshConnection();
                    setIsConnectingTikTok(false);
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
                    setIsConnectingTikTok(false);
                  }
                }, 300000);
              } else {
                toast.error(
                  "Popup blocked. Please allow popups and try again."
                );
                setIsConnectingTikTok(false);
              }
            }
          }, 10000);
        } else {
          // Fallback if popup is blocked
          toast.error("Popup blocked. Please allow popups and try again.");
          setIsConnectingTikTok(false);
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
              // Refresh connection status
              refreshConnection();
              setIsConnectingTikTok(false);
            }
          }, 1000);

          // Auto-close auth popup after 5 minutes
          setTimeout(() => {
            if (!authPopup.closed) {
              authPopup.close();
              clearInterval(checkAuthClosed);
              toast.error("TikTok connection timed out. Please try again.");
              setIsConnectingTikTok(false);
            }
          }, 300000);
        } else {
          toast.error("Popup blocked. Please allow popups and try again.");
          setIsConnectingTikTok(false);
        }
      }
    } catch (error) {
      console.error("Error connecting to TikTok:", error);
      toast.error("Failed to connect to TikTok. Please try again.");
    } finally {
      setIsConnectingTikTok(false);
    }
  };

  const handleJoinContest = async () => {
    if (!session) {
      toast.error("Please sign in first");
      return;
    }

    if (!isTikTokConnected) {
      toast.error("Please connect your TikTok account first to join contests");
      return;
    }

    if (tikTokAccounts.length > 1 && !selectedAccount) {
      toast.error("Please select which TikTok account to use for this contest");
      return;
    }

    setIsJoining(true);
    try {
      // Check if user has already joined this contest
      const { data: existingParticipant, error: checkError } = await supabase
        .from("contest_participants")
        .select("*")
        .eq("contest_id", contest.id)
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existingParticipant) {
        toast.error("You have already joined this contest");
        return;
      }

      // Load user's TikTok videos first (don't join contest yet)
      await loadTikTokVideos();
      setStep("select-video");
      // Don't show success message yet - wait until video is selected
    } catch (error) {
      console.error("Error preparing to join contest:", error);
      toast.error("Failed to load your TikTok videos");
    } finally {
      setIsJoining(false);
    }
  };

  const loadTikTokVideos = async () => {
    if (!session) return;

    // Check if already loading videos to prevent duplicate calls
    if (isLoadingVideos) {
      console.log("🔄 TikTok videos already loading, skipping...");
      return;
    }

    setIsLoadingVideos(true);
    try {
      console.log("🔍 Loading TikTok videos...");
      const response = await fetch(`${backendUrl}/api/v1/tiktok/videos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });

      console.log("🔍 TikTok videos response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();

        // Handle specific error cases
        if (response.status === 403) {
          console.error(
            "❌ TikTok API 403 Forbidden - likely token/permission issue"
          );
          console.error("🔍 Error details:", errorData);

          // Check if it's specifically about video permissions
          if (
            errorData.message &&
            errorData.message.includes("video permissions")
          ) {
            setTikTokConnectionError("permissions");
            toast.error(
              "TikTok video access denied. Please reconnect and grant video permissions to load your TikTok videos.",
              { duration: 8000 }
            );
          } else {
            setTikTokConnectionError("permissions");
            toast.error(
              "TikTok access forbidden. Your TikTok connection may have expired. Please reconnect your account.",
              { duration: 6000 }
            );
          }
        } else if (
          errorData.error_code === "PERMISSION_DENIED" ||
          (errorData.message &&
            errorData.message.includes("permission not granted"))
        ) {
          setTikTokConnectionError("permissions");
          toast.error(
            "TikTok video access permission not granted. Please reconnect your TikTok account with video permissions.",
            { duration: 6000 }
          );
        } else {
          throw new Error(
            errorData.message || `Failed to load videos: ${response.status}`
          );
        }
        return;
      }

      const responseData = await response.json();
      console.log("🔍 TikTok videos full response:", responseData);

      // Extract videos from the response
      let videos = [];

      if (responseData.status === "success") {
        // Extract videos based on the structure we observed in the console
        if (responseData.data && Array.isArray(responseData.data.videos)) {
          // Format: { status: "success", data: { videos: [...] } }
          videos = responseData.data.videos;
          console.log("🔍 Found videos in data.videos");
        } else if (
          responseData.data &&
          responseData.data.data &&
          Array.isArray(responseData.data.data.videos)
        ) {
          // Format: { status: "success", data: { data: { videos: [...] } } }
          videos = responseData.data.data.videos;
          console.log("🔍 Found videos in data.data.videos");
        } else {
          console.error(
            "❌ Could not find videos array in response:",
            responseData
          );
          toast.error("Could not find videos in the API response");
          return;
        }
      } else {
        console.error("❌ Response status is not success:", responseData);
        toast.error("Unexpected response from TikTok API");
        return;
      }

      console.log("🔍 Extracted videos:", videos);
      setVideos(videos);

      if (videos.length === 0) {
        toast.error(
          "No TikTok videos found. Please make sure you have public videos on your TikTok account."
        );
      }
    } catch (error) {
      console.error("❌ Error loading TikTok videos:", error);
      toast.error("Failed to load your TikTok videos. Please try again.");
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleSubmitVideo = async () => {
    if (!selectedVideo || !session) return;

    setIsSubmitting(true);
    try {
      console.log("🔍 Submitting video:", selectedVideo);

      // First, join the contest
      const { error: joinError } = await supabase
        .from("contest_participants")
        .insert({
          contest_id: contest.id,
          user_id: session.user.id,
        });

      if (joinError) {
        if (joinError.code === "23505") {
          toast.error("You have already joined this contest");
        } else {
          throw joinError;
        }
        return;
      }

      // Get TikTok username from profile
      const { data: tikTokProfileData } = await supabase
        .from("tiktok_profiles")
        .select("username")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const username = tikTokProfileData?.username || "username";

      // Construct the TikTok video URL
      const videoUrl =
        selectedVideo.share_url ||
        `https://www.tiktok.com/@${username}/video/${selectedVideo.id}`;

      // Reject videos older than 24 hours
      const nowSeconds = Math.floor(Date.now() / 1000);
      const videoAgeSeconds = nowSeconds - (selectedVideo.create_time || 0);
      if (videoAgeSeconds > 24 * 60 * 60) {
        toast.error(
          "Selected video is more than 24 hours old. Please upload a newer video to join this contest."
        );
        setIsSubmitting(false);
        // Offer to open TikTok upload page
        window.open("https://www.tiktok.com/upload", "_blank");
        return;
      }

      // Generate embed code for the video
      const embedCode = `<blockquote class=\"tiktok-embed\" cite=\"${videoUrl}\" data-video-id=\"${selectedVideo.id}\"><section></section></blockquote><script async src=\"https://www.tiktok.com/embed.js\"></script>`;

      // Download and store the video
      console.log("🔍 Downloading video:", videoUrl);
      let downloadedVideoUrl = null;
      
      try {
        setIsDownloadingVideo(true);
        const downloadResponse = await fetch(`${backendUrl}/api/v1/tiktok/videos/download`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            videoUrl: videoUrl,
            videoId: selectedVideo.id,
          }),
        });

        if (downloadResponse.ok) {
          const downloadData = await downloadResponse.json();
          downloadedVideoUrl = downloadData.data.publicUrl;
          console.log("✅ Video downloaded successfully:", downloadedVideoUrl);
          
          // Display detailed logs from backend
          if (downloadData.data.logs && downloadData.data.logs.length > 0) {
            console.group("📋 Detailed Download Logs:");
            downloadData.data.logs.forEach((log: any, index: number) => {
              const emoji = log.level === 'success' ? '✅' : log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : 'ℹ️';
              console.log(`${index + 1}. ${emoji} [${log.step}] ${log.message}`, log.details || '');
            });
            console.groupEnd();
            
            // Also show summary information
            const finalLog = downloadData.data.logs[downloadData.data.logs.length - 1];
            if (finalLog && finalLog.details) {
              console.log("📊 Download Summary:", {
                fileName: downloadData.data.fileName,
                publicUrl: downloadedVideoUrl,
                totalLogs: downloadData.data.logs.length,
                finalStep: finalLog.step
              });
            }
          }
        } else {
          console.warn("⚠️ Video download failed, continuing without stored video");
          const errorData = await downloadResponse.json();
          console.error("Download error:", errorData);
          
          // Display detailed error logs
          if (errorData.error && errorData.error.logs && errorData.error.logs.length > 0) {
            console.group("📋 Detailed Error Logs:");
            errorData.error.logs.forEach((log: any, index: number) => {
              const emoji = log.level === 'success' ? '✅' : log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : 'ℹ️';
              console.log(`${index + 1}. ${emoji} [${log.step}] ${log.message}`, log.details || '');
            });
            console.groupEnd();
            
            // Show error summary
            console.error("💥 Error Summary:", {
              message: errorData.error.message,
              type: errorData.error.type,
              stage: errorData.error.debugging?.stage,
              totalLogs: errorData.error.logs.length
            });
          }
        }
      } catch (downloadError) {
        console.warn("⚠️ Video download failed, continuing without stored video:", downloadError);
      } finally {
        setIsDownloadingVideo(false);
      }

      // Then submit the selected video to the contest
      const { error: submitError } = await supabase
        .from("contest_links")
        .insert({
          url: videoUrl,
          title:
            selectedVideo.title ||
            selectedVideo.video_description ||
            "TikTok Video",
          thumbnail: selectedVideo.cover_image_url,
          username: username,
          views: selectedVideo.view_count || 0,
          likes: selectedVideo.like_count || 0,
          comments: selectedVideo.comment_count || 0,
          shares: selectedVideo.share_count || 0,
          created_by: session.user.id,
          contest_id: contest.id,
          tiktok_video_id: selectedVideo.id,
          is_contest_submission: true,
          submission_date: new Date().toISOString(),
          embed_code: embedCode,
          video_type: "tiktok",
          duration: selectedVideo.duration,
          video_url: downloadedVideoUrl, // Store the downloaded video URL
        });

      if (submitError) throw submitError;

      toast.success("Successfully joined contest and submitted your video!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error submitting video:", error);
      toast.error("Failed to submit video");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-[#1A1A1A] border border-white/10 w-full h-full sm:h-auto sm:max-h-[90vh] max-w-none sm:max-w-4xl overflow-hidden rounded-none sm:rounded-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {step === "join"
              ? "Join Contest"
              : step === "select-video"
              ? "Select Video"
              : "Post Video"}
          </h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Scrollable body – flex-1 pushes footer to the bottom */}
        <div className="overflow-y-auto flex-1">
          {step === "join" ? (
            <div className="p-6">
              <div className="flex flex-col lg:flex-row gap-6">
                {contest.cover_image && (
                  <div className="lg:w-1/3">
                    <img
                      src={contest.cover_image}
                      alt={contest.name}
                      className="w-full h-48 lg:h-64 object-cover rounded-lg"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {contest.name}
                    </h3>
                    <p className="text-white/70">{contest.description}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/60">Start Date:</span>
                      <div className="text-white">
                        {formatDate(contest.start_date)}
                      </div>
                    </div>
                    <div>
                      <span className="text-white/60">End Date:</span>
                      <div className="text-white">
                        {formatDate(contest.end_date)}
                      </div>
                    </div>
                    {contest.submission_deadline && (
                      <div className="md:col-span-2">
                        <span className="text-white/60">
                          Submission Deadline:
                        </span>
                        <div className="text-white">
                          {formatDate(contest.submission_deadline)}
                        </div>
                      </div>
                    )}
                  </div>

                  {contest.hashtags && contest.hashtags.length > 0 && (
                    <div>
                      <span className="text-white/60 text-sm">
                        Required Hashtags:
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {contest.hashtags.map((hashtag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                          >
                            #{hashtag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {contest.rules && (
                    <div>
                      <span className="text-white/60 text-sm">Rules:</span>
                      <p className="text-white/80 text-sm mt-1">
                        {contest.rules}
                      </p>
                    </div>
                  )}

                  {contest.guidelines && (
                    <div>
                      <span className="text-white/60 text-sm">Guidelines:</span>
                      <p className="text-white/80 text-sm mt-1">
                        {contest.guidelines}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* TikTok Account Section */}
              {!isTikTokConnected && !isTikTokLoading && (
                <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <div className="flex items-start space-x-3 mb-3">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-amber-400 font-medium">
                        TikTok Account Required
                      </h4>
                      <p className="text-amber-300/80 text-sm mt-1">
                        You need to connect your TikTok account before joining this contest.
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={handleConnectTikTok}
                      disabled={isConnectingTikTok}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {isConnectingTikTok ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Connecting...</span>
                        </>
                      ) : (
                        <span>Connect TikTok Account</span>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Account Selection - Show when user has multiple accounts */}
              {isTikTokConnected && tikTokAccounts.length > 0 && (
                <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-start space-x-3 mb-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-green-400 font-medium">
                        Choose TikTok Account
                      </h4>
                      <p className="text-green-300/80 text-sm mt-1">
                        {tikTokAccounts.length === 1 
                          ? "You have 1 TikTok account connected."
                          : `You have ${tikTokAccounts.length} TikTok accounts connected. Choose which account to use for this contest.`
                        }
                      </p>
                    </div>
                  </div>

                  {tikTokAccounts.length === 1 ? (
                    // Single account - just show it
                    <div className="mt-3 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {tikTokAccounts[0].avatar_url ? (
                          <img
                            src={tikTokAccounts[0].avatar_url}
                            alt={`${tikTokAccounts[0].username} profile`}
                            className="w-10 h-10 rounded-full object-cover border border-white/10"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {tikTokAccounts[0].display_name?.charAt(0) || tikTokAccounts[0].username?.charAt(0) || 'T'}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="text-green-200 font-medium">
                            @{tikTokAccounts[0].username || 'TikTok User'}
                          </div>
                          {tikTokAccounts[0].display_name && (
                            <div className="text-green-300/70 text-sm">
                              {tikTokAccounts[0].display_name}
                            </div>
                          )}
                        </div>
                        {tikTokAccounts[0].is_primary && (
                          <div className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                            Primary
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // Multiple accounts - show selection
                    <div className="mt-3 space-y-2">
                      {tikTokAccounts.map((account) => (
                        <label
                          key={account.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedAccount === account.id
                              ? 'bg-blue-500/20 border-blue-500/40'
                              : 'bg-green-500/10 border-green-500/20 hover:bg-green-500/15'
                          }`}
                        >
                          <input
                            type="radio"
                            name="tiktok-account"
                            value={account.id}
                            checked={selectedAccount === account.id}
                            onChange={async (e) => {
                              const newAccountId = e.target.value;
                              console.log('🔄 ContestJoinModal - Radio button clicked:', newAccountId, 'Current primary:', primaryAccount?.id);
                              setSelectedAccount(newAccountId);
                              
                              // If the selected account is not already primary, switch to it
                              if (newAccountId !== primaryAccount?.id) {
                                console.log('🔄 ContestJoinModal - Switching to account:', newAccountId);
                                setSwitchingAccount(newAccountId);
                                try {
                                  await setPrimaryAccount(newAccountId);
                                  console.log('✅ ContestJoinModal - Switch successful');
                                  // Force refresh to ensure UI updates
                                  refreshConnection();
                                  toast.success(`Switched to @${account.username} successfully!`);
                                } catch (error: any) {
                                  console.error("❌ ContestJoinModal - Failed to switch primary account:", error);
                                  toast.error(error.message || 'Failed to switch account. Please try again.');
                                  // Revert selection on error
                                  setSelectedAccount(primaryAccount?.id || null);
                                } finally {
                                  setSwitchingAccount(null);
                                }
                              } else {
                                console.log('ℹ️ ContestJoinModal - Account already primary, no switch needed');
                              }
                            }}
                            disabled={switchingAccount !== null}
                            className="w-4 h-4 text-blue-600 bg-transparent border-2 border-blue-500 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50"
                          />
                          {account.avatar_url ? (
                            <img
                              src={account.avatar_url}
                              alt={`${account.username} profile`}
                              className="w-10 h-10 rounded-full object-cover border border-white/10"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {account.display_name?.charAt(0) || account.username?.charAt(0) || 'T'}
                              </span>
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="text-green-200 font-medium">
                              @{account.username || 'TikTok User'}
                            </div>
                            {account.display_name && (
                              <div className="text-green-300/70 text-sm">
                                {account.display_name}
                              </div>
                            )}
                            {account.account_name && account.account_name !== account.display_name && (
                              <div className="text-green-300/60 text-xs">
                                {account.account_name}
                              </div>
                            )}
                          </div>
                          {account.is_primary && (
                            <div className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                              Primary
                            </div>
                          )}
                          {switchingAccount === account.id && (
                            <div className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Switching...
                            </div>
                          )}
                        </label>
                      ))}
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
                          Connect a different TikTok account
                        </span>
                        <p className="text-blue-200/60 text-xs mt-1">
                          Check this to connect another TikTok account or switch accounts
                        </p>
                      </div>
                    </label>
                  </div>

                  {forceAccountSelection && (
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={handleConnectTikTok}
                        disabled={isConnectingTikTok}
                        className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                      >
                        {isConnectingTikTok ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <span>Connect New Account</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Current Leaderboard
                </h4>
                {isLeaderboardLoading ? (
                  <div className="text-white/60 text-sm">Loading…</div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-white/60 text-sm">
                    No participants yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-white/10 max-h-56 overflow-y-auto">
                    {leaderboard.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between py-2 text-sm text-white"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-blue-400">
                            #{entry.rank}
                          </span>
                          <span>{entry.username}</span>
                        </span>
                        <span className="text-white/70">
                          {entry.views?.toLocaleString() || 0} views
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Buttons now live in the global sticky footer to avoid duplicates */}
            </div>
          ) : step === "select-video" ? (
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Select a video to submit
                </h3>
                <p className="text-white/60 text-sm">
                  Choose one of your TikTok videos to participate in this
                  contest
                </p>
              </div>

              {isLoadingVideos ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-white/60" />
                  <span className="ml-2 text-white/60">
                    Loading your videos...
                  </span>
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-12">
                  {tikTokConnectionError === "permissions" ? (
                    <div>
                      <div className="flex items-center justify-center mb-4 text-amber-400">
                        <AlertCircle className="h-6 w-6 mr-2" />
                        <p>TikTok video access permission not granted</p>
                      </div>
                      <p className="text-white/60 mb-6">
                        You need to reconnect your TikTok account with video
                        permissions to participate in this contest.
                      </p>
                      <button
                        onClick={() => {
                          setTikTokConnectionError(null);
                          handleConnectTikTok();
                        }}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Reconnect TikTok with Video Permissions
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-white/60 mb-4">
                        No videos found in your TikTok profile
                      </p>
                      <a
                        href="https://www.tiktok.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span>Go to TikTok to create videos</span>
                      </a>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {videos.map((video) => {
                    const isEligible =
                      Date.now() / 1000 - (video.create_time || 0) <
                      24 * 60 * 60;
                    return (
                      <div
                        key={video.id}
                        onClick={() => {
                          if (!isEligible) {
                            toast.error(
                              "Video is older than 24 hours. Please upload a new TikTok to participate."
                            );
                            window.open(
                              "https://www.tiktok.com/upload",
                              "_blank"
                            );
                            return;
                          }
                          setSelectedVideo(video);
                          // Wait for user to press "Next" before moving to post-video step
                        }}
                        className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                          selectedVideo?.id === video.id
                            ? "border-blue-500 ring-2 ring-blue-500/20"
                            : "border-white/10 hover:border-white/30"
                        } ${
                          !isEligible ? "opacity-40 pointer-events-auto" : ""
                        }`}
                      >
                        <div className="aspect-[9/16] relative">
                          <img
                            src={video.cover_image_url}
                            alt={
                              video.title ||
                              video.video_description ||
                              "TikTok thumbnail"
                            }
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                          />
                          {!isEligible && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs text-center px-2">
                              Video too old (24h+)
                            </div>
                          )}
                          {selectedVideo?.id === video.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          )}
                          <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 rounded text-white text-[10px]">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Leaderboard Section */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">
                  Current Leaderboard
                </h4>
                {isLeaderboardLoading ? (
                  <div className="text-white/60 text-sm">Loading…</div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-white/60 text-sm">
                    No participants yet.
                  </div>
                ) : (
                  <ul className="divide-y divide-white/10 max-h-56 overflow-y-auto">
                    {leaderboard.map((entry) => (
                      <li
                        key={entry.id}
                        className="flex items-center justify-between py-2 text-sm text-white"
                      >
                        <span className="flex items-center gap-2">
                          <span className="font-medium text-blue-400">
                            #{entry.rank}
                          </span>
                          <span>{entry.username}</span>
                        </span>
                        <span className="text-white/70">
                          {entry.views?.toLocaleString() || 0} views
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* footer handled globally */}
            </div>
          ) : (
            /** POST-VIDEO STEP  */
            <div className="p-6 space-y-6">
              {selectedVideo && (
                <div className="flex justify-center">
                  <img
                    src={selectedVideo.cover_image_url}
                    alt="Selected video thumbnail"
                    className="w-40 sm:w-56 rounded-lg shadow-lg"
                  />
                </div>
              )}

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Creator Guidelines
                </h3>
                <ul className="list-disc pl-5 space-y-1 text-white/80 text-sm">
                  <li>
                    I have read and followed the project overview and rules
                  </li>
                  <li>
                    I will not boost this post or purchase non-organic
                    engagement
                  </li>
                  <li>
                    I will keep this submission up for at least 365 days if
                    selected as a winner
                  </li>
                </ul>

                <label className="flex items-center mt-4 text-sm text-white/80 gap-2">
                  <input
                    type="checkbox"
                    className="form-checkbox h-4 w-4 text-blue-600"
                    checked={agreedGuidelines}
                    onChange={(e) => setAgreedGuidelines(e.target.checked)}
                  />
                  <span>I understand and agree to the creator guidelines</span>
                </label>
              </div>

              {/* footer handled globally */}
            </div>
          )}
        </div>
        {/* ───────────────────── STICKY FOOTER ───────────────────── */}
        <div className="border-t border-white/10 p-4 sm:p-6 flex-shrink-0 flex justify-between items-center bg-[#1A1A1A]">
          {step === "join" && (
            <div className="w-full flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-3 py-2 sm:px-6 text-sm sm:text-base text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleJoinContest}
                disabled={
                  isJoining || 
                  !isTikTokConnected || 
                  isTikTokLoading ||
                  (tikTokAccounts.length > 1 && !selectedAccount)
                }
                className="px-3 py-2 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-sm sm:text-base text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isJoining ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <span>Join Contest</span>
                )}
              </button>
            </div>
          )}

          {step === "select-video" && (
            <>
              <button
                onClick={() => setStep("join")}
                className="px-3 py-2 sm:px-4 text-sm sm:text-base text-white/60 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-3 py-2 sm:px-6 text-sm sm:text-base text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep("post-video")}
                  disabled={
                    !selectedVideo ||
                    Date.now() / 1000 - (selectedVideo?.create_time || 0) >
                      24 * 60 * 60
                  }
                  className="px-3 py-2 sm:px-6 bg-gradient-to-r from-blue-500 to-purple-600 text-sm sm:text-base text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {step === "post-video" && (
            <>
              <button
                onClick={() => setStep("select-video")}
                className="px-3 py-2 sm:px-4 text-sm sm:text-base text-white/60 hover:text-white transition-colors"
              >
                ← Back
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={onClose}
                  className="px-3 py-2 sm:px-6 text-sm sm:text-base text-white/60 hover:text-white border border-white/20 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitVideo}
                  disabled={!agreedGuidelines || isSubmitting}
                  className="px-3 py-2 sm:px-6 bg-gradient-to-r from-green-500 to-blue-600 text-sm sm:text-base text-white rounded-lg hover:from-green-600 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>
                        {isDownloadingVideo ? "Downloading video..." : "Submitting..."}
                      </span>
                    </>
                  ) : (
                    <span>Submit Content</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
