import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
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
} from "lucide-react";
import toast from "react-hot-toast";

interface Participant {
  id: string;
  username: string;
  full_name: string;
  views: number;
  rank: number;
  previousRank?: number;
}

interface ContestDetails {
  id: string;
  name: string;
  description: string;
  status: string;
  start_date: string;
  end_date: string;
  prize_tier?: string;
  prize_per_winner: number;
  prize_titles: { rank: number; title: string }[];
  music_category: string;
  cover_image?: string;
  resources?: Resource[];
}

interface Resource {
  title: string;
  description?: string;
  url: string;
}

export function ContestDetails() {
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [contest, setContest] = useState<ContestDetails | null>(null);
  const [showAddResource, setShowAddResource] = useState(false);
  const [savingResource, setSavingResource] = useState(false);
  const [selectedPrize, setSelectedPrize] = useState<{
    rank: number;
    prize: string | number;
  } | null>(null);
  const [newResource, setNewResource] = useState<Resource>({
    title: "",
    description: "",
    url: "",
  });
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [participants, setParticipants] = useState<Participant[]>([]);

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        fetchProfile(session.user.id);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (id) {
      fetchContestDetails();
    }
  }, [id]);

  useEffect(() => {
    if (contest?.end_date) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const endDate = new Date(contest.end_date).getTime();
        const distance = endDate - now;

        if (distance < 0) {
          setTimeLeft("Contest Ended");
          clearInterval(timer);
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor(
            (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
          );
          const minutes = Math.floor(
            (distance % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);

          setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        }
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [contest?.end_date]);

  // Fetch live leaderboard data
  useEffect(() => {
    if (!id) return;

    let interval: any;

    const fetchLeaderboard = async () => {
      try {
        const res = await fetch(
          `${backendUrl}/api/v1/contests/${id}/leaderboard?limit=200`
        );
        if (!res.ok) throw new Error("Failed to fetch leaderboard");
        const json = await res.json();
        if (json?.data?.leaderboard) {
          setParticipants(json.data.leaderboard);
        }
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      }
    };

    fetchLeaderboard();
    interval = setInterval(fetchLeaderboard, 30000); // 30-sec refresh

    return () => clearInterval(interval);
  }, [id, backendUrl]);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const isOrganizer = profile?.role === "organizer";

  const fetchContestDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", id as string)
        .maybeSingle();

      if (error) throw error;
      setContest(data as unknown as ContestDetails);
    } catch (error) {
      console.error("Error fetching contest details:", error);
      toast.error("Failed to load contest details");
      setContest(null);
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: contest?.name || "Contest Details",
        text: contest?.description || "Check out this contest!",
        url: window.location.href,
      });
    } catch (error) {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handlePlayVideo = () => {
    toast.success("Video player coming soon!");
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-amber-700" />;
      default:
        return <Star className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />;
    }
  };

  const getRankChangeIcon = (currentRank: number, previousRank?: number) => {
    if (!previousRank) return <Minus className="h-4 w-4 text-gray-400" />;

    if (currentRank < previousRank) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    } else if (currentRank > previousRank) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-500";
      case 2:
        return "text-gray-400";
      case 3:
        return "text-amber-700";
      default:
        return "text-gray-400";
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-500" />
          <p className="mt-2 text-gray-600">Loading contest...</p>
        </div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Contest not found
          </h2>
          <p className="mt-2 text-gray-600">
            This contest may have ended or been removed.
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 mt-4 bg-black text-white rounded-md hover:bg-gray-900"
          >
            <Globe className="h-4 w-4" />
            <span>Return Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Contest Header */}
      <div className="relative bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="relative px-4 py-6 sm:px-6 lg:px-8">
            {contest.cover_image && (
              <div className="absolute inset-0 overflow-hidden opacity-50">
                <img
                  src={contest.cover_image}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-gray-900" />
              </div>
            )}

            <div className="relative">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">
                    {contest.name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-gray-300 text-sm">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{timeLeft}</span>
                    </div>
                    <span>•</span>
                    <span>{formatDate(contest.start_date)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShare}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6">
          {/* Contest Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold mb-4">About this Contest</h2>
            <p className="text-gray-600">{contest.description}</p>
          </div>

          {/* Prize Distribution */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Prize Distribution
              </h2>
              <span className="text-sm text-gray-500">
                {contest.prize_titles.length} Winners
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {contest.prize_titles.map((prize, index) => (
                <button
                  key={index}
                  onClick={() =>
                    setSelectedPrize({
                      rank: index + 1,
                      prize:
                        contest.prize_tier === "monetary"
                          ? contest.prize_per_winner * (1 - index * 0.2)
                          : prize.title,
                    })
                  }
                  className={`
                    p-4 rounded-lg border hover:border-gray-300 transition-all
                    ${
                      index === 0
                        ? "bg-yellow-50 border-yellow-200"
                        : index === 1
                        ? "bg-gray-50 border-gray-200"
                        : index === 2
                        ? "bg-amber-50 border-amber-200"
                        : "bg-white border-gray-200"
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getRankIcon(index + 1)}
                    <span
                      className={`text-sm font-medium ${getRankColor(
                        index + 1
                      )}`}
                    >
                      {index + 1}
                      {index === 0
                        ? "st"
                        : index === 1
                        ? "nd"
                        : index === 2
                        ? "rd"
                        : "th"}
                    </span>
                  </div>
                  <div className="text-sm font-medium">
                    {contest.prize_tier === "monetary"
                      ? `$${formatNumber(
                          contest.prize_per_winner * (1 - index * 0.2)
                        )}`
                      : prize.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Current Rankings</h2>
            </div>

            {/* Mobile View */}
            <div className="block sm:hidden divide-y divide-gray-200">
              {participants.map((participant) => (
                <div key={participant.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${getRankColor(
                            participant.rank
                          )}`}
                        >
                          #{participant.rank}
                        </span>
                        {getRankIcon(participant.rank)}
                      </div>
                      <div>
                        <div className="font-medium">
                          {participant.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatNumber(participant.views)} views
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={handlePlayVideo}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <Play className="h-5 w-5 text-gray-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop View */}
            <div className="hidden sm:block">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Views
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {participants.map((participant) => (
                    <tr key={participant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getRankIcon(participant.rank)}
                          <span
                            className={`font-medium ${getRankColor(
                              participant.rank
                            )}`}
                          >
                            #{participant.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium">
                          {participant.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {participant.full_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium">
                          {formatNumber(participant.views)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={handlePlayVideo}
                          className="p-2 rounded-full hover:bg-gray-100 inline-flex items-center justify-center"
                        >
                          <Play className="h-5 w-5 text-gray-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Modal */}
      {selectedPrize && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getRankIcon(selectedPrize.rank)}
                <h3 className="text-lg font-semibold">
                  {selectedPrize.rank}
                  {selectedPrize.rank === 1
                    ? "st"
                    : selectedPrize.rank === 2
                    ? "nd"
                    : selectedPrize.rank === 3
                    ? "rd"
                    : "th"}{" "}
                  Place
                </h3>
              </div>
              <button
                onClick={() => setSelectedPrize(null)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-center">
                {contest.prize_tier === "monetary" ? (
                  <>
                    <div className="text-2xl font-bold text-green-600">
                      ${formatNumber(selectedPrize.prize as number)}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Cash Prize</p>
                  </>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedPrize.prize}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Achievement Title
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
