import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Crown,
  Medal,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  Trophy,
  Link as LinkIcon,
  Plus,
  X,
  Loader2,
  Play,
  Share2,
  Globe,
  Gift,
  Users,
  Calendar,
  MapPin,
  Target,
  Zap,
  CheckCircle,
  Info,
  ExternalLink,
  Settings,
  User,
  Heart,
  MessageCircle,
  Eye,
  Share,
  TrendingUp,
  Award,
  Music,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { ContestJoinModal } from "../components/ContestJoinModal";
import { TikTokSettingsModal } from "../components/TikTokSettingsModal";
import { ViewSubmissionModal } from "../components/ViewSubmissionModal";
import { ContestMap } from "../components/ContestMap";
import { useTikTokConnection } from "../hooks/useTikTokConnection";
import { useAuthRedirect } from "../hooks/useAuthRedirect";
import { 
  calculateContestStatus, 
  getStatusLabel, 
  getStatusColor,
  formatTimeRemaining,
  getTimeRemaining 
} from "../lib/contestUtils";
import { ContestCountdown } from "../components/ContestCountdown";

interface Participant {
  rank: number;
  username: string;
  full_name: string;
  points: number;
  views: number;
  previousRank?: number;
  video_id?: string;
  video_title?: string;
  video_url?: string;
  thumbnail?: string;
  likes?: number;
  comments?: number;
  shares?: number;
  submission_date?: string;
  tiktok_username?: string;
  tiktok_display_name?: string;
  tiktok_account_name?: string;
  tiktok_account_id?: string;
}

interface ContestDetails {
  id: string;
  name: string;
  description: string;
  status: string;
  calculatedStatus?: 'draft' | 'active' | 'ended' | 'archived';
  start_date: string;
  end_date: string;
  prize_tier?: string;
  prize_per_winner: number;
  prize_titles: { rank: number; title: string }[];
  music_category: string;
  cover_image?: string;
  guidelines?: string;
  rules?: string;
  hashtags?: string[] | null;
  submission_deadline?: string | null;
  max_participants?: number | null;
  num_winners?: number;
  total_prize?: number;
}

