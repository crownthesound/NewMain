import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Trophy, 
  Clock, 
  Star, 
  Trash2, 
  HelpCircle, 
  ArrowLeft,
  Play,
  Eye,
  BarChart3,
  Calendar,
  Award,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ExternalLink,
  TrendingUp,
  Heart,
  MessageCircle,
  Share,
  Share2,
  Users,
  Target,
  Zap,
  X,
  Settings,
  Info,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ViewSubmissionModal } from '../components/ViewSubmissionModal';
import { TikTokSettingsModal } from '../components/TikTokSettingsModal';
import toast from 'react-hot-toast';

interface Contest {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  status: string;
  music_category: string;
  prize_per_winner: number;
  num_winners: number;
  prize_titles: any[];
  guidelines?: string;
  rules?: string;
  hashtags?: string[];
}

interface UserSubmission {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  created_at: string;
  tiktok_video_id?: string;
  embed_code?: string;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  views: number;
  video_id: string;
}

export function ContestManagement() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [contest, setContest] = useState<Contest | null>(null);
  const [userSubmission, setUserSubmission] = useState<UserSubmission | null>(null);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTikTokSettings, setShowTikTokSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'contest-info'>('overview');

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    if (!session) {
      navigate('/signin');
      return;
    }
    
    if (id) {
      fetchContestData();
      fetchUserSubmission();
      fetchLeaderboard();
    }
  }, [id, session]);

  const fetchContestData = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setContest(data);
    } catch (error) {
      console.error('Error fetching contest:', error);
      toast.error('Failed to load contest details');
      navigate('/contests-page');
    }
  };

  const fetchUserSubmission = async () => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase
        .from('contest_links')
        .select('*')
        .eq('contest_id', id)
        .eq('created_by', session.user.id)
        .eq('is_contest_submission', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (!data) {
        // User hasn't submitted to this contest
        navigate('/contests-page');
        return;
      }
      
      setUserSubmission(data);
    } catch (error) {
      console.error('Error fetching user submission:', error);
      toast.error('Failed to load your submission');
      navigate('/contests-page');
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
            setLeaderboard(data.data.leaderboard);
            
            // Find user's rank
            const userEntry = data.data.leaderboard.find((entry: any) => 
              entry.video_id === userSubmission?.id
            );
            if (userEntry) {
              setUserRank(userEntry.rank);
            }
          }
        }
      }
    } catch (error) {
      console.warn('Could not fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!userSubmission) return;
    
    setDeleting(true);
    try {
      // Delete from contest_links
      const { error: linkError } = await supabase
        .from('contest_links')
        .delete()
        .eq('id', userSubmission.id)
        .eq('created_by', session?.user.id);

      if (linkError) throw linkError;

      // Delete from contest_participants
      const { error: participantError } = await supabase
        .from('contest_participants')
        .delete()
        .eq('contest_id', id)
        .eq('user_id', session?.user.id);

      if (participantError) throw participantError;

      toast.success('Your submission has been removed from the contest');
      navigate('/contests-page');
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to remove submission');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const formatTimeLeft = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const distance = end - now;

    if (distance < 0) return 'Contest Ended';

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h left`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    } else if (minutes > 0) {
      return `${minutes}m left`;
    } else {
      return 'Ending soon';
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

  const getRankColor = (rank: number | null) => {
    if (!rank) return 'text-white/60';
    if (rank === 1) return 'text-yellow-400';
    if (rank === 2) return 'text-gray-300';
    if (rank === 3) return 'text-amber-600';
    if (rank <= 10) return 'text-blue-400';
    return 'text-white';
  };

  const getRankIcon = (rank: number | null) => {
    if (!rank) return <Target className="h-8 w-8 text-white/40" />;
    if (rank === 1) return <Trophy className="h-8 w-8 text-yellow-400" />;
    if (rank === 2) return <Award className="h-8 w-8 text-gray-300" />;
    if (rank === 3) return <Award className="h-8 w-8 text-amber-600" />;
    return <BarChart3 className="h-8 w-8 text-blue-400" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white/60" />
          <p className="mt-2 text-white/60">Loading contest management...</p>
        </div>
      </div>
    );
  }

  if (!contest || !userSubmission) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Contest Not Found</h2>
          <p className="text-white/60 mb-6">The contest you're looking for doesn't exist or you haven't submitted to it.</p>
          <Link
            to="/contests-page"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Back to Contests
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      {/* Header with Logo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crown</span>
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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Contest Management</h1>
          <p className="text-white/60">Track your performance and manage your submission</p>
        </div>

        {/* Main Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden">
          {/* Profile Header */}
          <div className="relative bg-gradient-to-r from-blue-500/20 to-purple-600/20 p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-600/10"></div>
            <div className="relative flex flex-col sm:flex-row items-center gap-6">
              {/* Contest Image/Avatar */}
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center border-2 border-white/20 overflow-hidden">
                {contest.cover_image ? (
                  <img
                    src={contest.cover_image}
                    alt={contest.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy className="h-12 w-12 text-white" />
                )}
              </div>

              {/* Contest Info */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">
                    {contest.name}
                  </h2>
                </div>

                {/* Status Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/10 border-green-400/20 border">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-green-400">
                    Participating
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{userRank || '—'}</p>
                  <p className="text-xs text-white/60">Rank</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{formatNumber(userSubmission.views || 0)}</p>
                  <p className="text-xs text-white/60">Views</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{formatNumber(userSubmission.likes || 0)}</p>
                  <p className="text-xs text-white/60">Likes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'performance', label: 'Performance', icon: BarChart3 },
                { id: 'contest-info', label: 'Contest Info', icon: Info }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 sm:px-6 py-3 sm:py-4 font-medium transition-colors border-b-2 whitespace-nowrap flex-shrink-0 ${
                      activeTab === tab.id
                        ? 'text-white border-white'
                        : 'text-white/60 hover:text-white border-transparent'
                    }`}
                  >
                    <Icon className="h-4 w-4 sm:h-4 sm:w-4" />
                    <span className="text-sm sm:text-base">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Current Position */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Current Position
                  </h3>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center">
                          {React.cloneElement(getRankIcon(userRank), { className: "h-12 w-12" })}
                        </div>
                        <div>
                          <div className={`text-3xl font-bold ${getRankColor(userRank)}`}>
                            {userRank ? `#${userRank}` : 'Unranked'}
                          </div>
                          <div className="text-white/60">Current Position</div>
                          {userRank && userRank <= contest.num_winners && (
                            <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-400/10 text-yellow-400 rounded text-sm font-medium mt-2">
                              <Star className="h-3 w-3" />
                              Prize Position
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Your Submission */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    Your Submission
                  </h3>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                      <img
                        src={userSubmission.thumbnail || ''}
                        alt={userSubmission.title || 'Video thumbnail'}
                        className="w-full sm:w-40 h-40 rounded-xl object-cover shadow-lg flex-shrink-0 mb-4"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-semibold text-white mb-3 line-clamp-2">{userSubmission.title}</h4>
                        <p className="text-white/60 mb-4">
                          Submitted {formatDate(userSubmission.created_at)}
                        </p>
                        <div className="flex items-center gap-6 text-sm text-white/60 mb-4">
                          <span>{formatNumber(userSubmission.views || 0)} views</span>
                          <span>•</span>
                          <span>{formatNumber(userSubmission.likes || 0)} likes</span>
                          <span>•</span>
                          <span>{formatNumber(userSubmission.comments || 0)} comments</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4 w-full">
                      <button
                        onClick={() => setShowViewModal(true)}
                        className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        <Play className="h-4 w-4" />
                        <span className="hidden xs:inline">View Video</span>
                        <span className="xs:hidden">View</span>
                      </button>
                      <Link
                        to={`/share/${id}`}
                        className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="hidden xs:inline">Share</span>
                        <span className="xs:hidden">Share</span>
                      </Link>
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden xs:inline">Remove</span>
                        <span className="xs:hidden text-[10px]">Delete</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Link
                      to={`/l/${contest.id}`}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-center"
                    >
                      <ExternalLink className="h-6 w-6 text-white/60 mx-auto mb-2" />
                      <div className="font-medium text-white">View Full Leaderboard</div>
                      <div className="text-sm text-white/60">See all participants</div>
                    </Link>
                    <button
                      onClick={() => setShowHelpModal(true)}
                      className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors text-center"
                    >
                      <HelpCircle className="h-6 w-6 text-white/60 mx-auto mb-2" />
                      <div className="font-medium text-white">Get Help & Support</div>
                      <div className="text-sm text-white/60">Contact support team</div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-6">
                {/* Performance Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                      <Eye className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formatNumber(userSubmission.views || 0)}</div>
                      <div className="text-sm text-white/60">Views</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                      <Heart className="h-6 w-6 text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formatNumber(userSubmission.likes || 0)}</div>
                      <div className="text-sm text-white/60">Likes</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                      <MessageCircle className="h-6 w-6 text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formatNumber(userSubmission.comments || 0)}</div>
                      <div className="text-sm text-white/60">Comments</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 text-center">
                      <Share className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-white">{formatNumber(userSubmission.shares || 0)}</div>
                      <div className="text-sm text-white/60">Shares</div>
                    </div>
                  </div>
                </div>

                {/* Ranking Information */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Trophy className="h-5 w-5" />
                    Ranking Information
                  </h3>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
                      <div>
                        <div className={`text-3xl font-bold ${getRankColor(userRank)} mb-2`}>
                          {userRank ? `#${userRank}` : '—'}
                        </div>
                        <div className="text-white/60">Current Rank</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-white mb-2">{leaderboard.length}</div>
                        <div className="text-white/60">Total Participants</div>
                      </div>
                      <div>
                        <div className="text-3xl font-bold text-white mb-2">{contest.num_winners}</div>
                        <div className="text-white/60">Prize Positions</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Tips */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Performance Tips
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Share className="h-4 w-4 text-blue-400" />
                        Increase Visibility
                      </h4>
                      <p className="text-white/70 text-sm">
                        Share your video on social media platforms to increase views and engagement. More views directly impact your ranking position.
                      </p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-400" />
                        Engage with Community
                      </h4>
                      <p className="text-white/70 text-sm">
                        Respond to comments and engage with other participants to build a community around your content.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'contest-info' && (
              <div className="space-y-6">
                {/* Contest Details */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Contest Details
                  </h3>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
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
                          <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Status</h4>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                            <span className="text-white/90 capitalize">{contest.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Contest Timeline
                  </h3>
                  <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">Start Date</h4>
                        <p className="text-white/90">{formatDate(contest.start_date)}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white/80 mb-2 uppercase tracking-wide">End Date</h4>
                        <p className="text-white/90">{formatDate(contest.end_date)}</p>
                      </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-white/60" />
                        <span className="text-white/90 font-medium">{formatTimeLeft(contest.end_date)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guidelines & Rules */}
                {(contest.guidelines || contest.rules) && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Guidelines & Rules
                    </h3>
                    <div className="space-y-4">
                      {contest.guidelines && (
                        <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                          <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">Guidelines</h4>
                          <p className="text-white/90 leading-relaxed">{contest.guidelines}</p>
                        </div>
                      )}
                      {contest.rules && (
                        <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                          <h4 className="text-sm font-semibold text-white/80 mb-3 uppercase tracking-wide">Rules</h4>
                          <p className="text-white/90 leading-relaxed">{contest.rules}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hashtags */}
                {contest.hashtags && contest.hashtags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Required Hashtags
                    </h3>
                    <div className="bg-white/5 rounded-lg border border-white/10 p-6">
                      <div className="flex flex-wrap gap-2">
                        {contest.hashtags.map((hashtag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium"
                          >
                            <span className="xs:hidden text-[10px]">Delete</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TikTok Settings Modal */}
      <TikTokSettingsModal
        isOpen={showTikTokSettings}
        onClose={() => setShowTikTokSettings(false)}
      />

      {/* View Submission Modal */}
      {userSubmission && (
        <ViewSubmissionModal
          isOpen={showViewModal}
          onClose={() => setShowViewModal(false)}
          video={userSubmission}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-red-500/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Remove Submission</h3>
              </div>
              <p className="text-white/70 mb-6 leading-relaxed">
                Are you sure you want to remove your submission from this contest? This action cannot be undone and you'll lose your current ranking position.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmission}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium"
                >
                  {deleting ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="hidden xs:inline">Removing...</span>
                      <span className="xs:hidden">Removing...</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      <span className="hidden xs:inline">Remove Submission</span>
                      <span className="xs:hidden">Remove</span>
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1A1A1A] rounded-2xl border border-white/10 shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                  <div className="p-2 bg-blue-500/20 rounded-full">
                    <HelpCircle className="h-5 w-5 text-blue-400" />
                  </div>
                  Help & Support
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-white/60" />
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-yellow-400" />
                    Contest Support
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    For questions about contest rules, prizes, or technical issues, our support team is here to help.
                  </p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-400" />
                    Improve Performance
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Your ranking is based on video views and engagement. Share your video on social media to increase visibility and climb the leaderboard.
                  </p>
                </div>
                
                <div className="p-4 bg-white/5 rounded-lg">
                  <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-400" />
                    Submission Guidelines
                  </h4>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Ensure your video follows all contest guidelines and rules to remain eligible for prizes and maintain your ranking.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-white/10">
                <a
                  href="mailto:support@crownthesound.com"
                  className="w-full px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors text-center block font-medium"
                >
                  Contact Support Team
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}