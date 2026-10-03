import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  MessageSquare,
  Search,
  MapPin,
  Briefcase,
  X,
  Check,
  UserMinus,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Friendship, FriendRequest, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { friendService } from '../services/friendService';
import { forumService } from '../services/forumService';

interface FriendsViewProps {
  friendships: Friendship[];
  receivedRequests: FriendRequest[];
  sentRequests: FriendRequest[];
  onStartChatWithFriend: (friend: UserProfile) => void;
  onViewMember: (member: UserProfile) => void;
  onOpenAuth: () => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({
  friendships,
  receivedRequests,
  sentRequests,
  onStartChatWithFriend,
  onViewMember,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [tab, setTab] = useState<'friends' | 'requests' | 'members'>('friends');
  const [searchMemberQuery, setSearchMemberQuery] = useState('');
  const [allMembers, setAllMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load all community members for the directory tab
  useEffect(() => {
    if (tab === 'members' && currentUser) {
      setLoadingMembers(true);
      forumService.getAllMembers(currentUser.uid)
        .then((members) => {
          setAllMembers(members);
        })
        .catch((e) => console.error('Failed to load members', e))
        .finally(() => setLoadingMembers(false));
    }
  }, [tab, currentUser]);

  const showToast = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 3000);
  };

  const handleSendRequest = async (targetUser: UserProfile) => {
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    try {
      await friendService.sendFriendRequest(userProfile, targetUser);
      showToast(`Friend request dispatched to ${targetUser.fullName}`);
    } catch (e: any) {
      showToast(e.message || 'Could not send friend request');
    }
  };

  const handleAcceptRequest = async (req: FriendRequest) => {
    try {
      await friendService.acceptFriendRequest(req);
      showToast(`You are now friends with ${req.senderName}!`);
    } catch (e) {
      showToast('Could not accept friend request');
    }
  };

  const handleDeclineRequest = async (reqId: string) => {
    try {
      await friendService.declineFriendRequest(reqId);
      showToast('Friend request declined');
    } catch (e) {
      showToast('Could not decline friend request');
    }
  };

  const handleCancelSent = async (receiverId: string) => {
    if (!currentUser) return;
    try {
      await friendService.cancelFriendRequest(currentUser.uid, receiverId);
      showToast('Sent friend request cancelled');
    } catch (e) {
      showToast('Could not cancel request');
    }
  };

  const handleRemoveFriend = async (friendId: string, friendName: string) => {
    if (!currentUser) return;
    try {
      await friendService.removeFriend(currentUser.uid, friendId);
      showToast(`Removed ${friendName} from friends`);
    } catch (e) {
      showToast('Could not remove friend');
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4">
        <Users className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-lg font-bold text-stone-900">Connect with Igede Brothers & Sisters</h2>
        <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
          Log in or create a free account to make friends, view member profiles, and chat directly in private one-to-one messaging rooms.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
        >
          Sign In to Access Friends Hub
        </button>
      </div>
    );
  }

  const filteredMembers = allMembers.filter((m) => {
    const q = searchMemberQuery.toLowerCase();
    return (
      m.fullName.toLowerCase().includes(q) ||
      (m.location && m.location.toLowerCase().includes(q)) ||
      (m.occupation && m.occupation.toLowerCase().includes(q)) ||
      (m.spaceAffiliation && m.spaceAffiliation.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="p-3 bg-emerald-100/90 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-xs animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Hub Navigation */}
      <div className="bg-white rounded-3xl border border-stone-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-700" />
              <span>Community Friends & Networking</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Build your network across Oju, Obi, and the worldwide Igede diaspora.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex bg-stone-100 p-1 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setTab('friends')}
              className={`py-1.5 px-3 rounded-xl transition-all ${
                tab === 'friends' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              My Friends ({friendships.length})
            </button>
            <button
              onClick={() => setTab('requests')}
              className={`py-1.5 px-3 rounded-xl transition-all relative ${
                tab === 'requests' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Requests
              {receivedRequests.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                  {receivedRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab('members')}
              className={`py-1.5 px-3 rounded-xl transition-all ${
                tab === 'members' ? 'bg-white text-emerald-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Find Members
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: MY FRIENDS */}
      {tab === 'friends' && (
        <div className="space-y-3">
          {friendships.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-3">
              <Inbox className="w-10 h-10 text-stone-300 mx-auto" />
              <h3 className="text-sm font-bold text-stone-800">You haven't added any friends yet</h3>
              <p className="text-xs text-stone-500 max-w-sm mx-auto">
                Explore the Community Directory or find interesting people in Oju, Obi, Market, and Singles spaces!
              </p>
              <button
                onClick={() => setTab('members')}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                Browse Community Members
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {friendships.map((f) => {
                const friend = f.friendInfo;
                const friendName = friend?.fullName || 'Igede Member';
                const friendPhoto = friend?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';
                const friendLocation = friend?.location || 'Igede Homeland';

                return (
                  <div
                    key={f.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between gap-3 shadow-xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => friend && onViewMember(friend)}
                        className="shrink-0"
                      >
                        <img
                          src={friendPhoto}
                          alt={friendName}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-600"
                        />
                      </button>
                      <div className="min-w-0">
                        <button
                          onClick={() => friend && onViewMember(friend)}
                          className="text-xs font-bold text-stone-900 hover:text-emerald-800 truncate block text-left"
                        >
                          {friendName}
                        </button>
                        <p className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                          <span>{friendLocation}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {friend && (
                        <button
                          onClick={() => onStartChatWithFriend(friend)}
                          title="Open Private Chat"
                          className="p-2 rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="hidden sm:inline">Chat</span>
                        </button>
                      )}
                      {friend && (
                        <button
                          onClick={() => handleRemoveFriend(friend.id, friendName)}
                          title="Remove Friend"
                          className="p-2 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <UserMinus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: REQUESTS (RECEIVED & SENT) */}
      {tab === 'requests' && (
        <div className="space-y-6">
          {/* Received Requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
              Received Requests ({receivedRequests.length})
            </h3>
            {receivedRequests.length === 0 ? (
              <p className="text-xs text-stone-400 bg-white p-6 rounded-2xl border border-stone-200 text-center">
                No pending incoming friend requests at the moment.
              </p>
            ) : (
              <div className="space-y-2">
                {receivedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.senderPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={req.senderName}
                        className="w-11 h-11 rounded-full object-cover ring-2 ring-stone-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{req.senderName}</h4>
                        <p className="text-[11px] text-stone-500">Sent you a friend request</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAcceptRequest(req)}
                        className="flex-1 sm:flex-none px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req.id)}
                        className="flex-1 sm:flex-none px-3 py-1.5 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-medium transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
              Sent Requests ({sentRequests.length})
            </h3>
            {sentRequests.length === 0 ? (
              <p className="text-xs text-stone-400 bg-white p-6 rounded-2xl border border-stone-200 text-center">
                You haven't sent any pending friend requests.
              </p>
            ) : (
              <div className="space-y-2">
                {sentRequests.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 flex items-center justify-between gap-3 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={req.receiverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={req.receiverName}
                        className="w-10 h-10 rounded-full object-cover ring-1 ring-stone-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-stone-900">{req.receiverName}</h4>
                        <p className="text-[11px] text-amber-600 font-medium">Pending response...</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelSent(req.receiverId)}
                      className="px-3 py-1.5 text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
                    >
                      Cancel Request
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FIND COMMUNITY MEMBERS */}
      {tab === 'members' && (
        <div className="space-y-3">
          {/* Member Search Bar */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchMemberQuery}
              onChange={(e) => setSearchMemberQuery(e.target.value)}
              placeholder="Search members by name, LGA (Oju/Obi), occupation, location..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-600 focus:outline-none shadow-xs"
            />
          </div>

          {loadingMembers ? (
            <div className="p-8 text-center text-xs text-stone-500">
              <span className="inline-block w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p>Loading community members directory...</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-2">
              <p className="text-xs text-stone-500">
                {searchMemberQuery ? 'No members match your search.' : 'No other members found in the directory yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMembers.map((member) => {
                const isFriend = friendships.some((f) => f.users.includes(member.id));
                const hasSentReq = sentRequests.some((r) => r.receiverId === member.id);
                const hasReceivedReq = receivedRequests.some((r) => r.senderId === member.id);

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-stone-200 p-4 flex flex-col justify-between gap-3 shadow-xs hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => onViewMember(member)}
                        className="shrink-0"
                      >
                        <img
                          src={member.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                          alt={member.fullName}
                          className="w-12 h-12 rounded-full object-cover ring-2 ring-emerald-600/40"
                        />
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => onViewMember(member)}
                          className="text-xs font-bold text-stone-900 hover:text-emerald-800 truncate block text-left"
                        >
                          {member.fullName}
                        </button>
                        <p className="text-[11px] text-emerald-700 font-medium truncate">
                          {member.spaceAffiliation || 'Igede Member'}
                        </p>
                        {member.location && (
                          <p className="text-[10px] text-stone-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{member.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="pt-2 border-t border-stone-100">
                      {isFriend ? (
                        <button
                          onClick={() => onStartChatWithFriend(member)}
                          className="w-full py-1.5 px-3 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat (Friends)</span>
                        </button>
                      ) : hasSentReq ? (
                        <button
                          onClick={() => handleCancelSent(member.id)}
                          className="w-full py-1.5 px-3 bg-stone-100 text-stone-600 rounded-xl text-xs font-medium"
                        >
                          Request Sent
                        </button>
                      ) : hasReceivedReq ? (
                        <button
                          onClick={() => setTab('requests')}
                          className="w-full py-1.5 px-3 bg-amber-500 text-white rounded-xl text-xs font-semibold"
                        >
                          Respond to Request
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendRequest(member)}
                          className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
