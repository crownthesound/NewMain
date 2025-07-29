import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  PlusCircle,
  Trash2,
  Edit2,
  EyeOff,
  Eye,
  Loader2,
  Clock,
  Globe,
  Menu,
  X,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Database } from "../lib/database.types";
import { useAuth } from "../contexts/AuthContext";
import { 
  calculateContestStatus, 
  getStatusLabel, 
  getStatusColor,
  formatTimeRemaining,
  getTimeRemaining 
} from "../lib/contestUtils";

type Contest = Database["public"]["Tables"]["contests"]["Row"] & {
  calculatedStatus?: 'draft' | 'active' | 'ended' | 'archived';
};

const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export function Contests() {
  const { session, profile } = useAuth();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "all" | "draft" | "active" | "completed" | "hidden"
  >("all");
  const [showFilters, setShowFilters] = useState(false);

  // Check if user can manage contests
  const canManageContests =
    profile?.role === "organizer" || profile?.role === "admin";

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data) {
        // Add calculated status to each contest
        const contestsWithStatus = data.map(contest => {
          const calculatedStatus = calculateContestStatus(contest);
          return {
            ...contest,
            calculatedStatus
          };
        });
        
        setContests(contestsWithStatus);
      }
    } catch (error) {
      console.error("Error fetching contests:", error);
      toast.error("Failed to load contests");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (contestId: string, contestStatus: string) => {
    const isDraft = contestStatus === "draft";
    const confirmMessage = isDraft
      ? "Are you sure you want to delete this draft? This action cannot be undone."
      : "Are you sure you want to delete this contest? This action cannot be undone and will affect all participants.";

    if (!confirm(confirmMessage)) {
      return;
    }

    if (!session?.access_token) {
      toast.error("Authentication required");
      return;
    }

    setDeleting(contestId);
    try {
      const response = await fetch(
        `${backendUrl}/api/v1/contests/${contestId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete contest");
      }

      setContests(contests.filter((contest) => contest.id !== contestId));
      toast.success(`${isDraft ? "Draft" : "Contest"} deleted successfully`);
    } catch (error) {
      console.error("Error deleting contest:", error);
      toast.error(`Failed to delete ${isDraft ? "draft" : "contest"}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleVisibility = async (
    contestId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "hidden" : "active";
    const actionText = currentStatus === "active" ? "hide" : "unhide";

    if (!confirm(`Are you sure you want to ${actionText} this contest?`)) {
      return;
    }

    if (!session?.access_token) {
      toast.error("Authentication required");
      return;
    }

    setUpdating(contestId);
    try {
      const response = await fetch(
        `${backendUrl}/api/v1/contests/${contestId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update contest");
      }

      setContests(
        contests.map((contest) =>
          contest.id === contestId ? { ...contest, status: newStatus } : contest
        )
      );

      toast.success(`Contest ${actionText}d successfully`);
    } catch (error) {
      console.error("Error updating contest visibility:", error);
      toast.error(`Failed to ${actionText} contest`);
    } finally {
      setUpdating(null);
    }
  };

  const getFilteredContests = () => {
    if (activeTab === "all") return contests;
    if (activeTab === "completed") {
      // Use calculated status for real-time filtering
      return contests.filter((contest) => contest.calculatedStatus === "ended");
    }
    if (activeTab === "active") {
      // Use calculated status for active contests
      return contests.filter((contest) => contest.calculatedStatus === "active");
    }
    // For other tabs (draft, hidden), use database status
    return contests.filter((contest) => contest.status === activeTab);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "active":
        return "bg-blue-100 text-blue-800";
      case "ended":
      case "completed":
        return "bg-green-100 text-green-800";
      case "hidden":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimeLeft = (contest: Contest) => {
    const timeRemaining = getTimeRemaining(contest);
    if (!timeRemaining) {
      return contest.calculatedStatus === 'ended' ? 'Ended' : 'Not started yet';
    }
    return formatTimeRemaining(timeRemaining) + ' left';
  };

  const renderActionButtons = (contest: Contest) => {
    if (!canManageContests) return null;

    if (contest.status === "draft") {
      return (
        <div className="flex items-center gap-2">
          <Link
            to={`/build/${contest.id}`}
            className="p-2 text-gray-400 hover:text-blue-600"
            title="Edit draft"
          >
            <Edit2 className="h-5 w-5" />
          </Link>
          <button
            onClick={() => handleDelete(contest.id, contest.status || "draft")}
            disabled={deleting === contest.id}
            className={`p-2 text-gray-400 hover:text-red-600 transition-colors ${
              deleting === contest.id ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Delete draft"
          >
            <Trash2
              className={`h-5 w-5 ${
                deleting === contest.id ? "animate-pulse" : ""
              }`}
            />
          </button>
        </div>
      );
    }

    if (contest.status === "active" || contest.status === "hidden") {
      return (
        <div className="flex items-center gap-2">
          <Link
            to={`/build/${contest.id}`}
            className="p-2 text-gray-400 hover:text-blue-600"
            title="Edit contest"
          >
            <Edit2 className="h-5 w-5" />
          </Link>
          <button
            onClick={() =>
              contest.status &&
              handleToggleVisibility(contest.id, contest.status)
            }
            disabled={updating === contest.id}
            className={`p-2 text-gray-400 hover:text-purple-600 transition-colors ${
              updating === contest.id ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title={
              contest.status === "active" ? "Hide contest" : "Unhide contest"
            }
          >
            {contest.status === "active" ? (
              <EyeOff
                className={`h-5 w-5 ${
                  updating === contest.id ? "animate-pulse" : ""
                }`}
              />
            ) : (
              <Eye
                className={`h-5 w-5 ${
                  updating === contest.id ? "animate-pulse" : ""
                }`}
              />
            )}
          </button>
        </div>
      );
    }

    if (contest.status === "ended") {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDelete(contest.id, contest.status || "ended")}
            disabled={deleting === contest.id}
            className={`p-2 text-gray-400 hover:text-red-600 transition-colors ${
              deleting === contest.id ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Delete contest"
          >
            <Trash2
              className={`h-5 w-5 ${
                deleting === contest.id ? "animate-pulse" : ""
              }`}
            />
          </button>
        </div>
      );
    }

    return null;
  };

  const getTabCount = (tab: string) => {
    if (tab === "all") return contests.length;
    if (tab === "completed") {
      return contests.filter((c) => c.calculatedStatus === "ended").length;
    }
    if (tab === "active") {
      return contests.filter((c) => c.calculatedStatus === "active").length;
    }
    return contests.filter((c) => c.status === tab).length;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
            <div className="flex items-center justify-between w-full sm:w-auto">
              <h1 className="text-2xl font-bold">Contests</h1>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="sm:hidden p-2 hover:bg-gray-100 rounded-md"
              >
                {showFilters ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
            {canManageContests && (
              <Link
                to="/build"
                className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-black text-white rounded-md hover:bg-gray-900 w-full sm:w-auto transition-colors"
              >
                <PlusCircle className="h-5 w-5" />
                <span>New Contest</span>
              </Link>
            )}
          </div>

          {/* Filter Tabs */}
          <div className={`${showFilters ? "block" : "hidden"} sm:block pb-4`}>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {["all", "draft", "active", "hidden", "completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab as typeof activeTab);
                    setShowFilters(false);
                  }}
                  className={`flex items-center justify-between px-4 py-2 rounded-md whitespace-nowrap transition-colors ${
                    activeTab === tab
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
                  <span className="ml-2 bg-white bg-opacity-20 px-2 py-0.5 rounded-full text-sm">
                    {getTabCount(tab)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contest List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">Loading contests...</p>
          </div>
        ) : getFilteredContests().length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-600">No contests found</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {getFilteredContests().map((contest) => (
              <div
                key={contest.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors"
              >
                <div className="p-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold truncate">
                            {contest.name || "Untitled Contest"}
                          </h3>
                          
                          {/* Real-time Status */}
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              contest.calculatedStatus
                            )}`}
                          >
                            {getStatusLabel(contest.calculatedStatus || 'draft')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {contest.description || "No description provided"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {renderActionButtons(contest)}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{formatTimeLeft(contest)}</span>
                      </div>
                      {contest.music_category && (
                        <div>
                          <span className="font-medium">Category:</span>{" "}
                          {contest.music_category}
                        </div>
                      )}
                      {contest.prize_per_winner &&
                        contest.prize_per_winner > 0 && (
                          <div>
                            <span className="font-medium">Prize:</span> $
                            {contest.prize_per_winner.toLocaleString()}
                          </div>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-4 border-t border-gray-100">
                      <Link
                        to={`/contests/${contest.id}`}
                        className="text-gray-600 hover:text-gray-900 text-sm"
                      >
                        View Details
                      </Link>
                      {contest.status === "active" && (
                        <Link
                          to={`/l/${contest.id}`}
                          target="_blank"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm group"
                        >
                          <Globe className="h-4 w-4" />
                          <span className="group-hover:underline">
                            Public Leaderboard
                          </span>
                        </Link>
                      )}
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
