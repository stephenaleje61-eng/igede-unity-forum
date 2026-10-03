export type SpaceId = 'oju' | 'obi' | 'market' | 'singles' | 'news' | 'jobs';

export interface SpaceConfig {
  id: SpaceId;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  accentColor: string;
  bgColor: string;
  badge: string;
}

export interface UserProfile {
  id: string; // Firebase Auth UID
  fullName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string; // e.g. Oju, Obi, Makurdi, Abuja, Lagos, Diaspora
  phone?: string;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  spaceAffiliation?: 'Oju' | 'Obi' | 'General Igede' | 'Diaspora';
  occupation?: string;
  hometown?: string;
  maritalStatus?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Post {
  id: string;
  spaceId: SpaceId;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  title?: string;
  content: string;
  imageUrl?: string;
  
  // Market specific
  product?: string;
  price?: string;
  category?: string;
  sellerContact?: string;
  
  // Job specific
  company?: string;
  jobLocation?: string;
  requirements?: string;
  applyInfo?: string;
  
  // News specific
  headline?: string;
  newsCategory?: string;
  
  // Singles specific
  age?: string;
  lookingFor?: string;
  interests?: string;

  likesCount: number;
  likes?: Record<string, boolean>; // uid map
  commentsCount: number;
  createdAt: any;
  updatedAt?: any;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorPhoto?: string;
  content: string;
  createdAt: any;
}

export interface FriendRequest {
  id: string; // typically senderId_receiverId
  senderId: string;
  receiverId: string;
  senderName: string;
  senderPhoto?: string;
  receiverName: string;
  receiverPhoto?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt: any;
  updatedAt?: any;
}

export interface Friendship {
  id: string; // min(uid1, uid2)_max(uid1, uid2)
  user1Id: string;
  user2Id: string;
  users: string[]; // [uid1, uid2]
  friendInfo?: UserProfile;
  createdAt: any;
}

export interface Conversation {
  id: string; // min(uid1, uid2)_max(uid1, uid2)
  participants: string[];
  participantNames?: Record<string, string>;
  participantPhotos?: Record<string, string>;
  lastMessage?: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp?: any;
  unreadCount?: Record<string, number>;
  updatedAt?: any;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  text: string;
  createdAt: any;
  read?: boolean;
}
