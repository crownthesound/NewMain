import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Play, Loader2, Volume2, VolumeX } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useRealtimeData } from '../hooks/useRealtimeData';

interface VideoLink {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  username: string;
  views: number;
  likes: number;
  video_url?: string;
  video_type: 'tiktok' | 'upload';
  embed_code?: string;
}

export function VideoCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    skipSnaps: false,
    dragFree: false
  });

  const [videos, setVideos] = useState<VideoLink[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [coverLoaded, setCoverLoaded] = useState<{[key: string]: boolean}>({});
  const [videoLoaded, setVideoLoaded] = useState<{[key: string]: boolean}>({});
  const [isMuted, setIsMuted] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const fetchVideos = async () => {
    try {
      setError(null);
      const { data, error: supabaseError } = await supabase
        .from('video_links')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('Supabase error:', supabaseError);
        throw new Error(supabaseError.message);
      }

      if (!data) {
        throw new Error('No data received from Supabase');
      }

      // Ensure all videos have valid thumbnails
      const processedVideos = data.map(video => ({
        ...video,
        thumbnail: video.thumbnail || 'https://images.pexels.com/photos/7500307/pexels-photo-7500307.jpeg'
      }));

      setVideos(processedVideos);

      // Initialize loading states
      const initialLoadState = processedVideos.reduce((acc, video) => ({
        ...acc,
        [video.id]: false
      }), {});
      setCoverLoaded(initialLoadState);
      setVideoLoaded(initialLoadState);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load videos';
      console.error('Error fetching videos:', error);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    // Listen for refresh events
    const handleRefresh = () => {
      fetchVideos();
    };

    window.addEventListener('refreshVideoCarousel', handleRefresh);

    return () => {
      window.removeEventListener('refreshVideoCarousel', handleRefresh);
    };
  }, []);

  // Set up real-time updates
  useRealtimeData({
    eventName: 'videoUpdate',
    onUpdate: () => {
      fetchVideos();
    }
  });

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);

    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  const handleCoverLoad = (videoId: string) => {
    setCoverLoaded(prev => ({
      ...prev,
      [videoId]: true
    }));
  };

  const handleVideoLoad = (videoId: string) => {
    setVideoLoaded(prev => ({
      ...prev,
      [videoId]: true
    }));
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    
    // Handle muting for TikTok videos
    const tiktokIframe = document.querySelector('iframe[src*="tiktok.com"]') as HTMLIFrameElement;
    if (tiktokIframe) {
      // Send mute/unmute message to TikTok iframe
      tiktokIframe.contentWindow?.postMessage(
        JSON.stringify({
          action: isMuted ? 'unmute' : 'mute'
        }),
        '*'
      );
    }

    // Handle muting for uploaded videos
    const videoElement = document.querySelector('video') as HTMLVideoElement;
    if (videoElement) {
      videoElement.muted = !isMuted;
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[448px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-white/60" />
          <p className="mt-2 text-white/60">Loading videos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[448px]">
        <div className="text-center">
          <p className="text-red-500">Error: {error}</p>
          <button 
            onClick={fetchVideos}
            className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-[448px]">
        <div className="text-center">
          <p className="text-white/60">No videos available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative max-w-7xl mx-auto w-full">
      <div className="overflow-hidden w-full" ref={emblaRef}>
        <div className="flex">
          {videos.map((video, index) => {
            const isSelected = index === selectedIndex;
            const scale = isSelected ? 1 : 0.85;
            const opacity = isSelected ? 1 : 0.3;

            return (
              <div 
                key={video.id}
                className="flex-[0_0_100%] min-w-0 px-2 md:flex-[0_0_33.333%] lg:flex-[0_0_25%] flex items-center justify-center"
              >
                <div 
                  className="relative transition-all duration-300 ease-out group will-change-transform"
                  style={{
                    transform: `scale(${scale})`,
                    opacity,
                    width: '280px',
                    maxWidth: '100%'
                  }}
                >
                  <div 
                    className="relative bg-black rounded-2xl overflow-hidden"
                    style={{ aspectRatio: '9/16' }}
                  >
                    {/* Loading Placeholder */}
                    {!coverLoaded[video.id] && (
                      <div className="absolute inset-0 bg-black flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-white/60" />
                      </div>
                    )}

                    {/* Thumbnail */}
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                        isSelected && videoLoaded[video.id] ? 'opacity-0' : 'opacity-100'
                      }`}
                      loading={isSelected ? 'eager' : 'lazy'}
                      onLoad={() => handleCoverLoad(video.id)}
                    />

                    {/* Video Content */}
                    {isSelected && (
                      <div className="absolute inset-0">
                        {video.video_type === 'upload' && video.video_url ? (
                          <video
                            src={video.video_url}
                            className={`w-full h-full object-cover rounded-2xl transition-opacity duration-700 ${
                              videoLoaded[video.id] ? 'opacity-100' : 'opacity-0'
                            }`}
                            autoPlay
                            loop
                            muted={isMuted}
                            playsInline
                            controls={false}
                            onLoadedData={() => handleVideoLoad(video.id)}
                          />
                        ) : video.video_type === 'tiktok' && video.embed_code ? (
                          <div 
                            className={`tiktok-clean-container transition-opacity duration-700 ${
                              videoLoaded[video.id] ? 'opacity-100' : 'opacity-0'
                            }`}
                            onLoad={() => handleVideoLoad(video.id)}
                            dangerouslySetInnerHTML={{ 
                              __html: video.embed_code
                            }}
                          />
                        ) : null}
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

                    {/* Video Info */}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="space-y-1">
                        <h3 className="text-sm sm:text-base font-medium text-white line-clamp-1">
                          {video.title}
                        </h3>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-white/60">
                          <span>@{video.username}</span>
                          <span>•</span>
                          <span>{formatNumber(video.views)} views</span>
                        </div>
                      </div>
                    </div>

                    {/* Mute Button */}
                    {isSelected && (
                      <button
                        onClick={toggleMute}
                        className="absolute bottom-4 right-4 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/60 transition-colors"
                      >
                        {isMuted ? (
                          <VolumeX className="h-4 w-4" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={scrollPrev}
        className="absolute left-2 sm:left-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
      >
        <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>

      <button
        onClick={scrollNext}
        className="absolute right-2 sm:right-8 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-30"
      >
        <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6" />
      </button>
    </div>
  );
}