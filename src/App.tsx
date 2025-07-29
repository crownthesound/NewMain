import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { Auth } from "./components/Auth";
import { BuildLeaderboard } from "./components/BuildLeaderboard";
import { Contests } from "./pages/Contests";
import { ContestDetails } from "./pages/ContestDetails";
import { PublicLeaderboard } from "./pages/PublicLeaderboard";
import { PastContests } from "./pages/PastContests";
import { ContestsPage } from "./pages/ContestsPage";
import { SharePage } from "./pages/SharePage";
import { ContestManagement } from "./pages/ContestManagement";
import { Start } from "./pages/Start";
import { SignIn } from "./pages/SignIn";
import { SignUp } from "./pages/SignUp";
import { OTPVerification } from "./pages/OTPVerification";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminPage } from "./pages/AdminPage";
import { TermsOfService } from "./pages/TermsOfService";
import { PrivacyPolicy } from "./pages/PrivacyPolicy";
import { Profile } from "./pages/Profile";
import { HomeContent } from "./components/HomeContent";
import { supabase } from "./lib/supabase";
import { Toaster } from "react-hot-toast";
import {
  Home,
  Crown,
  Medal,
  Star,
  Settings,
  ListTodo,
  Menu,
  X,
  History,
  ChevronLeft,
  ChevronRight,
  WifiOff,
  Plus,
  LogOut,
  Settings2,
  Trophy,
  User,
  Gift,
  UserPlus,
} from "lucide-react";
import { useAuth } from "./contexts/AuthContext";
import { useScrollToTop } from "./hooks/useScrollToTop";
import { useSessionExpiry } from "./hooks/useSessionExpiry";
import { TikTokSettingsModal } from "./components/TikTokSettingsModal";
import { useAuthRedirect } from "./hooks/useAuthRedirect";
import { calculateContestStatus } from "./lib/contestUtils";
import toast from "react-hot-toast";

interface Contest {
  id: string;
  name: string;
  description: string;
  cover_image: string | null;
  start_date: string;
  end_date: string;
  num_winners: number | null;
  total_prize: number | null;
  status: string | null;
  music_category?: string | null;
  prize_per_winner?: number | null;
  prize_titles?: any | null;
  guidelines?: string | null;
  rules?: string | null;
  hashtags?: string[] | null;
  submission_deadline?: string | null;
  max_participants?: number | null;
  top_participants?: any[];
}

const mockParticipants = [
  {
    rank: 1,
    username: "baeb__8",
    full_name: "Mukonazwothe Khabubu",
    points: 1200000,
    views: 1200000,
    previousRank: 2,
  },
  {
    rank: 2,
    username: "lordmust",
    full_name: "Lordmust Sadulloev",
    points: 850000,
    views: 850000,
    previousRank: 1,
  },
  {
    rank: 3,
    username: "glen_versoza",
    full_name: "Glen Versoza",
    points: 620000,
    views: 620000,
    previousRank: 3,
  },
  {
    rank: 4,
    username: "dance_queen",
    full_name: "Sarah Johnson",
    points: 450000,
    views: 450000,
    previousRank: 5,
  },
  {
    rank: 5,
    username: "beatmaster",
    full_name: "James Wilson",
    points: 380000,
    views: 380000,
    previousRank: 4,
  },
  {
    rank: 6,
    username: "rhythm_master",
    full_name: "Michael Chen",
    points: 320000,
    views: 320000,
    previousRank: 7,
  },
  {
    rank: 7,
    username: "melody_queen",
    full_name: "Emma Thompson",
    points: 280000,
    views: 280000,
    previousRank: 6,
  },
  {
    rank: 8,
    username: "groove_guru",
    full_name: "David Martinez",
    points: 250000,
    views: 250000,
    previousRank: 8,
  },
  {
    rank: 9,
    username: "beat_breaker",
    full_name: "Sophie Anderson",
    points: 220000,
    views: 220000,
    previousRank: 10,
  },
  {
    rank: 10,
    username: "music_maverick",
    full_name: "Ryan O'Connor",
    points: 200000,
    views: 200000,
    previousRank: 9,
  },
  {
    rank: 11,
    username: "vibes_master",
    full_name: "Aisha Patel",
    points: 180000,
    views: 180000,
    previousRank: 12,
  },
  {
    rank: 12,
    username: "sound_wave",
    full_name: "Lucas Kim",
    points: 160000,
    views: 160000,
    previousRank: 11,
  },
  {
    rank: 13,
    username: "harmony_hub",
    full_name: "Isabella Garcia",
    points: 140000,
    views: 140000,
    previousRank: 13,
  },
  {
    rank: 14,
    username: "tempo_king",
    full_name: "Marcus Lee",
    points: 120000,
    views: 120000,
    previousRank: 15,
  },
  {
    rank: 15,
    username: "beat_flow",
    full_name: "Nina Rodriguez",
    points: 100000,
    views: 100000,
    previousRank: 14,
  },
];

