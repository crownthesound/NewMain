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
  BarChart3,
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
  Video,
  Upload,
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
  const [activeToggle, setActiveToggle] = useState<'prizes' | 'how-to-join' | 'rules' | 'about' | 'list' | 'video'>('prizes');
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [showTikTokSettings, setShowTikTokSettings] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [currentHowToJoinIndex, setCurrentHowToJoinIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState<{[key: string]: boolean}>({});
  const [coverLoaded, setCoverLoaded] = useState<{[key: string]: boolean}>({});
  const [showFullDescription, setShowFullDescription] = useState(false);

  // Separate state for each toggle section
  const [contestDetailsView, setContestDetailsView] = useState<'prizes' | 'how-to-join' | 'rules' | 'about'>('prizes');
  const [leaderboardView, setLeaderboardView] = useState<'list' | 'videos'>('list');

  const { isConnected: isTikTokConnected } = useTikTokConnection();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  // Ref for the leaderboard section to enable smooth scrolling
  const leaderboardSectionRef = useRef<HTMLDivElement>(null);

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

  // Embla carousel for how to join steps
  const [howToJoinEmblaRef, howToJoinEmblaApi] = useEmblaCarousel({
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

  useEffect(() => {
    if (!howToJoinEmblaApi) return;

    const onSelect = () => {
      setCurrentHowToJoinIndex(howToJoinEmblaApi.selectedScrollSnap());
    };

    howToJoinEmblaApi.on('select', onSelect);
    howToJoinEmblaApi.on('reInit', onSelect);

    return () => {
      howToJoinEmblaApi.off('select', onSelect);
      howToJoinEmblaApi.off('reInit', onSelect);
    };
  }, [howToJoinEmblaApi]);
  
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

  const handleLeaderboardViewChange = (view: 'list' | 'videos') => {
    setLeaderboardView(view);
    
    // If switching to video view, scroll to the leaderboard section smoothly
    if (view === 'videos' && leaderboardSectionRef.current) {
      leaderboardSectionRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const scrollPrev = () => emblaApi && emblaApi.scrollPrev();
  const scrollNext = () => emblaApi && emblaApi.scrollNext();

  const scrollPrizePrev = () => prizeEmblaApi && prizeEmblaApi.scrollPrev();
  const scrollPrizeNext = () => prizeEmblaApi && prizeEmblaApi.scrollNext();

  const scrollHowToJoinPrev = () => howToJoinEmblaApi && howToJoinEmblaApi.scrollPrev();
  const scrollHowToJoinNext = () => howToJoinEmblaApi && howToJoinEmblaApi.scrollNext();
  
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
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
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
            className="px-6 py-3 sm:px-8 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-medium transition-colors text-sm sm:text-base relative z-50 flex items-center gap-2"
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
        <div className="relative h-[24rem] sm:h-[28rem] md:h-[32rem] lg:h-[36rem] xl:h-[40rem] overflow-hidden">
          <img
            src={contest.cover_image}
            alt={contest.name}
            className="w-full h-[20rem] sm:h-[24rem] md:h-[28rem] lg:h-[32rem] xl:h-[36rem] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/50 to-black/80"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-black/50"></div>
          
          {/* Black bottom section for expanded hero area */}
          
          {/* Header overlay on hero image */}
          <div className="absolute top-0 left-0 right-0 z-10 px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8">
            <div className="flex items-center justify-between">
              <Link to="/" className="flex items-center gap-3">
                <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crown</span>
              </Link>
              
              {!session && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => redirectToAuth("/signin")}
                    className="px-3 sm:px-6 py-2 text-white hover:bg-white/5 rounded-xl transition-colors whitespace-nowrap text-sm sm:text-base"
                  >
                    Login
                  </button>
                  <button
                    onClick={() => redirectToAuth("/signup")}
                    className="bg-white text-[#1A1A1A] px-3 sm:px-6 py-2 rounded-xl hover:bg-white/90 transition-colors transform hover:scale-105 duration-200 text-sm sm:text-base font-medium"
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
              <div className="flex flex-col h-full justify-end items-center text-center px-2 pb-12 pt-8">
                
                {/* Title - Compact */}
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4 tracking-tight leading-tight">
                  {contest.name.toUpperCase()}
                </h1>
                
                {/* Description - Now visible on mobile */}
                <div className="px-1 max-w-sm mx-auto">
                  <p className="text-sm text-white/90 text-center leading-relaxed mb-4">
                    {contest.description}
                  </p>
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
        </div>
      )}
      
      {/* Prizes Section - Below Hero */}
      <div className="bg-black px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Contest Details Heading */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">
              Contest Details
            </h2>
          </div>
          
          {/* Contest Details Toggle Buttons */}
          <div className="flex justify-center mb-8 sm:mb-12 lg:mb-16">
            <div className="bg-white/5 rounded-full p-1 flex flex-wrap gap-1">
              <button
                onClick={() => setContestDetailsView('prizes')}
                className={`px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-full font-medium transition-all text-base sm:text-lg lg:text-xl ${
                  contestDetailsView === 'prizes'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Prizes
              </button>
              <button
                onClick={() => setContestDetailsView('how-to-join')}
                className={`px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-full font-medium transition-all text-base sm:text-lg lg:text-xl ${
                  contestDetailsView === 'how-to-join'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                How to Join
              </button>
              <button
                onClick={() => setContestDetailsView('rules')}
                className={`px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-full font-medium transition-all text-base sm:text-lg lg:text-xl ${
                  contestDetailsView === 'rules'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                Rules
              </button>
              <button
                onClick={() => setContestDetailsView('about')}
                className={`px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-full font-medium transition-all text-base sm:text-lg lg:text-xl ${
                  contestDetailsView === 'about'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                About
              </button>
            </div>
          </div>
          
          {/* Content Area */}
          {contestDetailsView === 'prizes' ? (
            /* Prizes View */
            <div className="relative max-w-7xl mx-auto w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px]">
              <div className="overflow-hidden w-full" ref={prizeEmblaRef}>
                <div className="flex">
                  {Array.from({ length: contest?.num_winners || 5 }, (_, index) => {
                    const isSelected = index === currentPrizeIndex;
                    const scale = 1;
                    const opacity = 1;
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
                        className="flex-[0_0_100%] min-w-0 px-4 flex items-center justify-center"
                      >
                        <div 
                          className="relative transition-all duration-300 ease-out group will-change-transform"
                          style={{
                            transform: `scale(${scale})`,
                            opacity,
                            width: '220px',
                            maxWidth: '100%'
                          }}
                        >
                          <div className="text-center">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 ${
                              rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                              rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                              rank === 3 ? 'bg-gradient-to-br from-amber-600 to-amber-800' :
                              rank === 4 ? 'bg-gradient-to-br from-green-400 to-green-600' :
                              rank === 5 ? 'bg-gradient-to-br from-purple-400 to-purple-600' :
                              'bg-gradient-to-br from-slate-400 to-slate-600'
                            } rounded-full flex items-center justify-center border border-white/20 mb-2 sm:mb-3 mx-auto transition-all duration-300`}>
                              {rank === 1 ? (
                                <Crown className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white transition-all duration-300" />
                              ) : (
                                <span className="text-white font-bold text-sm sm:text-base lg:text-lg transition-all duration-300">{rank}</span>
                              )}
                            </div>
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[90px] sm:min-w-[110px] border border-white/20 transition-all duration-300">
                              <div className="text-white font-bold text-xs sm:text-sm lg:text-base transition-all duration-300">
                                {prizeText}
                              </div>
                              <div className="text-white/80 text-xs sm:text-sm leading-tight text-center transition-all duration-300">
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
              <button
                onClick={scrollPrizePrev}
                className="absolute left-4 sm:left-8 lg:left-12 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
              >
                <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              </button>

              <button
                onClick={scrollPrizeNext}
                className="absolute right-4 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
              >
                <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              </button>
            </div>
          ) : contestDetailsView === 'how-to-join' ? (
            /* How to Join View */
            <div className="relative max-w-7xl mx-auto w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px]">
              <div className="overflow-hidden w-full" ref={howToJoinEmblaRef}>
                <div className="flex">
                  {[
                    {
                      step: 1,
                      icon: Video,
                      title: 'Record Your Performance',
                      description: 'Create a video performance that follows the contest guidelines and showcases your talent'
                    },
                    {
                      step: 2,
                      icon: Upload,
                      title: 'Post to TikTok',
                      description: 'Share your video on TikTok using your connected account to enter the competition'
                    },
                    {
                      step: 3,
                      icon: CheckCircle,
                      title: 'Submit Your Entry',
                      description: 'Come back to the contest page and tap "Join Competition" to officially enter'
                    },
                  ].map((step, index) => {
                    const isSelected = index === currentHowToJoinIndex;
                    const scale = 1;
                    const opacity = 1;
                    const Icon = step.icon;
                    
                    return (
                      <div
                        key={index}
                        className="flex-[0_0_100%] min-w-0 px-4 flex items-center justify-center"
                      >
                        <div 
                          className="relative transition-all duration-300 ease-out group will-change-transform"
                          style={{
                            transform: `scale(${scale})`,
                            opacity,
                            width: '220px',
                            maxWidth: '100%'
                          }}
                        >
                          <div className="text-center">
                            <div className={`w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center border border-white/20 mb-2 sm:mb-3 mx-auto transition-all duration-300`}>
                              <Icon className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8 text-white transition-all duration-300" />
                            </div>
                            <div className="bg-black/60 backdrop-blur-sm rounded-lg p-2 sm:p-3 min-w-[90px] sm:min-w-[110px] border border-white/20 transition-all duration-300">
                              <div className="text-white font-bold text-xs sm:text-sm lg:text-base transition-all duration-300">
                                {step.title}
                              </div>
                              <div className="text-white/80 text-xs sm:text-sm leading-tight text-center transition-all duration-300">
                                STEP {step.step}
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
              <button
                onClick={scrollHowToJoinPrev}
                className="absolute left-4 sm:left-8 lg:left-12 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
              >
                <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              </button>

              <button
                onClick={scrollHowToJoinNext}
                className="absolute right-4 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
              >
                <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
              </button>
            </div>
          ) : contestDetailsView === 'rules' ? (
            /* Rules View */
            <div className="relative max-w-7xl mx-auto w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] flex items-center justify-center">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-white/20 p-8 max-w-4xl w-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-6">Contest Rules</h3>
                  {contest?.rules ? (
                    <div className="text-white/90 text-lg leading-relaxed whitespace-pre-line">
                      {contest.rules}
                    </div>
                  ) : (
                    <div className="space-y-4 text-white/80 text-left">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm font-bold">1</span>
                        </div>
                        <p>All submissions must be original performances and follow contest guidelines</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm font-bold">2</span>
                        </div>
                        <p>Videos must be posted on TikTok and submitted through the contest platform</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm font-bold">3</span>
                        </div>
                        <p>Rankings are based on video views and engagement metrics</p>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <span className="text-white text-sm font-bold">4</span>
                        </div>
                        <p>Winners will be verified for eligibility before prize distribution</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* About View */
            <div className="relative max-w-7xl mx-auto w-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px] flex items-center justify-center">
              <div className="bg-black/60 backdrop-blur-sm rounded-2xl border border-white/20 p-8 max-w-4xl w-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Info className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-6">About This Contest</h3>
                  <div className="text-white/90 text-lg leading-relaxed mb-6">
                    {contest?.description}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left">
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Music className="h-4 w-4 text-blue-400" />
                        Category
                      </h4>
                      <p className="text-white/80">{contest?.music_category || 'Music'}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-400" />
                        Participants
                      </h4>
                      <p className="text-white/80">{participants.length} Entered</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-yellow-400" />
                        Duration
                      </h4>
                      <p className="text-white/80">{formatTimeRemaining(timeRemaining) || 'Contest Active'}</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-purple-400" />
                        Winners
                      </h4>
                      <p className="text-white/80">{contest?.num_winners || 5} Prize Positions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content Area */}
      <div ref={leaderboardSectionRef} className="bg-black px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto">
          {/* Leaderboard Heading */}
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">Leaderboard</h2>
          </div>
          
          {/* Leaderboard Toggle Buttons */}
          <div className="flex justify-center mb-8 sm:mb-12 lg:mb-16">
            <div className="bg-white/5 rounded-full p-1 flex">
              <button
                onClick={() => handleLeaderboardViewChange('list')}
               className={`px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-full font-medium transition-all text-base sm:text-lg lg:text-xl ${
                  leaderboardView === 'list'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white'
               }`}
              >
                List
              </button>
              <button
                onClick={() => handleLeaderboardViewChange('videos')}
               className={`px-6 py-3 sm:px-8 sm:py-4 lg:px-10 lg:py-5 rounded-full font-medium transition-all text-base sm:text-lg lg:text-xl ${
                  leaderboardView === 'videos'
                    ? 'bg-purple-600 text-white'
                    : 'text-white/60 hover:text-white'
               }`}
              >
                Video View
              </button>
            </div>
            <button
              onClick={() => setActiveToggle('rules')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeToggle === 'rules'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              Rules
            </button>
            <button
              onClick={() => setActiveToggle('about')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeToggle === 'about'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveToggle('list')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeToggle === 'list'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              List
            </button>
            <button
              onClick={() => setActiveToggle('video')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeToggle === 'video'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
              }`}
            >
              Video
            </button>
          </div>

          {/* Content Area */}
          {leaderboardView === 'list' ? (
            /* Leaderboard View - Exact Design Match */
            <div className="max-w-sm mx-auto">
              {/* White Card Container */}
              <div className="bg-white rounded-2xl overflow-hidden">
                {/* GET CROWNED Header */}
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 text-center font-bold text-lg">
                  GET CROWNED.
                </div>
                
                {/* Participants List */}
                <div className="p-4">
                  {participants.length > 0 ? (
                    <div className="space-y-2">
                      {participants.slice(0, 10).map((participant, index) => (
                        <div
                          key={participant.user_id}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          {/* Left side - Rank, Avatar, and User Info */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1 w-8">
                              {participant.rank === 1 && (
                                <Crown className="h-4 w-4 text-yellow-500" />
                              )}
                              <span className="text-sm font-bold text-black">
                                {participant.rank}
                              </span>
                            </div>
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-bold text-gray-600">
                                {participant.tiktok_username?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-black">
                                @{participant.tiktok_username}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>{formatNumber(participant.views)} views</span>
                              </div>
                            </div>
                          </div>

                          {/* Right side - Support Button */}
                          <button className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                            Support
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-600 mb-2">No Participants Yet</h3>
                      <p className="text-gray-500 mb-6">Be the first to join this contest!</p>
                      <button
                        onClick={handleJoinContest}
                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium transition-opacity hover:opacity-90"
                      >
                        Join Contest
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Video Carousel View */
                featuredVideos.length > 0 ? (
                  <div className="relative w-full min-h-[500px] sm:min-h-[600px] lg:min-h-[700px]">
                    <div className="overflow-hidden w-full" ref={emblaRef}>
                      <div className="flex">
                        {featuredVideos.map((video, index) => {
                          const isSelected = index === currentVideoIndex;
                          const scale = 1;
                          const opacity = 1;

                          return (
                            <div 
                              key={video.id}
                              className="flex-[0_0_100%] min-w-0 px-4 flex items-center justify-center"
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
                                  className="relative bg-black rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all shadow-2xl max-w-[320px] sm:max-w-[360px] lg:max-w-[400px] mx-auto"
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
                    <button
                      onClick={scrollPrev}
                      className="absolute left-4 sm:left-8 lg:left-12 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
                    >
                      <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                    </button>

                    <button
                      onClick={scrollNext}
                      className="absolute right-4 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
                    >
                      <ChevronRight className="h-6 w-6 sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12 sm:py-16 lg:py-20 min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex items-center justify-center">
                    <div>
                      <Music className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 text-white/30 mx-auto mb-6" />
                      <h3 className="text-xl sm:text-2xl lg:text-3xl font-semibold text-white/60 mb-4">No Videos Yet</h3>
                      <p className="text-base sm:text-lg lg:text-xl text-white/40">Contest videos will appear here once submitted!</p>
                    </div>
                  </div>
                )
          )}
        </div>
      </div>

      {/* Call to Action Section */}
      <div className="bg-black text-center py-12 sm:py-16 lg:py-20 px-4">
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
          {session ? 'Join Contest' : 'Sign up to join'}
        </button>
      </div>

      {/* Footer */}
      <footer className="bg-black px-4 sm:px-6 lg:px-8 py-8 sm:py-10 border-t border-white/10">
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
            <p className="text-white/40 text-xs text-center">
              © {new Date().getFullYear()} Crown. All rights reserved.
            </p>

            {activeToggle === 'rules' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Contest Rules
                </h3>
                {contest.rules ? (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-white/80 leading-relaxed">{contest.rules}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <p className="text-white/80">Follow all contest guidelines and requirements</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <p className="text-white/80">Content must be original and appropriate</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <p className="text-white/80">One entry per participant</p>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      <p className="text-white/80">Must be submitted before the deadline</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeToggle === 'about' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-400" />
                  About This Contest
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Description</h4>
                    <p className="text-white/90 leading-relaxed">{contest.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Category</h4>
                      <p className="text-white/90">{contest.music_category}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Participants</h4>
                      <p className="text-white/90">{participants.length} entries</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Duration</h4>
                      <p className="text-white/90">{formatDate(contest.start_date)} - {formatDate(contest.end_date)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Winners</h4>
                      <p className="text-white/90">{contest.num_winners} prizes available</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeToggle === 'list' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Leaderboard
                </h3>
                
                {/* Mobile View */}
                <div className="block sm:hidden space-y-3">
                  {participants.map((participant, index) => (
                    <div
                      key={participant.id || index}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {getRankIcon(participant.rank)}
                            <span className={`font-bold ${getRankColor(participant.rank)}`}>
                              #{participant.rank}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              @{participant.username}
                            </div>
                            <div className="text-sm text-white/60">
                              {formatNumber(participant.views)} views
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handlePlayVideo(participant)}
                          className="p-2 rounded-full hover:bg-white/10 transition-colors"
                        >
                          <Play className="h-5 w-5 text-white/60" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                          Participant
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                          Views
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-white/60 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {participants.map((participant, index) => (
                        <tr key={participant.id || index} className="hover:bg-white/5">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {getRankIcon(participant.rank)}
                              <span className={`font-bold ${getRankColor(participant.rank)}`}>
                                #{participant.rank}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="font-medium text-white">
                              @{participant.username}
                            </div>
                            {participant.full_name && (
                              <div className="text-sm text-white/60">
                                {participant.full_name}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <span className="font-medium text-white">
                              {formatNumber(participant.views)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => handlePlayVideo(participant)}
                              className="p-2 rounded-full hover:bg-white/10 transition-colors inline-flex items-center justify-center"
                            >
                              <Play className="h-5 w-5 text-white/60" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeToggle === 'video' && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-400" />
                  Video Gallery
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.slice(0, 12).map((participant, index) => (
                    <div
                      key={participant.id || index}
                      className="group relative bg-white/5 rounded-lg overflow-hidden border border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer"
                      onClick={() => handlePlayVideo(participant)}
                    >
                      <div className="aspect-video relative">
                        <img
                          src={participant.thumbnail || 'https://images.pexels.com/photos/7500307/pexels-photo-7500307.jpeg'}
                          alt={`${participant.username} video`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                        
                        {/* Rank Badge */}
                        <div className="absolute top-2 left-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                            participant.rank === 1 ? 'bg-yellow-500/80 text-yellow-100' :
                            participant.rank === 2 ? 'bg-gray-400/80 text-gray-100' :
                            participant.rank === 3 ? 'bg-amber-600/80 text-amber-100' :
                            'bg-white/20 text-white'
                          }`}>
                            #{participant.rank}
                          </div>
                        </div>
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                            <Play className="h-6 w-6 text-white ml-1" />
                          </div>
                        </div>
                        
                        {/* Video Info */}
                        <div className="absolute bottom-0 left-0 right-0 p-3">
                          <div className="font-medium text-white text-sm mb-1">
                            @{participant.username}
                          </div>
                          <div className="text-white/60 text-xs">
                            {formatNumber(participant.views)} views
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {participants.length > 12 && (
                  <div className="mt-4 text-center">
                    <p className="text-white/60 text-sm">
                      Showing top 12 submissions. View the full leaderboard above.
                    </p>
                  </div>
                )}
              </div>
            )}
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