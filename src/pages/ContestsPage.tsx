import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Crown,
  Trophy,
  Clock,
  Users,
  Star,
  ArrowRight,
  Filter,
  Search,
  Sparkles,
  Gift,
  Music,
  Loader2,
  Calendar,
  Award,
  Settings,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { ContestJoinModal } from "../components/ContestJoinModal";
import { TikTokSettingsModal } from "../components/TikTokSettingsModal";
import { ViewSubmissionModal } from "../components/ViewSubmissionModal";
import toast from "react-hot-toast";
import { useTikTokConnection } from "../hooks/useTikTokConnection";
import { useAuthRedirect } from "../hooks/useAuthRedirect";
import { 
  calculateContestStatus, 
  getStatusLabel, 
  getStatusColor,
  formatTimeRemaining,
  getTimeRemaining 
} from "../lib/contestUtils";
import { ContestCountdownCompact } from "../components/ContestCountdown";

interface LeaderboardContest {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  status: string | null;
  calculatedStatus?: 'draft' | 'active' | 'ended' | 'archived';
  music_category?: string | null;
  prize_tier?: string | null;
  prize_per_winner?: number | null;
  prize_titles?: any | null;
  num_winners?: number | null;
  total_prize?: number | null;
  guidelines?: string | null;
  rules?: string | null;
  hashtags?: string[] | null;
  submission_deadline?: string | null;
  max_participants?: number | null;
  top_participants?: {
    rank: number;
    username: string;
    full_name: string;
    points: number;
    views: number;
    previousRank?: number;
  }[];
}

const MUSIC_CATEGORIES = [
  "All",
  "Pop",
  "Rock",
  "Hip Hop/Rap",
  "R&B/Soul",
  "Electronic/Dance",
  "Jazz",
  "Classical",
  "Country",
  "Folk",
  "Blues",
  "Metal",
  "Reggae",
  "World Music",
  "Alternative",
  "Indie",
  "Latin",
  "Gospel/Christian",
  "Punk",
  "Funk",
];

