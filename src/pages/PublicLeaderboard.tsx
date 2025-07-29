import React, { useEffect, useState, useRef } from "react";
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
  Share2,
  Play,
  Home,
  Users,
  Gift,
  Sparkles,
  TrendingUp,
  Eye,
  Heart,
  MessageCircle,
  Share,
  Calendar,
  Music,
  Award,
  Target,
  Zap,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Loader2,
  UserPlus,
  Settings,
  ExternalLink,
  Info,
  CheckCircle,
  AlertCircle,
  Flame,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import { ContestJoinModal } from "../components/ContestJoinModal";
import { TikTokSettingsModal } from "../components/TikTokSettingsModal";
import { ViewSubmissionModal } from "../components/ViewSubmissionModal";
import { MobileVideoModal } from "../components/MobileVideoModal";
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
import useEmblaCarousel from 'embla-carousel-react';

interface Contest {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  status: string | null;
  music_category?: string | null;
  prize_per_winner?: number | null;
  prize_titles?: any | null;
  num_winners?: number | null;
  total_prize?: number | null;
  guidelines?: string | null;
  rules?: string | null;
  hashtags?: string[] | null;
  submission_deadline?: string | null;
  max_participants?: number | null;
}

interface VideoData {
  id: string;
  title: string;
  url: string;
  video_url?: string | null;
  thumbnail: string;
  username: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  avatar_url?: string | null;
  tiktok_display_name?: string | null;
  rank?: number | null;
}

interface Participant {
  rank: number;
  user_id: string;
  full_name: string;
  tiktok_username: string;
  tiktok_display_name: string;
  tiktok_account_name: string;
  tiktok_account_id: string;
  video_id: string;
  video_title: string;
  video_url: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  submission_date: string;
}

