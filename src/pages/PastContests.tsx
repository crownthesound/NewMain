import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Clock, Globe, Loader2, Crown, Medal, Star, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Contest {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  start_date: string;
  end_date: string;
  status: string;
  music_category: string;
  prize_tier: string;
  prize_per_winner: number;
  prize_titles: { rank: number; title: string; }[];
  top_participants?: {
    rank: number;
    username: string;
    full_name: string;
    points: number;
    views: number;
  }[];
}

export function PastContests() {
  const { session } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPastContests();
  }, []);

  const fetchPastContests = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_config')
        .select('*')
        .eq('status', 'completed')
        .order('end_date', { ascending: false });

      if (error) throw error;
      setContests(data || []);
    } catch (error) {
      console.error('Error fetching past contests:', error);
      toast.error('Failed to load past contests');
    } finally {
      setLoading(false);
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
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-700" />;
      default:
        return <Star className="h-5 w-5 text-gray-400" />;
    }
  };

  const handlePlayVideo = () => {
    toast.success('Video player coming soon!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" />
          <p className="mt-2 text-gray-600">Loading past contests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-[2rem] xs:text-[2.5rem] sm:text-[3rem] font-black text-gray-900">Past Contests</h1>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-800 font-medium"
          >
            View Active Contests
          </Link>
        </div>

        {contests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Past Contests</h3>
            <p className="text-gray-600">Check back later for completed contests.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {contests.map(contest => (
              <div
                key={contest.id}
                className="group bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Contest Cover */}
                    {contest.cover_image && (
                      <div className="sm:w-48 h-32 sm:h-48 flex-shrink-0">
                        <img
                          src={contest.cover_image}
                          alt={contest.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Contest Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-xl font-black text-gray-900">{contest.name}</h2>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium">
                          Completed
                        </span>
                      </div>

                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {contest.description}
                      </p>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Category</span>
                          <p className="font-medium text-gray-900">{contest.music_category}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Start Date</span>
                          <p className="font-medium text-gray-900">{formatDate(contest.start_date)}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">End Date</span>
                          <p className="font-medium text-gray-900">{formatDate(contest.end_date)}</p>
                        </div>
                      </div>

                      {/* Winners */}
                      {contest.top_participants && contest.top_participants.length > 0 && (
                        <div className="mt-6 pt-6 border-t border-gray-100">
                          <h3 className="text-sm font-medium text-gray-900 mb-3">Winners</h3>
                          <div className="grid gap-3">
                            {contest.top_participants.slice(0, 3).map((participant, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {getRankIcon(index + 1)}
                                  <div>
                                    <div className="font-medium text-gray-900">{participant.username}</div>
                                    <div className="text-sm text-gray-500">
                                      {formatNumber(participant.views)} views
                                    </div>
                                  </div>
                                </div>
                                <button
                                  onClick={handlePlayVideo}
                                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                  <Play className="h-4 w-4 text-gray-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* View Details Link */}
                      <div className="mt-6 flex items-center gap-4">
                        <Link
                          to={`/l/${contest.id}`}
                          className="inline-flex items-center gap-2 text-gray-900 hover:text-gray-800 font-medium"
                        >
                          <Globe className="h-4 w-4" />
                          <span>View Details</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}