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
  ChevronDown,
  ChevronUp,
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
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState<{[key: string]: boolean}>({});
  const [coverLoaded, setCoverLoaded] = useState<{[key: string]: boolean}>({});
  const [showFullDescription, setShowFullDescription] = useState(false);

  const { isConnected: isTikTokConnected } = useTikTokConnection();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Embla carousel for video player
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false
  });

  // Embla carousel for prizes
  const [prizeEmblaRef, prizeEmblaApi] = useEmblaCarousel({
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

  useEffect(() => {
    if (!prizeEmblaApi) return;

    const onSelect = () => {
      setCurrentPrizeIndex(prizeEmblaApi.selectedScrollSnap());
    };

    prizeEmblaApi.on('select', onSelect);
    prizeEmblaApi.on('reInit', onSelect);

    return () => {
      prizeEmblaApi.off('select', onSelect);
      prizeEmblaApi.off('reInit', onSelect);
    };
  }, [prizeEmblaApi]);
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

  const scrollPrizePrev = () => prizeEmblaApi && prizeEmblaApi.scrollPrev();
  const scrollPrizeNext = () => prizeEmblaApi && prizeEmblaApi.scrollNext();
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
            className="px-6 py-3 sm:px-8 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors text-sm sm:text-base relative z-50"
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
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Hero Image Section */}
      {contest.cover_image && (
        <div className="relative h-[42rem] sm:h-[37rem] md:h-[46rem] lg:h-[54rem] xl:h-[63rem] overflow-hidden bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
          <img
            src={contest.cover_image}
            alt={contest.name}
            className="w-full h-[30rem] sm:h-[25rem] md:h-[34rem] lg:h-[42rem] xl:h-[51rem] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/70"></div>
          
          {/* Black bottom section for expanded hero area */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]"></div>
          
          {/* Header overlay on hero image */}
          <div className="absolute top-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 sm:gap-3">
                <Crown className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
                <span className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight">Crown</span>
              </Link>
              
              {!session && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => redirectToAuth("/signin")}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-colors text-xs sm:text-sm font-medium"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => redirectToAuth("/signup")}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors text-xs sm:text-sm font-medium"
                  >
                    Sign up
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Hero Content */}
          <div className="absolute inset-4 sm:inset-8 flex flex-col justify-center items-center text-center">
            {/* Mobile Layout */}
            <div className="block sm:hidden w-full h-full">
              {/* Compact Mobile Layout */}
              <div className="flex flex-col h-full justify-center items-center text-center px-2">
                
                {/* Title - Compact */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
                  {contest.name.toUpperCase()}
                </h1>
                
                {/* Description - Now visible on mobile */}
                <div className="px-1 max-w-sm mx-auto">
                  <p className={`text-sm text-white/90 text-center leading-relaxed mb-4 ${
                    showFullDescription ? '' : 'line-clamp-3'
                  }`}>
                    {contest.description || "Join this exciting music competition and showcase your talent to win amazing prizes!"}
                  </p>
                  {contest.description && contest.description.length > 150 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="mt-2 text-xs text-white/70 hover:text-white transition-colors flex items-center gap-1 mx-auto"
                    >
                      {showFullDescription ? (
                        <>
                          <span>Show less</span>
                          <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          <span>Show more</span>
                          <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                
              </div>
            </div>
            
            {/* Desktop Layout */}
            <div className="hidden sm:block">
              {/* Crown Logo at Top */}
              <div className="mb-6 sm:mb-8">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center border-2 sm:border-4 border-white/20 shadow-2xl">
                  <Crown className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-white" />
                </div>
              </div>
              
              {/* Contest Title and Description */}
              <div className="mb-3 sm:mb-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-4 tracking-tight">
                  {contest.name.toUpperCase()}
                </h1>
                
                <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8">
                  {contest.description}
                </p>
              </div>
            </div>
          </div>
          
          {/* Prizes Section Above Button */}
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <div className="text-center mb-4">
              <h2 className="text-lg sm:text-xl font-black text-white mb-2 mt-6 flex items-center justify-center gap-2">
                <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-400" />
                Prizes
              </h2>
            </div>
            
            <div className="relative max-w-7xl mx-auto w-full">
              <div className="overflow-hidden w-full" ref={prizeEmblaRef}>
                <div className="flex">
                  {Array.from({ length: contest?.num_winners || 5 }, (_, index) => {
                    const isSelected = index === currentPrizeIndex;
                    const scale = 1; // Keep all prizes the same size
                    const opacity = 1; // Keep all prizes the same opacity
                    const rank = index + 1;
                    
                    // Get prize data from database
                    const prizeTitle = contest?.prize_titles?.[index];
                    
                    // Use actual database prize structure
                    let prizeText;
                    let prizeAmount = null;
                    
                    // Check if we have custom prize titles from database
                    if (prizeTitle && prizeTitle.title) {
                      prizeText = prizeTitle.title;
                    } else {
                      // Generate default place names
                      prizeText = `${rank}${rank === 1 ? 'ST' : rank === 2 ? 'ND' : rank === 3 ? 'RD' : 'TH'} PLACE`;
                    }
                    
                    // Calculate prize amount from database
                    if (contest?.prize_per_winner && contest.prize_per_winner > 0) {
                      // Use the actual prize_per_winner from database
                      prizeAmount = contest.prize_per_winner;
                      
                      // If there are multiple winners, calculate distribution
                      if (contest.num_winners && contest.num_winners > 1) {
                        // First place gets full amount, others get reduced amounts
                        const reductionFactor = Math.max(0.2, 1 - (index * 0.2));
                        prizeAmount = Math.round(contest.prize_per_winner * reductionFactor);
                      }
                    }
                    
                    return (
                      <div 
                        key={index}
                        className="flex-[0_0_100%] min-w-0 px-2 md:flex-[0_0_33.333%] lg:flex-[0_0_25%] flex items-center justify-center"
                      >
                        <div 
                          className="relative transition-all duration-300 ease-out group will-change-transform"
                          style={{
                            transform: `scale(${scale})`,
                            opacity,
                            width: '180px',
                            maxWidth: '100%'
                          }}
                        >
                          <div className="text-center">
                            <div className={`w-10 h-10 ${
                              rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                              rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                              rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                              rank === 4 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                              rank === 5 ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                              'bg-gradient-to-br from-slate-400 to-slate-600'
                            } rounded-full flex items-center justify-center border border-white/20 mb-1 mx-auto transition-all duration-300`}>
                              {rank === 1 ? (
                                <Crown className="h-5 w-5 text-white transition-all duration-300" />
                              ) : (
                                <span className="text-white font-bold text-xs transition-all duration-300">{rank}</span>
                              )}
                            </div>
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-1.5 min-w-[70px] border border-white/20 transition-all duration-300">
                              <div className="text-white font-bold text-[9px] transition-all duration-300">
                                {prizeText}
                              </div>
                              <div className="text-white/80 text-[8px] leading-tight text-center transition-all duration-300">
                                {prizeAmount ? `$${formatNumber(prizeAmount)}` : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Navigation Arrows */}
              {(contest?.num_winners || 5) > 1 && (
                <>
                  <button
                    onClick={scrollPrizePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <button
                    onClick={scrollPrizeNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sign up button at bottom of hero */}
          <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2">
            <button
              onClick={handleJoinContest}
              className="px-6 py-3 sm:px-8 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors text-sm sm:text-base relative z-50"
            >
              Sign up to join
            </button>
          </div>
        </div>
      )}

      {/* Fallback header for contests without cover image */}
      {!contest.cover_image && (
        <div className="bg-gradient-to-b from-gray-900 to-gray-800 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 pb-8 sm:pb-12">
          <div className="flex items-center justify-between mb-8 sm:mb-12">
            <Link to="/" className="flex items-center gap-2 sm:gap-3">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 text-white" />
              <span className="text-lg sm:text-2xl lg:text-3xl font-black text-white tracking-tight">Crown</span>
            </Link>
            
            {!session && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => redirectToAuth("/signin")}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full transition-colors text-xs sm:text-sm font-medium"
                >
                  Login
                </button>
                <button
                  onClick={() => redirectToAuth("/signup")}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-full transition-colors text-xs sm:text-sm font-medium"
                >
                  Sign up
                </button>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="mb-6 sm:mb-8">
              <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mx-auto bg-gradient-to-br from-orange-400 to-yellow-500 rounded-full flex items-center justify-center border-2 sm:border-4 border-white/20 shadow-2xl">
                <Crown className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-white" />
              </div>
            </div>
            
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-2 sm:mb-4 tracking-tight">
              {contest.name.toUpperCase()}
            </h1>
            
            <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8">
              {contest.description}
            </p>
            
            <button
              onClick={handleJoinContest}
              className="px-6 py-2.5 sm:px-8 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors text-sm sm:text-base"
            >
              Sign up to join
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      <div className="bg-[#0A0A0A] px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2 flex items-center justify-center gap-2 sm:gap-3">
              <Crown className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-400" />
            Leaderboard
            </h2>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
          {/* Header */}
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 sm:p-4 text-center">
              <h3 className="text-white font-black text-lg sm:text-xl tracking-wider">GET CROWNED.</h3>
            </div>

          {/* Leaderboard Table */}
            <div className="p-3 sm:p-4 lg:p-6">
            {participants.length > 0 ? (
                <div className="space-y-2 sm:space-y-3">
                {participants.slice(0, 10).map((participant, index) => (
                  <div
                    key={participant.video_id}
                      className="flex items-center justify-between p-2 sm:p-3 lg:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 flex-1 min-w-0">
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          <span className="text-lg sm:text-xl lg:text-2xl font-black text-gray-800">
                          {participant.rank}
                          </span>
                        {participant.rank <= 3 && (
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center">
                              {participant.rank === 1 && <Crown className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />}
                              {participant.rank === 2 && <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
                              {participant.rank === 3 && <Medal className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />}
                            </div>
                          )}
                        </div>
                      
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs sm:text-sm font-medium">
                            {participant.tiktok_display_name?.charAt(0) || participant.tiktok_username?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 text-sm sm:text-base truncate">
                            @{participant.tiktok_username}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500 sm:hidden">
                              {formatNumber(participant.views)} views
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <div className="font-bold text-gray-900 text-sm sm:text-base">
                          {formatNumber(participant.views)}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500">views</div>
                        </div>
                        <button className="px-3 py-1.5 sm:px-4 sm:py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-full text-xs sm:text-sm font-medium transition-colors">
                        Support
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
            ) : (
                <div className="text-center py-8 sm:py-12 lg:py-16">
                  <Target className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">No Participants Yet</h3>
                  <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Be the first to join this contest!</p>
                <button
                  onClick={handleJoinContest}
                    className="px-4 py-2 sm:px-6 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors text-sm sm:text-base"
                  >
                  Join Contest
                </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Trending Entries Section */}
      <div className="bg-gradient-to-b from-gray-800 to-gray-900 px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 flex items-center justify-center gap-2 sm:gap-3">
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            Trending Entries
              <Flame className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
            </h2>
          </div>

        {featuredVideos.length > 0 ? (
            <div className="relative w-full">
            <div className="overflow-hidden w-full" ref={emblaRef}>
              <div className="flex">
                {featuredVideos.map((video, index) => {
                  const isSelected = index === currentVideoIndex;
                  const scale = isSelected ? 1 : 0.85;
                  const opacity = isSelected ? 1 : 0.6;

                  return (
                    <div 
                      key={video.id}
                        className="flex-[0_0_100%] min-w-0 px-4 sm:flex-[0_0_45%] md:flex-[0_0_30%] lg:flex-[0_0_22%] flex items-center justify-center"
                      >
                      <div 
                        className="relative transition-all duration-300 ease-out group will-change-transform cursor-pointer w-full max-w-[280px] mx-auto"
                        style={{
                          transform: `scale(${scale})`,
                          opacity,
                        }}
                        onClick={() => handleVideoClick(video, index)}
                        >
                        <div 
                            className="relative bg-black rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all shadow-2xl"
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
                            <div className="absolute top-2 sm:top-4 left-2 sm:left-4">
                              <div className="px-2 py-1 sm:px-3 sm:py-1 bg-blue-500 text-white rounded-full text-xs sm:text-sm font-bold">
                              👁 {formatNumber(video.views || 0)}
                              </div>
                            </div>

                          {/* Video Info */}
                            <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4">
                              <div className="space-y-1 sm:space-y-2">
                                <h3 className="text-xs sm:text-sm lg:text-base font-medium text-white line-clamp-1">
                                {video.title}
                                </h3>
                                <div className="flex items-center gap-2 text-xs text-white/60">
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
                                className="absolute bottom-2 right-2 sm:bottom-4 sm:right-4 p-1.5 sm:p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors"
                              >
                              {isMuted ? (
                                  <VolumeX className="h-3 w-3 sm:h-4 sm:w-4" />
                              ) : (
                                  <Volume2 className="h-3 w-3 sm:h-4 sm:w-4" />
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
                    className="absolute left-1 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </button>

                <button
                  onClick={scrollNext}
                    className="absolute right-1 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                </button>
              </>
            )}
            </div>
        ) : (
            <div className="text-center py-8 sm:py-12 lg:py-16">
              <Music className="h-12 w-12 sm:h-16 sm:w-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No Submissions Yet</h3>
              <p className="text-sm sm:text-base text-white/60">Be the first to submit your entry!</p>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-[#0A0A0A] text-center py-8 sm:py-12 lg:py-16 px-4">
        <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black text-white/20 mb-4 sm:mb-6 lg:mb-8 tracking-wider leading-tight">
          WHAT ARE YOU
        </h2>
        <h2 className="text-2xl sm:text-4xl lg:text-6xl font-black text-white/20 mb-6 sm:mb-8 lg:mb-12 tracking-wider leading-tight">
          WAITING FOR?
        </h2>
        
        <button
          onClick={handleJoinContest}
          className="px-6 py-3 sm:px-8 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-base sm:text-lg transition-colors"
        >
          Sign up to join
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
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