export function PublicLeaderboard() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const { redirectToAuth } = useAuthRedirect();
  
  const [contest, setContest] = useState<Contest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [showTikTokSettings, setShowTikTokSettings] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState<{[key: string]: boolean}>({});
  const [coverLoaded, setCoverLoaded] = useState<{[key: string]: boolean}>({});

  const { isConnected: isTikTokConnected } = useTikTokConnection();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Embla carousel for video player
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false
  });

  useEffect(() => {
    if (id) {
      fetchContestData();
      fetchLeaderboard();
      fetchFeaturedVideos();
      if (session) {
        fetchUserSubmission();
      }
    }
  }, [id, session]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setCurrentVideoIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  const fetchContestData = async () => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setContest(data);
    } catch (error) {
      console.error("Error fetching contest:", error);
      toast.error("Contest not found");
      navigate("/");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      if (backendUrl && backendUrl !== "http://localhost:3000") {
        const response = await fetch(
          `${backendUrl}/api/v1/contests/${id}/leaderboard?limit=100`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.data?.leaderboard) {
            setParticipants(data.data.leaderboard);
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch leaderboard:', error);
    }
  };

  const fetchFeaturedVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("contest_links")
        .select("*")
        .eq("contest_id", id)
        .eq("is_contest_submission", true)
        .eq("active", true)
        .order("views", { ascending: false })
        .limit(10);

      if (error) throw error;

      const videosWithRank = (data || []).map((video, index) => ({
        ...video,
        rank: index + 1,
      }));

      setFeaturedVideos(videosWithRank);

      // Initialize loading states
      const initialLoadState = videosWithRank.reduce((acc, video) => ({
        ...acc,
        [video.id]: false
      }), {});
      setCoverLoaded(initialLoadState);
      setVideoLoaded(initialLoadState);
    } catch (error) {
      console.error("Error fetching featured videos:", error);
      // Set empty array to prevent UI issues
      setFeaturedVideos([]);
      setCoverLoaded({});
      setVideoLoaded({});
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmission = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase
        .from("contest_links")
        .select("*")
        .eq("contest_id", id)
        .eq("created_by", session.user.id)
        .eq("is_contest_submission", true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setUserSubmission(data);
    } catch (error) {
      console.error("Error fetching user submission:", error);
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

  const handleVideoClick = (video: VideoData, index: number) => {
    setSelectedVideo(video);
    setCurrentVideoIndex(index);
    
    // Check if mobile
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowMobileModal(true);
    } else {
      setShowViewModal(true);
    }
  };

  const handleCoverLoad = (videoId: string) => {
    setCoverLoaded(prev => ({
      ...prev,
      [videoId]: true
    }));
  };

  const handleVideoLoad = (videoId: string) => {
    setVideoLoaded(prev => ({
      ...prev,
      [videoId]: true
    }));
  };

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

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
      4: "text-blue-400",
      5: "text-green-400",
    };

    const color = colors[rank as keyof typeof colors] || "text-slate-400";

    if (rank === 1) {
      return (
        <div className="relative">
          <Crown className={`h-5 w-5 ${color}`} />
          <Sparkles className="absolute -top-1 -right-1 h-3 w-3 text-yellow-300 animate-pulse" />
        </div>
      );
    }

    return (
      <div className="relative">
        <Crown className={`h-5 w-5 ${color}`} />
      </div>
    );
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    try {
      await navigator.share({
        title: contest?.name || "Contest",
        text: contest?.description || "Check out this contest!",
        url: shareUrl,
      });
    } catch (error) {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 relative">
            <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"></div>
            <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin"></div>
          </div>
          <p className="mt-6 text-white/60 font-light tracking-wider">LOADING</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-white/20 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Contest Not Found</h2>
          <p className="text-white/60 mb-6">This contest may have ended or been removed.</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            <Home className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  const contestStatus = calculateContestStatus(contest);
  const timeRemaining = getTimeRemaining(contest);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 relative overflow-hidden">
      {/* Background Image */}
      {contest.cover_image && (
        <div className="absolute inset-0">
          <img
            src={contest.cover_image}
            alt=""
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/80 via-gray-800/60 to-gray-900/90"></div>
        </div>
      )}

      {/* Header */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crown</span>
          </Link>
          
          {session ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => redirectToAuth("/signin")}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-colors text-sm font-medium"
              >
                Login
              </button>
              <button
                onClick={() => redirectToAuth("/signup")}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors text-sm font-medium"
              >
                Sign up
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => redirectToAuth("/signin")}
                className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-colors text-sm font-medium"
              >
                Login
              </button>
              <button
                onClick={() => redirectToAuth("/signup")}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors text-sm font-medium"
              >
                Sign up
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Hero Section with Large Crown Logo */}
      <div className="relative z-10 text-center py-16">
        <div className="mb-8">
          <div className="w-32 h-32 mx-auto bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center border-4 border-white/20 shadow-2xl">
            <Crown className="h-16 w-16 text-white" />
          </div>
        </div>
        
        <div className="mb-8">
          <button
            onClick={handleJoinContest}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors"
          >
            Sign up to join
          </button>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white mb-4 tracking-tight">
          {contest.name.toUpperCase()}
        </h1>
        
        <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
          {contest.description}
        </p>
      </div>

      {/* Prize Podium */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 mb-16">
        <div className="flex justify-center items-end gap-8">
          {/* Second Place */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full flex items-center justify-center border-4 border-white/20 mb-4">
              <span className="text-2xl">🥈</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white font-bold">SECOND PLACE</div>
              <div className="text-white/60 text-sm mt-1">
                {contest.prize_per_winner ? `$${formatNumber(contest.prize_per_winner * 0.8)}` : 'Runner-up'}
              </div>
            </div>
          </div>

          {/* First Place */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-4 border-white/20 mb-4">
              <Crown className="h-10 w-10 text-white" />
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
              <div className="text-white font-bold text-lg">FIRST PLACE</div>
              <div className="text-white/80 text-sm mt-1">
                EXCLUSIVE SPOT AT THE
              </div>
              <div className="text-white/80 text-sm">
                DO-LAB IN THE DESERT
              </div>
              <div className="text-white/80 text-sm">
                IN 2025.
              </div>
            </div>
          </div>

          {/* Third Place */}
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center border-4 border-white/20 mb-4">
              <span className="text-2xl">🥉</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="text-white font-bold">THIRD PLACE</div>
              <div className="text-white/60 text-sm mt-1">
                {contest.prize_per_winner ? `$${formatNumber(contest.prize_per_winner * 0.6)}` : 'Third Place'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Section */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-2 flex items-center justify-center gap-3">
            <Crown className="h-8 w-8 text-yellow-400" />
            Leaderboard
          </h2>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-4 text-center">
            <h3 className="text-white font-black text-xl tracking-wider">GET CROWNED.</h3>
          </div>

          {/* Leaderboard Table */}
          <div className="p-6">
            {participants.length > 0 ? (
              <div className="space-y-3">
                {participants.slice(0, 10).map((participant, index) => (
                  <div
                    key={participant.video_id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-gray-800">
                          {participant.rank}
                        </span>
                        {participant.rank <= 3 && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center">
                            {participant.rank === 1 && <Crown className="h-5 w-5 text-yellow-500" />}
                            {participant.rank === 2 && <Medal className="h-5 w-5 text-gray-400" />}
                            {participant.rank === 3 && <Medal className="h-5 w-5 text-amber-600" />}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {participant.tiktok_display_name?.charAt(0) || participant.tiktok_username?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            @{participant.tiktok_username}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          {formatNumber(participant.views)}
                        </div>
                        <div className="text-sm text-gray-500">views</div>
                      </div>
                      <button className="px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-sm font-medium transition-colors">
                        Support
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Target className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No Participants Yet</h3>
                <p className="text-gray-500 mb-6">Be the first to join this contest!</p>
                <button
                  onClick={handleJoinContest}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors"
                >
                  Join Contest
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trending Entries Section */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 mb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-white mb-4 flex items-center justify-center gap-3">
            <Flame className="h-8 w-8 text-orange-500" />
            Trending Entries
            <Flame className="h-8 w-8 text-orange-500" />
          </h2>
        </div>

        {featuredVideos.length > 0 ? (
          <div className="relative max-w-7xl mx-auto w-full">
            <div className="overflow-hidden w-full" ref={emblaRef}>
              <div className="flex">
                {featuredVideos.map((video, index) => {
                  const isSelected = index === currentVideoIndex;
                  const scale = isSelected ? 1 : 0.85;
                  const opacity = isSelected ? 1 : 0.6;

                  return (
                    <div 
                      key={video.id}
                      className="flex-[0_0_100%] min-w-0 px-2 md:flex-[0_0_33.333%] lg:flex-[0_0_25%] flex items-center justify-center"
                    >
                      <div 
                        className="relative transition-all duration-300 ease-out group will-change-transform cursor-pointer"
                        style={{
                          transform: `scale(${scale})`,
                          opacity,
                          width: '280px',
                          maxWidth: '100%'
                        }}
                        onClick={() => handleVideoClick(video, index)}
                      >
                        <div 
                          className="relative bg-black rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all"
                          style={{ aspectRatio: '9/16' }}
                        >
                          {/* Loading Placeholder */}
                          {!coverLoaded[video.id] && (
                            <div className="absolute inset-0 bg-black flex items-center justify-center">
                              <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                            </div>
                          )}

                          {/* Thumbnail */}
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                              isSelected && videoLoaded[video.id] ? 'opacity-0' : 'opacity-100'
                            }`}
                            loading={isSelected ? 'eager' : 'lazy'}
                            onLoad={() => handleCoverLoad(video.id)}
                          />

                          {/* Video Content */}
                          {isSelected && (
                            <div className="absolute inset-0">
                              {video.video_url ? (
                                <video
                                  src={video.video_url}
                                  className={`w-full h-full object-cover rounded-2xl transition-opacity duration-700 ${
                                    videoLoaded[video.id] ? 'opacity-100' : 'opacity-0'
                                  }`}
                                  autoPlay
                                  loop
                                  muted={isMuted}
                                  playsInline
                                  controls={false}
                                  onLoadedData={() => handleVideoLoad(video.id)}
                                />
                              ) : null}
                            </div>
                          )}

                          {/* Gradient Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                          {/* Views Badge */}
                          <div className="absolute top-4 left-4">
                            <div className="px-3 py-1 bg-blue-500 text-white rounded-full text-sm font-bold">
                              👁 {formatNumber(video.views || 0)}
                            </div>
                          </div>

                          {/* Video Info */}
                          <div className="absolute bottom-0 left-0 right-0 p-4">
                            <div className="space-y-2">
                              <h3 className="text-sm sm:text-base font-medium text-white line-clamp-1">
                                {video.title}
                              </h3>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                                <span>@{video.username}</span>
                              </div>
                            </div>
                          </div>

                          {/* Mute Button */}
                          {isSelected && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsMuted(!isMuted);
                              }}
                              className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors"
                            >
                              {isMuted ? (
                                <VolumeX className="h-4 w-4" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Arrows */}
            {featuredVideos.length > 1 && (
              <>
                <button
                  onClick={scrollPrev}
                  className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
                >
                  <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>

                <button
                  onClick={scrollNext}
                  className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
                >
                  <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <Music className="h-16 w-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
            <p className="text-white/60">Be the first to submit your entry!</p>
          </div>
        )}
      </div>

      {/* Call to Action Section */}
      <div className="relative z-10 text-center py-16">
        <h2 className="text-4xl sm:text-6xl font-black text-white/20 mb-8 tracking-wider">
          WHAT ARE YOU
        </h2>
        <h2 className="text-4xl sm:text-6xl font-black text-white/20 mb-8 tracking-wider">
          WAITING FOR?
        </h2>
        
        <button
          onClick={handleJoinContest}
          className="px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-lg transition-colors"
        >
          Sign up to join
        </button>
      </div>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 mt-8 sm:mt-12 border-t border-white/10">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-white/40" />
            <span className="text-white/40 font-light tracking-wider">CROWN</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <Link to="/terms" className="text-white/60 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <span className="text-white/20">•</span>
            <Link to="/privacy" className="text-white/60 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </div>
          <p className="text-white/40 text-xs sm:text-sm text-center">
            © {new Date().getFullYear()} Crown. All rights reserved.
          </p>
        </div>
      </footer>

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
        video={selectedVideo}
      />

      <MobileVideoModal
        isOpen={showMobileModal}
        onClose={() => setShowMobileModal(false)}
        video={selectedVideo}
      />
    </div>
  );
}