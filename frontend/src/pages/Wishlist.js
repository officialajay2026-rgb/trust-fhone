import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import ListingCard from '../components/ListingCard';
import api from '../utils/api';
import { toast } from 'sonner';

const Wishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data } = await api.get('/api/user/wishlist');
      setWishlist(data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (listingId) => {
    try {
      await api.delete(`/api/user/wishlist/${listingId}`);
      setWishlist(prev => prev.filter(l => l._id !== listingId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove');
    }
  };

  return (
    <div className="min-h-screen py-8" data-testid="wishlist-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-red-400" />
            <h1 className="text-3xl font-black text-white" data-testid="wishlist-title">My Wishlist</h1>
            <span className="bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-sm font-bold">
              {wishlist.length} items
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-80 animate-pulse" />
              ))}
            </div>
          ) : wishlist.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="wishlist-grid">
              {wishlist.map((listing) => (
                <div key={listing._id} className="relative">
                  <ListingCard listing={listing} />
                  <button
                    onClick={() => removeFromWishlist(listing._id)}
                    className="absolute top-3 right-3 z-10 p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors"
                    data-testid={`remove-wishlist-${listing._id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <Card className="glass-card p-12 text-center">
              <Heart className="w-16 h-16 text-slate-700 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">No saved phones yet</h2>
              <p className="text-slate-400 mb-6">Browse the marketplace and tap the heart icon to save phones you like</p>
              <a href="/marketplace">
                <Button className="gradient-primary">Browse Marketplace</Button>
              </a>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Wishlist;
