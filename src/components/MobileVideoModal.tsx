import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface VideoData {
  id: string;
  title: string;
  url: string;
  video_url?: string | null;
  thumbnail: string;
  username: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  avatar_url?: string | null; // TikTok profile avatar
  tiktok_display_name?: string | null; // TikTok display name
  rank?: number | null; // Current rank in contest
}

interface MobileVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoData | null;
}

export const MobileVideoModal: React.FC<MobileVideoModalProps> = ({
  isOpen,
  onClose,
  video,
}) => {
  const [isMuted, setIsMuted] = useState(true);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const getRankDisplay = (rank: number | null) => {
    if (!rank) return null;

    const getRankSuffix = (num: number) => {
      if (num >= 11 && num <= 13) return 'th';
      switch (num % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };

    const rankText = `#${rank} ${rank}${getRankSuffix(rank)} Place`;
    
    // Color coding based on rank
    let bgColor = 'bg-white/20 border-white/30';
    let textColor = 'text-white';
    
    if (rank === 1) {
      bgColor = 'bg-gradient-to-r from-yellow-400 to-yellow-600 border-yellow-300';
      textColor = 'text-yellow-900';
    } else if (rank === 2) {
      bgColor = 'bg-gradient-to-r from-gray-300 to-gray-500 border-gray-200';
      textColor = 'text-gray-900';
    } else if (rank === 3) {
      bgColor = 'bg-gradient-to-r from-amber-600 to-amber-800 border-amber-400';
      textColor = 'text-amber-100';
    } else if (rank <= 10) {
      bgColor = 'bg-gradient-to-r from-blue-500 to-blue-700 border-blue-300';
      textColor = 'text-blue-100';
    }

    return (
      <div className={`px-3 py-2 rounded-lg backdrop-blur-sm border ${bgColor} ${textColor} font-bold text-sm shadow-lg`}>
        {rankText}
      </div>
    );
  };

  if (!isOpen || !video) return null;

  return (
    <div className="fixed inset-0 bg-black z-[100] flex items-center justify-center">
      {/* Video content */}
      {video.video_url ? (
        // Our stored video from Supabase
        <div className="flex items-center justify-center w-full h-full p-4 relative bg-black">
          <div className="relative max-w-sm w-full bg-black/90 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
            <video
              src={video.video_url}
              autoPlay
              muted={isMuted}
              playsInline
              loop
              className="w-full aspect-[9/16] object-cover rounded-2xl"
              onPlay={() => setIsMuted(false)}
            >
              Your browser does not support the video tag.
            </video>
            
            {/* Close button positioned in video corner */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-30 p-2 bg-black/60 backdrop-blur-sm rounded-full text-white hover:bg-black/80 transition-all duration-300 border border-white/10 hover:border-white/30 shadow-lg hover:shadow-xl transform hover:scale-110"
              aria-label="Close video"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Video Info Overlay - Inside Video Container */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
              {/* Ranking and Views */}
              <div className="flex items-center justify-between mb-3">
                {video.rank && (
                  <div className={`px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-md border ${
                    video.rank === 1 ? 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30' :
                    video.rank === 2 ? 'bg-gray-300/20 text-gray-300 border-gray-300/30' :
                    video.rank === 3 ? 'bg-amber-600/20 text-amber-600 border-amber-600/30' :
                    video.rank <= 10 ? 'bg-blue-400/20 text-blue-400 border-blue-400/30' :
                    'bg-black/40 text-white/90 border-white/20'
                  }`}>
                    Current Rank: #{video.rank}
                  </div>
                )}
                {video.views !== null && video.views !== undefined && (
                  <div className="text-white/90 text-xs font-medium bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                    {video.views.toLocaleString()} views
                  </div>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex items-center gap-2">
                {video.avatar_url ? (
                  <img
                    src={video.avatar_url}
                    alt={`${video.username} profile`}
                    className="w-8 h-8 rounded-full object-cover border border-white/20"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center border border-white/20">
                    <span className="text-white text-xs font-medium">
                      {(video.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-white/90 text-sm font-medium">
                    {video.tiktok_display_name || video.username || 'Unknown User'}
                  </p>
                  <p className="text-white/70 text-xs">
                    @{video.username || 'unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Fallback to TikTok iframe for full-screen
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-full max-w-sm h-full">
            <iframe
              src={`https://www.tiktok.com/embed/v2/${video.url.split('/').pop()}`}
              allow="encrypted-media; fullscreen"
              className="w-full h-full border-0"
              title={`TikTok video by ${video.username}`}
            />
          </div>
        </div>
      )}
      
      {/* Background tap to close */}
      <div 
        className="absolute inset-0 -z-10"
        onClick={onClose}
        aria-label="Close video"
      />
    </div>
  );
};