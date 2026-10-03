import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  User,
  ArrowLeft,
  Check,
  Shield,
  Smile,
  Clock,
  Sparkles,
  Inbox
} from 'lucide-react';
import { Conversation, Message, UserProfile, Friendship } from '../types';
import { useAuth } from '../context/AuthContext';
import { chatService } from '../services/chatService';

interface ChatViewProps {
  conversations: Conversation[];
  friendships: Friendship[];
  initialActiveFriend?: UserProfile | null;
  onViewMember: (member: UserProfile) => void;
  onOpenAuth: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  conversations,
  friendships,
  initialActiveFriend,
  onViewMember,
  onOpenAuth,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [activeFriend, setActiveFriend] = useState<UserProfile | null>(initialActiveFriend || null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // When initialActiveFriend prop changes
  useEffect(() => {
    if (initialActiveFriend) {
      setActiveFriend(initialActiveFriend);
    }
  }, [initialActiveFriend]);

  // Load or initialize conversation whenever activeFriend is set
  useEffect(() => {
    if (currentUser && userProfile && activeFriend) {
      chatService.getOrCreateConversation(userProfile, activeFriend)
        .then((convo) => {
          setActiveConversation(convo);
          chatService.markAsRead(convo.id, currentUser.uid);
        })
        .catch((e) => console.error('Error opening conversation:', e));
    }
  }, [activeFriend, currentUser, userProfile]);

  // Listen to messages for active conversation
  useEffect(() => {
    if (activeConversation) {
      const unsubscribe = chatService.subscribeMessages(activeConversation.id, (msgs) => {
        setMessages(msgs);
        if (currentUser) {
          chatService.markAsRead(activeConversation.id, currentUser.uid);
        }
      });
      return () => unsubscribe();
    } else {
      setMessages([]);
    }
  }, [activeConversation, currentUser]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile || !activeFriend || !activeConversation) return;
    if (!inputText.trim()) return;

    setSending(true);
    const textToSend = inputText;
    setInputText('');

    try {
      await chatService.sendMessage(
        activeConversation.id,
        userProfile,
        activeFriend.id,
        textToSend
      );
    } catch (e) {
      console.error('Failed to send message:', e);
      setInputText(textToSend); // restore on error
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (convo: Conversation) => {
    if (!currentUser) return;
    const otherUid = convo.participants.find((p) => p !== currentUser.uid);
    if (!otherUid) return;

    // Check if other user is among friendships
    const matchedFriendship = friendships.find((f) => f.friendInfo?.id === otherUid);
    const friendInfo: UserProfile = matchedFriendship?.friendInfo || {
      id: otherUid,
      fullName: convo.participantNames?.[otherUid] || 'Igede Friend',
      email: '',
      photoURL: convo.participantPhotos?.[otherUid] || '',
      location: 'Igede Community',
      spaceAffiliation: 'General Igede',
    };

    setActiveFriend(friendInfo);
    setActiveConversation(convo);
  };

  if (!currentUser) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-stone-200 text-center space-y-4">
        <MessageSquare className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-lg font-bold text-stone-900">Secure 1-on-1 Private Chat</h2>
        <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
          Communicate directly with your confirmed friends across the lgede unity forum. Messages are encrypted and restricted solely to chat participants.
        </p>
        <button
          onClick={onOpenAuth}
          className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
        >
          Sign In to Access Private Messages
        </button>
      </div>
    );
  }

