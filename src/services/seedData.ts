import { collection, getDocs, addDoc, serverTimestamp, limit, query } from 'firebase/firestore';
import { db } from '../firebase/config';

export const INITIAL_COMMUNITY_POSTS = [
  {
    spaceId: 'news',
    title: 'Historic Commissioning of the Oju-Obi-Makurdi Federal Highway Rehabilitation',
    headline: 'Federal and State Infrastructure Team inspects completed sections of Oju-Awum-Obi Highway',
    newsCategory: 'Infrastructure',
    content: 'The long-awaited rehabilitation of the central road artery connecting Oju LGA, Obi LGA, and the state capital has made tremendous progress. Community elders and youth leaders gathered today at the Ito council square to commend the high engineering standards and improved transit times for agricultural produce.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?auto=format&fit=crop&w=1000&q=80',
    authorId: 'igede_news_desk',
    authorName: 'Igede Voice Editorial',
    authorPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    likesCount: 24,
    commentsCount: 6,
  },
  {
    spaceId: 'oju',
    title: 'Welcome to LGEDE Village! Celebrating Community, Culture & Unity in Oju LGA',
    content: 'Oju is vibrant with joy as cultural dance groups, drummers, youth and elders gather in traditional blue, black, and white Igede attire! Let us come together in unity, honor our heritage, and celebrate community progress with love and hospitality. Welcome to our village!',
    imageUrl: '/igede_village_banner.jpg',
    authorId: 'elder_odeh',
    authorName: 'Elder Lawrence Odeh',
    authorPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    likesCount: 58,
    commentsCount: 16,
  },
  {
    spaceId: 'obi',
    title: 'Obi LGA Youth Skill Acquisition & Tech Training Initiative',
    content: 'We are delighted to announce a 6-week intensive digital skills and solar installation workshop for youth in Obi. Classes will take place at the Ito ICT center. Certificates and starter kits will be awarded to top participants. Let us build a self-reliant generation.',
    imageUrl: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1000&q=80',
    authorId: 'grace_egbe',
    authorName: 'Engr. Grace Egbe',
    authorPhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    likesCount: 35,
    commentsCount: 8,
  },
  {
    spaceId: 'market',
    title: 'Fresh Grade-A Igede Yams & Pure Red Palm Oil (Direct Farm Gate)',
    product: '200 Tubers of Premium Igede Yams & 25L Palm Oil',
    price: '₦85,000 bundle',
    category: 'Agricultural Produce',
    sellerContact: '+234 803 456 7890 (Call / WhatsApp)',
    content: 'Freshly harvested giant yams directly from our farms in Uwokwu. Sweet, dry, and ideal for pounded yam. Also available: Grade-1 clarified palm oil in 25-litre jerricans. Delivery available across Benue, Abuja, and Lagos.',
    imageUrl: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=1000&q=80',
    authorId: 'sunday_adima',
    authorName: 'Sunday Adima Farms',
    authorPhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    likesCount: 19,
    commentsCount: 4,
  },
  {
    spaceId: 'jobs',
    title: 'Community Health Extension Workers (CHEW) & Staff Nurses',
    company: 'Oju General Hospital & Rural Outreach Initiative',
    jobLocation: 'Oju & Obi Primary Healthcare Centers',
    requirements: 'ND / RN Certification, 1+ year practical clinical experience, fluency in Igede dialect',
    applyInfo: 'Send CV to jobs@igedehealthtrust.org or submit physically at Oju Central Clinic',
    content: 'We are expanding maternal and primary healthcare services across rural communities in Oju and Obi. Competitive monthly remuneration, housing allowance, and hazard bonus included.',
    imageUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1000&q=80',
    authorId: 'dr_okpabi',
    authorName: 'Dr. Michael Okpabi',
    authorPhoto: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=200&q=80',
    likesCount: 29,
    commentsCount: 7,
  },
  {
    spaceId: 'singles',
    title: 'Hello Family! Civil Engineer in Abuja seeking sincere friendship',
    age: '29',
    lookingFor: 'Genuine, God-fearing Igede lady for long-term friendship and courtship',
    interests: 'Reading, traditional highlife music, community volunteer work, cooking',
    content: 'Greetings everyone in the Single Girls & Boys Space! I grew up in Ito, Obi LGA, now practicing civil engineering in Abuja. Believer in mutual respect, family values, and uplifting each other. Looking forward to meeting great minds here.',
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1000&q=80',
    authorId: 'kenneth_ogbu',
    authorName: 'Kenneth Ogbu',
    authorPhoto: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
    likesCount: 31,
    commentsCount: 14,
  }
];

export async function checkAndSeedInitialPosts(): Promise<void> {
  if (typeof window !== 'undefined' && sessionStorage.getItem('igede_posts_seeded_checked')) {
    return;
  }
  try {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('igede_posts_seeded_checked', '1');
    }
    const q = query(collection(db, 'posts'), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) {
      console.log('Seeding initial community posts for lgede unity forum...');
      for (const p of INITIAL_COMMUNITY_POSTS) {
        await addDoc(collection(db, 'posts'), {
          ...p,
          likes: {},
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
    }
  } catch (err) {
    console.warn('Initial seed skipped or failed (may already be initialized or waiting for rules)', err);
  }
}
