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
  Link as LinkIcon,
  Image,
  Calendar,
  Video,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

interface VideoLink {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  username: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  active: boolean;
  created_at: string;
  video_url?: string;
  duration?: number;
  size?: number;
  video_type: "tiktok" | "upload";
}

interface Contest {
  id: string;
  name: string;
  end_date: string;
  status: string;
}

export function AdminPage() {
  const [videos, setVideos] = useState<VideoLink[]>([]);
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({
    video: 0,
    thumbnail: 0,
  });
  const [showExtendTime, setShowExtendTime] = useState<string | null>(null);
  const [extensionDays, setExtensionDays] = useState(7);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [newVideo, setNewVideo] = useState({
    title: "",
    username: "",
    videoFile: null as File | null,
    thumbnailFile: null as File | null,
    thumbnailPreview: "",
  });

  useEffect(() => {
    fetchVideos();
    fetchContests();
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setCurrentUser(session.user.id);
      }
    } catch (error) {
      console.error("Error getting current user:", error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("video_links")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error("Error fetching videos:", error);
      toast.error("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  const fetchContests = async () => {
    try {
      const { data, error } = await supabase
        .from("contests")
        .select("id, name, end_date, status")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContests(data || []);
    } catch (error) {
      console.error("Error fetching contests:", error);
      toast.error("Failed to load contests");
    }
  };

  const handleExtendTime = async (contestId: string) => {
    if (!extensionDays || extensionDays < 1) {
      toast.error("Please enter a valid number of days");
      return;
    }

    try {
      const contest = contests.find((c) => c.id === contestId);
      if (!contest) return;

      const currentEndDate = new Date(contest.end_date);
      const newEndDate = new Date(
        currentEndDate.getTime() + extensionDays * 24 * 60 * 60 * 1000
      );

      const { error } = await supabase
        .from("contests")
        .update({
          end_date: newEndDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", contestId);

      if (error) throw error;

      setContests(
        contests.map((c) =>
          c.id === contestId ? { ...c, end_date: newEndDate.toISOString() } : c
        )
      );

      toast.success(`Contest extended by ${extensionDays} days`);
      setShowExtendTime(null);
      setExtensionDays(7);
    } catch (error) {
      console.error("Error extending contest time:", error);
      toast.error("Failed to extend contest time");
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newVideo.videoFile ||
      !newVideo.thumbnailFile ||
      !newVideo.title ||
      !newVideo.username
    ) {
      toast.error(
        "Please fill in all fields and select both video and thumbnail files"
      );
      return;
    }

    setProcessing(true);
    try {
      // Upload thumbnail
      const thumbnailFileName = `${Date.now()}-${newVideo.thumbnailFile.name}`;
      const { error: thumbnailError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailFileName, newVideo.thumbnailFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (thumbnailError) throw thumbnailError;

      // Get thumbnail URL
      const {
        data: { publicUrl: thumbnailUrl },
      } = supabase.storage.from("thumbnails").getPublicUrl(thumbnailFileName);

      // Upload video file
      const videoFileName = `${Date.now()}-${newVideo.videoFile.name}`;
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, newVideo.videoFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (videoError) throw videoError;

      // Get video URL
      const {
        data: { publicUrl: videoUrl },
      } = supabase.storage.from("videos").getPublicUrl(videoFileName);

      // Create video entry
      if (!currentUser) {
        throw new Error("User not authenticated");
      }

      const { error: dbError } = await supabase.from("video_links").insert([
        {
          title: newVideo.title,
          username: newVideo.username,
          url: videoUrl,
          thumbnail: thumbnailUrl,
          views: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          active: true,
          video_url: videoUrl,
          video_type: "upload",
          size: newVideo.videoFile.size,
          created_by: currentUser,
          is_public: true,
        },
      ]);

      if (dbError) throw dbError;

      toast.success("Video added successfully");
      setShowAddForm(false);
      setNewVideo({
        title: "",
        username: "",
        videoFile: null,
        thumbnailFile: null,
        thumbnailPreview: "",
      });
      fetchVideos();
    } catch (error: any) {
      console.error("Error adding video:", error);
      toast.error(error.message || "Failed to add video");
    } finally {
      setProcessing(false);
      setUploadProgress({ video: 0, thumbnail: 0 });
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Thumbnail must be less than 5MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNewVideo((prev) => ({
        ...prev,
        thumbnailFile: file,
        thumbnailPreview: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleToggleVisibility = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("video_links")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      setVideos(
        videos.map((video) =>
          video.id === id ? { ...video, active: !currentStatus } : video
        )
      );

      toast.success(`Video ${currentStatus ? "hidden" : "shown"} successfully`);
    } catch (error) {
      console.error("Error updating video visibility:", error);
      toast.error("Failed to update video visibility");
    }
  };

  const handleDelete = async (id: string) => {
    if (videos.length <= 3) {
      toast.error("Cannot delete: Minimum of 3 videos must be maintained");
      return;
    }

    if (!confirm("Are you sure you want to delete this video?")) {
      return;
    }

    try {
      const video = videos.find((v) => v.id === id);
      if (video?.video_url) {
        const fileName = video.video_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("videos").remove([fileName]);
        }
      }

      const { error } = await supabase
        .from("video_links")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setVideos(videos.filter((video) => video.id !== id));
      toast.success("Video deleted successfully");
    } catch (error) {
      console.error("Error deleting video:", error);
      toast.error("Failed to delete video");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getTimeLeft = (endDate: string) => {
    const end = new Date(endDate).getTime();
    const now = new Date().getTime();
    const distance = end - now;

    if (distance < 0) return "Ended";

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );

    return `${days}d ${hours}h left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white/60" />
          <p className="mt-2 text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#2A2A2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Contests Section */}
        {/* <div className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">
            Active Contests
          </h2>
          <div className="grid gap-4">
            {contests
              .filter((contest) => contest.status === "active")
              .map((contest) => (
                <div
                  key={contest.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-white mb-1">
                        {contest.name}
                      </h3>
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Clock className="h-4 w-4" />
                        <span>{getTimeLeft(contest.end_date)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/l/${contest.id}`}
                        target="_blank"
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Globe className="h-5 w-5" />
                      </Link>
                      <button
                        onClick={() => setShowExtendTime(contest.id)}
                        className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Calendar className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div> */}

        {/* Videos Section */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Video Management</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
          >
            <PlusCircle className="h-5 w-5" />
            <span>Add Video</span>
          </button>
        </div>

        {videos.length <= 3 && (
          <div className="mb-6 p-4 bg-yellow-900/20 backdrop-blur-sm border border-yellow-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-yellow-500">
              <AlertTriangle className="h-5 w-5" />
              <p className="text-sm">
                A minimum of 3 videos must be maintained. You cannot delete
                videos when only 3 remain.
              </p>
            </div>
          </div>
        )}

        {/* Video Grid */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Video
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Stats
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/40 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/40 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-white/5">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-white/5">
                          {video.thumbnail ? (
                            <img
                              src={video.thumbnail}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-8 w-8 text-white/20" />
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {video.title}
                          </div>
                          <div className="text-sm text-white/60">
                            @{video.username}
                          </div>
                          <div className="text-xs text-white/40 mt-1">
                            {formatDate(video.created_at)}
                          </div>
                          {video.size && (
                            <div className="text-xs text-white/40">
                              Size: {formatFileSize(video.size)}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {video.views.toLocaleString()}
                          </div>
                          <div className="text-sm text-white/60">Views</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {video.likes.toLocaleString()}
                          </div>
                          <div className="text-sm text-white/60">Likes</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          video.active
                            ? "bg-green-500/20 text-green-500"
                            : "bg-white/10 text-white/60"
                        }`}
                      >
                        {video.active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {video.video_url && (
                          <a
                            href={video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="View video"
                          >
                            <LinkIcon className="h-5 w-5" />
                          </a>
                        )}
                        <button
                          onClick={() =>
                            handleToggleVisibility(video.id, video.active)
                          }
                          className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title={video.active ? "Hide video" : "Show video"}
                        >
                          {video.active ? (
                            <EyeOff className="h-5 w-5" />
                          ) : (
                            <Eye className="h-5 w-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(video.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            videos.length > 3
                              ? "text-white/60 hover:text-red-500 hover:bg-white/10"
                              : "cursor-not-allowed opacity-50"
                          }`}
                          title={
                            videos.length > 3
                              ? "Delete video"
                              : "Cannot delete: Minimum 3 videos required"
                          }
                          disabled={videos.length <= 3}
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Extend Time Modal */}
      {showExtendTime && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1A1A1A] rounded-xl border border-white/10 shadow-xl max-w-md w-full">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Extend Contest Duration
              </h3>
              <button
                onClick={() => setShowExtendTime(null)}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-white/60" />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">
                    Extension Period (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={extensionDays}
                    onChange={(e) =>
                      setExtensionDays(parseInt(e.target.value) || 0)
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-white/10 bg-white/5">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowExtendTime(null)}
                  className="px-4 py-2 border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleExtendTime(showExtendTime)}
                  className="px-4 py-2 bg-white text-black rounded-lg hover:bg-white/90 transition-colors font-medium"
                >
                  Extend Time
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div
            className="bg-[#0A0A0A] rounded-2xl border border-white/10 shadow-xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto"
            style={{ maxWidth: "min(90vw, 640px)" }}
          >
            <div className="p-4 sm:p-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Add New Video</h2>
                <button
                  onClick={() => setShowAddForm(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <form onSubmit={handleAddVideo} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Video Title
                  </label>
                  <input
                    type="text"
                    value={newVideo.title}
                    onChange={(e) =>
                      setNewVideo({ ...newVideo, title: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Enter video title"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Creator Username
                  </label>
                  <input
                    type="text"
                    value={newVideo.username}
                    onChange={(e) =>
                      setNewVideo({ ...newVideo, username: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    placeholder="Enter creator username"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Video File (MP4)
                  </label>
                  <input
                    type="file"
                    accept="video/mp4"
                    onChange={(e) =>
                      setNewVideo({
                        ...newVideo,
                        videoFile: e.target.files?.[0] || null,
                      })
                    }
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                    required
                  />
                  <p className="mt-2 text-sm text-white/60">
                    Maximum file size: 500MB
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/60 mb-2">
                    Thumbnail Image
                  </label>
                  <div className="space-y-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20"
                      required
                    />
                    {newVideo.thumbnailPreview && (
                      <div className="relative aspect-video w-full max-w-xs mx-auto">
                        <img
                          src={newVideo.thumbnailPreview}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <p className="text-sm text-white/60">
                      Maximum file size: 5MB
                    </p>
                  </div>
                </div>

                {(uploadProgress.video > 0 || uploadProgress.thumbnail > 0) && (
                  <div className="space-y-2">
                    {uploadProgress.video > 0 && uploadProgress.video < 100 && (
                      <div>
                        <div className="flex justify-between text-sm text-white/60 mb-1">
                          <span>Uploading video...</span>
                          <span>{uploadProgress.video}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div
                            className="bg-white h-2 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress.video}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {uploadProgress.thumbnail > 0 &&
                      uploadProgress.thumbnail < 100 && (
                        <div>
                          <div className="flex justify-between text-sm text-white/60 mb-1">
                            <span>Uploading thumbnail...</span>
                            <span>{uploadProgress.thumbnail}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div
                              className="bg-white h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress.thumbnail}%` }}
                            />
                          </div>
                        </div>
                      )}
                  </div>
                )}
              </form>
            </div>

            <div className="p-4 sm:p-6 border-t border-white/10 bg-white/5">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2 border border-white/10 rounded-xl text-white hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddVideo}
                  disabled={processing}
                  className="px-6 py-2 bg-white text-black rounded-xl hover:bg-white/90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? (
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  ) : (
                    "Add Video"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
