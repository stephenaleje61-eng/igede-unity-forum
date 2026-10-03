import {
  collection,
  doc,
  query,
  where,
  orderBy,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDoc,
  increment,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';
import { Conversation, Message, UserProfile } from '../types';
import { RateLimiter } from '../utils/rateLimiter';
import { MemoryCache } from '../utils/cache';

export const chatService = {
  getConversationId(uid1: string, uid2: string): string {
    return [uid1, uid2].sort().join('_');
  },

  // Get or initialize a conversation between two users with cache check
  async getOrCreateConversation(currentUser: UserProfile, friend: UserProfile): Promise<Conversation> {
    const convoId = this.getConversationId(currentUser.id, friend.id);
    const cached = MemoryCache.get<Conversation>(`convo_${convoId}`);
    if (cached) {
      return cached;
    }

    const convoRef = doc(db, 'conversations', convoId);
    const snap = await getDoc(convoRef);

    if (snap.exists()) {
      const convo = { id: snap.id, ...snap.data() } as Conversation;
      MemoryCache.set(`convo_${convoId}`, convo, 2 * 60 * 1000);
      return convo;
    }

    const newConvo: Conversation = {
      id: convoId,
      participants: [currentUser.id, friend.id],
      participantNames: {
        [currentUser.id]: currentUser.fullName,
        [friend.id]: friend.fullName,
      },
      participantPhotos: {
        [currentUser.id]: currentUser.photoURL || '',
        [friend.id]: friend.photoURL || '',
      },
      lastMessage: 'Conversation started',
      lastMessageSenderId: currentUser.id,
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: {
        [currentUser.id]: 0,
        [friend.id]: 0,
      },
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(convoRef, newConvo);
      MemoryCache.set(`convo_${convoId}`, newConvo, 2 * 60 * 1000);
      return newConvo;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `conversations/${convoId}`);
    }
  },

  // Subscribe to all conversations for current user (bounded to 40)
  subscribeConversations(
    userId: string,
    onUpdate: (conversations: Conversation[]) => void
  ) {
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('updatedAt', 'desc'),
      limit(40)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const convos = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as Conversation));
        onUpdate(convos);
      },
      (error) => {
        console.error('Error listening to conversations:', error);
      }
    );
  },

  // Subscribe to real-time messages in a conversation (bounded to 50 for mobile speed)
  subscribeMessages(
    conversationId: string,
    onUpdate: (messages: Message[]) => void
  ) {
    const messagesPath = `conversations/${conversationId}/messages`;
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as Message));
        onUpdate(msgs);
      },
      (error) => {
        console.error('Error listening to messages:', error);
        try {
          handleFirestoreError(error, OperationType.LIST, messagesPath);
        } catch {
          // ignore
        }
      }
    );
  },

  // Send a message with rate limiting and unread increments
  async sendMessage(
    conversationId: string,
    sender: UserProfile,
    receiverId: string,
    text: string
  ): Promise<void> {
    const cleanText = text.trim();
    if (!cleanText) return;

    // Throttle chat message dispatch: max 1 msg every 500ms
    const rateCheck = RateLimiter.check(`chat_${sender.id}`, 500);
    if (!rateCheck.allowed) {
      return;
    }

    const messagesPath = `conversations/${conversationId}/messages`;
    try {
      // 1. Add message doc
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        conversationId,
        senderId: sender.id,
        senderName: sender.fullName,
        senderPhoto: sender.photoURL || '',
        text: cleanText,
        createdAt: serverTimestamp(),
      });

      // 2. Update conversation header
      const convoRef = doc(db, 'conversations', conversationId);
      await updateDoc(convoRef, {
        lastMessage: cleanText,
        lastMessageSenderId: sender.id,
        lastMessageTimestamp: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`unreadCount.${receiverId}`]: increment(1),
        [`unreadCount.${sender.id}`]: 0,
      });

      MemoryCache.invalidate(`convo_${conversationId}`);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, messagesPath);
    }
  },

  // Reset unread counter for current user in conversation
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      const convoRef = doc(db, 'conversations', conversationId);
      await updateDoc(convoRef, {
        [`unreadCount.${userId}`]: 0,
      });
    } catch (e) {
      console.warn('Could not mark conversation as read:', e);
    }
  }
};
