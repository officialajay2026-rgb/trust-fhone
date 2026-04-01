import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye } from 'lucide-react';
import TrustBadge from './TrustBadge';
import { Card } from './ui/card';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

const ListingCard = ({ listing, onWishlistToggle, isWishlisted: initialWishlisted }) => {
  const { isAuthenticated } = useAuth();
  const [wishlisted, setWishlisted] = useState(initialWishlisted || false);
  const trustScore = 100 - (listing.fraudScore || 0);
  const isHighTrust = trustScore >= 70;

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Login karein wishlist use karne ke liye');
      return;
    }
    try {
      if (wishlisted) {
        await api.delete(`/api/user/wishlist/${listing._id}`);
        setWishlisted(false);
        toast.success('Wishlist se hataya');
      } else {
        await api.post(`/api/user/wishlist/${listing._id}`);
        setWishlisted(true);
        toast.success('Wishlist mein add kiya');
      }
      if (onWishlistToggle) onWishlistToggle(listing._id);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error';
      if (msg.includes('already')) { setWishlisted(true); }
      else toast.error(msg);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      data-testid="listing-card"
    >
      <Card className="glass-card overflow-hidden hover-lift cursor-pointer group">
        <Link to={`/product/${listing._id}`}>
          <div className="relative h-48 bg-slate-800 overflow-hidden">
            <img
              src={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
              alt={`${listing.brand} ${listing.model}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {isHighTrust && (
              <div className="absolute top-2 left-2">
                <TrustBadge verified={true} size="sm" />
              </div>
            )}
            <button
              onClick={handleWishlist}
              className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
                wishlisted ? 'bg-red-500/90 text-white' : 'bg-black/50 text-slate-300 hover:bg-red-500/80 hover:text-white'
              }`}
              data-testid="wishlist-heart-button"
            >
              <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
            <div className="absolute bottom-2 left-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-bold ${
                  listing.condition === 'New'
                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                    : listing.condition === 'Like New'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                }`}
              >
                {listing.condition}
              </span>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-2">
              <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                {listing.brand} {listing.model}
              </h3>
              <p className="text-sm text-slate-400">By {listing.seller?.name || 'Seller'}</p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div>
                <p className="text-2xl font-black gradient-text">₹{listing.price?.toLocaleString()}</p>
                <div className="flex items-center text-xs text-slate-400 mt-1">
                  <Eye className="w-3 h-3 mr-1" />
                  {listing.views || 0} views
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-bold ${trustScore >= 70 ? 'text-green-400' : trustScore >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {trustScore}% Trust
                </div>
                {listing.hasBox && <span className="text-xs text-slate-400">Box Available</span>}
              </div>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};

export default ListingCard;
