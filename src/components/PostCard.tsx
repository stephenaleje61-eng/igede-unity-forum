import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Tag,
  MapPin,
  Briefcase,
  Phone,
  Flame,
  ShoppingBag,
  ExternalLink,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { Post, SpaceId } from '../types';
import { COMMUNITY_SPACES } from '../config/spaces';
import { useAuth } from '../context/AuthContext';
import { forumService } from '../services/forumService';
import { CommentsSection } from './CommentsSection';
import { isImageAllowedForSpace } from '../utils/imageHelper';

interface PostCardProps {
  post: Post;
  onOpenAuth: () => void;
  onViewMember: (memberId: string) => void;
  onContactSeller?: (post: Post) => void;
  onConnectSingle?: (post: Post) => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  onOpenAuth,
  onViewMember,
  onContactSeller,
  onConnectSingle,
}) => {
  const { currentUser } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState<boolean | null>(null);
  const [optimisticCountOffset, setOptimisticCountOffset] = useState<number>(0);

  const space = COMMUNITY_SPACES[post.spaceId] || COMMUNITY_SPACES['oju'];
  const isLiked = currentUser
    ? (optimisticLiked !== null ? optimisticLiked : Boolean(post.likes?.[currentUser.uid]))
    : false;
  const isAuthor = currentUser?.uid === post.authorId;
  const displayLikesCount = Math.max(0, (post.likesCount || 0) + optimisticCountOffset);

  const handleLike = async () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const nextState = !isLiked;
    setOptimisticLiked(nextState);
    setOptimisticCountOffset((prev) => prev + (nextState ? 1 : -1));
    try {
      await forumService.toggleLike(post.id, currentUser.uid, isLiked);
    } catch {
      setOptimisticLiked(null);
      setOptimisticCountOffset(0);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    await forumService.deletePost(post.id);
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    if (timestamp.toDate) {
      const d = timestamp.toDate();
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    return 'Recently';
  };

  return (
    <article className="bg-white rounded-3xl border border-stone-200 shadow-xs hover:shadow-sm transition-all overflow-hidden">
      
      {/* Post Header */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onViewMember(post.authorId)}
              className="relative group shrink-0"
            >
              <img
                src={post.authorPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={post.authorName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-stone-100 group-hover:ring-emerald-600 transition-all"
              />
            </button>
            <div>
              <button
                type="button"
                onClick={() => onViewMember(post.authorId)}
                className="font-bold text-sm text-stone-900 hover:text-emerald-800 transition-colors text-left block leading-tight"
              >
                {post.authorName}
              </button>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-400">
                <span>{formatDate(post.createdAt)}</span>
                <span>•</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${space.bgColor}`}>
                  {space.name}
                </span>
              </div>
            </div>
          </div>

          {/* Delete Action if owner */}
          {isAuthor && (
            <div className="flex items-center gap-1">
              {confirmDelete ? (
                <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200 text-[11px]">
                  <span className="text-red-700 font-semibold px-1">Delete post?</span>
                  <button
                    onClick={handleDelete}
                    className="px-2 py-0.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-1.5 py-0.5 text-stone-600 hover:text-stone-800"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleDelete}
                  title="Delete post"
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Space-Specific Prominent Features */}

        {/* NEWS HEADLINE & CATEGORY */}
        {post.spaceId === 'news' && (
          <div className="mt-3.5 pt-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-red-100 text-red-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
              <Flame className="w-3.5 h-3.5 fill-red-600 text-red-600" />
              <span>{post.newsCategory || 'Breaking News'}</span>
            </div>
            {post.headline && (
              <h3 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                {post.headline}
              </h3>
            )}
          </div>
        )}

        {/* MARKET PRODUCT & PRICE BADGE */}
        {post.spaceId === 'market' && (
          <div className="mt-3.5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">
                {post.category || 'Market Listing'}
              </span>
              <h3 className="text-sm sm:text-base font-black text-stone-900">
                {post.product || post.title}
              </h3>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 rounded-xl bg-amber-600 text-white font-black text-sm shadow-xs">
                {post.price}
              </span>
            </div>
          </div>
        )}

        {/* JOBS BADGE & DETAILS */}
        {post.spaceId === 'jobs' && (
          <div className="mt-3.5 p-3 rounded-2xl bg-blue-50/80 border border-blue-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">
                  Career Vacancy
                </span>
                <h3 className="text-sm sm:text-base font-black text-stone-900">
                  {post.title}
                </h3>
                <p className="text-xs font-semibold text-blue-900 mt-0.5 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-blue-700" />
                  <span>{post.company}</span>
                  {post.jobLocation && (
                    <>
                      <span className="text-stone-400">•</span>
                      <MapPin className="w-3.5 h-3.5 text-stone-500" />
                      <span className="text-stone-600">{post.jobLocation}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            {post.requirements && (
              <p className="mt-2 text-xs text-stone-600 border-t border-blue-200/60 pt-1.5">
                <strong>Requirements:</strong> {post.requirements}
              </p>
            )}
            {post.applyInfo && (
              <div className="mt-2 text-xs bg-white/80 p-2 rounded-lg text-blue-900 font-medium">
                <strong>How to Apply:</strong> {post.applyInfo}
              </div>
            )}
          </div>
        )}

        {/* SINGLES INTRO BADGES */}
        {post.spaceId === 'singles' && (
          <div className="mt-3.5 p-3 rounded-2xl bg-rose-50/80 border border-rose-200 flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800 block">
                Single Girls & Boys Space
              </span>
              <div className="flex items-center gap-2 mt-1">
                {post.age && (
                  <span className="px-2 py-0.5 rounded-full bg-white text-rose-800 font-bold text-xs border border-rose-200">
                    Age: {post.age}
                  </span>
                )}
                {post.lookingFor && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-medium text-xs">
                    Looking for: {post.lookingFor}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onViewMember(post.authorId)}
              className="px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Say Hello 👋
            </button>
          </div>
        )}

        {/* Standard Post Title for Oju / Obi spaces */}
        {(post.spaceId === 'oju' || post.spaceId === 'obi') && post.title && (
          <h3 className="mt-3 text-base sm:text-lg font-bold text-stone-900 leading-snug">
            {post.title}
          </h3>
        )}

        {/* Post Text Content */}
        <p className="mt-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
          {post.content}
        </p>

        {/* Market Contact Button */}
        {post.spaceId === 'market' && post.sellerContact && (
          <div className="mt-3 flex items-center gap-2">
            <a
              href={`tel:${post.sellerContact.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Contact Seller: {post.sellerContact}</span>
            </a>
          </div>
        )}
      </div>

      {/* Post Image Attachment - Only displayed in allowed spaces: Market, Oju, Singles, Jobs */}
      {post.imageUrl && isImageAllowedForSpace(post.spaceId) && (
        <div className="relative w-full bg-stone-100 max-h-96 overflow-hidden">
          <img
            src={post.imageUrl}
            alt={post.title || 'Post attachment'}
            className="w-full h-auto object-cover max-h-96"
            loading="lazy"
          />
        </div>
      )}

      {/* Engagement Actions Footer */}
      <div className="px-4 sm:px-5 py-3 bg-stone-50/60 border-t border-stone-100 flex items-center justify-between">
        <div className="flex items-center gap-4">
          
          {/* Like button */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              isLiked ? 'text-rose-600' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
            <span>{displayLikesCount}</span>
          </button>

          {/* Comment toggle button */}
          <button
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center gap-1.5 text-xs font-semibold transition-colors ${
              showComments ? 'text-emerald-800' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.commentsCount || 0}</span>
            <span className="hidden sm:inline">Comments</span>
          </button>
        </div>

        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800 font-medium"
        >
          <Share2 className="w-4 h-4" />
          <span>{copied ? 'Copied Link!' : 'Share'}</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="px-4 sm:px-5 pb-4 bg-stone-50/40">
          <CommentsSection
            postId={post.id}
            onOpenAuth={onOpenAuth}
            onViewMember={onViewMember}
          />
        </div>
      )}
    </article>
  );
};
