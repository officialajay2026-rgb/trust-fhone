import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, Eye, MapPin } from 'lucide-react';
import TrustBadge from './TrustBadge';
import { Card } from './ui/card';

const ListingCard = ({ listing, onWishlistToggle }) => {
  const trustScore = 100 - (listing.fraudScore || 0);
  const isHighTrust = trustScore >= 70;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      data-testid="listing-card"
    >
      <Card className="glass-card overflow-hidden hover-lift cursor-pointer group">
        <Link to={`/product/${listing._id}`}>
          {/* Image */}
          <div className="relative h-48 bg-slate-800 overflow-hidden">
            <img
              src={listing.images?.[0]?.url || 'https://via.placeholder.com/400x300'}
              alt={`${listing.brand} ${listing.model}`}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            {isHighTrust && (
              <div className="absolute top-2 right-2">
                <TrustBadge verified={true} size="sm" />
              </div>
            )}
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

          {/* Content */}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                  {listing.brand} {listing.model}
                </h3>
                <p className="text-sm text-slate-400">By {listing.seller?.name || 'Seller'}</p>
              </div>
              {onWishlistToggle && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onWishlistToggle(listing._id);
                  }}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                  data-testid="wishlist-button"
                >
                  <Heart className="w-5 h-5" />
                </button>
              )}
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
                <div
                  className={`text-sm font-bold ${
                    trustScore >= 70
                      ? 'text-green-400'
                      : trustScore >= 40
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}
                >
                  {trustScore}% Trust
                </div>
                {listing.hasBox && (
                  <span className="text-xs text-slate-400">✓ Box Available</span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </Card>
    </motion.div>
  );
};

export default ListingCard;