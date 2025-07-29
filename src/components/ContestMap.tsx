import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker } from 'react-map-gl';
import { Crown, ArrowRight, ChevronDown, ChevronUp, X } from 'lucide-react';
import 'mapbox-gl/dist/mapbox-gl.css';

interface Contest {
  id: string;
  name: string;
  description: string;
  cover_image: string;
  start_date: string;
  end_date: string;
  location?: {
    lat: number;
    lng: number;
    city: string;
    country: string;
  };
}

interface ContestMapProps {
  contests: Contest[];
  onContestClick: (contestId: string) => void;
  className?: string;
  isExpandable?: boolean;
}

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY3Jvd250aGVzb3VuZCIsImEiOiJjbTlveG45ZmkweHVqMmpweDEzMnF1bzFnIn0.R6cqCawfyVkMXdm30dPQag';

const INITIAL_VIEW_STATE = {
  latitude: 20,
  longitude: 0,
  zoom: 1.5,
  bearing: 0,
  pitch: 45
};

export function ContestMap({ contests, onContestClick, className = "h-[40vh] sm:h-[50vh] lg:h-[60vh]", isExpandable = false }: ContestMapProps) {
  const [popupInfo, setPopupInfo] = useState<Contest | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const mapRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserver = useRef<ResizeObserver | null>(null);
  const resizeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Handle viewport resize with ResizeObserver
  useEffect(() => {
    const handleResize = (entries: ResizeObserverEntry[]) => {
      const entry = entries[0];
      if (!entry) return;

      // Clear existing timeout
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }

      // Set a new timeout to debounce the resize handling
      resizeTimeout.current = setTimeout(() => {
        const containerWidth = entry.contentRect.width;
        const containerHeight = entry.contentRect.height;
        const aspectRatio = containerWidth / containerHeight;
        
        // Adjust zoom based on container size
        const baseZoom = Math.min(2, Math.max(1.5, Math.log2(containerWidth / 320)));
        
        // Adjust center based on aspect ratio
        const newLongitude = aspectRatio > 1.5 ? 10 : 0;

        if (mapRef.current) {
          mapRef.current.resize();
          
          // Only update view state if not showing popup
          if (!popupInfo) {
            setViewState(prev => ({
              ...prev,
              zoom: baseZoom,
              longitude: newLongitude
            }));
          }
        }
      }, 100); // 100ms debounce
    };

    // Initialize ResizeObserver
    resizeObserver.current = new ResizeObserver(handleResize);
    
    if (containerRef.current) {
      resizeObserver.current.observe(containerRef.current);
    }

    return () => {
      if (resizeObserver.current) {
        resizeObserver.current.disconnect();
      }
      if (resizeTimeout.current) {
        clearTimeout(resizeTimeout.current);
      }
    };
  }, [popupInfo]);

  const handleMarkerClick = useCallback((contest: Contest) => {
    setPopupInfo(contest);
    if (contest.location) {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const zoom = Math.min(2, Math.max(1.5, Math.log2(containerWidth / 320)));
      const pitch = 45;
      
      mapRef.current?.flyTo({
        center: [contest.location.lng, contest.location.lat],
        zoom: zoom,
        duration: 2000,
        pitch: pitch
      });
    }
  }, []);

  const handleClosePopup = () => {
    setPopupInfo(null);
    setIsExpanded(false);
    mapRef.current?.flyTo({
      ...viewState,
      duration: 2000
    });
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded && popupInfo?.location) {
      const containerWidth = containerRef.current?.offsetWidth || 0;
      const zoom = Math.min(3, Math.max(2, Math.log2(containerWidth / 320)));
      
      mapRef.current?.flyTo({
        center: [popupInfo.location.lng, popupInfo.location.lat],
        zoom: zoom,
        duration: 1500,
        pitch: 60
      });
    } else {
      mapRef.current?.flyTo({
        ...viewState,
        duration: 1500
      });
    }
  };

  // Mock locations for demo
  const mockLocations = [
    { lat: 40.7128, lng: -74.0060, city: 'New York', country: 'USA' },
    { lat: 51.5074, lng: -0.1278, city: 'London', country: 'UK' },
    { lat: 35.6762, lng: 139.6503, city: 'Tokyo', country: 'Japan' },
    { lat: -33.8688, lng: 151.2093, city: 'Sydney', country: 'Australia' },
    { lat: 48.8566, lng: 2.3522, city: 'Paris', country: 'France' }
  ];

  // Assign mock locations to contests
  const contestsWithLocations = contests.map((contest, index) => ({
    ...contest,
    location: mockLocations[index % mockLocations.length]
  }));

  return (
    <div 
      ref={containerRef}
      className={`
        w-full relative rounded-2xl overflow-hidden border border-white/10 transition-all duration-700
        ${isExpanded 
          ? 'fixed inset-0 z-20 rounded-none border-none' 
          : className
        }
      `}
    >
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/crownthesound/cm9oxp51x006401sshoju1e7o"
        style={{ width: '100%', height: '100%' }}
        projection="globe"
        dragRotate={!popupInfo}
        dragPan={!popupInfo}
        scrollZoom={!popupInfo}
        touchZoom={!popupInfo}
        touchRotate={!popupInfo}
        doubleClickZoom={!popupInfo}
        keyboard={!popupInfo}
        minPitch={0}
        maxPitch={60}
        minZoom={1}
        maxZoom={3}
        reuseMaps
      >
        {contestsWithLocations.map((contest) => (
          <Marker
            key={contest.id}
            longitude={contest.location?.lng || 0}
            latitude={contest.location?.lat || 0}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(contest);
            }}
          >
            <div className="relative group cursor-pointer">
              <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl group-hover:bg-white/30 transition-all duration-500 animate-pulse"></div>
              <div className="relative w-8 h-8 bg-black/80 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center transform-gpu group-hover:scale-110 transition-all duration-500">
                <Crown className="h-4 w-4 text-white group-hover:text-yellow-400 transition-colors duration-500" />
              </div>
            </div>
          </Marker>
        ))}

        {popupInfo && (
          <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center p-4">
            <div 
              className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden pointer-events-auto transform-gpu hover:scale-[1.02] transition-all duration-500 max-w-[185px] w-full shadow-2xl"
            >
              {popupInfo.cover_image && (
                <div className="relative aspect-video">
                  <img
                    src={popupInfo.cover_image}
                    alt={popupInfo.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                </div>
              )}
              
              <div className="p-2">
                <h3 className="text-xs font-bold text-white mb-1">{popupInfo.name}</h3>
                <p className="text-white/80 text-[9px] mb-2 line-clamp-3">
                  {popupInfo.description}
                </p>
                {isExpandable && (
                  <button
                    onClick={toggleExpand}
                    className="w-full bg-white/10 hover:bg-white/20 text-white py-0.5 rounded-lg transition-colors text-[9px] mb-1.5 flex items-center justify-center gap-1"
                  >
                    <span>{isExpanded ? 'Show Less' : 'Show More'}</span>
                    {isExpanded ? (
                      <ChevronUp className="h-2 w-2" />
                    ) : (
                      <ChevronDown className="h-2 w-2" />
                    )}
                  </button>
                )}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onContestClick(popupInfo.id)}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-0.5 rounded-lg transition-colors text-[9px]"
                  >
                    View Details
                  </button>
                  <button
                    onClick={handleClosePopup}
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white py-0.5 rounded-lg transition-colors text-[9px] flex items-center justify-center gap-1 group"
                  >
                    <span>Close</span>
                    <ArrowRight className="h-2 w-2 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Map>

      {/* Map Overlay */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none"></div>

      {/* Close button when expanded */}
      {isExpanded && (
        <button
          onClick={toggleExpand}
          className="absolute top-4 right-4 p-2 bg-black/80 backdrop-blur-sm rounded-full border border-white/20 text-white hover:bg-black/60 transition-colors z-30"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}