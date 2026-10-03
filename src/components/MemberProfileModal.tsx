import React, { useState } from 'react';
import {
  X,
  UserPlus,
  UserCheck,
  MessageSquare,
  MapPin,
  Briefcase,
  Calendar,
  Home,
  ShieldCheck,
  UserMinus,
  Check
} from 'lucide-react';
import { UserProfile, FriendRequest, Friendship } from '../types';
import { useAuth } from '../context/AuthContext';
import { friendService } from '../services/friendService';

interface MemberProfileModalProps {
  member: UserProfile | null;
  friendships: Friendship[];
  sentRequests: FriendRequest[];
  receivedRequests: FriendRequest[];
  onClose: () => void;
  onStartChat: (member: UserProfile) => void;
  onEditOwnProfile: () => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  friendships,
  sentRequests,
  receivedRequests,
  onClose,
  onStartChat,
  onEditOwnProfile,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  if (!member) return null;

  const isMe = currentUser?.uid === member.id;
  const isFriend = friendships.some((f) => f.users.includes(member.id));
  const sentReq = sentRequests.find((r) => r.receiverId === member.id);
  const receivedReq = receivedRequests.find((r) => r.senderId === member.id);

  const handleSendRequest = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      await friendService.sendFriendRequest(userProfile, member);
      setActionNotice('Friend request sent!');
    } catch (e: any) {
      setActionNotice(e.message || 'Could not send friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!receivedReq) return;
    setLoading(true);
    try {
      await friendService.acceptFriendRequest(receivedReq);
      setActionNotice('Friend request accepted! You can now chat in private.');
    } catch (e: any) {
      setActionNotice('Could not accept friend request');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await friendService.cancelFriendRequest(currentUser.uid, member.id);
      setActionNotice('Request cancelled');
    } catch (e: any) {
      setActionNotice('Could not cancel request');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      await friendService.removeFriend(currentUser.uid, member.id);
      setActionNotice('Friend removed');
    } catch (e: any) {
      setActionNotice('Could not remove friend');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Banner with cultural styling */}
        <div className="h-28 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-950 relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Profile Avatar & Main Info */}
        <div className="px-6 pb-6 pt-0 relative">
          <div className="flex justify-between items-end -mt-12 mb-3">
            <img
              src={member.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'}
              alt={member.fullName}
              className="w-24 h-24 rounded-full object-cover ring-4 ring-white shadow-lg bg-stone-100"
            />
            {isFriend && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
                <UserCheck className="w-3.5 h-3.5" />
                Friends
              </span>
            )}
          </div>

          <h3 className="text-lg font-bold text-stone-900 leading-tight">
            {member.fullName}
          </h3>
          <p className="text-xs text-emerald-700 font-medium mt-0.5">
            {member.spaceAffiliation || 'Igede Member'} • {member.occupation || 'Community Member'}
          </p>

          {actionNotice && (
            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{actionNotice}</span>
            </div>
          )}

          {/* Bio */}
          {member.bio && (
            <p className="mt-3 text-xs text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-200/80 leading-relaxed">
              "{member.bio}"
            </p>
          )}

          {/* Details list */}
          <div className="mt-4 space-y-2 text-xs text-stone-600">
            {member.location && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Lives in: <strong className="text-stone-800">{member.location}</strong></span>
              </div>
            )}
            {member.hometown && (
              <div className="flex items-center gap-2">
                <Home className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Hometown: <strong className="text-stone-800">{member.hometown}</strong></span>
              </div>
            )}
            {member.occupation && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-stone-400 shrink-0" />
                <span>Occupation: <strong className="text-stone-800">{member.occupation}</strong></span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Member of <strong className="text-stone-800">lgede unity forum</strong></span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 pt-4 border-t border-stone-200 flex flex-wrap gap-2">
            {isMe ? (
              <button
                onClick={() => {
                  onClose();
                  onEditOwnProfile();
                }}
                className="w-full py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs"
              >
                Edit Your Profile
              </button>
            ) : currentUser ? (
              <>
                {/* Friendship actions */}
                {isFriend ? (
                  <>
                    <button
                      onClick={() => {
                        onClose();
                        onStartChat(member);
                      }}
                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Private Chat</span>
                    </button>
                    <button
                      onClick={handleRemoveFriend}
                      disabled={loading}
                      className="py-2 px-3 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-medium flex items-center justify-center gap-1"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </>
                ) : receivedReq ? (
                  <div className="w-full flex gap-2">
                    <button
                      onClick={handleAcceptRequest}
                      disabled={loading}
                      className="flex-1 py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Accept Request</span>
                    </button>
                    <button
                      onClick={() => friendService.declineFriendRequest(receivedReq.id)}
                      disabled={loading}
                      className="py-2 px-3 border border-stone-300 text-stone-600 hover:bg-stone-50 rounded-xl text-xs font-medium"
                    >
                      Decline
                    </button>
                  </div>
                ) : sentReq ? (
                  <button
                    onClick={handleCancelRequest}
                    disabled={loading}
                    className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-medium flex items-center justify-center gap-1.5"
                  >
                    <span>Request Sent (Click to Cancel)</span>
                  </button>
                ) : (
                  <button
                    onClick={handleSendRequest}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Send Friend Request</span>
                  </button>
                )}
              </>
            ) : (
              <p className="text-center w-full text-xs text-stone-500 py-1">
                Sign in to send friend requests or chat with {member.fullName}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