export function ContestsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [contests, setContests] = useState<LeaderboardContest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [selectedContest, setSelectedContest] =
    useState<LeaderboardContest | null>(null);
  const [userSubmissions, setUserSubmissions] = useState<Record<string, any>>(
    {}
  );
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewVideo, setViewVideo] = useState<any>(null);
  const { redirectToAuth } = useAuthRedirect();

  const { isConnected: isTikTokConnected, refreshConnection } =
    useTikTokConnection();

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    fetchContests();
    fetchUserSubmissions();
  }, []);

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .in("status", ["active", "draft"]) // Get both active and draft contests
        .order("created_at", { ascending: false });

      if (error) throw error;

      const contestsWithParticipants = await Promise.all(
        (data || []).map(async (contest) => {
          // Fetch leaderboard data for each contest
          let top_participants: any[] = [];

          // Only attempt to fetch leaderboard if backend URL is properly configured
          if (backendUrl) {
            try {
              // Create AbortController for timeout
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

              const response = await fetch(
                `${backendUrl}/api/v1/contests/${
                  contest.id
                }/leaderboard?limit=${contest.num_winners || 15}`,
                {
                  signal: controller.signal,
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              clearTimeout(timeoutId);

              if (response.ok) {
                const leaderboardData = await response.json();
                if (leaderboardData.data?.leaderboard) {
                  top_participants = leaderboardData.data.leaderboard.map(
                    (participant: any, index: number) => ({
                      rank: index + 1,
                      username: participant.username || "Unknown",
                      full_name:
                        participant.full_name ||
                        participant.username ||
                        "Unknown",
                      points: participant.views || 0,
                      views: participant.views || 0,
                      previousRank: participant.previousRank || index + 1,
                    })
                  );
                }
              } else {
                console.warn(
                  `Leaderboard API returned ${response.status} for contest ${contest.id}`
                );
              }
            } catch (error) {
              if (error instanceof Error && error.name === "AbortError") {
                console.warn(
                  `Leaderboard request timeout for contest ${contest.id}`
                );
              } else {
                console.warn(
                  `Network error fetching leaderboard for contest ${contest.id}:`,
                  error
                );
              }
            }
          } else {
            console.warn(
              "Backend URL not configured or using default localhost - skipping leaderboard fetch"
            );
          }

          const contestWithData = {
            ...contest,
            cover_image: contest.cover_image || "",
            music_category: contest.music_category || "",
            prize_tier: contest.prize_per_winner ? "monetary" : "non-monetary",
            prize_per_winner:
              contest.total_prize && contest.num_winners
                ? Math.floor(contest.total_prize / contest.num_winners)
                : contest.prize_per_winner || 0,
            prize_titles: contest.prize_titles || [
              { rank: 1, title: "Winner" },
              { rank: 2, title: "Runner-up" },
              { rank: 3, title: "Third Place" },
            ],
            top_participants,
          };

          // Add calculated status - ensure required fields exist
          let calculatedStatus: 'draft' | 'active' | 'ended' | 'archived' = 'draft';
          if (contestWithData.start_date && contestWithData.end_date && contestWithData.status) {
            calculatedStatus = calculateContestStatus(contestWithData);
          }
          
          return {
            ...contestWithData,
            calculatedStatus,
          };
        })
      );
      
      // Filter to only show contests that are currently active based on calculated status
      const activeContests = contestsWithParticipants.filter(contest => 
        contest.calculatedStatus === 'active'
      );
      
      setContests(activeContests);
    } catch (error) {
      console.error("Error fetching contests:", error);
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmissions = async () => {
    if (!session) return;
    try {
      const { data, error } = await supabase
        .from("contest_links")
        .select("*")
        .eq("created_by", session.user.id)
        .eq("is_contest_submission", true);
      if (error) throw error;
      const mapping: Record<string, any> = {};
      data.forEach((row) => {
        if (row.contest_id) {
          mapping[row.contest_id] = row;
        }
      });
      setUserSubmissions(mapping);
    } catch (err) {
      console.error("Error fetching user submissions", err);
    }
  };

  const handleJoinContest = (contest: LeaderboardContest) => {
    // Check if contest has ended
    if (contest.calculatedStatus === 'ended') {
      toast.error('This contest has ended and is no longer accepting participants.');
      return;
    }

    if (!session) {
      redirectToAuth("/signin");
      return;
    }

    setSelectedContest(contest);
    setShowJoinModal(true);
  };

  // TikTokSettingsModal handles its own success/failure states
  // No need for handleTikTokConnected function

  const handleContestJoined = () => {
    setShowJoinModal(false);
    setSelectedContest(null);
    fetchUserSubmissions(); // Refresh user submissions after joining
    toast.success("Successfully joined contest!");
  };

  const formatTimeLeft = (contest: LeaderboardContest) => {
    const timeRemaining = getTimeRemaining(contest);
    if (!timeRemaining) {
      return contest.calculatedStatus === 'ended' ? 'Ended' : 'Not started';
    }
    return formatTimeRemaining(timeRemaining) + ' left';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const getRankIcon = (rank: number) => {
    const colors = {
      1: "text-yellow-400",
      2: "text-gray-400",
      3: "text-amber-600",
    };
    const color = colors[rank as keyof typeof colors] || "text-white/60";

    if (rank === 1) {
      return (
        <div className="relative">
          <Crown className={`h-4 w-4 ${color}`} />
          <Sparkles className="absolute -top-1 -right-1 h-2 w-2 text-yellow-300 animate-pulse" />
        </div>
      );
    }

    return <Crown className={`h-4 w-4 ${color}`} />;
  };

  const handleViewVideo = (video: any) => {
    setViewVideo(video);
    setShowViewModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white/60" />
          <p className="mt-2 text-white/60">Loading contests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <Link to="/" className="flex items-center gap-3">
          <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Crown
          </span>
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Trophy className="h-8 w-8 text-yellow-400" />
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
              Active Contests
            </h1>
          </div>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Join live music competitions and showcase your talent to win amazing
            prizes
          </p>
        </div>

        {/* Contests Grid */}
        {contests.length === 0 ? (
          <div className="text-center py-16">
            <Music className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No contests found
            </h3>
            <p className="text-white/60">Check back later for new contests!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
            {contests.map((contest) => (
              <div
                key={contest.id}
                className="group bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all duration-300 hover:scale-[1.02]"
              >
                {/* Contest Image */}
                <div className="relative aspect-video overflow-hidden">
                  {contest.cover_image ? (
                    <div className="w-full h-full">
                      <img
                        src={contest.cover_image}
                        alt={contest.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                      <Music className="h-12 w-12 text-white/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* Time left badge with live countdown */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 px-2 py-0.5 sm:px-3 sm:py-1 bg-black/60 backdrop-blur-sm rounded-full">
                    <ContestCountdownCompact 
                      contest={contest} 
                      className="text-white text-xs sm:text-sm"
                    />
                  </div>

                  {/* Category and Status badges */}
                  <div className="absolute top-2 left-2 sm:top-4 sm:left-4 flex flex-col gap-1">
                    <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-[10px] sm:text-xs font-medium">
                      {contest.music_category || "Music"}
                    </div>
                    <div className={`px-2 py-0.5 sm:px-3 sm:py-1 backdrop-blur-sm rounded-full text-[10px] sm:text-xs font-medium ${
                      contest.calculatedStatus === 'active' ? 'bg-green-500/80 text-white' :
                      contest.calculatedStatus === 'ended' ? 'bg-red-500/80 text-white' :
                      'bg-gray-500/80 text-white'
                    }`}>
                      {getStatusLabel(contest.calculatedStatus || 'active')}
                    </div>
                  </div>
                </div>

                {/* Contest Info */}
                <div className="p-3 sm:p-6 space-y-2 sm:space-y-4">
                  <div>
                    <h3 className="text-sm sm:text-xl font-bold text-white mb-1 sm:mb-2 line-clamp-1">
                      {contest.name}
                    </h3>
                    <p className="text-white/70 text-xs sm:text-sm line-clamp-2">
                      {contest.description}
                    </p>
                  </div>

                  {/* Prize Info */}
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg p-1.5 sm:p-2">
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                        <h4 className="text-[10px] sm:text-xs font-medium text-white">
                          Prizes
                        </h4>
                      </div>
                      <div className="text-[10px] sm:text-xs text-white/60">
                        {contest.num_winners} Winners
                      </div>
                    </div>
                    <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-2 -mx-1 px-1 snap-x snap-mandatory scrollbar-hide">
                      {contest.prize_titles
                        .slice(
                          0,
                          contest.num_winners || contest.prize_titles.length
                        )
                        .map((prize: any, index: number) => (
                          <div
                            key={index}
                            className="p-1 sm:p-1.5 rounded-lg border snap-start flex-shrink-0 min-w-[60px] sm:min-w-[70px] bg-black/20 border-white/10 transition-all hover:bg-white/5"
                          >
                            <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
                              {getRankIcon(index + 1)}
                              <span
                                className={`text-[10px] font-medium ${
                                  index === 0
                                    ? "text-yellow-400"
                                    : index === 1
                                    ? "text-gray-400"
                                    : index === 2
                                    ? "text-amber-600"
                                    : "text-white/60"
                                }`}
                              >
                                {index + 1}
                                {index === 0
                                  ? "st"
                                  : index === 1
                                  ? "nd"
                                  : index === 2
                                  ? "rd"
                                  : "th"}
                              </span>
                            </div>
                            <div className="text-[8px] sm:text-[10px] font-medium leading-tight line-clamp-1 sm:line-clamp-2 text-white">
                              {contest.prize_tier === "monetary"
                                ? `$${formatNumber(
                                    (contest.prize_per_winner || 0) *
                                      (1 - index * 0.2)
                                  )}`
                                : prize.title}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Top Participants */}
                  {/* Hide top participants on mobile to save space */}
                  {contest.top_participants &&
                    contest.top_participants.length > 0 && (
                      <div className="space-y-2">
                        <div className="hidden sm:flex items-center gap-2">
                          <Users className="h-3 w-3 sm:h-4 sm:w-4 text-white/60" />
                          <span className="text-xs sm:text-sm font-medium text-white/60">
                            Current Leaders
                          </span>
                        </div>
                        <div className="hidden sm:block space-y-1">
                          {contest.top_participants
                            .slice(0, 3)
                            .map((participant) => (
                              <div
                                key={participant.rank}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  {getRankIcon(participant.rank)}
                                  <span className="text-white">
                                    @{participant.username}
                                  </span>
                                </div>
                                <span className="text-white/60">
                                  {formatNumber(participant.views)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 sm:gap-3 pt-2">
                    <Link
                      to={`/l/${contest.id}`}
                      className="flex-1 px-2 py-1.5 sm:px-4 sm:py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-center text-[10px] sm:text-sm font-medium"
                    >
                      Leaderboard
                    </Link>
                    {session && userSubmissions[contest.id] ? (
                      <button
                        onClick={() =>
                          navigate(`/contest-management/${contest.id}`)
                        }
                        className="flex-1 px-2 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-all text-[10px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2"
                      >
                        <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                        Manage
                      </button>
                    ) : (
                      <button
                        onClick={() => handleJoinContest(contest)}
                        className="flex-1 px-2 py-1.5 sm:px-4 sm:py-2 bg-white hover:bg-white/90 text-black rounded-lg transition-all text-[10px] sm:text-sm font-medium flex items-center justify-center gap-1 sm:gap-2"
                      >
                        <Trophy className="h-3 w-3 sm:h-4 sm:w-4" />
                        {session ? (
                          <>
                            <span className="hidden sm:inline">
                              Join Contest
                            </span>
                            <span className="sm:hidden">Join</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden sm:inline">
                              Sign Up to Join
                            </span>
                            <span className="sm:hidden">Sign Up</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Call to Action */}
        {!session && contests.length > 0 && (
          <div className="mt-16 text-center bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8">
            <Award className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">
              Ready to Compete?
            </h3>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Sign up now to join contests and showcase your musical talent to
              the world
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => redirectToAuth("/signup")}
                className="px-8 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium"
              >
                Create Account
              </button>
              <button
                onClick={() => redirectToAuth("/signin")}
                className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-lg transition-colors font-medium"
              >
                Sign In
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <TikTokSettingsModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
      />

      {selectedContest && (
        <ContestJoinModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          contest={selectedContest as any}
          onSuccess={handleContestJoined}
        />
      )}

      {viewVideo && (
        <ViewSubmissionModal
          isOpen={!!viewVideo}
          onClose={() => setViewVideo(null)}
          video={viewVideo}
        />
      )}
    </div>
  );
}
