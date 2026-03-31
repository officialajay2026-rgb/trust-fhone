import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Zap, Search, TrendingUp, Lock, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import ListingCard from '../components/ListingCard';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const [featuredListings, setFeaturedListings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    fetchFeaturedListings();
  }, []);

  const fetchFeaturedListings = async () => {
    try {
      const { data } = await api.get('/api/listings?limit=6&sort=-createdAt');
      setFeaturedListings(data.listings || []);
    } catch (error) {
      console.error('Error fetching featured listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/marketplace?search=${searchQuery}`);
    }
  };

  return (
    <div data-testid="home-page">
      {/* Hero Section */}
      <section
        className="relative py-20 lg:py-32 overflow-hidden"
        style={{
          backgroundImage: 'url(https://static.prod-images.emergentagent.com/jobs/8d106aa1-6d12-4c5b-9a2c-eb67cd53533b/images/7791a881020bb25b59cb20fbe0c8e841dda492e65217ad7398a64e6a81f4d8e7.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#020617]/80 to-[#020617]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <div className="inline-flex items-center px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full mb-6" data-testid="hero-badge">
              <Zap className="w-4 h-4 neon-green mr-2" />
              <span className="text-sm font-bold neon-green">AI-Powered Fraud Detection</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter text-white mb-6" data-testid="hero-title">
              Trusted Phones.
              <br />
              <span className="gradient-text">Zero Fraud.</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto mb-8" data-testid="hero-subtitle">
              India's first AI-verified mobile marketplace. Every listing verified through IMEI validation, bill authentication, and fraud detection.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-8" data-testid="hero-search-form">
              <div className="flex glass-card p-2">
                <Input
                  type="text"
                  placeholder="Search for iPhone, Samsung, OnePlus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-0 text-white placeholder:text-slate-400 focus-visible:ring-0"
                  data-testid="hero-search-input"
                />
                <Button type="submit" className="gradient-primary" data-testid="hero-search-button">
                  <Search className="w-5 h-5" />
                </Button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/marketplace" data-testid="browse-phones-button">
                <Button size="lg" className="gradient-primary text-white hover:scale-105 transition-transform">
                  Browse Phones
                </Button>
              </Link>
              {!isAuthenticated && (
                <Link to="/auth" data-testid="sell-phone-button">
                  <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Sell Your Phone
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Features */}
      <section className="py-20 bg-slate-900/50" data-testid="trust-features-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Why TrustFhone Delhi?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Advanced AI technology ensures every transaction is safe, verified, and fraud-free.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: 'IMEI Verification',
                description: 'Every phone verified using Luhn algorithm. No fake or duplicate IMEI allowed.',
                color: 'green'
              },
              {
                icon: CheckCircle,
                title: 'Bill Authentication',
                description: 'AI-powered OCR verifies original purchase bills for brand and price matching.',
                color: 'blue'
              },
              {
                icon: Lock,
                title: 'Fraud Score System',
                description: 'Real-time fraud detection scores every listing. High-risk listings auto-rejected.',
                color: 'purple'
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="glass-card p-8 text-center hover-lift"
                data-testid={`feature-${index}`}
              >
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${feature.color}-500/10 border border-${feature.color}-500/30 mb-4`}>
                  <feature.icon className={`w-8 h-8 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-20" data-testid="featured-listings-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">Trending Deals</h2>
              <p className="text-slate-400">Verified listings with highest trust scores</p>
            </div>
            <Link to="/marketplace" data-testid="view-all-button">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                View All
                <TrendingUp className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card h-80 animate-pulse" data-testid="skeleton-card" />
              ))}
            </div>
          ) : featuredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6" data-testid="featured-listings-grid">
              {featuredListings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400">No listings available yet. Be the first to list!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden" data-testid="cta-section">
        <div className="absolute inset-0 gradient-primary opacity-10"></div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Sell Your Phone?
          </h2>
          <p className="text-lg text-slate-300 mb-8">
            Join thousands of verified sellers. List your phone in minutes with complete trust.
          </p>
          <Link to={isAuthenticated ? '/seller-dashboard' : '/auth'} data-testid="start-selling-button">
            <Button size="lg" className="gradient-primary text-white hover:scale-105 transition-transform">
              Start Selling Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;