import React, { useEffect, useState } from 'react';
import { Send, MessageCircle } from 'lucide-react';
import { Comment } from '../types';
import { forumService } from '../services/forumService';
import { useAuth } from '../context/AuthContext';

interface CommentsSectionProps {
  postId: string;
  onOpenAuth: () => void;
  onViewMember: (memberId: string) => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  postId,
  onOpenAuth,
  onViewMember,
}) => {
  const { currentUser, userProfile } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = forumService.subscribeComments(postId, (data) => {
      setComments(data);
    });
    return () => unsubscribe();
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) {
      onOpenAuth();
      return;
    }

    if (!newComment.trim()) return;

    setLoading(true);
    setErrorNotice(null);
    try {
      await forumService.addComment(postId, {
        authorId: currentUser.uid,
        authorName: userProfile.fullName || 'Community Member',
        authorPhoto: userProfile.photoURL || '',
        content: newComment.trim(),
      });
      setNewComment('');
    } catch (e: any) {
      console.error('Failed to post comment', e);
      setErrorNotice(e.message || 'Could not post comment.');
      setTimeout(() => setErrorNotice(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-3 border-t border-stone-100 space-y-3">
      {/* Existing Comments List */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="text-xs text-stone-400 py-1 text-center italic">
            No replies yet. Be the first to share your thoughts!
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-2.5 group">
              <button
                type="button"
                onClick={() => onViewMember(comment.authorId)}
                className="shrink-0"
              >
                <img
                  src={comment.authorPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={comment.authorName}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-stone-200 group-hover:ring-emerald-600 transition-all"
                />
              </button>
              <div className="flex-1 bg-stone-50 rounded-2xl px-3 py-2 border border-stone-200/60">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <button
                    type="button"
                    onClick={() => onViewMember(comment.authorId)}
                    className="text-xs font-bold text-stone-800 hover:text-emerald-800 truncate"
                  >
                    {comment.authorName}
                  </button>
                  <span className="text-[10px] text-stone-400">
                    {comment.createdAt?.toDate ? comment.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                  </span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Comment Input */}
      {errorNotice && (
        <p className="text-[11px] text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          {errorNotice}
        </p>
      )}

      {currentUser ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 pt-1">
          <img
            src={userProfile?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
            alt="My Avatar"
            className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-600 shrink-0"
          />
          <div className="relative flex-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write a supportive reply..."
              className="w-full pl-3 pr-10 py-1.5 text-xs bg-stone-100 hover:bg-stone-100/80 focus:bg-white border border-stone-200 rounded-full focus:ring-1 focus:ring-emerald-600 focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !newComment.trim()}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-emerald-700 hover:text-emerald-900 disabled:text-stone-300"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-2 bg-stone-50 rounded-xl text-center text-xs text-stone-500">
          <button
            onClick={onOpenAuth}
            className="text-emerald-700 font-semibold hover:underline"
          >
            Log in
          </button>{' '}
          to join the conversation and comment.
        </div>
      )}
    </div>
  );
};
