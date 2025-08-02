import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Calendar, 
  Crown, 
  LogOut, 
  Edit3, 
  Trophy,
  Settings,
  Eye,
  Upload,
  Heart,
  Video
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { TikTokSettingsModal } from '../components/TikTokSettingsModal';
import { useTikTokConnection } from '../hooks/useTikTokConnection';

interface Contest {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  status: string | null;
  music_category: string | null;
  prize_per_winner: number | null;
  num_winners: number | null;
  joined_at?: string;
}

interface Submission {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  created_at: string | null;
  contest_id: string | null;
  contest_name: string;
}

export function Profile() {
  const { session, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tikTokAccounts, connectWithVideoPermissions, isLoading: tikTokLoading } = useTikTokConnection();
  
  const initialTab = searchParams.get('tab') as 'overview' | 'contests' | 'submissions' | 'tiktok-accounts' || 'overview';
  const [activeTab, setActiveTab] = useState<'overview' | 'contests' | 'submissions' | 'tiktok-accounts'>(initialTab);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(profile?.full_name || '');
  const [saving, setSaving] = useState(false);
  const [joinedContests, setJoinedContests] = useState<Contest[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTikTokSettings, setShowTikTokSettings] = useState(false);

  useEffect(() => {
    if (session && (activeTab === 'contests' || activeTab === 'submissions')) {
      fetchUserData();
    }
  }, [session, activeTab]);

  const fetchUserData = async () => {
    if (!session?.user?.id) return;
    
    setLoading(true);
    try {
      // Fetch contests and submissions with proper null handling
      const { data: participantData } = await supabase
        .from('contest_participants')
        .select('joined_at, contests(*)')
        .eq('user_id', session.user.id);

      const contests = participantData?.map(p => ({
        ...p.contests,
        joined_at: p.joined_at
      })) || [];
      setJoinedContests(contests);

      const { data: submissionData } = await supabase
        .from('submissions')
        .select('*, contests(name)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      const submissionsWithContestName = submissionData?.map(submission => ({
        ...submission,
        contest_name: submission.contests?.name || 'Unknown Contest'
      })) || [];
      setSubmissions(submissionsWithContestName);

    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const handleSaveProfile = async () => {
    if (!session?.user?.id) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editedName })
        .eq('id', session.user.id);

      if (error) throw error;
      
      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Crown className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Sign In Required</h1>
          <p className="text-white/60 mb-6">Please sign in to view your profile</p>
          <Link
            to="/"
            className="inline-flex items-center px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
          >
            Go to Home
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTikTokSettings(true)}
              className="flex items-center justify-center px-3 sm:px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-white text-sm sm:text-base"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">TikTok</span>
            </button>
          </div>
        </div>
      </div>

      {/* TikTok Settings Modal */}
      <TikTokSettingsModal
        isOpen={showTikTokSettings}
        onClose={() => setShowTikTokSettings(false)}
      />

      {/* Hero Section with Profile Content */}
      <div className="relative h-[28rem] sm:h-[32rem] md:h-[36rem] lg:h-[40rem] overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1A1A1A] via-[#2A2A2A] to-[#3A3A3A]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/80"></div>
        
        {/* Crown Logo Background */}
        <div className="absolute top-12 left-1/2 transform -translate-x-1/2">
          <Crown className="h-24 w-24 sm:h-32 sm:w-32 md:h-40 md:w-40 text-white/5" />
        </div>
        
        {/* Profile Content */}
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          <div className="mb-6">
            <Crown className="h-12 w-12 sm:h-16 sm:w-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-2 tracking-tight">
              YOUR PROFILE
            </h1>
            <p className="text-lg sm:text-xl text-white/80 font-medium max-w-2xl mx-auto">
              Manage your account, contests, and submissions
            </p>
          </div>
          
          {/* Profile Card */}
          <div className="w-full max-w-4xl mx-auto">
            <div className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/10 p-6 sm:p-8 shadow-2xl">
              <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                {/* Avatar */}
                <div className="flex justify-center lg:justify-start">
                  <div className="relative">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center border-4 border-white/20 shadow-xl">
                      <span className="text-2xl sm:text-3xl font-bold text-white">
                        {profile?.full_name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-2 border-black"></div>
                  </div>
                </div>
                
                {/* Profile Info */}
                <div className="flex-1 text-center lg:text-left">
                  <div className="mb-4">
                    {isEditing ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editedName}
                          onChange={(e) => setEditedName(e.target.value)}
                          className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50"
                          placeholder="Enter your name"
                        />
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setEditedName(profile?.full_name || '');
                            }}
                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white">
                          {profile?.full_name || 'Anonymous User'}
                        </h2>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-white/70 hover:text-white transition-colors text-sm"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </button>
                      </div>
                    )}
                    <p className="text-white/60 text-sm sm:text-base">{session.user.email}</p>
                  </div>
                  
                  {/* Activity Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl border border-yellow-500/20 text-center">
                      <Trophy className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{joinedContests.length}</p>
                      <p className="text-xs text-white/70">Contests</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-500/5 rounded-xl border border-blue-500/20 text-center">
                      <Upload className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{submissions.length}</p>
                      <p className="text-xs text-white/70">Submissions</p>
                    </div>
                    <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-500/5 rounded-xl border border-purple-500/20 text-center">
                      <Eye className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {formatNumber(submissions.reduce((total, sub) => total + (sub.views || 0), 0))}
                      </p>
                      <p className="text-xs text-white/70">Views</p>
                    </div>
                  </div>
                </div>
                
                {/* Sign Out Button */}
                <div className="flex justify-center lg:justify-end">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-full p-1.5 sm:p-2 shadow-lg border border-white/10">
            <nav className="flex overflow-x-auto scrollbar-hide">
              {[
                { id: 'overview', label: 'Overview', icon: Settings },
                { id: 'contests', label: 'My Contests', icon: Trophy },
                { id: 'submissions', label: 'My Submissions', icon: Upload },
                { id: 'tiktok-accounts', label: 'TikTok Accounts', icon: Video }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 rounded-full font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 text-sm sm:text-base ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-400" />
                Account Information
              </h3>
              <div className="grid gap-4">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Mail className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Email Address</p>
                    <p className="text-white font-medium">{session.user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                  <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-white/60">Member Since</p>
                    <p className="text-white font-medium">
                      {formatDate(profile?.created_at || session.user.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'contests' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                My Contests
              </h3>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                  <p className="text-white/60">Loading contests...</p>
                </div>
              ) : joinedContests.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">No contests joined yet</h4>
                  <p className="text-white/60 mb-6">Join your first contest to start competing!</p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Trophy className="h-4 w-4" />
                    Browse Contests
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {joinedContests.map((contest) => (
                    <div key={contest.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-white font-semibold">{contest.name}</h4>
                      <p className="text-white/60 text-sm">{contest.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-400" />
                My Submissions
              </h3>
              
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                  <p className="text-white/60">Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div className="text-center py-12">
                  <Upload className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">No submissions yet</h4>
                  <p className="text-white/60 mb-6">Create your first submission to participate!</p>
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Join a Contest
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <div key={submission.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-white font-semibold">{submission.title}</h4>
                      <p className="text-white/60 text-sm">{submission.contest_name}</p>
                      <div className="flex gap-4 mt-2 text-sm text-white/60">
                        <span>{formatNumber(submission.views || 0)} views</span>
                        <span>{formatNumber(submission.likes || 0)} likes</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'tiktok-accounts' && (
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-pink-400" />
                TikTok Accounts
              </h3>
              
              {tikTokLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-white rounded-full mx-auto mb-4"></div>
                  <p className="text-white/60">Loading TikTok accounts...</p>
                </div>
              ) : tikTokAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <Video className="h-16 w-16 text-white/20 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-white mb-2">No TikTok accounts connected</h4>
                  <p className="text-white/60 mb-6">Connect your TikTok account to participate in contests</p>
                  <button
                    onClick={connectWithVideoPermissions}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium transition-colors hover:from-pink-600 hover:to-purple-700"
                  >
                    <Video className="h-4 w-4" />
                    Connect TikTok Account
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tikTokAccounts.map((account) => (
                    <div key={account.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <h4 className="text-white font-semibold">@{account.username}</h4>
                      <p className="text-white/60 text-sm">{account.display_name}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
