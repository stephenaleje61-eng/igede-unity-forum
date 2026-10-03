import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { MobileNav } from './components/MobileNav';
import { SpaceHeader } from './components/SpaceHeader';
import { PostCard } from './components/PostCard';
import { FriendsView } from './components/FriendsView';
import { ChatView } from './components/ChatView';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { MemberProfileModal } from './components/MemberProfileModal';
import { CreatePostModal } from './components/CreatePostModal';
import { Post, SpaceId, Friendship, FriendRequest, Conversation, UserProfile } from './types';
import { forumService } from './services/forumService';
import { friendService } from './services/friendService';
import { chatService } from './services/chatService';
import { checkAndSeedInitialPosts } from './services/seedData';
import { SPACES_LIST } from './config/spaces';
import {
  Sparkles,
  Inbox,
  Filter,
  Users,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';

function ForumMain() {
  const { currentUser, userProfile, loading: authLoading } = useAuth();

  // Navigation state
  const [currentSpace, setCurrentSpace] = useState<SpaceId | 'all' | 'friends' | 'chat'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Data states
  const [posts, setPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [createPostOpen, setCreatePostOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<UserProfile | null>(null);
  const [chatFriendTarget, setChatFriendTarget] = useState<UserProfile | null>(null);

  // Initial community posts seeding
  useEffect(() => {
    checkAndSeedInitialPosts();
  }, []);

  // Subscribe to posts for current space
  useEffect(() => {
    if (currentSpace === 'friends' || currentSpace === 'chat') {
      return;
    }

    setLoadingPosts(true);
    setLastVisibleDoc(null);
    setHasMorePosts(false);

    const unsubscribe = forumService.subscribePostsBySpace(
      currentSpace,
      (fetchedPosts, lastDoc) => {
        setPosts(fetchedPosts);
        setLastVisibleDoc(lastDoc || null);
        setHasMorePosts(fetchedPosts.length >= 20);
        setLoadingPosts(false);
      },
      () => {
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [currentSpace]);

  // Load more earlier posts using cursor-based pagination
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);

  const handleLoadMorePosts = async () => {
    if (!lastVisibleDoc || loadingMore || !hasMorePosts) return;
    if (currentSpace === 'friends' || currentSpace === 'chat') return;

    setLoadingMore(true);
    try {
      const res = await forumService.fetchMorePosts(currentSpace, lastVisibleDoc, 15);
      if (res) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const fresh = res.posts.filter((p) => !existingIds.has(p.id));
          return [...prev, ...fresh];
        });
        setLastVisibleDoc(res.lastDoc);
        setHasMorePosts(res.hasMore);
      }
    } catch (err) {
      console.error('Failed to load more posts:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  // IntersectionObserver for seamless infinite loading
  useEffect(() => {
    if (!hasMorePosts || loadingMore || !lastVisibleDoc || searchQuery) return;
    const sentinel = loadMoreSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          handleLoadMorePosts();
        }
      },
      { rootMargin: '250px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMorePosts, loadingMore, lastVisibleDoc, searchQuery]);

  // Subscribe to Friendships, Requests & Conversations when logged in
  useEffect(() => {
    if (!currentUser) {
      setFriendships([]);
      setReceivedRequests([]);
      setSentRequests([]);
      setConversations([]);
      return;
    }

    const unsubFriendships = friendService.subscribeFriendships(currentUser.uid, setFriendships);
    const unsubReceived = friendService.subscribeReceivedRequests(currentUser.uid, setReceivedRequests);
    const unsubSent = friendService.subscribeSentRequests(currentUser.uid, setSentRequests);
    const unsubConvos = chatService.subscribeConversations(currentUser.uid, setConversations);

    return () => {
      unsubFriendships();
      unsubReceived();
      unsubSent();
      unsubConvos();
    };
  }, [currentUser]);

  // Count unread messages
  const totalUnreadMessages = conversations.reduce((acc, c) => {
    if (!currentUser) return acc;
    return acc + (c.unreadCount?.[currentUser.uid] || 0);
  }, 0);

  // Filter posts by search query
  const filteredPosts = posts.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.content && p.content.toLowerCase().includes(q)) ||
      (p.headline && p.headline.toLowerCase().includes(q)) ||
      (p.product && p.product.toLowerCase().includes(q)) ||
      (p.company && p.company.toLowerCase().includes(q)) ||
      (p.authorName && p.authorName.toLowerCase().includes(q))
    );
  });

  const handleOpenAuth = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleViewMemberById = async (memberId: string) => {
    try {
      const member = await forumService.getUserProfile(memberId);
      if (member) {
        setSelectedMember(member);
      }
    } catch (e) {
      console.error('Failed to load member profile', e);
    }
  };

  const handleStartChat = (targetMember: UserProfile) => {
    setChatFriendTarget(targetMember);
    setCurrentSpace('chat');
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 pb-20 md:pb-12 font-sans selection:bg-emerald-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentSpace={currentSpace}
        onSelectSpace={setCurrentSpace}
        onOpenCreatePost={() => {
          if (!currentUser) {
            handleOpenAuth('signup');
          } else {
            setCreatePostOpen(true);
          }
        }}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenAuth={handleOpenAuth}
        unreadMessagesCount={totalUnreadMessages}
        pendingRequestsCount={receivedRequests.length}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Shell */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6">
        <div className="flex gap-6 items-start">
          
          {/* Desktop Left Sidebar */}
          <Sidebar
            currentSpace={currentSpace}
            onSelectSpace={setCurrentSpace}
            onOpenCreatePost={() => {
              if (!currentUser) {
                handleOpenAuth('signup');
              } else {
                setCreatePostOpen(true);
              }
            }}
            onOpenProfile={() => setProfileModalOpen(true)}
            pendingRequestsCount={receivedRequests.length}
            unreadMessagesCount={totalUnreadMessages}
          />

          {/* Central Main View Area */}
          <main className="flex-1 min-w-0 space-y-4">
            
            {/* View Switcher based on currentSpace */}
            {currentSpace === 'friends' ? (
              <FriendsView
                friendships={friendships}
                receivedRequests={receivedRequests}
                sentRequests={sentRequests}
                onStartChatWithFriend={handleStartChat}
                onViewMember={(m) => setSelectedMember(m)}
                onOpenAuth={() => handleOpenAuth('signup')}
              />
            ) : currentSpace === 'chat' ? (
              <ChatView
                conversations={conversations}
                friendships={friendships}
                initialActiveFriend={chatFriendTarget}
                onViewMember={(m) => setSelectedMember(m)}
                onOpenAuth={() => handleOpenAuth('signup')}
              />
            ) : (
              <>
                {/* Space Banner / Header */}
                <SpaceHeader
                  spaceId={currentSpace}
                  postsCount={filteredPosts.length}
                  onOpenCreatePost={() => {
                    if (!currentUser) {
                      handleOpenAuth('signup');
                    } else {
                      setCreatePostOpen(true);
                    }
                  }}
                />

                {/* Horizontal Space Quick Pill Scroller on Tablet & Mobile */}
                <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                  <button
                    onClick={() => setCurrentSpace('all')}
                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      currentSpace === 'all'
                        ? 'bg-emerald-800 text-white shadow-xs'
                        : 'bg-white text-stone-700 border border-stone-200'
                    }`}
                  >
                    All Spaces
                  </button>
                  {SPACES_LIST.map((sp) => (
                    <button
                      key={sp.id}
                      onClick={() => setCurrentSpace(sp.id)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        currentSpace === sp.id
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-white text-stone-700 border border-stone-200'
                      }`}
                    >
                      {sp.name}
                    </button>
                  ))}
                </div>

                {/* Posts Feed */}
                {loadingPosts ? (
                  <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-3">
                    <span className="inline-block w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-stone-500 font-medium">Loading space discussions...</p>
                  </div>
                ) : filteredPosts.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4">
                    <Inbox className="w-12 h-12 text-stone-300 mx-auto" />
                    <div>
                      <h3 className="text-base font-bold text-stone-800">
                        {searchQuery ? 'No matching posts found' : 'No posts in this space yet'}
                      </h3>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                        {searchQuery
                          ? 'Try adjusting your search terms.'
                          : 'Start the conversation and share updates with the community!'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (!currentUser) handleOpenAuth('signup');
                        else setCreatePostOpen(true);
                      }}
                      className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
                    >
                      Publish First Post
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onOpenAuth={() => handleOpenAuth('login')}
                        onViewMember={handleViewMemberById}
                        onContactSeller={() => handleViewMemberById(post.authorId)}
                        onConnectSingle={() => handleViewMemberById(post.authorId)}
                      />
                    ))}

                    {/* Cursor-Based Pagination Load More Trigger with IntersectionObserver */}
                    {hasMorePosts && !searchQuery && (
                      <div ref={loadMoreSentinelRef} className="pt-3 pb-2 text-center">
                        <button
                          type="button"
                          onClick={handleLoadMorePosts}
                          disabled={loadingMore}
                          className="px-6 py-2.5 bg-white hover:bg-stone-50 border border-stone-200 text-stone-700 hover:text-emerald-800 text-xs font-semibold rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50 cursor-pointer hover:border-emerald-500"
                        >
                          {loadingMore ? (
                            <>
                              <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                              <span>Loading earlier posts...</span>
                            </>
                          ) : (
                            <span>Load Earlier Posts</span>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Dock Navigation */}
      <MobileNav
        currentSpace={currentSpace}
        onSelectSpace={setCurrentSpace}
        onOpenCreatePost={() => {
          if (!currentUser) {
            handleOpenAuth('signup');
          } else {
            setCreatePostOpen(true);
          }
        }}
        pendingRequestsCount={receivedRequests.length}
        unreadMessagesCount={totalUnreadMessages}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
      />

      {/* Profile Edit Modal */}
      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />

      {/* View Member Profile Modal */}
      <MemberProfileModal
        member={selectedMember}
        friendships={friendships}
        sentRequests={sentRequests}
        receivedRequests={receivedRequests}
        onClose={() => setSelectedMember(null)}
        onStartChat={handleStartChat}
        onEditOwnProfile={() => setProfileModalOpen(true)}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={createPostOpen}
        defaultSpace={currentSpace === 'all' || currentSpace === 'friends' || currentSpace === 'chat' ? 'oju' : currentSpace}
        onClose={() => setCreatePostOpen(false)}
        onPostCreated={() => {
          // Refresh or let Firestore snapshot do real-time update
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ForumMain />
    </AuthProvider>
  );
}
