import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import { SpaceId } from '../types';

/**
 * Spaces where picture posts are officially permitted:
 * - Market Space ('market')
 * - Oju Space ('oju')
 * - Single Girls & Boys Space ('singles')
 * - Job Opportunities ('jobs')
 *
 * Spaces where picture posts are disallowed to keep discussions text-first & fast:
 * - Obi Space ('obi')
 * - lgede Breaking News ('news')
 */
export function isImageAllowedForSpace(spaceId: SpaceId | string): boolean {
  return spaceId === 'market' || spaceId === 'oju' || spaceId === 'singles' || spaceId === 'jobs';
}

/**
 * High-Efficiency Client-Side Image Compression
 * Downscales images to max 960x960 and compresses to quality 0.75 JPEG
 * Reduces file sizes from ~5MB to ~40KB-80KB, perfect for 1M user scale on mobile networks.
 */
export async function compressImage(
  file: File,
  maxWidth = 960,
  maxHeight = 960,
  quality = 0.75
): Promise<string> {
  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Selected file must be an image (JPEG, PNG, WebP).');
  }

  // Pre-check raw size (reject if > 10MB to protect memory)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Image exceeds 10MB limit. Please choose a smaller image.');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding within maxWidth & maxHeight
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(readerEvent.target?.result as string);
          return;
        }

        // Draw image with smoothing for high-quality downsampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as lightweight, highly compressed JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.src = readerEvent.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image base64 data string to Firebase Storage if available,
 * or returns the optimized dataUrl directly as fallback.
 */
export async function uploadImageOrFallback(dataUrl: string, storagePath: string): Promise<string> {
  try {
    const storageRef = ref(storage, storagePath);
    await uploadString(storageRef, dataUrl, 'data_url');
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    // If storage is unavailable or permission denied, the compressed data URL is safely stored in Firestore
    console.info('Storage fallback used: returning optimized data URL');
    return dataUrl;
  }
}

/**
 * Cultural preset avatar URLs with friendly diverse representations
 */
export const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&h=256&q=80',
  'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=256&h=256&q=80',
];

export function getInitialsAvatar(name: string): string {
  const safeName = name ? name.trim() : 'Igede';
  const initial = encodeURIComponent(safeName.charAt(0).toUpperCase());
  return `https://ui-avatars.com/api/?name=${initial}&background=15803d&color=ffffff&bold=true`;
}
