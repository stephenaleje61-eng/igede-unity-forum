import React from 'react';
import {
  Sparkles,
  ShoppingBag,
  PlusCircle,
  Users,
  MessageSquare,
  Landmark
} from 'lucide-react';
import { SpaceId } from '../types';

interface MobileNavProps {
  currentSpace: SpaceId | 'all' | 'friends' | 'chat';
  onSelectSpace: (space: SpaceId | 'all' | 'friends' | 'chat') => void;
  onOpenCreatePost: () => void;
  pendingRequestsCount: number;
  unreadMessagesCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentSpace,
  onSelectSpace,
  onOpenCreatePost,
  pendingRequestsCount,
  unreadMessagesCount,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-1.5 shadow-lg">
      <div className="flex items-center justify-around">
        {/* All / Spaces */}
        <button
          onClick={() => onSelectSpace('all')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentSpace === 'all' || currentSpace === 'oju' || currentSpace === 'obi'
              ? 'text-emerald-800 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Spaces</span>
        </button>

        {/* Market */}
        <button
          onClick={() => onSelectSpace('market')}
          className={`flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentSpace === 'market'
              ? 'text-amber-700 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Market</span>
        </button>

        {/* Create Post floating center button */}
        <button
          onClick={onOpenCreatePost}
          className="flex flex-col items-center -mt-4 group"
          title="Create Post"
        >
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-700/30 group-hover:scale-105 transition-transform">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="text-[10px] font-semibold text-emerald-800 mt-0.5">Post</span>
        </button>

        {/* Friends */}
        <button
          onClick={() => onSelectSpace('friends')}
          className={`relative flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentSpace === 'friends'
              ? 'text-emerald-800 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Friends</span>
          {pendingRequestsCount > 0 && (
            <span className="absolute top-0 right-1 px-1 py-0.2 text-[9px] font-bold bg-amber-500 text-white rounded-full min-w-3.5 text-center">
              {pendingRequestsCount}
            </span>
          )}
        </button>

        {/* Private Chat */}
        <button
          onClick={() => onSelectSpace('chat')}
          className={`relative flex flex-col items-center py-1 px-2 rounded-xl transition-all ${
            currentSpace === 'chat'
              ? 'text-emerald-800 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Chat</span>
          {unreadMessagesCount > 0 && (
            <span className="absolute top-0 right-1 px-1 py-0.2 text-[9px] font-bold bg-emerald-600 text-white rounded-full min-w-3.5 text-center animate-pulse">
              {unreadMessagesCount}
            </span>
          )}
        </button>
      </div>
    </nav>
  );
};
