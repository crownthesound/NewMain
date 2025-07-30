import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Crown,
  Trophy,
  Medal,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Clock,
  Share2,
  Play,
  Users,
  Gift,
  CheckCircle,
  ArrowRight,
  Loader2,
  Music,
  Calendar,
  MapPin,
  Globe,
  ExternalLink,
  UserPlus,
  Settings,
  Eye,
  Heart,
  MessageCircle,
  BarChart3,
  Grid3X3,
  List as ListIcon,
  Video as VideoIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ContestJoinModal } from '../components/ContestJoinModal';
import { TikTokSettingsModal } from '../components/TikTokSettingsModal';
import { ViewSubmissionModal } from '../components/ViewSubmissionModal';
import { MobileVideoModal } from '../components/MobileVideoModal';
import { ContestMap } from '../components/ContestMap';
import { useTikTokConnection } from '../hooks/useTikTokConnection';
import { useAuthRedirect } from '../hooks/useAuthRedirect';
import toast from 'react-hot-toast';
import { 
  calculateContestStatus, 
  getStatusLabel, 
  getStatusColor,
  formatTimeRemaining,
  getTimeRemaining,
  getRankColor
} from '../lib/contestUtils';

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
  tiktok_display_name?: string;
  tiktok_username?: string;
  tiktok_account_name?: string;
  tiktok_account_id?: string;
  avatar_url?: string;
}

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export function PublicLeaderboard() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [contest, setContest] = useState<Contest | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showMobileVideoModal, setShowMobileVideoModal] = useState(false);
  const [viewVideo, setViewVideo] = useState<any>(null);
  const [userSubmission, setUserSubmission] = useState<any>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [activeToggle, setActiveToggle] = useState<'prizes' | 'how-to-join' | 'rules' | 'about' | 'list' | 'video'>('prizes');
  const { isConnected: isTikTokConnected } = useTikTokConnection();
  const { redirectToAuth } = useAuthRedirect();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (id) {
      fetchContestDetails();
      fetchLeaderboard();
      
      // Set up interval for real-time updates
      intervalRef.current = setInterval(() => {
        fetchLeaderboard();
      }, 30000); // Update every 30 seconds
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  useEffect(() => {
    if (session && contest) {
      fetchUserSubmission();
    }
  }, [session, contest]);

  const fetchContestDetails = async (retryCount = 0) => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setContest(data);
    } catch (error) {
      console.error('Error fetching contest details:', error);
      
      // Check if it's a network error and we haven't exceeded max retries
      if ((error instanceof TypeError || error.message?.includes('Failed to fetch')) && retryCount < 3) {
        const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
        console.log(`Retrying fetchContestDetails in ${delay}ms (attempt ${retryCount + 1}/3)`);
        setTimeout(() => {
          fetchContestDetails(retryCount + 1);
        }, delay);
      } else {
        toast.error('Failed to load contest details');
      }
    }
  };

  const fetchLeaderboard = async () => {
    try {
      if (backendUrl && backendUrl !== "http://localhost:3000") {
        const response = await fetch(
          `${backendUrl}/api/v1/contests/${id}/leaderboard?limit=200`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.data?.leaderboard) {
            setParticipants(data.data.leaderboard);
          }
        } else {
          console.warn('Failed to fetch leaderboard from backend');
        }
      }
    } catch (error) {
      console.warn('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSubmission = async () => {
    if (!session || !contest) return;
    
    try {
      const { data, error } = await supabase
        .from('contest_links')
        .select('*')
        .eq('contest_id', contest.id)
        .eq('created_by', session.user.id)
        .eq('is_contest_submission', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        setUserSubmission(data);
        
        // Find user's rank in the leaderboard
        const userEntry = participants.find(p => p.video_id === data.id);
        if (userEntry) {
          setUserRank(userEntry.rank);
        }
      }
    } catch (error) {
      console.error('Error fetching user submission:', error);
    }
  };

  const handleJoinContest = () => {
    if (!session) {
      redirectToAuth('/signin');
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
    toast.success('Successfully joined contest!');
  };

  const handleViewVideo = (video: any) => {
    setViewVideo(video);
    
    // Check if mobile
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setShowMobileVideoModal(true);
    } else {
      setShowViewModal(true);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/l/${contest?.id}`;
    try {
      await navigator.share({
        title: contest?.name || 'Contest',
        text: contest?.description || 'Check out this contest!',
        url: shareUrl,
      });
    } catch (error) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
    }
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
    };
    const color = colors[rank as keyof typeof colors] || "text-white/60";

    if (rank === 1) {
      return <Crown className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />;
    } else if (rank === 2) {
      return <Medal className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />;
    } else if (rank === 3) {
      return <Medal className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />;
    }
    return <Star className={`h-5 w-5 sm:h-6 sm:w-6 ${color}`} />;
  };

  const getRankChangeIcon = (currentRank: number, previousRank?: number) => {
    if (!previousRank) return <Minus className="h-3 w-3 text-white/40" />;

    if (currentRank < previousRank) {
      return <ArrowUp className="h-3 w-3 text-green-500" />;
    } else if (currentRank > previousRank) {
      return <ArrowDown className="h-3 w-3 text-red-500" />;
    }
    return <Minus className="h-3 w-3 text-white/40" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white/60" />
          <p className="mt-2 text-white/60">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Contest not found</h2>
          <Link
            to="/"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const contestStatus = calculateContestStatus(contest);
  const timeRemaining = getTimeRemaining(contest);

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crown</span>
          </Link>
          {session && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTikTokModal(true)}
                className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white text-sm sm:text-base"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">TikTok</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contest Header */}
        <div className="relative mb-8 rounded-2xl overflow-hidden">
          {contest.cover_image && (
            <div className="aspect-video sm:aspect-[21/9] relative">
              <img
                src={contest.cover_image}
                alt={contest.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            </div>
          )}
          
          <div className="absolute inset-0 flex items-end p-6 sm:p-8">
            <div className="w-full">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contestStatus)}`}>
                      {getStatusLabel(contestStatus)}
                    </div>
                    {contest.music_category && (
                      <div className="px-3 py-1 bg-white/20 rounded-full text-white text-sm font-medium">
                        {contest.music_category}
                      </div>
                    )}
                  </div>
                  
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-2">
                    {contest.name}
                  </h1>
                  
                  <p className="text-white/80 text-sm sm:text-base max-w-2xl">
                    {contest.description}
                  </p>
                  
                  {timeRemaining && (
                    <div className="flex items-center gap-2 mt-3 text-white/90">
                      <Clock className="h-4 w-4" />
                      <span className="font-medium">
                        {formatTimeRemaining(timeRemaining)} left
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShare}
                    className="p-3 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                  
                  {session && userSubmission ? (
                    <button
                      onClick={() => navigate(`/contest-management/${contest.id}`)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors font-medium"
                    >
                      Manage Entry
                    </button>
                  ) : (
                    <button
                      onClick={handleJoinContest}
                      className="px-6 py-3 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-medium"
                    >
                      {session ? 'Join Contest' : 'Sign Up to Join'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contest Details Section */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 mb-8">
          {/* Toggle Buttons */}
          <div className="border-b border-white/10 p-4 sm:p-6">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveToggle('prizes')}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  activeToggle === 'prizes'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
              >
                Prizes
              </button>
              <button
                onClick={() => setActiveToggle('how-to-join')}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  activeToggle === 'how-to-join'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
              >
                How to Join
              </button>
              <button
                onClick={() => setActiveToggle('rules')}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  activeToggle === 'rules'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
              >
                Rules
              </button>
              <button
                onClick={() => setActiveToggle('about')}
                className={`px-4 py-2 rounded-lg transition-colors font-medium ${
                  activeToggle === 'about'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
              >
                About
              </button>
              <button
                onClick={() => setActiveToggle('list')}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                  activeToggle === 'list'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
              >
                <ListIcon className="h-4 w-4" />
                List
              </button>
              <button
                onClick={() => setActiveToggle('video')}
                className={`px-4 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                  activeToggle === 'video'
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-white/60 hover:text-white hover:bg-white/20'
                }`}
              >
                <VideoIcon className="h-4 w-4" />
                Video
              </button>
            </div>
          </div>

          {/* Toggle Content */}
          <div className="p-4 sm:p-6">
            {activeToggle === 'prizes' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  Prize Distribution
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {contest.prize_titles?.slice(0, contest.num_winners || 5).map((prize: any, index: number) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border transition-all ${
                        index === 0
                          ? "bg-yellow-400/10 border-yellow-400/30"
                          : index === 1
                          ? "bg-gray-300/10 border-gray-300/30"
                          : index === 2
                          ? "bg-amber-600/10 border-amber-600/30"
                          : "bg-white/5 border-white/10"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {getRankIcon(index + 1)}
                        <span className={`text-sm font-medium ${getRankColor(index + 1)}`}>
                          {index + 1}
                          {index === 0 ? "st" : index === 1 ? "nd" : index === 2 ? "rd" : "th"}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-white">
                        {contest.prize_per_winner
                          ? `$${formatNumber(contest.prize_per_winner * (1 - index * 0.2))}`
                          : prize.title}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeToggle === 'how-to-join' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-blue-400" />
                  How to Join
                </h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Create Your Performance</h4>
                      <p className="text-white/60 text-sm">
                        Record a video performance that follows the contest guidelines and showcases your talent.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Connect TikTok Account</h4>
                      <p className="text-white/60 text-sm">
                        Link your TikTok account to Crown to submit your video entry.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Submit Your Entry</h4>
                      <p className="text-white/60 text-sm">
                        Select your video and officially enter the competition.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                      4
                    </div>
                    <div>
                      <h4 className="font-medium text-white mb-1">Share & Promote</h4>
                      <p className="text-white/60 text-sm">
                        Share your video to get more views and climb the leaderboard rankings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeToggle === 'rules' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  Contest Rules
                </h3>
                {contest.rules ? (
                  <div className="prose prose-invert max-w-none">
                    <p className="text-white/80 leading-relaxed">{contest.rules}</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-white/80">
                    <p>• Videos must be original performances</p>
                    <p>• Follow all contest guidelines and requirements</p>
                    <p>• Rankings are based on video views and engagement</p>
                    <p>• Winners will be verified before prize distribution</p>
                    <p>• Contest organizers reserve the right to disqualify entries that violate terms</p>
                  </div>
                )}
                
                {contest.guidelines && (
                  <div className="mt-6 p-4 bg-white/5 rounded-lg">
                    <h4 className="font-medium text-white mb-2">Guidelines</h4>
                    <p className="text-white/70 text-sm">{contest.guidelines}</p>
                  </div>
                )}
              </div>
            )}

            {activeToggle === 'about' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-400" />
                  Contest Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Start Date</h4>
                      <p className="text-white/90">{formatDate(contest.start_date)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">End Date</h4>
                      <p className="text-white/90">{formatDate(contest.end_date)}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Category</h4>
                      <p className="text-white/90">{contest.music_category || 'Music'}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Total Participants</h4>
                      <p className="text-white/90">{participants.length}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Prize Winners</h4>
                      <p className="text-white/90">{contest.num_winners || 5}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Status</h4>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(contestStatus)}`}>
                        {getStatusLabel(contestStatus)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeToggle === 'list' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <ListIcon className="h-5 w-5 text-blue-400" />
                  Leaderboard
                </h3>
                
                {participants.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No participants yet</h3>
                    <p className="text-white/60">Be the first to join this contest!</p>
                  </div>
                ) : (
                  <>
                    {/* Mobile View */}
                    <div className="block sm:hidden space-y-3">
                      {participants.map((participant) => (
                        <div key={participant.rank} className="bg-white/5 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                <span className={`font-medium ${getRankColor(participant.rank)}`}>
                                  #{participant.rank}
                                </span>
                                {getRankIcon(participant.rank)}
                              </div>
                              <div>
                                <div className="font-medium text-white">
                                  {participant.tiktok_display_name || participant.username}
                                </div>
                                <div className="text-sm text-white/60">
                                  {formatNumber(participant.views)} views
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleViewVideo(participant)}
                              className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                              <Play className="h-5 w-5 text-white/60" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Desktop View */}
                    <div className="hidden sm:block">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/10">
                              <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                                Rank
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                                Participant
                              </th>
                              <th className="px-6 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">
                                Views
                              </th>
                              <th className="px-6 py-3 text-center text-xs font-medium text-white/40 uppercase tracking-wider">
                                Actions
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/10">
                            {participants.map((participant) => (
                              <tr key={participant.rank} className="hover:bg-white/5">
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    {getRankIcon(participant.rank)}
                                    <span className={`font-medium ${getRankColor(participant.rank)}`}>
                                      #{participant.rank}
                                    </span>
                                    {getRankChangeIcon(participant.rank, participant.previousRank)}
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    {participant.thumbnail && (
                                      <img
                                        src={participant.thumbnail}
                                        alt={participant.video_title || 'Video thumbnail'}
                                        className="w-12 h-12 rounded-lg object-cover"
                                      />
                                    )}
                                    <div>
                                      <div className="font-medium text-white">
                                        {participant.tiktok_display_name || participant.username}
                                      </div>
                                      <div className="text-sm text-white/60">
                                        @{participant.tiktok_username || participant.username}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <span className="font-medium text-white">
                                    {formatNumber(participant.views)}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <button
                                    onClick={() => handleViewVideo(participant)}
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
                  </>
                )}
              </div>
            )}

            {activeToggle === 'video' && (
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <VideoIcon className="h-5 w-5 text-red-400" />
                  Video Gallery
                </h3>
                
                {participants.length === 0 ? (
                  <div className="text-center py-12">
                    <VideoIcon className="h-12 w-12 text-white/20 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No videos yet</h3>
                    <p className="text-white/60">Be the first to submit a video!</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {participants.slice(0, 12).map((participant) => (
                        <div
                          key={participant.rank}
                          className="group relative bg-white/5 rounded-xl overflow-hidden hover:bg-white/10 transition-all duration-300 cursor-pointer"
                          onClick={() => handleViewVideo(participant)}
                        >
                          {/* Video Thumbnail */}
                          <div className="relative aspect-video">
                            {participant.thumbnail ? (
                              <img
                                src={participant.thumbnail}
                                alt={participant.video_title || 'Video thumbnail'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                                <VideoIcon className="h-8 w-8 text-white/40" />
                              </div>
                            )}
                            
                            {/* Rank Badge */}
                            <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-bold ${
                              participant.rank === 1 ? 'bg-yellow-400/90 text-yellow-900' :
                              participant.rank === 2 ? 'bg-gray-300/90 text-gray-900' :
                              participant.rank === 3 ? 'bg-amber-600/90 text-amber-100' :
                              'bg-black/60 text-white'
                            }`}>
                              #{participant.rank}
                            </div>
                            
                            {/* Play Button Overlay */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                <Play className="h-6 w-6 text-white ml-1" />
                              </div>
                            </div>
                          </div>
                          
                          {/* Video Info */}
                          <div className="p-3">
                            <div className="flex items-center gap-2 mb-2">
                              {getRankIcon(participant.rank)}
                              <span className="font-medium text-white text-sm">
                                {participant.tiktok_display_name || participant.username}
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-xs text-white/60">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  <span>{formatNumber(participant.views)}</span>
                                </div>
                                {participant.likes && (
                                  <div className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    <span>{formatNumber(participant.likes)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {participants.length > 12 && (
                      <div className="text-center">
                        <p className="text-white/60 text-sm">
                          Showing top 12 submissions. Switch to List view to see all {participants.length} participants.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Contest Map */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="h-6 w-6" />
            Contest Locations
          </h2>
          <ContestMap
            contests={contest ? [contest] : []}
            onContestClick={(contestId) => {
              // Already on contest page
            }}
            className="h-[40vh] sm:h-[50vh]"
            isExpandable={true}
          />
        </div>
      </div>

      {/* Modals */}
      <TikTokSettingsModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
      />

      {contest && (
        <ContestJoinModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          contest={contest as any}
          onSuccess={handleContestJoined}
        />
      )}

      {viewVideo && (
        <ViewSubmissionModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          video={viewVideo}
        />
      )}

      {viewVideo && (
        <MobileVideoModal
          isOpen={showMobileVideoModal}
          onClose={() => setShowMobileVideoModal(false)}
          video={viewVideo}
        />
      )}
    </div>
  );
}