export function PublicLeaderboard() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [showTikTokSettings, setShowTikTokSettings] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewVideo, setViewVideo] = useState<any>(null);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'prizes' | 'how-to-enter' | 'rules'>('prizes');
  const [detailsView, setDetailsView] = useState<'prizes' | 'how-to-enter' | 'rules'>('prizes');
  const [showMobileDetails, setShowMobileDetails] = useState(false);
  const { isConnected: isTikTokConnected, refreshConnection } = useTikTokConnection();
  const { redirectToAuth } = useAuthRedirect();

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    if (id) {
      fetchContestDetails();
      fetchLeaderboard();
    }
  }, [id]);

  useEffect(() => {
    if (session && contest) {
      fetchUserSubmission();
    }
  }, [session, contest]);

  const fetchContestDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", id as string)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        const contestWithStatus = {
          ...data,
          calculatedStatus: calculateContestStatus(data)
        };
        setContest(contestWithStatus as unknown as ContestDetails);
      } else {
        setContest(null);
      }
    } catch (error) {
      console.error("Error fetching contest details:", error);
      toast.error("Failed to load contest details");
      setContest(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmission = async () => {
    if (!session || !contest) return;
    
    try {
      const { data, error } = await supabase
        .from("contest_links")
        .select("*")
        .eq("contest_id", contest.id)
        .eq("created_by", session.user.id)
        .eq("is_contest_submission", true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setUserSubmission(data);
    } catch (error) {
      console.error("Error fetching user submission:", error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      if (backendUrl && backendUrl !== "http://localhost:3000") {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          `${backendUrl}/api/v1/contests/${id}/leaderboard?limit=200`,
          {
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.data?.leaderboard) {
            setParticipants(data.data.leaderboard);
          }
        } else {
          console.warn(`Leaderboard API returned ${response.status}`);
        }
      } else {
        console.warn("Using localhost backend - limited functionality");
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        console.warn("Leaderboard request timeout");
      } else {
        console.warn("Network error fetching leaderboard:", error);
      }
    }
  };

  const handleJoinContest = () => {
    if (!session) {
      redirectToAuth("/signin");
      return;
    }

    if (!isTikTokConnected) {
      setShowTikTokModal(true);
      return;
    }

    setShowJoinModal(true);
  };

  const handleContestJoined = () => {
    setShowJoinModal(false);
    fetchUserSubmission();
    fetchLeaderboard();
    toast.success("Successfully joined contest!");
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: contest?.name || "Contest Leaderboard",
        text: contest?.description || "Check out this contest!",
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleViewVideo = (participant: Participant) => {
    if (!participant.video_id) {
      toast.error("Video not available");
      return;
    }

    const videoData = {
      id: participant.video_id,
      title: participant.video_title || `Video by ${participant.username}`,
      url: participant.video_url || "",
      video_url: participant.video_url,
      thumbnail: participant.thumbnail || "",
      username: participant.tiktok_username || participant.username,
      views: participant.views,
      likes: participant.likes || 0,
      comments: participant.comments || 0,
      shares: participant.shares || 0,
      tiktok_display_name: participant.tiktok_display_name,
      rank: participant.rank,
    };

    setViewVideo(videoData);
    setShowViewModal(true);
  };

  const getRankIcon = (rank: number) => {
    const colors = {
      1: "text-yellow-400",
      2: "text-gray-400", 
      3: "text-amber-600",
      4: "text-blue-400",
      5: "text-green-400",
    };

    const color = colors[rank as keyof typeof colors] || "text-slate-400";

    if (rank === 1) {
      return (
        <div className="relative">
          <Crown className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
        </div>
      );
    }

    return (
      <div className="relative">
        <Crown className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />
      </div>
    );
  };

  const getRankChangeIcon = (currentRank: number, previousRank?: number) => {
    if (!previousRank) return <Minus className="h-4 w-4 text-white/40" />;

    if (currentRank < previousRank) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (currentRank > previousRank) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-white/40" />;
  };

  const getRankColor = (rank: number) => {
    const colors = {
      1: "text-yellow-400",
      2: "text-gray-400",
      3: "text-amber-600",
    };
    return colors[rank as keyof typeof colors] || "text-white/60";
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

  const formatDate = (dateString: string) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const formatCurrency = (value: number) => {
    const rounded = Math.round(value * 100) / 100;
    if (rounded >= 1000) {
      return formatNumber(rounded);
    }
    return rounded % 1 === 0 ? rounded.toString() : rounded.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin"></div>
          </div>
          <p className="mt-6 text-white/60 font-light tracking-wider">
            LOADING
          </p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Contest not found
          </h2>
          <p className="text-white/60 mb-6">
            This contest may have ended or been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <Globe className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Crown
            </span>
          </Link>
          {session && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTikTokSettings(true)}
                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white text-sm sm:text-base"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">TikTok</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contest Header */}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          {contest.cover_image && (
            <div className="absolute inset-0 overflow-hidden opacity-30">
              <img
                src={contest.cover_image}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/50 to-[#0A0A0A]" />
            </div>
          )}

          <div className="relative">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-4">
                <Trophy className="h-4 w-4 text-yellow-400" />
                <span className="text-white/80 text-sm font-medium">
                  Live Contest
                </span>
              </div>
              
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4 tracking-tight">
                {contest.name}
              </h1>
              
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-6">
                {contest.description}
              </p>

              {/* Contest Status and Countdown */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(contest.calculatedStatus || 'active')}`}>
                  {getStatusLabel(contest.calculatedStatus || 'active')}
                </div>
                <ContestCountdown contest={contest} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {session && userSubmission ? (
                  <Link
                    to={`/contest-management/${contest.id}`}
                    className="px-8 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-medium flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Manage Entry
                  </Link>
                ) : contest.calculatedStatus === 'active' ? (
                  <button
                    onClick={handleJoinContest}
                    className="px-8 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-medium flex items-center gap-2"
                  >
                    <Trophy className="h-4 w-4" />
                    {session ? "Join Contest" : "Sign Up to Join"}
                  </button>
                ) : (
                  <div className="px-8 py-3 bg-white/20 text-white/60 rounded-xl font-medium">
                    Contest {contest.calculatedStatus === 'ended' ? 'Ended' : 'Not Started'}
                  </div>
                )}
                
                <button
                  onClick={handleShare}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Contest Details */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mobile Details Toggle */}
            <div className="lg:hidden">
              <button
                onClick={() => setShowMobileDetails(!showMobileDetails)}
                className="w-full flex items-center justify-between p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10"
              >
                <span className="text-white font-medium">Contest Details</span>
                {showMobileDetails ? (
                  <ChevronUp className="h-5 w-5 text-white/60" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-white/60" />
                )}
              </button>
            </div>

            {/* Contest Details */}
            <div className={`space-y-6 ${showMobileDetails ? 'block' : 'hidden lg:block'}`}>
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Contest Details
                </h2>

                {/* Toggle Buttons */}
                <div className="flex bg-white/10 rounded-lg p-1 mb-6">
                  <button
                    onClick={() => setDetailsView('prizes')}
                    className={`px-4 py-2 rounded-full transition-all duration-300 font-medium text-sm ${
                      detailsView === 'prizes'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Prizes
                  </button>
                  <button
                    onClick={() => setDetailsView('how-to-enter')}
                    className={`px-4 py-2 rounded-full transition-all duration-300 font-medium text-sm ${
                      detailsView === 'how-to-enter'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    How to Enter
                  </button>
                  <button
                    onClick={() => setDetailsView('rules')}
                    className={`px-4 py-2 rounded-full transition-all duration-300 font-medium text-sm ${
                      detailsView === 'rules'
                        ? 'bg-white text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    Rules
                  </button>
                </div>

                {/* Tab Content */}
                {detailsView === 'prizes' && (
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {contest.prize_titles
                        .slice(0, contest.num_winners || contest.prize_titles.length)
                        .map((prize: any, index: number) => (
                          <div
                            key={index}
                            className="p-4 rounded-lg border bg-black/20 border-white/10 transition-all hover:bg-white/5"
                          >
                            <div className="flex items-center gap-3 mb-2">
                              {getRankIcon(index + 1)}
                              <span className={`text-sm font-medium ${getRankColor(index + 1)}`}>
                                {index + 1}
                                {index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"} Place
                              </span>
                            </div>
                            <div className="text-base font-medium text-white">
                              {contest.prize_tier === "monetary"
                                ? `$${formatCurrency((contest.prize_per_winner || 0) * (1 - index * 0.2))}`
                                : prize.title}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {detailsView === 'how-to-enter' && (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          1
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Create Your Performance</h4>
                          <p className="text-white/70 text-sm">
                            Record a video performance that follows the contest guidelines and showcases your talent.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          2
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Post to TikTok</h4>
                          <p className="text-white/70 text-sm">
                            Share your video on TikTok using your connected account to enter the competition.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          3
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Submit Your Entry</h4>
                          <p className="text-white/70 text-sm">
                            Come back to this page and tap "Join Contest" to officially enter your video.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          4
                        </div>
                        <div>
                          <h4 className="font-medium text-white mb-1">Climb the Leaderboard</h4>
                          <p className="text-white/70 text-sm">
                            Share your video and get more views to rise up in the contest rankings.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {detailsView === 'rules' && (
                  <div className="space-y-4">
                    {contest.rules ? (
                      <div className="text-white/80 leading-relaxed">
                        {contest.rules}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-400" />
                            Eligibility
                          </h4>
                          <p className="text-white/70 text-sm">
                            Must be 18+ years old and have a valid TikTok account to participate.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                            <Music className="h-4 w-4 text-blue-400" />
                            Content Guidelines
                          </h4>
                          <p className="text-white/70 text-sm">
                            Videos must be original performances in the {contest.music_category} category.
                          </p>
                        </div>
                        
                        <div className="p-4 bg-white/5 rounded-lg">
                          <h4 className="font-medium text-white mb-2 flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-yellow-400" />
                            Judging Criteria
                          </h4>
                          <p className="text-white/70 text-sm">
                            Rankings are based on video views and engagement metrics from TikTok.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Contest Info */}
              <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Timeline
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-white/60">Start Date</div>
                    <div className="text-white font-medium">{formatDate(contest.start_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/60">End Date</div>
                    <div className="text-white font-medium">{formatDate(contest.end_date)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-white/60">Category</div>
                    <div className="text-white font-medium">{contest.music_category}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Leaderboard */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-400" />
                    Leaderboard
                  </h2>
                  <div className="text-sm text-white/60">
                    {participants.length} participants
                  </div>
                </div>
              </div>

              {/* Leaderboard Content */}
              {participants.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No participants yet
                  </h3>
                  <p className="text-white/60">
                    Be the first to join this contest!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {participants.map((participant, index) => (
                    <div
                      key={participant.rank || index}
                      className="p-4 sm:p-6 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <div className="flex items-center gap-2 min-w-[60px]">
                          {getRankIcon(participant.rank)}
                          <span className={`font-bold text-lg ${getRankColor(participant.rank)}`}>
                            #{participant.rank}
                          </span>
                        </div>

                        {/* Participant Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white truncate">
                              {participant.tiktok_display_name || participant.full_name || participant.username}
                            </h3>
                            {participant.rank <= (contest.num_winners || 3) && (
                              <div className="px-2 py-1 bg-yellow-400/20 text-yellow-400 rounded text-xs font-medium">
                                Winner
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-white/60">
                            @{participant.tiktok_username || participant.username}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
                            <span className="flex items-center gap-1">
                              <Eye className="h-3 w-3" />
                              {formatNumber(participant.views)} views
                            </span>
                            {participant.likes !== undefined && (
                              <span className="flex items-center gap-1">
                                <Heart className="h-3 w-3" />
                                {formatNumber(participant.likes)}
                              </span>
                            )}
                            {participant.comments !== undefined && (
                              <span className="flex items-center gap-1">
                                <MessageCircle className="h-3 w-3" />
                                {formatNumber(participant.comments)}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {participant.video_id && (
                            <button
                              onClick={() => handleViewVideo(participant)}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                              title="View video"
                            >
                              <Play className="h-4 w-4 text-white" />
                            </button>
                          )}
                          <div className="flex items-center gap-1">
                            {getRankChangeIcon(participant.rank, participant.previousRank)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TikTokSettingsModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
      />

      <TikTokSettingsModal
        isOpen={showTikTokSettings}
        onClose={() => setShowTikTokSettings(false)}
      />

      <ContestJoinModal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        contest={contest}
        onSuccess={handleContestJoined}
      />

      <ViewSubmissionModal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        video={viewVideo}
      />
    </div>
  );
}