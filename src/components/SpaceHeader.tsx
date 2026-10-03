import React, { useState } from 'react';
import {
  Compass,
  Landmark,
  ShoppingBag,
  Heart,
  Flame,
  Briefcase,
  Sparkles,
  Plus,
  Maximize2,
  X,
  MapPin
} from 'lucide-react';
import { SpaceId } from '../types';
import { COMMUNITY_SPACES } from '../config/spaces';

interface SpaceHeaderProps {
  spaceId: SpaceId | 'all';
  postsCount: number;
  onOpenCreatePost: () => void;
}

export const SpaceHeader: React.FC<SpaceHeaderProps> = ({
  spaceId,
  postsCount,
  onOpenCreatePost,
}) => {
  const [showLightbox, setShowLightbox] = useState(false);

  // Cultural Village Celebration Image
  const villageImage = '/igede_village_banner.jpg';

  if (spaceId === 'all') {
    return (
      <div className="space-y-4">
        {/* Cultural Welcome Hero Banner */}
        <div className="relative rounded-3xl overflow-hidden border border-emerald-900/30 shadow-md bg-stone-900 group">
          {/* Main Visual Image */}
          <div className="relative h-56 sm:h-72 md:h-80 lg:h-96 w-full overflow-hidden">
            <img
              src={villageImage}
              alt="Welcome to LGEDE Village • Oju LGA, Benue State • We Celebrate Community & Culture"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-[1.02] transition-transform duration-500 cursor-pointer"
              onClick={() => setShowLightbox(true)}
            />

            {/* Gradient Darkening Overlay for Text Contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/40 to-black/20 pointer-events-none" />

            {/* Zoom Button in Corner */}
            <button
              onClick={() => setShowLightbox(true)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/50 hover:bg-black/75 text-white/90 hover:text-white backdrop-blur-xs transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
              title="View full picture"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Expand Photo</span>
            </button>

            {/* Village Sign Badge on Image */}
            <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-200 border border-emerald-500/30 backdrop-blur-xs text-xs font-semibold shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Oju LGA, Benue State</span>
            </div>

            {/* Hero Details Overlay at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600/80 text-white text-[11px] font-bold uppercase tracking-wider mb-2">
                <Sparkles className="w-3 h-3" />
                <span>Welcome to LGEDE Village</span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight leading-tight drop-shadow-md">
                lgede unity forum
              </h1>

              <p className="text-xs sm:text-sm text-stone-200 max-w-2xl mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none drop-shadow-xs">
                Celebrating community, cultural pride, and heritage. Connect with sons and daughters of Igede across Oju, Obi, and around the world.
              </p>

              {/* Action Buttons */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                <button
                  onClick={onOpenCreatePost}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Share an Update or Post</span>
                </button>

                <button
                  onClick={() => setShowLightbox(true)}
                  className="py-2 px-3.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-semibold text-xs backdrop-blur-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>View Village Picture</span>
                </button>

                <span className="text-xs text-emerald-200/90 font-medium ml-1">
                  {postsCount} active community {postsCount === 1 ? 'post' : 'posts'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Lightbox Modal for Photo */}
        {showLightbox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
              <button
                onClick={() => setShowLightbox(false)}
                className="absolute -top-10 sm:-top-12 right-0 p-2 text-white hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <X className="w-6 h-6" />
                <span className="text-xs font-semibold">Close</span>
              </button>

              <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
                <img
                  src={villageImage}
                  alt="Welcome to LGEDE Village • Oju LGA, Benue State"
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[80vh] object-contain bg-black"
                />
                <div className="p-3 bg-stone-950 text-white text-center text-xs">
                  <p className="font-bold text-emerald-300">
                    Welcome to LGEDE Village • Oju LGA, Benue State • We Celebrate Community & Culture
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    Authentic Igede cultural heritage attire, unity, and traditional music
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const space = COMMUNITY_SPACES[spaceId];
  if (!space) return null;

  const getSpaceIcon = (id: SpaceId) => {
    switch (id) {
      case 'oju':
        return <Landmark className="w-8 h-8 text-emerald-300" />;
      case 'obi':
        return <Compass className="w-8 h-8 text-teal-300" />;
      case 'market':
        return <ShoppingBag className="w-8 h-8 text-amber-300" />;
      case 'singles':
        return <Heart className="w-8 h-8 text-rose-300 fill-rose-300/30" />;
      case 'news':
        return <Flame className="w-8 h-8 text-red-300 fill-red-300/30" />;
      case 'jobs':
        return <Briefcase className="w-8 h-8 text-blue-300" />;
    }
  };

  const getGradient = (id: SpaceId) => {
    switch (id) {
      case 'oju':
        return 'from-emerald-900 to-teal-900';
      case 'obi':
        return 'from-teal-900 to-emerald-950';
      case 'market':
        return 'from-amber-950 via-stone-900 to-amber-900';
      case 'singles':
        return 'from-rose-950 via-stone-900 to-rose-900';
      case 'news':
        return 'from-red-950 via-stone-900 to-stone-950';
      case 'jobs':
        return 'from-blue-950 via-stone-900 to-blue-900';
    }
  };

  return (
    <div className="space-y-4">
      {/* If Oju Space, also showcase the village celebration picture */}
      {spaceId === 'oju' && (
        <div className="relative rounded-3xl overflow-hidden border border-emerald-900/30 shadow-sm bg-stone-900 h-44 sm:h-56 group cursor-pointer" onClick={() => setShowLightbox(true)}>
          <img
            src={villageImage}
            alt="Welcome to LGEDE Village, Oju LGA"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-black/20" />
          <div className="absolute bottom-3 left-4 text-white">
            <span className="px-2 py-0.5 rounded bg-emerald-900/80 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Oju LGA Cultural Heartland
            </span>
            <p className="text-sm font-bold mt-1 text-white drop-shadow-sm">
              Welcome to LGEDE Village • We Celebrate Community & Culture
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowLightbox(true);
            }}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Space Header Card */}
      <div className={`bg-gradient-to-r ${getGradient(spaceId)} text-white rounded-3xl p-6 shadow-sm relative overflow-hidden`}>
        <div className="flex items-start justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white">
                {space.badge}
              </span>
              <span className="text-xs text-white/70">
                {postsCount} {postsCount === 1 ? 'post' : 'posts'}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              {space.name}
            </h1>
            <p className="text-xs text-emerald-200 font-semibold mt-0.5">
              {space.tagline}
            </p>
            <p className="text-xs text-white/80 max-w-xl mt-1.5 leading-relaxed">
              {space.description}
            </p>

            <div className="mt-4">
              <button
                onClick={onOpenCreatePost}
                className="py-2 px-4 rounded-xl bg-white text-stone-900 font-bold text-xs shadow-md hover:bg-stone-100 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-800" />
                <span>
                  {spaceId === 'market'
                    ? 'Post Market Item'
                    : spaceId === 'jobs'
                    ? 'Post Job Opening'
                    : spaceId === 'news'
                    ? 'Report Breaking News'
                    : spaceId === 'singles'
                    ? 'Post Intro'
                    : `Post in ${space.name}`}
                </span>
              </button>
            </div>
          </div>

          <div className="hidden sm:flex p-3 rounded-2xl bg-white/10 shrink-0">
            {getSpaceIcon(spaceId)}
          </div>
        </div>
      </div>

      {/* Lightbox for Oju space view */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setShowLightbox(false)}
              className="absolute -top-10 sm:-top-12 right-0 p-2 text-white hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-6 h-6" />
              <span className="text-xs font-semibold">Close</span>
            </button>

            <div className="relative rounded-2xl overflow-hidden border border-white/20 shadow-2xl">
              <img
                src={villageImage}
                alt="Welcome to LGEDE Village • Oju LGA, Benue State"
                referrerPolicy="no-referrer"
                className="w-full max-h-[80vh] object-contain bg-black"
              />
              <div className="p-3 bg-stone-950 text-white text-center text-xs">
                <p className="font-bold text-emerald-300">
                  Welcome to LGEDE Village • Oju LGA, Benue State • We Celebrate Community & Culture
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Authentic Igede cultural heritage attire, unity, and traditional music
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
