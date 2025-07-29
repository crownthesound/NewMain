import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Crown, 
  Share2, 
  Copy, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  ArrowRight, 
  ExternalLink,
  Smartphone,
  Loader2,
  Award,
  Zap,
  MessageSquare,
  Heart,
  Eye,
  BarChart3,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
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
  hashtags?: string[] | null;
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

export function SharePage() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [contest, setContest] = useState<Contest | null>(null);
  const [userSubmission, setUserSubmission] = useState<UserSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tiktok' | 'other'>('tiktok');
  const [shareStats, setShareStats] = useState({
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0
  });

  useEffect(() => {
    if (id) {
      fetchContestData();
      if (session) {
        fetchUserSubmission();
      }
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
      navigate('/');
    } finally {
      setLoading(false);
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
      
      if (data) {
        setUserSubmission(data);
        setShareStats({
          views: data.views || 0,
          likes: data.likes || 0,
          comments: data.comments || 0,
          shares: data.shares || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user submission:', error);
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  const handleShareToTikTok = () => {
    const shareUrl = userSubmission 
      ? `https://www.tiktok.com/upload?shareUrl=${encodeURIComponent(window.location.origin + '/l/' + id)}`
      : `https://www.tiktok.com/upload`;
    
    window.open(shareUrl, '_blank');
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white/60" />
          <p className="mt-2 text-white/60">Loading share page...</p>
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      {/* Header with Logo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <Link to="/" className="flex items-center gap-3">
          <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
          <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crown</span>
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-2 bg-white/10 rounded-full mb-4">
            <Share2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Share & Grow</h1>
          <p className="text-white/60 max-w-lg mx-auto">
            Share your contest entry to get more views and climb the leaderboard rankings
          </p>
        </div>

        {/* Contest Card */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden mb-8">
          <div className="relative aspect-video">
            {contest.cover_image ? (
              <img
                src={contest.cover_image}
                alt={contest.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <Award className="h-16 w-16 text-white/40" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">{contest.name}</h2>
                  <div className="flex items-center gap-2 text-white/60 text-sm">
                    <Clock className="h-4 w-4" />
                    <span>{formatTimeLeft(contest.end_date)}</span>
                  </div>
                </div>
                <Link
                  to={`/l/${contest.id}`}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 mb-6">
          <button
            onClick={() => setActiveTab('tiktok')}
            className={`flex-1 py-3 font-medium text-center transition-colors ${
              activeTab === 'tiktok'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            TikTok Sharing
          </button>
          <button
            onClick={() => setActiveTab('other')}
            className={`flex-1 py-3 font-medium text-center transition-colors ${
              activeTab === 'other'
                ? 'text-white border-b-2 border-white'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Other Platforms
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'tiktok' && (
            <>
              {/* TikTok Sharing Steps */}
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-400" />
                    How to Boost Your Ranking
                  </h3>
                  <p className="text-white/80 mb-4">
                    Follow these steps to share your contest entry on TikTok and increase your views to climb the leaderboard:
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">Create a New TikTok</h4>
                        <p className="text-white/60 text-sm">
                          Create a new TikTok video that promotes your contest entry. You can show behind-the-scenes content or talk about why people should watch your entry.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">Include Contest Hashtags</h4>
                        <div className="mb-2">
                          <p className="text-white/60 text-sm">
                            Add these hashtags to your TikTok to increase visibility:
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                            #CrownContest
                          </div>
                          {contest.hashtags && contest.hashtags.map((tag, index) => (
                            <div key={index} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                              #{tag}
                            </div>
                          ))}
                          <div className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">
                            #{contest.music_category.replace(/\s+/g, '')}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const hashtags = [`CrownContest`];
                            if (contest.hashtags) {
                              contest.hashtags.forEach(tag => hashtags.push(tag));
                            }
                            hashtags.push(contest.music_category.replace(/\s+/g, ''));
                            
                            const hashtagText = hashtags.map(tag => `#${tag}`).join(' ');
                            navigator.clipboard.writeText(hashtagText);
                            toast.success('Hashtags copied to clipboard!');
                          }}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Copy all hashtags
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">Add Contest Link</h4>
                        <p className="text-white/60 text-sm mb-2">
                          Include the contest link in your TikTok bio or caption:
                        </p>
                        <div className="flex items-center gap-2 p-2 bg-white/10 rounded-lg mb-2">
                          <input
                            type="text"
                            value={`${window.location.origin}/l/${contest.id}`}
                            readOnly
                            className="bg-transparent text-white text-sm flex-1 outline-none"
                          />
                          <button
                            onClick={() => handleCopyLink(`${window.location.origin}/l/${contest.id}`)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          >
                            {copied ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-white" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-white font-bold">
                        4
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">Post and Share</h4>
                        <p className="text-white/60 text-sm mb-3">
                          Post your TikTok and share it across your other social media platforms to maximize views.
                        </p>
                        <button
                          onClick={handleShareToTikTok}
                          className="px-4 py-2 bg-gradient-to-r from-[#FF0050] to-[#00F2EA] text-white rounded-lg hover:opacity-90 transition-opacity text-sm font-medium flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                          </svg>
                          Open TikTok
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Tips */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-400" />
                    TikTok Performance Tips
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-white/60" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">Post at Peak Times</h4>
                        <p className="text-white/60 text-sm">
                          Share your TikToks between 6-9 PM on weekdays when engagement is highest.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <MessageSquare className="h-5 w-5 text-white/60" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">Engage with Comments</h4>
                        <p className="text-white/60 text-sm">
                          Respond to comments quickly to boost engagement and algorithm visibility.
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-white/60" />
                      </div>
                      <div>
                        <h4 className="font-medium text-white mb-1">Collaborate with Others</h4>
                        <p className="text-white/60 text-sm">
                          Partner with other creators to cross-promote your contest entry.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'other' && (
            <>
              {/* Other Platforms Sharing */}
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Share2 className="h-5 w-5 text-purple-400" />
                    Share Across Platforms
                  </h3>
                  
                  <p className="text-white/80 mb-4">
                    Increase your reach by sharing your contest entry across multiple platforms:
                  </p>
                  
                  <div className="space-y-4">
                    {/* Contest Link */}
                    <div className="p-4 bg-white/10 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Contest Link</h4>
                      <p className="text-white/60 text-sm mb-2">
                        Share this link to direct people to the contest leaderboard:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={`${window.location.origin}/l/${contest.id}`}
                          readOnly
                          className="bg-white/10 text-white text-sm rounded-lg px-3 py-2 flex-1 outline-none"
                        />
                        <button
                          onClick={() => handleCopyLink(`${window.location.origin}/l/${contest.id}`)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          {copied ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Copy className="h-4 w-4 text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {/* Share Text */}
                    <div className="p-4 bg-white/10 rounded-lg">
                      <h4 className="font-medium text-white mb-2">Suggested Share Text</h4>
                      <p className="text-white/60 text-sm mb-2">
                        Copy and paste this text when sharing:
                      </p>
                      <div className="bg-white/10 rounded-lg p-3 text-white/80 text-sm mb-2">
                        I've entered the {contest.name} music contest! Check out my entry and help me climb the leaderboard by watching my video 🎵 🏆 {window.location.origin}/l/{contest.id}
                      </div>
                      <button
                        onClick={() => {
                          const text = `I've entered the ${contest.name} music contest! Check out my entry and help me climb the leaderboard by watching my video 🎵 🏆 ${window.location.origin}/l/${contest.id}`;
                          navigator.clipboard.writeText(text);
                          toast.success('Share text copied to clipboard!');
                        }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Copy share text
                      </button>
                    </div>
                    
                    {/* Share Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          const text = `I've entered the ${contest.name} music contest! Check out my entry and help me climb the leaderboard by watching my video 🎵 🏆`;
                          const url = `${window.location.origin}/l/${contest.id}`;
                          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                        }}
                        className="p-3 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                        </svg>
                        <span>Share on X</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/l/${contest.id}`;
                          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                        }}
                        className="p-3 bg-[#1877F2]/20 hover:bg-[#1877F2]/30 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" />
                        </svg>
                        <span>Share on Facebook</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const text = `I've entered the ${contest.name} music contest! Check out my entry and help me climb the leaderboard by watching my video 🎵 🏆 ${window.location.origin}/l/${contest.id}`;
                          window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="p-3 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path fillRule="evenodd" clipRule="evenodd" d="M17.415 14.382c-.298-.149-1.759-.867-2.031-.967-.272-.099-.47-.148-.669.15-.198.296-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.1-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.57-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                        </svg>
                        <span>Share on WhatsApp</span>
                      </button>
                      
                      <button
                        onClick={() => {
                          const text = `I've entered the ${contest.name} music contest! Check out my entry and help me climb the leaderboard by watching my video 🎵 🏆`;
                          const url = `${window.location.origin}/l/${contest.id}`;
                          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`, '_blank');
                        }}
                        className="p-3 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        <span>Share on LinkedIn</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Template */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-green-400" />
                    Email Template
                  </h3>
                  
                  <p className="text-white/80 mb-4">
                    Use this template to email friends and family:
                  </p>
                  
                  <div className="bg-white/10 rounded-lg p-4 text-white/80 text-sm mb-3">
                    <p className="mb-2"><strong>Subject:</strong> Help me win the {contest.name} music contest! 🎵</p>
                    <p className="mb-2">Hi there,</p>
                    <p className="mb-2">I've entered the {contest.name} music contest and I need your support! The contest ranks entries based on views, so every view counts.</p>
                    <p className="mb-2">Here's how you can help:</p>
                    <p className="mb-2">1. Click this link to view my entry: {window.location.origin}/l/{contest.id}</p>
                    <p className="mb-2">2. Watch my video all the way through</p>
                    <p className="mb-2">3. Share the link with others who might enjoy it</p>
                    <p className="mb-2">Thank you so much for your support! It means a lot to me.</p>
                    <p>Best regards,</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const subject = `Help me win the ${contest.name} music contest! 🎵`;
                      const body = `Hi there,

I've entered the ${contest.name} music contest and I need your support! The contest ranks entries based on views, so every view counts.

Here's how you can help:
1. Click this link to view my entry: ${window.location.origin}/l/${contest.id}
2. Watch my video all the way through
3. Share the link with others who might enjoy it

Thank you so much for your support! It means a lot to me.

Best regards,`;
                      
                      navigator.clipboard.writeText(body);
                      toast.success('Email template copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Email Template
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats Card */}
        {userSubmission && (
          <div className="mt-8 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-400" />
              Your Current Stats
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-white/10 rounded-lg text-center">
                <Eye className="h-5 w-5 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{formatNumber(shareStats.views)}</div>
                <div className="text-xs text-white/60">Views</div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg text-center">
                <Heart className="h-5 w-5 text-red-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{formatNumber(shareStats.likes)}</div>
                <div className="text-xs text-white/60">Likes</div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg text-center">
                <MessageSquare className="h-5 w-5 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{formatNumber(shareStats.comments)}</div>
                <div className="text-xs text-white/60">Comments</div>
              </div>
              <div className="p-3 bg-white/10 rounded-lg text-center">
                <Share2 className="h-5 w-5 text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{formatNumber(shareStats.shares)}</div>
                <div className="text-xs text-white/60">Shares</div>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-white/10 text-center">
              <p className="text-white/60 text-sm">
                Keep sharing to increase your stats and climb the leaderboard!
              </p>
            </div>
          </div>
        )}

        {/* Back to Contest Button */}
        <div className="mt-8 text-center">
          <Link
            to={`/l/${contest.id}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium"
          >
            <ArrowRight className="h-4 w-4" />
            Back to Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}