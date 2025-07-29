import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import toast from "react-hot-toast";
import { 
  calculateContestStatus, 
  getStatusLabel, 
  getStatusColor 
} from "../lib/contestUtils";
import {
  Upload,
  CheckCircle,
  X,
  Move,
  Trophy,
  Link as LinkIcon,
  Plus,
  Trash2,
  Loader2,
  CircleDot,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

const DEFAULT_PRIZE_TITLES = [
  "First Place",
  "Second Place",
  "Third Place",
  "Fourth Place",
  "Fifth Place",
];

const MUSIC_CATEGORIES = [
  "All",
  "Pop",
  "Rock",
  "Hip Hop/Rap",
  "R&B/Soul",
  "Electronic/Dance",
  "Jazz",
  "Classical",
  "Country",
  "Folk",
  "Blues",
  "Metal",
  "Reggae",
  "World Music",
  "Alternative",
  "Indie",
  "Latin",
  "Gospel/Christian",
  "Punk",
  "Funk",
  "Ambient",
  "Experimental",
];

const STEPS = [
  { id: "get-started", label: "Get Started", icon: CircleDot },
  { id: "create-brief", label: "Create Brief", icon: CircleDot },
  { id: "prize", label: "Prize", icon: CircleDot },
] as const;

type StepId = (typeof STEPS)[number]["id"];

interface PrizeTitle {
  rank: number;
  title: string;
}

const ProgressStep = ({
  isActive,
  isCompleted,
  label,
}: {
  isActive: boolean;
  isCompleted: boolean;
  label: string;
}) => {
  return (
    <div className="flex-1 relative">
      <div
        className={`
          h-1 absolute left-0 right-0 top-4 -translate-y-1/2
          ${isCompleted ? "bg-blue-500" : "bg-gray-200"}
        `}
      />
      <div className="flex flex-col items-center relative">
        <div
          className={`
            w-8 h-8 rounded-full flex items-center justify-center z-10
            transition-all duration-200
            ${
              isActive
                ? "bg-blue-600 text-white scale-110"
                : isCompleted
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-600"
            }
          `}
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <CircleDot className="h-5 w-5" />
          )}
        </div>
        <span
          className={`
            mt-2 text-xs font-medium transition-colors duration-200
            ${
              isActive
                ? "text-blue-600"
                : isCompleted
                ? "text-blue-500"
                : "text-gray-500"
            }
          `}
        >
          {label}
        </span>
      </div>
    </div>
  );
};

