import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  getDocs,
  getDoc,
  limit,
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Post, Comment, SpaceId, UserProfile } from '../types';
import { MemoryCache } from '../utils/cache';
import { RateLimiter } from '../utils/rateLimiter';

export interface PaginatedPostsResult {
  posts: Post[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

// In-flight like locks to prevent race conditions & duplicate writes
const activeLikeLocks = new Set<string>();

export const forumService = {
  /**
   * Subscribe to real-time posts for a given space (bounded to top 20 for scalability)
   */
  subscribePostsBySpace(
    spaceId: SpaceId | 'all',
    onUpdate: (posts: Post[], lastDoc?: QueryDocumentSnapshot<DocumentData> | null) => void,
    onError?: (err: any) => void
  ) {
    const postsRef = collection(db, 'posts');
    const q = spaceId === 'all'
      ? query(postsRef, orderBy('createdAt', 'desc'), limit(20))
      : query(postsRef, where('spaceId', '==', spaceId), orderBy('createdAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const posts: Post[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Post));
        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        onUpdate(posts, lastDoc);
      },
      (error) => {
        console.error('Error listening to posts for space', spaceId, error);
        if (onError) onError(error);
        try {
          handleFirestoreError(error, OperationType.LIST, 'posts');
        } catch {
          // keep caller intact
        }
      }
    );

    return unsubscribe;
  },

  /**
   * Fetch additional posts using cursor-based pagination (startAfter)
   * Designed for infinite scroll / Load More across millions of posts
   */
  async fetchMorePosts(
    spaceId: SpaceId | 'all',
    lastVisibleDoc: QueryDocumentSnapshot<DocumentData>,
    pageSize = 15
  ): Promise<PaginatedPostsResult> {
    const postsRef = collection(db, 'posts');
    const q = spaceId === 'all'
      ? query(postsRef, orderBy('createdAt', 'desc'), startAfter(lastVisibleDoc), limit(pageSize))
      : query(postsRef, where('spaceId', '==', spaceId), orderBy('createdAt', 'desc'), startAfter(lastVisibleDoc), limit(pageSize));

    try {
      const snap = await getDocs(q);
      const posts: Post[] = snap.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      } as Post));

      const newLastDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
      return {
        posts,
        lastDoc: newLastDoc,
        hasMore: snap.docs.length === pageSize,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'posts');
    }
  },

  /**
   * Create a new post in any space
   */
  async createPost(postData: Omit<Post, 'id' | 'createdAt' | 'likesCount' | 'commentsCount'>): Promise<string> {
    const postsPath = 'posts';
    try {
      const docRef = await addDoc(collection(db, postsPath), {
        ...postData,
        likesCount: 0,
        likes: {},
        commentsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, postsPath);
    }
  },

  /**
   * Delete a post
   */
  async deletePost(postId: string): Promise<void> {
    const path = `posts/${postId}`;
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Toggle like on a post with debounce lock & rate limiting
   */
  async toggleLike(postId: string, userId: string, isCurrentlyLiked: boolean): Promise<void> {
    const lockKey = `${postId}_${userId}`;
    if (activeLikeLocks.has(lockKey)) {
      return; // Drop spam clicks while in-flight
    }

    activeLikeLocks.add(lockKey);
    const path = `posts/${postId}`;
    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        [`likes.${userId}`]: !isCurrentlyLiked,
        likesCount: increment(isCurrentlyLiked ? -1 : 1),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    } finally {
      setTimeout(() => {
        activeLikeLocks.delete(lockKey);
      }, 350);
    }
  },

  /**
   * Subscribe to real-time comments on a post (bounded to latest 30)
   */
  subscribeComments(
    postId: string,
    onUpdate: (comments: Comment[]) => void
  ) {
    const commentsPath = `posts/${postId}/comments`;
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'), limit(30));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const comments: Comment[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as Comment));
        onUpdate(comments);
      },
      (error) => {
        console.error('Error listening to comments for post', postId, error);
        try {
          handleFirestoreError(error, OperationType.LIST, commentsPath);
        } catch {
          // ignore
        }
      }
    );

    return unsubscribe;
  },

  /**
   * Add comment to a post with rate limiting and atomic counter increment
   */
  async addComment(
    postId: string,
    commentData: { authorId: string; authorName: string; authorPhoto?: string; content: string }
  ): Promise<void> {
    // Rate limit: max 1 comment every 2.5s per member
    const rateCheck = RateLimiter.check(`comment_${commentData.authorId}`, 2500);
    if (!rateCheck.allowed) {
      throw new Error(`Please wait ${rateCheck.waitSeconds}s before adding another comment.`);
    }

    const commentsPath = `posts/${postId}/comments`;
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        postId,
        ...commentData,
        createdAt: serverTimestamp(),
      });

      // Increment comments count on post
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        commentsCount: increment(1),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, commentsPath);
    }
  },

  /**
   * Fetch community members with bounded limit & cache (scalable for 1M members)
   */
  async getAllMembers(currentUserId?: string, limitCount = 36): Promise<UserProfile[]> {
    const cacheKey = `members_dir_${limitCount}`;
    const cached = MemoryCache.get<UserProfile[]>(cacheKey);
    if (cached) {
      return currentUserId ? cached.filter((m) => m.id !== currentUserId) : cached;
    }

    const usersPath = 'users';
    try {
      const q = query(collection(db, usersPath), limit(limitCount));
      const snapshot = await getDocs(q);
      const members: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() } as UserProfile;
        members.push(data);
        // Cache individual profile
        MemoryCache.set(`user_${docSnap.id}`, data, 5 * 60 * 1000);
      });

      MemoryCache.set(cacheKey, members, 2 * 60 * 1000); // 2 minute cache
      return currentUserId ? members.filter((m) => m.id !== currentUserId) : members;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, usersPath);
    }
  },

  /**
   * Get user profile by ID with high-speed memory cache (zero redundant Firestore reads)
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const cacheKey = `user_${userId}`;
    const cached = MemoryCache.get<UserProfile>(cacheKey);
    if (cached) {
      return cached;
    }

    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (!snap.exists()) return null;
      const profile = { id: snap.id, ...snap.data() } as UserProfile;
      MemoryCache.set(cacheKey, profile, 5 * 60 * 1000); // Cache for 5 mins
      return profile;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  /**
   * Invalidate cached user profile when edited
   */
  invalidateUserCache(userId: string): void {
    MemoryCache.invalidate(`user_${userId}`);
    MemoryCache.invalidate('members_dir');
  }
};
