import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import ListingCard from '../components/ListingCard';
import api from '../utils/api';
import { toast } from 'sonner';

const Marketplace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    condition: searchParams.get('condition') || '',
    minPrice: 0,
    maxPrice: 100000,
    sort: '-createdAt'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchListings();
  }, [filters, pagination.page]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        sort: filters.sort
      };

      if (filters.search) params.search = filters.search;
      if (filters.brand) params.brand = filters.brand;
      if (filters.condition) params.condition = filters.condition;
      if (filters.minPrice > 0) params.minPrice = filters.minPrice;
      if (filters.maxPrice < 100000) params.maxPrice = filters.maxPrice;

      const { data } = await api.get('/api/listings', { params });
      setListings(data.listings || []);
      setPagination({
        ...pagination,
        total: data.total,
        pages: data.pages
      });
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setPagination({ ...pagination, page: 1 });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      brand: '',
      condition: '',
      minPrice: 0,
      maxPrice: 100000,
      sort: '-createdAt'
    });
    setSearchParams({});
  };

  const brands = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Google', 'Nothing'];

  return (
    <div className="min-h-screen py-8" data-testid="marketplace-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-2" data-testid="marketplace-title">
            Marketplace
          </h1>
          <p className="text-slate-400">Browse verified mobile listings with complete trust</p>
        </div>

        {/* Search & Filters */}
        <div className="glass-card p-4 mb-8" data-testid="filters-section">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search phones..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pl-10 bg-slate-950/50 border-white/10 text-white"
                  data-testid="search-input"
                />
              </div>
            </div>

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-white/20 text-white"
              data-testid="filter-toggle-button"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>

            {/* Sort */}
            <Select value={filters.sort} onValueChange={(value) => handleFilterChange('sort', value)}>
              <SelectTrigger className="w-full md:w-48 bg-slate-950/50 border-white/10 text-white" data-testid="sort-select">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="-createdAt">Newest First</SelectItem>
                <SelectItem value="price">Price: Low to High</SelectItem>
                <SelectItem value="-price">Price: High to Low</SelectItem>
                <SelectItem value="fraudScore">Most Trusted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-6 pt-6 border-t border-white/10"
              data-testid="expanded-filters"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Brand Filter */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Brand</label>
                  <Select value={filters.brand} onValueChange={(value) => handleFilterChange('brand', value)}>
                    <SelectTrigger className="bg-slate-950/50 border-white/10 text-white" data-testid="brand-select">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Brands</SelectItem>
                      {brands.map((brand) => (
                        <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Condition Filter */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">Condition</label>
                  <Select value={filters.condition} onValueChange={(value) => handleFilterChange('condition', value)}>
                    <SelectTrigger className="bg-slate-950/50 border-white/10 text-white" data-testid="condition-select">
                      <SelectValue placeholder="All Conditions" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Conditions</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Price Range: ₹{filters.minPrice.toLocaleString()} - ₹{filters.maxPrice.toLocaleString()}
                  </label>
                  <Slider
                    min={0}
                    max={100000}
                    step={5000}
                    value={[filters.minPrice, filters.maxPrice]}
                    onValueChange={([min, max]) => {
                      setFilters({ ...filters, minPrice: min, maxPrice: max });
                    }}
                    className="mt-2"
                    data-testid="price-slider"
                  />
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-slate-400 hover:text-white"
                  data-testid="clear-filters-button"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="glass-card h-96 animate-pulse" data-testid="skeleton-card" />
            ))}
          </div>
        ) : listings.length > 0 ? (
          <>
            <div className="mb-4 text-slate-400 text-sm" data-testid="results-count">
              Showing {listings.length} of {pagination.total} results
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6" data-testid="listings-grid">
              {listings.map((listing) => (
                <ListingCard key={listing._id} listing={listing} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-12 flex justify-center gap-2" data-testid="pagination">
                <Button
                  variant="outline"
                  onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                  disabled={pagination.page === 1}
                  className="border-white/20 text-white"
                  data-testid="prev-page-button"
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 text-white">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                  disabled={pagination.page === pagination.pages}
                  className="border-white/20 text-white"
                  data-testid="next-page-button"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-20" data-testid="no-results">
            <p className="text-slate-400 text-lg">No listings found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Marketplace;
