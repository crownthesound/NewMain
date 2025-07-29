import React, { useState, useEffect } from 'react';
import { Video, ArrowRight, CheckCircle, RefreshCw, Loader2, Crown, Music2, Trophy, Star, Sparkles, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useAuthRedirect } from '../hooks/useAuthRedirect';

interface Contest {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  status: string;
}

export function Start() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [currentContestIndex, setCurrentContestIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { redirectToAuth } = useAuthRedirect();

  useEffect(() => {
    fetchActiveContests();
  }, []);

  const fetchActiveContests = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_config')
        .select('id, name, description, cover_image, status')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        setContests(data);
      } else {
        toast.error('No active contests found');
      }
    } catch (error) {
      console.error('Error fetching contests:', error);
      toast.error('Failed to load contests');
    } finally {
      setLoading(false);
    }
  };

  const handleNextContest = () => {
    setCurrentContestIndex((prev) => 
      prev === contests.length - 1 ? 0 : prev + 1
    );
  };

  const handleSubmitEntry = () => {
    if (!session) {
      redirectToAuth('/signin');
      return;
    }
    toast.success('Coming soon! Entry submission will be available shortly.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
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

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      {/* Logo and Auth Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <Crown className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">Crown</span>
          </Link>
          {!session && (
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => redirectToAuth('/signin')}
                className="px-4 sm:px-6 py-2 text-white hover:bg-white/5 rounded-xl transition-colors whitespace-nowrap"
              >
                Login
              </button>
              <button
                onClick={() => redirectToAuth('/signup')}
                className="bg-white text-[#1A1A1A] px-4 sm:px-6 py-2 rounded-xl hover:bg-white/90 transition-colors transform hover:scale-105 duration-200 font-medium whitespace-nowrap"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8 sm:py-16 lg:py-24">
        {contests.length === 0 ? (
          <div className="max-w-lg mx-auto text-center py-24">
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/10 blur-2xl opacity-20"></div>
              <Music2 className="h-16 w-16 text-white mx-auto relative animate-float-icon" />
            </div>
            <h2 className="text-4xl font-light text-white mb-4 tracking-wider">NO ACTIVE CONTESTS</h2>
            <p className="text-white/60 mb-12 tracking-wide">Check back later for new opportunities</p>
            <Link
              to="/"
              className="inline-flex items-center gap-3 px-12 py-4 bg-white/5 text-white border border-white/10 rounded-full hover:bg-white/10 transition-all duration-500 tracking-wider group backdrop-blur-sm"
            >
              EXPLORE
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-500" />
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-24 items-start lg:items-center">
            {/* Contest Card */}
            <div className="transform-gpu hover:scale-[1.02] transition-all duration-700">
              <div className="relative rounded-2xl overflow-hidden border border-white/10 backdrop-blur-xl bg-white/5">
                <div className="relative aspect-[16/9] sm:aspect-[4/3]">
                  <img
                    src={contests[currentContestIndex].cover_image}
                    alt={contests[currentContestIndex].name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                  
                  <div className="absolute inset-x-0 bottom-0 p-4 sm:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                      <Trophy className="h-5 w-5 sm:h-6 sm:w-6 text-white animate-float-icon" />
                      <span className="text-white text-xs sm:text-sm tracking-widest">FEATURED CONTEST</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-light text-white mb-2 sm:mb-3 tracking-wider">
                      {contests[currentContestIndex].name}
                    </h2>
                    <p className="text-white/80 text-sm sm:text-base lg:text-lg font-light leading-relaxed line-clamp-2">
                      {contests[currentContestIndex].description}
                    </p>
                  </div>

                  {contests.length > 1 && (
                    <button
                      onClick={handleNextContest}
                      className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-500 hover:scale-110 group"
                    >
                      <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Steps Section */}
            <div className="space-y-4 sm:space-y-6">
              {/* Step 1 */}
              <div className="group bg-white/5 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-8 transform-gpu hover:translate-y-[-2px] transition-all duration-700">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transform-gpu group-hover:scale-110 transition-transform duration-700">
                    <Video className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-light text-white text-lg sm:text-xl tracking-wider mb-1 sm:mb-2">RECORD PERFORMANCE</h3>
                    <p className="text-white/60 text-sm sm:text-base tracking-wide line-clamp-2">Create your masterpiece following contest guidelines</p>
                  </div>
                  <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6 text-white/40 group-hover:translate-x-2 transition-transform duration-700" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="group bg-white/5 backdrop-blur-lg rounded-xl sm:rounded-2xl border border-white/10 p-4 sm:p-8 transform-gpu hover:translate-y-[-2px] transition-all duration-700">
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg transform-gpu group-hover:scale-110 transition-transform duration-700">
                    <Play className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-light text-white text-lg sm:text-xl tracking-wider mb-1 sm:mb-2">SUBMIT ENTRY</h3>
                    <p className="text-white/60 text-sm sm:text-base tracking-wide line-clamp-2">Share your creation with the world</p>
                  </div>
                  <button
                    onClick={handleSubmitEntry}
                    className="px-4 sm:px-8 py-3 sm:py-4 bg-white/20 text-white font-light tracking-wider rounded-lg sm:rounded-xl hover:bg-white/30 transition-all transform-gpu hover:scale-105 text-sm sm:text-base whitespace-nowrap"
                  >
                    SUBMIT
                  </button>
                </div>
              </div>

              {/* View All Link */}
              <div className="pt-4 sm:pt-6 text-center">
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 sm:gap-3 text-white/60 hover:text-white tracking-widest text-xs sm:text-sm group transition-colors duration-500"
                >
                  EXPLORE ALL CONTESTS
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 group-hover:translate-x-2 transition-transform duration-500" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}