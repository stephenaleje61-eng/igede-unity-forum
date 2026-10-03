import React from 'react';
import {
  Compass,
  Landmark,
  ShoppingBag,
  Heart,
  Flame,
  Briefcase,
  Users,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Plus
} from 'lucide-react';
import { SpaceId } from '../types';
import { COMMUNITY_SPACES, SPACES_LIST } from '../config/spaces';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentSpace: SpaceId | 'all' | 'friends' | 'chat';
  onSelectSpace: (space: SpaceId | 'all' | 'friends' | 'chat') => void;
  onOpenCreatePost: () => void;
  onOpenProfile: () => void;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSpace,
  onSelectSpace,
  onOpenCreatePost,
  onOpenProfile,
  pendingRequestsCount,
  unreadMessagesCount,
}) => {
  const { currentUser, userProfile } = useAuth();

  const getSpaceIcon = (id: SpaceId) => {
    switch (id) {
      case 'oju':
        return <Landmark className="w-4 h-4 text-emerald-600" />;
      case 'obi':
        return <Compass className="w-4 h-4 text-teal-600" />;
      case 'market':
        return <ShoppingBag className="w-4 h-4 text-amber-600" />;
      case 'singles':
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />;
      case 'news':
        return <Flame className="w-4 h-4 text-red-500 fill-red-500/20" />;
      case 'jobs':
        return <Briefcase className="w-4 h-4 text-blue-600" />;
    }
  };

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-4">
        
        {/* Post Trigger Button */}
        {currentUser && (
          <button
            onClick={onOpenCreatePost}
            className="w-full py-2.5 px-4 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-900/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Post</span>
          </button>
        )}

        {/* Community Spaces Menu */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-xs">
          <div className="flex items-center justify-between px-3 py-2 text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Community Spaces
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-medium">
              6 Spaces
            </span>
          </div>

          <div className="space-y-1 mt-1">
            {/* All Spaces */}
            <button
              onClick={() => onSelectSpace('all')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                currentSpace === 'all'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border-l-4 border-emerald-600'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>All Spaces Feed</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-stone-400 opacity-60" />
            </button>

            {/* Individual Spaces */}
            {SPACES_LIST.map((space) => {
              const isActive = currentSpace === space.id;
              return (
                <button
                  key={space.id}
                  onClick={() => onSelectSpace(space.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-900 font-bold border-l-4 border-emerald-600'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {getSpaceIcon(space.id)}
                    <span className="truncate">{space.name}</span>
                  </div>
                  <span className="text-[10px] font-normal text-stone-400">
                    {space.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Networking & Direct Chat Menu */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-3 shadow-xs">
          <div className="px-3 py-1.5 text-stone-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Connections & Messages
            </span>
          </div>

          <div className="space-y-1 mt-1">
            <button
              onClick={() => onSelectSpace('friends')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                currentSpace === 'friends'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border-l-4 border-emerald-600'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-emerald-600" />
                <span>Friends & Members</span>
              </div>
              {pendingRequestsCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full">
                  {pendingRequestsCount} new
                </span>
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 opacity-60" />
              )}
            </button>

            <button
              onClick={() => onSelectSpace('chat')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                currentSpace === 'chat'
                  ? 'bg-emerald-50 text-emerald-900 font-bold border-l-4 border-emerald-600'
                  : 'text-stone-700 hover:bg-stone-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Private 1-on-1 Chat</span>
              </div>
              {unreadMessagesCount > 0 ? (
                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full">
                  {unreadMessagesCount}
                </span>
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 opacity-60" />
              )}
            </button>
          </div>
        </div>

        {/* Member Profile Quick Card */}
        {currentUser && userProfile && (
          <div className="bg-gradient-to-br from-emerald-950 to-stone-900 text-white rounded-2xl p-3.5 shadow-md">
            <div className="flex items-center gap-3">
              <img
                src={userProfile.photoURL || currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
                alt={userProfile.fullName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-400"
              />
              <div className="truncate flex-1">
                <p className="text-xs font-bold truncate leading-tight">
                  {userProfile.fullName}
                </p>
                <p className="text-[10px] text-emerald-300 truncate">
                  {userProfile.location || 'Igede Homeland'}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-[11px]">
              <span className="text-stone-300">Status: Active</span>
              <button
                onClick={onOpenProfile}
                className="text-emerald-300 hover:text-emerald-200 font-semibold underline cursor-pointer"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {/* Culture & Peace Footer Note with Official Emblem */}
        <div className="p-3 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex items-center gap-3">
          <img
            src="/app-icon.jpg"
            alt="lgede unity forum official emblem"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-emerald-600/30 shadow-xs shrink-0 bg-stone-900"
          />
          <div className="min-w-0">
            <p className="text-xs font-black text-emerald-950 truncate">
              lgede unity forum
            </p>
            <p className="text-[10px] text-stone-500 leading-tight mt-0.5">
              Igede People • Benue • Unity & Cultural Progress
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
