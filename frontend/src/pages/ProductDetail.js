import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, Eye, Calendar, CheckCircle, AlertTriangle, MapPin, Heart, MessageCircle, Star, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import FraudScoreMeter from '../components/FraudScoreMeter';
import TrustBadge from '../components/TrustBadge';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const StarRating = ({ rating, onRate, interactive = false, size = 'md' }) => {
  const [hover, setHover] = useState(0);
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-7 h-7' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRate?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
        >
          <Star className={`${sizeClass} ${(hover || rating) >= star ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'} transition-colors`} />
        </button>
      ))}
    </div>
  );
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ totalRatings: 0, avgRating: 0 });
  const [newReview, setNewReview] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await api.get(`/api/listings/${id}`);
      setListing(data.listing);
      if (isAuthenticated) {
        await api.post(`/api/user/recently-viewed/${id}`).catch(() => {});
        // Check wishlist
        try {
          const wlRes = await api.get('/api/user/wishlist');
          setWishlisted((wlRes.data.wishlist || []).some(l => l._id === id));
        } catch {}
      }
      // Fetch reviews for seller
      if (data.listing?.seller?._id) {
        fetchReviews(data.listing.seller._id);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (sellerId) => {
    try {
      const { data } = await api.get(`/api/reviews/seller/${sellerId}`);
      setReviews(data.reviews || []);
      setReviewStats(data.stats || { totalRatings: 0, avgRating: 0 });
    } catch (err) {}
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) { toast.error('Login karein'); return; }
    try {
      if (wishlisted) {
        await api.delete(`/api/user/wishlist/${id}`);
        setWishlisted(false);
        toast.success('Wishlist se hataya');
      } else {
        await api.post(`/api/user/wishlist/${id}`);
        setWishlisted(true);
        toast.success('Wishlist mein add kiya');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  const handleChat = async () => {
    if (!isAuthenticated) { toast.error('Login karein chat ke liye'); return; }
    try {
      await api.post('/api/chat/start', { listingId: id });
      navigate('/chat');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Chat start nahi ho paya');
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (newReview.rating === 0) { toast.error('Rating select karein'); return; }
    setSubmittingReview(true);
    try {
      await api.post('/api/reviews', {
        sellerId: listing.seller._id,
        listingId: id,
        rating: newReview.rating,
        comment: newReview.comment
      });
      toast.success('Review submit ho gaya!');
      setNewReview({ rating: 0, comment: '' });
      fetchReviews(listing.seller._id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Review submit nahi ho paya');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Listing Not Found</h2>
          <p className="text-slate-400">This listing may have been removed.</p>
        </div>
      </div>
    );
  }

  const trustScore = 100 - (listing.fraudScore || 0);
  const isHighTrust = trustScore >= 70;
  const isSeller = user?.id === listing.seller?._id || user?._id === listing.seller?._id;

  return (
    <div className="min-h-screen py-8" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <Card className="glass-card p-4 mb-4">
              <div className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden mb-4">
                <img src={listing.images?.[selectedImage]?.url || 'https://via.placeholder.com/600'} alt={`${listing.brand} ${listing.model}`} className="w-full h-full object-cover" data-testid="main-image" />
                {isHighTrust && (
                  <div className="absolute top-4 right-4"><TrustBadge verified={true} size="lg" /></div>
                )}
                <button onClick={handleWishlist} className={`absolute top-4 left-4 p-3 rounded-full transition-all ${wishlisted ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-red-500/80'}`} data-testid="detail-wishlist-button">
                  <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {listing.images?.map((img, index) => (
                  <button key={index} onClick={() => setSelectedImage(index)} className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedImage === index ? 'border-purple-500' : 'border-white/10 hover:border-white/30'}`} data-testid={`thumbnail-${index}`}>
                    <img src={img.url} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </Card>
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">AI Verification</h3>
              <div className="flex justify-center"><FraudScoreMeter score={listing.fraudScore || 0} size="lg" /></div>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2" data-testid="product-title">{listing.brand} {listing.model}</h1>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center"><Eye className="w-4 h-4 mr-1" />{listing.views || 0} views</span>
                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" />{new Date(listing.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${listing.condition === 'New' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : listing.condition === 'Like New' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'}`} data-testid="condition-badge">{listing.condition}</span>
              </div>
              <div className="mb-6"><p className="text-4xl font-black gradient-text" data-testid="price">₹{listing.price?.toLocaleString()}</p></div>
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between"><span className="text-slate-400">IMEI Number</span><span className="text-white font-mono">{listing.imei}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Box Available</span><span className={listing.hasBox ? 'text-green-400' : 'text-slate-500'}>{listing.hasBox ? 'Yes' : 'No'}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Original Parts</span><span className={listing.hasOriginalParts ? 'text-green-400' : 'text-slate-500'}>{listing.hasOriginalParts ? 'Yes' : 'No'}</span></div>
              </div>
              {listing.description && (
                <div className="mb-6"><h3 className="text-white font-bold mb-2">Description</h3><p className="text-slate-300">{listing.description}</p></div>
              )}

              {/* Action Buttons */}
              {!isSeller && (
                <div className="space-y-3">
                  <Button onClick={handleChat} className="w-full gradient-primary text-white text-lg py-6" data-testid="chat-with-seller-button">
                    <MessageCircle className="w-5 h-5 mr-2" /> Chat with Seller
                  </Button>
                  <a href={`https://wa.me/918287550979?text=Hi%2C%20interested%20in%20${listing.brand}%20${listing.model}%20-%20%E2%82%B9${listing.price}`} target="_blank" rel="noopener noreferrer" className="block">
                    <Button variant="outline" className="w-full border-green-500/30 text-green-400 hover:bg-green-500/10" data-testid="whatsapp-button">
                      WhatsApp pe baat karein
                    </Button>
                  </a>
                </div>
              )}
            </Card>

            {/* Seller Info */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Seller Information</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-400">{listing.seller?.name?.[0]?.toUpperCase() || 'S'}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold">{listing.seller?.name || 'Seller'}</p>
                    {listing.seller?.verificationBadge && <TrustBadge verified={true} size="sm" />}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <StarRating rating={Math.round(reviewStats.avgRating)} size="sm" />
                    <span className="text-xs text-slate-400">{reviewStats.avgRating} ({reviewStats.totalRatings} reviews)</span>
                  </div>
                  <p className="text-sm text-slate-400">Member since {new Date(listing.seller?.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-slate-400"><Mail className="w-4 h-4 mr-2" />{listing.seller?.email || 'Email hidden'}</div>
                {listing.seller?.phone && (<div className="flex items-center text-slate-400"><Phone className="w-4 h-4 mr-2" />{listing.seller.phone}</div>)}
                <div className="flex items-center text-slate-400"><MapPin className="w-4 h-4 mr-2" />Delhi, India</div>
              </div>
            </Card>

            {/* Verification Details */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Verification Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between"><span className="text-slate-400">IMEI Valid</span><span className={listing.aiVerification?.imeiValid ? 'text-green-400' : 'text-red-400'}>{listing.aiVerification?.imeiValid ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Bill Verified</span><span className={listing.aiVerification?.billVerified ? 'text-green-400' : 'text-red-400'}>{listing.aiVerification?.billVerified ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}</span></div>
                <div className="flex items-center justify-between"><span className="text-slate-400">Image Quality</span><span className={listing.aiVerification?.imageQuality === 'good' ? 'text-green-400' : 'text-yellow-400'}>{listing.aiVerification?.imageQuality === 'good' ? 'Good' : 'Fair'}</span></div>
              </div>
            </Card>
          </div>
        </motion.div>

        {/* Reviews Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8">
          <Card className="glass-card p-6" data-testid="reviews-section">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">Seller Reviews</h3>
              <div className="flex items-center gap-2">
                <StarRating rating={Math.round(reviewStats.avgRating)} size="md" />
                <span className="text-white font-bold">{reviewStats.avgRating}</span>
                <span className="text-slate-400">({reviewStats.totalRatings})</span>
              </div>
            </div>

            {/* Write Review */}
            {isAuthenticated && !isSeller && (
              <form onSubmit={handleReviewSubmit} className="mb-8 p-4 bg-slate-800/50 rounded-xl" data-testid="review-form">
                <h4 className="text-white font-medium mb-3">Rate this seller</h4>
                <div className="mb-3">
                  <StarRating rating={newReview.rating} onRate={(r) => setNewReview(prev => ({ ...prev, rating: r }))} interactive size="lg" />
                </div>
                <Textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Apna experience share karein..."
                  className="bg-slate-950 border-white/10 text-white mb-3"
                  rows={3}
                  data-testid="review-comment-input"
                />
                <Button type="submit" disabled={submittingReview || newReview.rating === 0} className="gradient-primary" data-testid="submit-review-button">
                  <Send className="w-4 h-4 mr-2" /> {submittingReview ? 'Submitting...' : 'Submit Review'}
                </Button>
              </form>
            )}

            {/* Reviews List */}
            <div className="space-y-4" data-testid="reviews-list">
              {reviews.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No reviews yet</p>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="p-4 bg-slate-800/30 rounded-xl" data-testid={`review-${review._id}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-xs font-bold text-purple-400">{review.reviewer?.name?.[0]?.toUpperCase() || '?'}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{review.reviewer?.name || 'Anonymous'}</p>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      <span className="text-xs text-slate-500 ml-auto">{new Date(review.createdAt).toLocaleDateString()}</span>
                    </div>
                    {review.comment && <p className="text-slate-300 text-sm ml-11">{review.comment}</p>}
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
