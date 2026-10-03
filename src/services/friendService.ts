import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { FriendRequest, Friendship, UserProfile } from '../types';
import { MemoryCache } from '../utils/cache';
import { RateLimiter } from '../utils/rateLimiter';

export const friendService = {
  // Helper to generate a consistent friendship ID
  getFriendshipId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  },

  // Helper for request ID
  getRequestId(fromUid: string, toUid: string): string {
    return `${fromUid}_${toUid}`;
  },

  // Send friend request with rate limiting and pre-check
  async sendFriendRequest(
    sender: UserProfile,
    receiver: UserProfile
  ): Promise<void> {
    const rateCheck = RateLimiter.check(`friend_req_${sender.id}`, 2000);
    if (!rateCheck.allowed) {
      throw new Error(`Please wait ${rateCheck.waitSeconds}s before sending another request.`);
    }

    const reqId = this.getRequestId(sender.id, receiver.id);
    const path = `friend_requests/${reqId}`;

    // Verify if already friends using cache if available
    const friendshipId = this.getFriendshipId(sender.id, receiver.id);
    const friendshipDoc = await getDoc(doc(db, 'friendships', friendshipId));
    if (friendshipDoc.exists()) {
      throw new Error('You are already friends with this member.');
    }

    try {
      await setDoc(doc(db, 'friend_requests', reqId), {
        id: reqId,
        senderId: sender.id,
        receiverId: receiver.id,
        senderName: sender.fullName,
        senderPhoto: sender.photoURL || '',
        receiverName: receiver.fullName,
        receiverPhoto: receiver.photoURL || '',
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Cancel a sent friend request
  async cancelFriendRequest(senderId: string, receiverId: string): Promise<void> {
    const reqId = this.getRequestId(senderId, receiverId);
    const path = `friend_requests/${reqId}`;
    try {
      await deleteDoc(doc(db, 'friend_requests', reqId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Decline a received friend request
  async declineFriendRequest(requestId: string): Promise<void> {
    const path = `friend_requests/${requestId}`;
    try {
      await deleteDoc(doc(db, 'friend_requests', requestId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Accept a friend request
  async acceptFriendRequest(request: FriendRequest): Promise<void> {
    const friendshipId = this.getFriendshipId(request.senderId, request.receiverId);
    const friendshipPath = `friendships/${friendshipId}`;

    try {
      // 1. Create friendship doc
      await setDoc(doc(db, 'friendships', friendshipId), {
        id: friendshipId,
        user1Id: request.senderId,
        user2Id: request.receiverId,
        users: [request.senderId, request.receiverId],
        createdAt: serverTimestamp(),
      });

      // 2. Remove pending request
      await deleteDoc(doc(db, 'friend_requests', request.id));
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, friendshipPath);
    }
  },

  // Remove an existing friend
  async removeFriend(userId: string, friendId: string): Promise<void> {
    const friendshipId = this.getFriendshipId(userId, friendId);
    const path = `friendships/${friendshipId}`;
    try {
      await deleteDoc(doc(db, 'friendships', friendshipId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Subscribe to received pending friend requests (bounded)
  subscribeReceivedRequests(
    userId: string,
    onUpdate: (requests: FriendRequest[]) => void
  ) {
    const q = query(
      collection(db, 'friend_requests'),
      where('receiverId', '==', userId),
      where('status', '==', 'pending'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as FriendRequest));
        onUpdate(requests);
      },
      (error) => {
        console.error('Error listening to received requests:', error);
      }
    );
  },

  // Subscribe to sent pending friend requests (bounded)
  subscribeSentRequests(
    userId: string,
    onUpdate: (requests: FriendRequest[]) => void
  ) {
    const q = query(
      collection(db, 'friend_requests'),
      where('senderId', '==', userId),
      where('status', '==', 'pending'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const requests = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...docSnap.data(),
        } as FriendRequest));
        onUpdate(requests);
      },
      (error) => {
        console.error('Error listening to sent requests:', error);
      }
    );
  },

  // Subscribe to confirmed friendships with profile caching
  subscribeFriendships(
    userId: string,
    onUpdate: (friendships: Friendship[]) => void
  ) {
    const q = query(
      collection(db, 'friendships'),
      where('users', 'array-contains', userId),
      limit(100)
    );

    return onSnapshot(
      q,
      async (snapshot) => {
        const rawFriendships = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as Friendship));

        // Fetch friend profiles with cache support
        const enriched: Friendship[] = await Promise.all(
          rawFriendships.map(async (f) => {
            const friendId = f.users.find((u) => u !== userId);
            if (friendId) {
              const cached = MemoryCache.get<UserProfile>(`user_${friendId}`);
              if (cached) {
                return { ...f, friendInfo: cached };
              }

              try {
                const uDoc = await getDoc(doc(db, 'users', friendId));
                if (uDoc.exists()) {
                  const profile = { id: uDoc.id, ...uDoc.data() } as UserProfile;
                  MemoryCache.set(`user_${friendId}`, profile, 5 * 60 * 1000);
                  return { ...f, friendInfo: profile };
                }
              } catch (e) {
                console.warn('Failed to fetch friend profile', friendId, e);
              }
            }
            return f;
          })
        );

        onUpdate(enriched);
      },
      (error) => {
        console.error('Error listening to friendships:', error);
      }
    );
  }
};
