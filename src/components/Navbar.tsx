import React from 'react';
import {
  Users,
  MessageSquare,
  UserCheck,
  Search,
  LogOut,
  User,
  PlusCircle,
  Menu,
  X,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SpaceId } from '../types';
import { SPACES_LIST } from '../config/spaces';

interface NavbarProps {
  currentSpace: SpaceId | 'all' | 'friends' | 'chat';
  onSelectSpace: (space: SpaceId | 'all' | 'friends' | 'chat') => void;
  onOpenCreatePost: () => void;
  onOpenProfile: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  unreadMessagesCount: number;
  pendingRequestsCount: number;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSpace,
  onSelectSpace,
  onOpenCreatePost,
  onOpenProfile,
  onOpenAuth,
  unreadMessagesCount,
  pendingRequestsCount,
  searchQuery,
  onSearchChange,
}) => {
  const { currentUser, userProfile, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand: must always be exactly "lgede unity forum" in lowercase */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectSpace('all')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-emerald-950/20 group-hover:scale-105 transition-transform ring-2 ring-emerald-700/30 bg-stone-900 shrink-0">
                <img
                  src="/app-icon.jpg"
                  alt="lgede unity forum official icon"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-emerald-950 block leading-tight">
                  lgede unity forum
                </span>
                <span className="text-[11px] font-medium text-emerald-600 block tracking-wide">
                  Oju • Obi • Unity & Progress
                </span>
              </div>
            </button>
          </div>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search posts, market items, jobs, news, members..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-stone-100 hover:bg-stone-100/80 focus:bg-white border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {currentUser ? (
              <>
                {/* Create post button */}
                <button
                  onClick={onOpenCreatePost}
                  className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs hover:shadow transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Create Post</span>
                </button>

                {/* Friend requests button */}
                <button
                  onClick={() => onSelectSpace('friends')}
                  title="Friends & Requests"
                  className={`relative p-2 rounded-full transition-colors ${
                    currentSpace === 'friends'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  {pendingRequestsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full min-w-4 text-center">
                      {pendingRequestsCount}
                    </span>
                  )}
                </button>

                {/* Private Messages button */}
                <button
                  onClick={() => onSelectSpace('chat')}
                  title="Private Chat"
                  className={`relative p-2 rounded-full transition-colors ${
                    currentSpace === 'chat'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadMessagesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full min-w-4 text-center animate-pulse">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>

                {/* User menu avatar */}
                <div className="flex items-center gap-2 pl-1 border-l border-stone-200">
                  <button
                    onClick={onOpenProfile}
                    className="flex items-center gap-2 p-1 rounded-full hover:bg-stone-100 transition-colors"
                    title="My Profile"
                  >
                    <img
                      src={userProfile?.photoURL || currentUser.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
                      alt={userProfile?.fullName || 'User'}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-600"
                    />
                    <span className="hidden lg:block text-xs font-semibold text-stone-800 max-w-28 truncate">
                      {userProfile?.fullName || 'Profile'}
                    </span>
                  </button>

                  <button
                    onClick={signOut}
                    title="Sign Out"
                    className="p-1.5 text-stone-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onOpenAuth('login')}
                  className="px-3.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-full transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white rounded-full shadow-xs transition-colors"
                >
                  Register
                </button>
              </div>
            )}

            {/* Mobile Hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-stone-200 space-y-2">
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search lgede unity forum..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-stone-100 border border-stone-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                onClick={() => {
                  onSelectSpace('all');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-lg text-left ${currentSpace === 'all' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-stone-50 text-stone-700'}`}
              >
                🌍 All Spaces Feed
              </button>
              {SPACES_LIST.map((sp) => (
                <button
                  key={sp.id}
                  onClick={() => {
                    onSelectSpace(sp.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-lg text-left truncate ${currentSpace === sp.id ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-stone-50 text-stone-700'}`}
                >
                  {sp.name}
                </button>
              ))}
              <button
                onClick={() => {
                  onSelectSpace('friends');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-lg text-left ${currentSpace === 'friends' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-stone-50 text-stone-700'}`}
              >
                👥 Friends & Members
              </button>
              <button
                onClick={() => {
                  onSelectSpace('chat');
                  setMobileMenuOpen(false);
                }}
                className={`p-2 rounded-lg text-left ${currentSpace === 'chat' ? 'bg-emerald-100 text-emerald-900 font-bold' : 'bg-stone-50 text-stone-700'}`}
              >
                💬 Private Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
