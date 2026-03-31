import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Mail, Eye, Calendar, Box, CheckCircle, AlertTriangle, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import FraudScoreMeter from '../components/FraudScoreMeter';
import TrustBadge from '../components/TrustBadge';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const ProductDetail = () => {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const { data } = await api.get(`/api/listings/${id}`);
      setListing(data.listing);
      
      // Track view if authenticated
      if (isAuthenticated) {
        await api.post(`/api/user/recently-viewed/${id}`).catch(() => {});
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Listing Not Found</h2>
          <p className="text-slate-400">This listing may have been removed or doesn't exist.</p>
        </div>
      </div>
    );
  }

  const trustScore = 100 - (listing.fraudScore || 0);
  const isHighTrust = trustScore >= 70;

  return (
    <div className="min-h-screen py-8" data-testid="product-detail-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Images */}
          <div>
            <Card className="glass-card p-4 mb-4">
              <div className="relative aspect-square bg-slate-800 rounded-lg overflow-hidden mb-4">
                <img
                  src={listing.images?.[selectedImage]?.url || 'https://via.placeholder.com/600'}
                  alt={`${listing.brand} ${listing.model}`}
                  className="w-full h-full object-cover"
                  data-testid="main-image"
                />
                {isHighTrust && (
                  <div className="absolute top-4 right-4">
                    <TrustBadge verified={true} size="lg" />
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2">
                {listing.images?.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === index
                        ? 'border-purple-500'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    data-testid={`thumbnail-${index}`}
                  >
                    <img
                      src={img.url}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </Card>

            {/* Trust Score */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">AI Verification</h3>
              <div className="flex justify-center">
                <FraudScoreMeter score={listing.fraudScore || 0} size="lg" />
              </div>
            </Card>
          </div>

          {/* Details */}
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-black text-white mb-2" data-testid="product-title">
                    {listing.brand} {listing.model}
                  </h1>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {listing.views || 0} views
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-bold ${
                    listing.condition === 'New'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : listing.condition === 'Like New'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                  }`}
                  data-testid="condition-badge"
                >
                  {listing.condition}
                </span>
              </div>

              <div className="mb-6">
                <p className="text-4xl font-black gradient-text" data-testid="price">
                  ₹{listing.price?.toLocaleString()}
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">IMEI Number</span>
                  <span className="text-white font-mono">{listing.imei}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Box Available</span>
                  <span className={listing.hasBox ? 'text-green-400' : 'text-slate-500'}>
                    {listing.hasBox ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Original Parts</span>
                  <span className={listing.hasOriginalParts ? 'text-green-400' : 'text-slate-500'}>
                    {listing.hasOriginalParts ? '✓ Yes' : '✗ No'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {listing.description && (
                <div className="mb-6">
                  <h3 className="text-white font-bold mb-2">Description</h3>
                  <p className="text-slate-300">{listing.description}</p>
                </div>
              )}

              <Button className="w-full gradient-primary text-white text-lg py-6" data-testid="contact-seller-button">
                <Phone className="w-5 h-5 mr-2" />
                Contact Seller
              </Button>
            </Card>

            {/* Seller Info */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Seller Information</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-400">
                    {listing.seller?.name?.[0]?.toUpperCase() || 'S'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white font-bold">{listing.seller?.name || 'Seller'}</p>
                    {listing.seller?.verificationBadge && <TrustBadge verified={true} size="sm" />}
                  </div>
                  <p className="text-sm text-slate-400">
                    Member since {new Date(listing.seller?.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center text-slate-400">
                  <Mail className="w-4 h-4 mr-2" />
                  {listing.seller?.email || 'Email hidden'}
                </div>
                {listing.seller?.phone && (
                  <div className="flex items-center text-slate-400">
                    <Phone className="w-4 h-4 mr-2" />
                    {listing.seller.phone}
                  </div>
                )}
                <div className="flex items-center text-slate-400">
                  <MapPin className="w-4 h-4 mr-2" />
                  Delhi, India
                </div>
              </div>
            </Card>

            {/* AI Verification Details */}
            <Card className="glass-card p-6">
              <h3 className="text-xl font-bold text-white mb-4">Verification Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">IMEI Valid</span>
                  <span className={listing.aiVerification?.imeiValid ? 'text-green-400' : 'text-red-400'}>
                    {listing.aiVerification?.imeiValid ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Bill Verified</span>
                  <span className={listing.aiVerification?.billVerified ? 'text-green-400' : 'text-red-400'}>
                    {listing.aiVerification?.billVerified ? <CheckCircle className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Image Quality</span>
                  <span className={listing.aiVerification?.imageQuality === 'good' ? 'text-green-400' : 'text-yellow-400'}>
                    {listing.aiVerification?.imageQuality === 'good' ? 'Good' : 'Fair'}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProductDetail;