function App() {
  const { session, signOut, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [activeContests, setActiveContests] = useState<Contest[]>([]);
  const [showTikTokModal, setShowTikTokModal] = useState(false);
  const { setRedirectFromCurrent } = useAuthRedirect();

  useScrollToTop();
  useSessionExpiry(); // Handle session expiry checking

  const isPublicPage = location.pathname.startsWith("/l/");
  const isAuthPage = [
    "/signin",
    "/signup",
    "/verify-otp",
    "/admin-login",
    "/terms",
    "/privacy",
  ].includes(location.pathname);
  const currentPage =
    location.pathname === "/" ? "home" : location.pathname.slice(1);
  const isOrganizer =
    profile?.role === "organizer" || profile?.role === "admin";
  const showFooter = session && !isPublicPage && !isAuthPage;

  console.log({ isOrganizer, session, profile, authLoading });
  // Check for TikTok modal URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const isContestPage = location.pathname.includes('/l/') || location.pathname.includes('/contest');
    
    if (urlParams.get("showTikTokModal") === "true" && session && !isContestPage) {
      setShowTikTokModal(true);
      // Clean up URL parameter without changing the current page
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("showTikTokModal");
      window.history.replaceState({}, "", newUrl.toString());
    } else if (urlParams.get("showTikTokModal") === "true" && isContestPage) {
      // Clean up URL parameter for contest pages without opening modal
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete("showTikTokModal");
      window.history.replaceState({}, "", newUrl.toString());
    }
  }, [location.search, session]);

  useEffect(() => {
    const fetchActiveContests = async () => {
      try {
        const { data, error } = await supabase
          .from("contests")
          .select("*")
          .eq("status", "active")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const contestsWithParticipants = (data || []).map((contest) => ({
          ...contest,
          top_participants: mockParticipants.slice(
            0,
            contest.num_winners || 15
          ),
        }));

        // Filter contests to only show those that are actually active based on end_date
        const activeContests = contestsWithParticipants.filter(contest => {
          // Ensure contest has required fields and status is not null
          if (!contest.start_date || !contest.end_date || !contest.status) {
            return false;
          }
          return calculateContestStatus(contest as any) === 'active';
        });

        setActiveContests(activeContests);
      } catch (error) {
        console.error("Error fetching active contests:", error);
        toast.error("Failed to load contests");
      } finally {
        setLoading(false);
      }
    };

    fetchActiveContests();
  }, []);

  // Check TikTok connection status after authentication
  useEffect(() => {
    const checkTikTokConnection = async () => {
      if (session && profile && !isAuthPage && !isOrganizer) {
        try {
          const { data: tikTokProfile } = await supabase
            .from("tiktok_profiles")
            .select("*")
            .eq("user_id", session.user.id)
            .single();

          // Only show TikTok modal on home page, not on contest pages
          const isContestPage = location.pathname.includes('/l/') || location.pathname.includes('/contest');
          
          if (!tikTokProfile && location.pathname === "/" && !isContestPage) {
            // User is not connected to TikTok, show modal after a short delay
            setTimeout(() => {
              setShowTikTokModal(true);
            }, 2000);
          }
        } catch (error) {
          console.error("Error checking TikTok connection:", error);
        }
      }
    };

    checkTikTokConnection();
  }, [session, profile, isAuthPage, location.pathname, isOrganizer]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/");
      toast.success("Signed out successfully");
    } catch (error) {
      console.error("Error signing out:", error);
      navigate("/");
      toast.error("Error during sign out");
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "organizer":
        return "text-yellow-400";
      case "admin":
        return "text-red-400";
      default:
        return "text-blue-400";
    }
  };

  // Loading component for protected routes
  const ProtectedRoute = ({
    children,
    requireOrganizer = false,
    redirectPath,
  }: {
    children: React.ReactNode;
    requireOrganizer?: boolean;
    redirectPath?: string;
  }) => {
    // Show loading while auth is loading OR while we have a session but no profile yet
    if (authLoading || (session && !profile)) {
      return (
        <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 relative">
              <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping"></div>
              <div className="absolute inset-0 rounded-full border-2 border-t-white animate-spin"></div>
            </div>
            <p className="mt-6 text-white/60 font-light tracking-wider">
              LOADING
            </p>
          </div>
        </div>
      );
    }

    if (!session) {
      // Store current URL for redirect after authentication
      setRedirectFromCurrent({ preserveParams: true });
      
      // Redirect to appropriate auth page
      const authPath = requireOrganizer ? "/admin-login" : "/signin";
      return <Navigate to={authPath} replace />;
    }

    if (requireOrganizer && !isOrganizer) {
      // For organizer-only routes, redirect to home instead of storing redirect URL
      return <Navigate to="/" replace />;
    }

    return <>{children}</>;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      <main className={`flex-1 ${showFooter ? "pb-24" : ""}`}>
        <Routes>
          <Route
            path="/"
            element={
              <HomeContent
                contests={activeContests}
                loading={loading}
                session={session}
                onShowAuth={(isSignUp) => {
                  // Store current URL for redirect after authentication
                  setRedirectFromCurrent({ preserveParams: true });
                  navigate(isSignUp ? "/signup" : "/signin");
                }}
              />
            }
          />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/verify-otp" element={<OTPVerification />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/start" element={<Start />} />
          <Route path="/contests-page" element={<ContestsPage />} />
          <Route path="/share/:id" element={<SharePage />} />
          <Route
            path="/contest-management/:id"
            element={
              <ProtectedRoute>
                <ContestManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/past"
            element={
              <ProtectedRoute>
                <PastContests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/contests"
            element={
              <ProtectedRoute requireOrganizer>
                <Contests />
              </ProtectedRoute>
            }
          />
          <Route path="/contests/:id" element={<ContestDetails />} />
          <Route path="/l/:id" element={<PublicLeaderboard />} />
          <Route
            path="/build"
            element={
              <ProtectedRoute requireOrganizer>
                <BuildLeaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/build/:id"
            element={
              <ProtectedRoute requireOrganizer>
                <BuildLeaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireOrganizer>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      {showFooter && (
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom pb-[env(safe-area-inset-bottom)]">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex justify-center">
              {isOrganizer ? (
                // Organizer/Admin Footer
                <nav className="grid grid-cols-5 w-[600px] gap-1">
                  {/* Manage Contests */}
                  <button
                    onClick={() => {
                      navigate("/contests");
                    }}
                    className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 group ${
                      currentPage === "contests"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <ListTodo className="h-6 w-6 mb-1 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-medium">Contests</span>
                  </button>

                  {/* Create Contest */}
                  <button
                    onClick={() => {
                      navigate("/build");
                    }}
                    className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 group ${
                      currentPage === "build"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Plus className="h-6 w-6 mb-1 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-medium">Create</span>
                  </button>

                  {/* Admin Panel */}
                  <button
                    onClick={() => {
                      navigate("/admin");
                    }}
                    className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 group ${
                      currentPage === "admin"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <Settings2 className="h-6 w-6 mb-1 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-medium">Admin</span>
                  </button>

                  {/* Profile with Role */}
                  <button
                    onClick={() => {
                      navigate("/profile");
                    }}
                    className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 group ${
                      currentPage === "profile"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <div className="relative">
                      <User className="h-6 w-6 mb-1 transition-transform duration-300 group-hover:scale-110 text-yellow-400" />
                      {/* {profile?.role && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
                      )} */}
                    </div>
                    {profile?.role && (
                      <span
                        className={`text-xs font-bold ${getRoleColor(
                          profile.role
                        )}`}
                      >
                        {profile.role.toUpperCase()}
                      </span>
                    )}
                  </button>

                  {/* Sign Out */}
                  <button
                    onClick={handleSignOut}
                    className="flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 group text-white/60 hover:text-white"
                  >
                    <LogOut className="h-6 w-6 mb-1 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-medium">Sign Out</span>
                  </button>
                </nav>
              ) : (
                // Regular User Footer
                <nav className="grid grid-cols-3 w-[400px] gap-1">
                  {/* Rewards Button - Far Left */}
                  <button
                    onClick={() => {
                      // TODO: Navigate to rewards page or show rewards modal
                      toast.success("Rewards coming soon!");
                    }}
                    className="flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 group text-white/60 hover:text-white"
                  >
                    <Gift className="h-6 w-6 mb-1 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-medium">Rewards</span>
                  </button>

                  {/* Join Contest Button - Middle */}
                  <button
                    onClick={() => {
                      navigate("/contests-page");
                    }}
                    className="flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 group text-white/60 hover:text-white"
                  >
                    <UserPlus className="h-6 w-6 mb-1 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-medium">Join Contest</span>
                  </button>

                  {/* Profile Button - Far Right */}
                  <button
                    onClick={() => {
                      navigate("/profile");
                    }}
                    className={`flex flex-col items-center justify-center py-3 px-4 rounded-lg transition-all duration-300 group ${
                      currentPage === "profile"
                        ? "text-white"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <User className="h-6 w-6 mb-1 transition-transform duration-300 group-hover:scale-110" />
                    <span className="text-xs font-medium">Profile</span>
                  </button>
                </nav>
              )}
            </div>
          </div>
        </footer>
      )}

      <Toaster position="bottom-center" />

      {/* TikTok Settings Modal */}
      <TikTokSettingsModal
        isOpen={showTikTokModal}
        onClose={() => setShowTikTokModal(false)}
      />
    </div>
  );
}

export default App;
