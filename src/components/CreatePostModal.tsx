import React, { useState } from 'react';
import {
  X,
  Image as ImageIcon,
  Sparkles,
  ShoppingBag,
  Heart,
  Flame,
  Briefcase,
  Landmark,
  Compass,
  AlertCircle
} from 'lucide-react';
import { SpaceId } from '../types';
import { COMMUNITY_SPACES, SPACES_LIST } from '../config/spaces';
import { useAuth } from '../context/AuthContext';
import { forumService } from '../services/forumService';
import { compressImage, isImageAllowedForSpace } from '../utils/imageHelper';
import { RateLimiter } from '../utils/rateLimiter';

interface CreatePostModalProps {
  isOpen: boolean;
  defaultSpace?: SpaceId;
  onClose: () => void;
  onPostCreated: () => void;
}

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  defaultSpace = 'oju',
  onClose,
  onPostCreated,
}) => {
  const { currentUser, userProfile } = useAuth();

  const [selectedSpace, setSelectedSpace] = useState<SpaceId>(defaultSpace);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Market specific
  const [product, setProduct] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Agricultural Produce');
  const [sellerContact, setSellerContact] = useState('');

  // Jobs specific
  const [company, setCompany] = useState('');
  const [jobLocation, setJobLocation] = useState('Oju & Obi, Benue');
  const [requirements, setRequirements] = useState('');
  const [applyInfo, setApplyInfo] = useState('');

  // News specific
  const [headline, setHeadline] = useState('');
  const [newsCategory, setNewsCategory] = useState('Infrastructure & Development');

  // Singles specific
  const [age, setAge] = useState('');
  const [lookingFor, setLookingFor] = useState('Meaningful Relationship');
  const [interests, setInterests] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpaceSelect = (space: SpaceId) => {
    setSelectedSpace(space);
    if (!isImageAllowedForSpace(space)) {
      setImagePreview(null);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isImageAllowedForSpace(selectedSpace)) {
      setErrorMsg('Image posts are only allowed in Market, Oju Space, Single Girls & Boys, and Job Opportunities.');
      return;
    }
    if (e.target.files && e.target.files[0]) {
      try {
        setErrorMsg(null);
        const compressed = await compressImage(e.target.files[0], 960, 960, 0.75);
        setImagePreview(compressed);
      } catch (err: any) {
        console.error('Failed to compress image:', err);
        setErrorMsg(err.message || 'Failed to process image');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userProfile) {
      setErrorMsg('Please log in to create a post');
      return;
    }

    if (!content.trim()) {
      setErrorMsg('Please add some content to your post');
      return;
    }

    // Rate-limiting: prevent accidental double-submits or rapid spam
    const rateCheck = RateLimiter.check(`create_post_${currentUser.uid}`, 6000);
    if (!rateCheck.allowed) {
      setErrorMsg(`Please wait ${rateCheck.waitSeconds}s before publishing another post.`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const allowedPhoto = isImageAllowedForSpace(selectedSpace) ? (imagePreview || undefined) : undefined;
      const postPayload: any = {
        spaceId: selectedSpace,
        authorId: currentUser.uid,
        authorName: userProfile.fullName || 'Community Member',
        authorPhoto: userProfile.photoURL || '',
        title: title.trim() || headline.trim() || product.trim() || undefined,
        content: content.trim(),
        imageUrl: allowedPhoto,
      };

      if (selectedSpace === 'market') {
        if (!product.trim() || !price.trim()) {
          throw new Error('Please provide the product name and price.');
        }
        postPayload.product = product.trim();
        postPayload.price = price.trim();
        postPayload.category = category;
        postPayload.sellerContact = sellerContact.trim() || userProfile.phone || undefined;
      } else if (selectedSpace === 'jobs') {
        if (!company.trim()) {
          throw new Error('Please provide the hiring organization or company.');
        }
        postPayload.company = company.trim();
        postPayload.jobLocation = jobLocation.trim();
        postPayload.requirements = requirements.trim() || undefined;
        postPayload.applyInfo = applyInfo.trim() || undefined;
      } else if (selectedSpace === 'news') {
        postPayload.headline = (headline.trim() || title.trim()) || 'Breaking Announcement';
        postPayload.newsCategory = newsCategory;
      } else if (selectedSpace === 'singles') {
        postPayload.age = age.trim() || undefined;
        postPayload.lookingFor = lookingFor;
        postPayload.interests = interests.trim() || undefined;
      }

      await forumService.createPost(postPayload);
      onPostCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create post:', err);
      setErrorMsg(err.message || 'Failed to submit post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-300" />
            <h2 className="text-base font-bold">Create Post on lgede unity forum</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white/80 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Space Selector */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1.5">
              Select Community Space
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPACES_LIST.map((sp) => {
                const isSelected = selectedSpace === sp.id;
                return (
                  <button
                    key={sp.id}
                    type="button"
                    onClick={() => handleSpaceSelect(sp.id)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center gap-2 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs ring-1 ring-emerald-600'
                        : 'border-stone-200 hover:border-stone-300 text-stone-700'
                    }`}
                  >
                    <span className="truncate">{sp.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Space-Specific Fields */}

          {/* MARKET SPACE FIELDS */}
          {selectedSpace === 'market' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
                <ShoppingBag className="w-4 h-4 text-amber-700" />
                <span>Marketplace Item Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Product / Item Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    placeholder="e.g. 50 Tubers of Oju Yams"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Price (₦ or negotiable) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="e.g. ₦35,000 / bag"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
                  >
                    <option value="Agricultural Produce">Agricultural Produce (Yam, Palm Oil, Cassava)</option>
                    <option value="Livestock & Poultry">Livestock & Poultry (Goats, Fowl, Fish)</option>
                    <option value="Electronics & Phones">Electronics & Phones</option>
                    <option value="Fashion & Cultural Fabrics">Fashion & Cultural Fabrics</option>
                    <option value="Vehicles & Motorcycles">Vehicles & Motorcycles</option>
                    <option value="Real Estate & Farmland">Real Estate & Farmland</option>
                    <option value="Services & Crafts">Services & Artisan Crafts</option>
                    <option value="Other">Other Goods</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Seller Phone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={sellerContact}
                    onChange={(e) => setSellerContact(e.target.value)}
                    placeholder="e.g. +234 803 123 4567"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* JOBS SPACE FIELDS */}
          {selectedSpace === 'jobs' && (
            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                <Briefcase className="w-4 h-4 text-blue-700" />
                <span>Job Vacancy Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Community Health Nurse / Site Engineer"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Company / Employer <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Oju Local Clinic / Agro Allied Ltd"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Job Location
                  </label>
                  <input
                    type="text"
                    value={jobLocation}
                    onChange={(e) => setJobLocation(e.target.value)}
                    placeholder="e.g. Oju, Obi, Makurdi, or Remote"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    How to Apply (Email / Phone / Link)
                  </label>
                  <input
                    type="text"
                    value={applyInfo}
                    onChange={(e) => setApplyInfo(e.target.value)}
                    placeholder="e.g. Send CV to jobs@example.com"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Key Requirements / Qualifications
                </label>
                <input
                  type="text"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="e.g. Minimum ND/HND, 2 years experience"
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* NEWS SPACE FIELDS */}
          {selectedSpace === 'news' && (
            <div className="p-4 bg-red-50/70 border border-red-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-red-900 font-bold text-xs">
                <Flame className="w-4 h-4 text-red-700" />
                <span>lgede Breaking News Bulletin</span>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Breaking Headline <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Major Highway Expansion Commissioned Between Oju and Obi"
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  News Category
                </label>
                <select
                  value={newsCategory}
                  onChange={(e) => setNewsCategory(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-red-500"
                >
                  <option value="Infrastructure & Development">Infrastructure & Development</option>
                  <option value="Governance & Politics">Governance & Politics</option>
                  <option value="Cultural Heritage & Festivals">Cultural Heritage & Festivals</option>
                  <option value="Security & Peace">Security & Community Peace</option>
                  <option value="Education & Scholarships">Education & Scholarships</option>
                  <option value="Sports & Youth">Sports & Youth Milestones</option>
                </select>
              </div>
            </div>
          )}

          {/* SINGLES SPACE FIELDS */}
          {selectedSpace === 'singles' && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
              <div className="flex items-center gap-1.5 text-rose-900 font-bold text-xs">
                <Heart className="w-4 h-4 text-rose-600 fill-rose-600/30" />
                <span>Single Girls & Boys Intro</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Your Age
                  </label>
                  <input
                    type="text"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="e.g. 26"
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-700 mb-1">
                    Seeking / Intent
                  </label>
                  <select
                    value={lookingFor}
                    onChange={(e) => setLookingFor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="Meaningful Relationship">Meaningful Relationship</option>
                    <option value="Courtship & Marriage">Courtship & Marriage</option>
                    <option value="Sincere Friendship & Networking">Sincere Friendship & Networking</option>
                    <option value="Social Companion">Social Companion</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Interests & Hobbies
                </label>
                <input
                  type="text"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. Reading, traveling, cooking, entrepreneurship"
                  className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg bg-white focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* Post Title for general spaces (Oju & Obi) */}
          {(selectedSpace === 'oju' || selectedSpace === 'obi') && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Post Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your topic a clear title..."
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          )}

          {/* Main Content / Description */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              {selectedSpace === 'market' ? 'Product Description & Condition' : selectedSpace === 'jobs' ? 'Job Description & Duties' : selectedSpace === 'news' ? 'Full News Report' : selectedSpace === 'singles' ? 'Self Introduction' : 'Discussion Content'} <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message to the community..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none resize-none"
            />
          </div>

          {/* Image Upload - allowed in Market, Oju, Singles, and Jobs */}
          {isImageAllowedForSpace(selectedSpace) ? (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Add Photo / Image (Optional)
              </label>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImagePreview(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white text-xs cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-2xl cursor-pointer bg-stone-50/50 hover:bg-emerald-50/30 transition-all">
                  <ImageIcon className="w-7 h-7 text-stone-400 mb-1" />
                  <span className="text-xs font-medium text-stone-600">Click to upload photo</span>
                  <span className="text-[10px] text-stone-400 mt-0.5">Optimized JPEG, PNG, WebP</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-stone-600 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="text-[11px] leading-relaxed">
                Photos are permitted in <strong>Market</strong>, <strong>Oju Space</strong>, <strong>Single Girls & Boys</strong>, and <strong>Job Opportunities</strong>. Obi and Breaking News focus on fast, high-clarity community discussions.
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>Publish Post</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
