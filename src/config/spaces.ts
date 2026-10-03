import { SpaceConfig, SpaceId } from '../types';

export const COMMUNITY_SPACES: Record<SpaceId, SpaceConfig> = {
  oju: {
    id: 'oju',
    name: 'Oju Space',
    tagline: 'Heartland of Igede Heritage & Unity',
    description: 'Connect, discuss local developments, cultural traditions, festivals like Igede Agba, and community affairs in Oju Local Government Area.',
    icon: 'Landmark',
    accentColor: 'emerald',
    bgColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-300',
    badge: 'Oju LGA'
  },
  obi: {
    id: 'obi',
    name: 'Obi Space',
    tagline: 'The Pride of Obi Communities',
    description: 'Share initiatives, youth empowerment programs, hometown stories, and community growth for Obi Local Government Area.',
    icon: 'Compass',
    accentColor: 'teal',
    bgColor: 'bg-teal-500/10 text-teal-700 border-teal-300',
    badge: 'Obi LGA'
  },
  market: {
    id: 'market',
    name: 'Market Space',
    tagline: 'Buy, Sell & Trade with Fellow Igede People',
    description: 'Post agricultural produce (yams, cassava, palm oil), crafts, vehicles, electronics, fashion, and business services.',
    icon: 'ShoppingBag',
    accentColor: 'amber',
    bgColor: 'bg-amber-500/10 text-amber-700 border-amber-300',
    badge: 'Marketplace'
  },
  singles: {
    id: 'singles',
    name: 'Single Girls & Boys Space',
    tagline: 'Meaningful Friendships & Romance',
    description: 'Meet single, eligible Igede brothers and sisters at home and in the diaspora in a respectful, warm, and uplifting atmosphere.',
    icon: 'Heart',
    accentColor: 'rose',
    bgColor: 'bg-rose-500/10 text-rose-700 border-rose-300',
    badge: 'Friendship & Dating'
  },
  news: {
    id: 'news',
    name: 'lgede Breaking News',
    tagline: 'Fast, Authentic & Verified Community Bulletins',
    description: 'Stay informed with verified breaking news, political updates, infrastructural projects, and milestones across Igedeland and Benue State.',
    icon: 'Flame',
    accentColor: 'red',
    bgColor: 'bg-red-500/10 text-red-700 border-red-300',
    badge: 'Breaking News'
  },
  jobs: {
    id: 'jobs',
    name: 'Job Opportunity Space',
    tagline: 'Empowering Careers & Livelihoods',
    description: 'Find and post vacancies, internships, federal & state opportunities, remote jobs, and artisan contracts for sons and daughters of Igede.',
    icon: 'Briefcase',
    accentColor: 'blue',
    bgColor: 'bg-blue-500/10 text-blue-700 border-blue-300',
    badge: 'Careers'
  }
};

export const SPACES_LIST = Object.values(COMMUNITY_SPACES);