// Format a Date object to the string format required by <input type="datetime-local">
// e.g. 2025-07-04T18:30 (local time, no timezone offset)
const toDatetimeLocal = (date: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export function BuildLeaderboard() {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const [step, setStep] = useState<StepId>("get-started");
  const [loading, setLoading] = useState(contestId ? true : false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePosition, setImagePosition] = useState({ x: 50, y: 50 });

  const [config, setConfig] = useState({
    id: contestId || uuidv4(),
    name: "",
    description: "",
    cover_image: "",
    start_date: toDatetimeLocal(new Date()),
    end_date: toDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    num_winners: 5,
    prize_per_winner: 2000,
    prize_tier: "non-monetary" as "non-monetary" | "monetary",
    total_prize: 5000,
    music_category: "",
    prize_titles: DEFAULT_PRIZE_TITLES.map((title, index) => ({
      rank: index + 1,
      title,
    })),
    prize_amounts: Array(5).fill(2000),
    created_by: null as string | null,
    status: "draft",
  });

  useEffect(() => {
    const getCurrentUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user.id);
        setConfig((prev) => ({
          ...prev,
          created_by: session.user.id,
        }));
      }
    };

    getCurrentUser();

    if (contestId) {
      fetchContestData();
    }
  }, [contestId]);

  const fetchContestData = async () => {
    if (!contestId) {
      toast.error("Contest ID not found");
      navigate("/contests");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("contests")
        .select("*")
        .eq("id", contestId)
        .single();

      if (error) throw error;

      if (!data) {
        toast.error("Contest not found");
        navigate("/contests");
        return;
      }

      // Properly format dates to preserve exact times from database
      const startDate = data.start_date
        ? toDatetimeLocal(new Date(data.start_date))
        : toDatetimeLocal(new Date());

      const endDate = data.end_date
        ? toDatetimeLocal(new Date(data.end_date))
        : toDatetimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

      const numWinners = data.num_winners || 5;
      const prizePerWinner = data.prize_per_winner || 2000;
      
      setConfig({
        id: data.id,
        name: data.name || "",
        description: data.description || "",
        cover_image: data.cover_image || "",
        start_date: startDate,
        end_date: endDate,
        num_winners: numWinners,
        prize_per_winner: prizePerWinner,
        prize_tier: data.prize_per_winner ? "monetary" : "non-monetary",
        total_prize: data.total_prize || 5000,
        music_category: data.music_category || "",
        prize_titles:
          (data.prize_titles as unknown as PrizeTitle[]) ||
          DEFAULT_PRIZE_TITLES.map((title, index) => ({
            rank: index + 1,
            title,
          })),
        prize_amounts: Array(numWinners).fill(prizePerWinner),
        created_by: data.created_by,
        status: (data.status as string) || "draft",
      });

      setIsDraft(data.status === "draft");
    } catch (error) {
      console.error("Error fetching contest:", error);
      toast.error("Failed to load contest data");
      navigate("/contests");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    setUploadingImage(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `cover-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("leaderboard-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("leaderboard-images").getPublicUrl(filePath);

      setConfig((prev) => ({
        ...prev,
        cover_image: publicUrl,
      }));

      toast.success("Cover image uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setConfig((prev) => ({
      ...prev,
      cover_image: "",
    }));
    setImagePosition({ x: 50, y: 50 });
  };

  const handleImagePositionChange = (
    direction: "up" | "down" | "left" | "right"
  ) => {
    setImagePosition((prev) => {
      const step = 5;
      switch (direction) {
        case "up":
          return { ...prev, y: Math.max(0, prev.y - step) };
        case "down":
          return { ...prev, y: Math.min(100, prev.y + step) };
        case "left":
          return { ...prev, x: Math.max(0, prev.x - step) };
        case "right":
          return { ...prev, x: Math.min(100, prev.x + step) };
        default:
          return prev;
      }
    });
  };

  const handleNext = () => {
    if (step === "get-started" && !config.music_category) {
      toast.error("Please select a music category");
      return;
    }

    const currentIndex = STEPS.findIndex((s) => s.id === step);
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1].id);
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.findIndex((s) => s.id === step);
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1].id);
      window.scrollTo(0, 0);
    }
  };

  const handleUpdatePrizeTitle = (index: number, title: string) => {
    setConfig((prev) => ({
      ...prev,
      prize_titles: prev.prize_titles.map((pt, i) =>
        i === index ? { ...pt, title } : pt
      ),
    }));
  };

  const handleUpdateNumWinners = (newNum: number) => {
    const currentTitles = [...config.prize_titles];
    const currentAmounts = [...config.prize_amounts];

    if (newNum > currentTitles.length) {
      for (let i = currentTitles.length; i < newNum; i++) {
        currentTitles.push({
          rank: i + 1,
          title: `Winner ${i + 1}`,
        });
        currentAmounts.push(config.prize_per_winner);
      }
    } else if (newNum < currentTitles.length) {
      currentTitles.splice(newNum);
      currentAmounts.splice(newNum);
    }

    setConfig((prev) => ({
      ...prev,
      num_winners: newNum,
      prize_titles: currentTitles,
      prize_amounts: currentAmounts,
    }));
  };

  const handleUpdatePrizeAmount = (index: number, amount: number) => {
    setConfig((prev) => ({
      ...prev,
      prize_amounts: prev.prize_amounts.map((amt, i) =>
        i === index ? amount : amt
      ),
    }));
  };

  const handleSaveDraft = async () => {
    if (!config.music_category) {
      toast.error("Please select a music category");
      return;
    }
    const { created_by } = config;
    if (!created_by) {
      toast.error("You must be logged in to save a draft.");
      return;
    }

    setLoading(true);
    try {
      const { prize_tier, ...raw } = config;

      // Create proper date objects - preserve exact times
      const startDate = new Date(raw.start_date || Date.now());
      const endDate = new Date(raw.end_date || Date.now());

      // No automatic adjustment to end of day - preserve user's selected time

      const dataToSave = {
        ...raw,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };
      const { error } = await supabase.from("contests").upsert({
        ...dataToSave,
        created_by,
        status: "draft",
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setIsDraft(true);
      toast.success("Draft saved successfully");
      navigate("/contests");
    } catch (error: any) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!config.music_category) {
      toast.error("Please select a music category");
      return;
    }
    const { created_by } = config;
    if (!created_by) {
      toast.error("You must be logged in to publish a contest.");
      return;
    }

    setLoading(true);
    try {
      const { prize_tier, ...raw } = config;

      // Create proper date objects - preserve exact times
      const startDate = new Date(raw.start_date || Date.now());
      const endDate = new Date(raw.end_date || Date.now());

      // No automatic adjustment to end of day - preserve user's selected time

      const dataToSave = {
        ...raw,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      };
      const { error } = await supabase.from("contests").upsert({
        ...dataToSave,
        created_by,
        status: "active",
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      toast.success("Contest published successfully");
      navigate("/contests");
    } catch (error: any) {
      console.error("Error publishing contest:", error);
      toast.error("Failed to publish contest");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteContest = async () => {
    if (!contestId) {
      toast.error("Contest ID not found");
      return;
    }

    if (
      !confirm(
        "Are you sure you want to delete this contest? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("contests")
        .delete()
        .eq("id", contestId);

      if (error) throw error;

      toast.success("Contest deleted successfully");
      navigate("/contests");
    } catch (error: any) {
      console.error("Error deleting contest:", error);
      toast.error("Failed to delete contest");
    } finally {
      setLoading(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center px-8">
            {STEPS.map((stepConfig, index) => (
              <React.Fragment key={stepConfig.id}>
                <ProgressStep
                  isActive={step === stepConfig.id}
                  isCompleted={STEPS.findIndex((s) => s.id === step) > index}
                  label={stepConfig.label}
                />
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Contest Status Display */}
          {contestId && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {config.name || 'Unnamed Contest'}
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(calculateContestStatus(config))}`}>
                    {getStatusLabel(calculateContestStatus(config))}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {calculateContestStatus(config) === 'ended' && (
                    <span className="text-red-600 font-medium">
                      This contest has ended
                    </span>
                  )}
                  {calculateContestStatus(config) === 'active' && (
                    <span className="text-green-600 font-medium">
                      Contest is currently active
                    </span>
                  )}
                  {calculateContestStatus(config) === 'draft' && new Date(config.start_date) > new Date() && (
                    <span className="text-blue-600 font-medium">
                      Contest will start on {new Date(config.start_date).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="p-4">
            {step === "get-started" && (
              <div>
                <h2 className="text-xl font-bold mb-6">
                  Customize your contest
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contest Name
                    </label>
                    <input
                      type="text"
                      value={config.name}
                      onChange={(e) =>
                        setConfig((prev) => ({ ...prev, name: e.target.value }))
                      }
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      placeholder="Enter contest name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Music Category
                    </label>
                    <select
                      value={config.music_category}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          music_category: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                      required
                    >
                      <option value="">Select a category</option>
                      {MUSIC_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cover Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg">
                      {config.cover_image ? (
                        <div className="relative">
                          <div
                            className="w-full h-48 rounded-lg overflow-hidden"
                            style={{
                              position: "relative",
                            }}
                          >
                            <div
                              className="w-full h-full bg-cover bg-no-repeat"
                              style={{
                                backgroundImage: `url(${config.cover_image})`,
                                backgroundPosition: `${imagePosition.x}% ${imagePosition.y}%`,
                                transition: "background-position 0.3s ease",
                              }}
                            />
                          </div>

                          {/* Image Controls */}
                          <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2">
                            <div className="grid grid-cols-3 gap-1">
                              <button
                                className="p-2 hover:bg-gray-100 rounded-md"
                                onClick={() =>
                                  handleImagePositionChange("left")
                                }
                              >
                                <Move className="h-4 w-4 rotate-180" />
                              </button>
                              <button
                                className="p-2 hover:bg-gray-100 rounded-md"
                                onClick={() => handleImagePositionChange("up")}
                              >
                                <Move className="h-4 w-4 -rotate-90" />
                              </button>
                              <button
                                className="p-2 hover:bg-gray-100 rounded-md"
                                onClick={() =>
                                  handleImagePositionChange("right")
                                }
                              >
                                <Move className="h-4 w-4" />
                              </button>
                              <div className="p-1" />
                              <button
                                className="p-2 hover:bg-gray-100 rounded-md"
                                onClick={() =>
                                  handleImagePositionChange("down")
                                }
                              >
                                <Move className="h-4 w-4 rotate-90" />
                              </button>
                              <div className="p-1" />
                            </div>
                          </div>

                          <button
                            onClick={handleRemoveImage}
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-100"
                          >
                            <X className="h-5 w-5 text-gray-600" />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer block p-6">
                          <div className="text-center">
                            <div className="flex flex-col items-center">
                              {uploadingImage ? (
                                <Loader2 className="h-12 w-12 text-gray-400 mb-4 animate-spin" />
                              ) : (
                                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                              )}
                              <p className="text-gray-600">
                                Drag, drop or browse thumbnail
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                Max file size: 5MB
                              </p>
                            </div>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage}
                            />
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "create-brief" && (
              <div>
                <h2 className="text-xl font-bold mb-6">Create Brief</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={config.description}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 min-h-[120px]"
                      placeholder="Describe your contest requirements and goals..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={config.start_date}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            start_date: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        min={new Date().toISOString().slice(0, 16)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={config.end_date}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            end_date: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                        min={config.start_date}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === "prize" && (
              <div>
                <h2 className="text-xl font-bold mb-6">Prize Distribution</h2>

                {/* Prize Type Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                  <div
                    className={`p-4 rounded-lg border cursor-pointer hover:border-blue-300 transition-colors ${
                      config.prize_tier === "non-monetary"
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200"
                    }`}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        prize_tier: "non-monetary",
                      }))
                    }
                  >
                    <div className="text-lg font-semibold mb-2">
                      Title Based
                    </div>
                    <div className="text-2xl font-bold mb-2">Title Rewards</div>
                    <p className="text-sm text-gray-600">
                      Award custom titles to winners
                    </p>
                  </div>

                  <div
                    className={`p-4 rounded-lg border cursor-pointer hover:border-blue-300 transition-colors ${
                      config.prize_tier === "monetary"
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200"
                    }`}
                    onClick={() =>
                      setConfig((prev) => ({ ...prev, prize_tier: "monetary" }))
                    }
                  >
                    <div className="text-lg font-semibold mb-2">
                      Money Based
                    </div>
                    <div className="text-2xl font-bold mb-2">
                      Custom Prize Pool
                    </div>
                    <p className="text-sm text-gray-600">
                      Set custom monetary prizes for each winner
                    </p>
                  </div>
                </div>

                {/* Winners Distribution */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Winners
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          handleUpdateNumWinners(
                            Math.max(1, config.num_winners - 1)
                          )
                        }
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        disabled={config.num_winners <= 1}
                      >
                        -
                      </button>
                      <span className="text-lg font-medium w-12 text-center">
                        {config.num_winners}
                      </span>
                      <button
                        onClick={() =>
                          handleUpdateNumWinners(
                            Math.min(10, config.num_winners + 1)
                          )
                        }
                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                        disabled={config.num_winners >= 10}
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Minimum 1, maximum 10 winners
                    </p>
                  </div>

                  {/* Prize Distribution Table */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      {config.prize_tier === "non-monetary"
                        ? "Prize Titles"
                        : "Prize Distribution"}
                    </h3>

                    <div className="space-y-4">
                      {config.prize_tier === "non-monetary"
                        ? config.prize_titles.map((prizeTitle, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4"
                            >
                              <div className="w-24 text-sm font-medium text-gray-600">
                                Rank {index + 1}
                              </div>
                              <input
                                type="text"
                                value={prizeTitle.title}
                                onChange={(e) =>
                                  handleUpdatePrizeTitle(index, e.target.value)
                                }
                                className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                placeholder={`Enter title for rank ${
                                  index + 1
                                }`}
                              />
                            </div>
                          ))
                        : config.prize_titles.map((prizeTitle, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-4"
                            >
                              <div className="w-24 text-sm font-medium text-gray-600">
                                Rank {index + 1}
                              </div>
                              <div className="flex-1 flex items-center gap-2">
                                <span className="text-gray-500">$</span>
                                <input
                                  type="number"
                                  value={config.prize_amounts[index] || 0}
                                  onChange={(e) =>
                                    handleUpdatePrizeAmount(
                                      index,
                                      parseInt(e.target.value) || 0
                                    )
                                  }
                                  className="flex-1 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400"
                                  placeholder="Enter prize amount"
                                  min="0"
                                />
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBack}
                  className={`px-6 py-2 rounded-md border border-gray-300 hover:bg-gray-50 ${
                    step === "get-started" ? "invisible" : ""
                  }`}
                >
                  Back
                </button>

                {contestId && (
                  <button
                    onClick={handleDeleteContest}
                    className="px-6 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Contest
                  </button>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleSaveDraft}
                  className="px-6 py-2 rounded-md border border-blue-500 text-blue-600 hover:bg-blue-50"
                >
                  Save Draft
                </button>

                {step === "prize" ? (
                  <button
                    onClick={handleFinish}
                    className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Finish
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