  const formatTime = (ts: any) => {
    if (!ts) return '';
    if (ts.toDate) {
      return ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return '';
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[75vh] min-h-[500px]">
      
      {/* LEFT COLUMN: Conversation List */}
      <div
        className={`w-full md:w-80 border-r border-stone-200 flex flex-col bg-stone-50/50 ${
          activeFriend ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-stone-200 bg-white">
          <h2 className="text-sm font-black text-stone-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" />
              <span>Private Messages</span>
            </span>
            <span className="text-[11px] font-normal text-stone-400">
              {conversations.length} {conversations.length === 1 ? 'chat' : 'chats'}
            </span>
          </h2>
          <p className="text-[10px] text-stone-500 mt-0.5">
            Strict participant-only communication
          </p>
        </div>

        {/* Start chat with friends quick ribbon */}
        {friendships.length > 0 && (
          <div className="p-3 border-b border-stone-200/80 bg-emerald-50/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 mb-2">
              Start Chat with a Friend:
            </p>
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {friendships.map((f) => {
                const friend = f.friendInfo;
                if (!friend) return null;
                const isSelected = activeFriend?.id === friend.id;
                return (
                  <button
                    key={friend.id}
                    onClick={() => setActiveFriend(friend)}
                    className="flex flex-col items-center shrink-0 w-14 group"
                    title={friend.fullName}
                  >
                    <div className="relative">
                      <img
                        src={friend.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={friend.fullName}
                        className={`w-10 h-10 rounded-full object-cover ring-2 transition-all ${
                          isSelected ? 'ring-emerald-600 scale-105' : 'ring-white group-hover:ring-emerald-400'
                        }`}
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                    </div>
                    <span className="text-[10px] text-stone-700 truncate w-full text-center mt-1 font-medium">
                      {friend.fullName.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Existing Conversations List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-stone-400 space-y-2">
              <Inbox className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-xs">No active conversations yet.</p>
              <p className="text-[10px]">Select a friend above to start chatting!</p>
            </div>
          ) : (
            conversations.map((convo) => {
              const otherUid = convo.participants.find((p) => p !== currentUser.uid) || '';
              const friendName = convo.participantNames?.[otherUid] || 'Igede Member';
              const friendPhoto = convo.participantPhotos?.[otherUid] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80';
              const isSelected = activeConversation?.id === convo.id;
              const unread = convo.unreadCount?.[currentUser.uid] || 0;

              return (
                <button
                  key={convo.id}
                  onClick={() => selectConversation(convo)}
                  className={`w-full p-3.5 flex items-center gap-3 text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-600' : 'hover:bg-stone-100/70 bg-white'
                  }`}
                >
                  <img
                    src={friendPhoto}
                    alt={friendName}
                    className="w-11 h-11 rounded-full object-cover ring-1 ring-stone-200 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold text-stone-900 truncate">
                        {friendName}
                      </h4>
                      <span className="text-[10px] text-stone-400 shrink-0">
                        {formatTime(convo.lastMessageTimestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500 truncate">
                      {convo.lastMessage || 'Click to view messages'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-full shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Room */}
      <div
        className={`flex-1 flex flex-col bg-stone-100/60 ${
          activeFriend ? 'flex' : 'hidden md:flex'
        }`}
      >
        {activeFriend ? (
          <>
            {/* Chat Room Header */}
            <div className="p-3.5 bg-white border-b border-stone-200 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3">
                {/* Mobile back to conversation list button */}
                <button
                  onClick={() => setActiveFriend(null)}
                  className="md:hidden p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => onViewMember(activeFriend)}
                  className="relative group shrink-0"
                >
                  <img
                    src={activeFriend.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
                    alt={activeFriend.fullName}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-emerald-600 group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
                </button>

                <div>
                  <button
                    onClick={() => onViewMember(activeFriend)}
                    className="text-xs sm:text-sm font-bold text-stone-900 hover:text-emerald-800 transition-colors block text-left"
                  >
                    {activeFriend.fullName}
                  </button>
                  <p className="text-[10px] text-stone-500 flex items-center gap-1">
                    <span>{activeFriend.location || 'Igede Community'}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      Encrypted Friend Chat
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => onViewMember(activeFriend)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold transition-colors"
              >
                View Profile
              </button>
            </div>

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-12 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-800">
                    This is the start of your private chat with {activeFriend.fullName}
                  </h4>
                  <p className="text-[11px] text-stone-500 max-w-xs mx-auto">
                    Say "Iye!" (greetings), share thoughts, or catch up on hometown updates.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === currentUser.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && (
                        <img
                          src={msg.senderPhoto || activeFriend.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={msg.senderName}
                          className="w-6 h-6 rounded-full object-cover shrink-0 mb-1 ring-1 ring-stone-200"
                        />
                      )}

                      <div
                        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-xs shadow-2xs leading-relaxed ${
                          isMine
                            ? 'bg-emerald-700 text-white rounded-br-xs'
                            : 'bg-white text-stone-800 border border-stone-200/80 rounded-bl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span
                          className={`block text-[9px] mt-1 text-right ${
                            isMine ? 'text-emerald-200' : 'text-stone-400'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input Box */}
            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeFriend.fullName.split(' ')[0]}...`}
                className="flex-1 px-4 py-2.5 text-xs bg-stone-100 hover:bg-stone-100/80 focus:bg-white border border-stone-200 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                className="w-10 h-10 rounded-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-stone-300 text-white flex items-center justify-center shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-stone-200 flex items-center justify-center text-emerald-700 shadow-xs">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-stone-700">No Chat Selected</h3>
            <p className="text-xs text-stone-500 max-w-xs">
              Select a friend from the list or start a conversation to send private messages.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
