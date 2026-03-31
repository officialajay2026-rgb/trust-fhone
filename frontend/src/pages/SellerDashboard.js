import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Package, Clock, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import api from '../utils/api';
import { uploadMultipleToCloudinary, uploadToCloudinary } from '../utils/cloudinary';

const SellerDashboard = () => {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    price: '',
    condition: 'Used',
    imei: '',
    hasBox: false,
    hasOriginalParts: false,
    description: '',
    productImages: [],
    billImage: null
  });

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const { data } = await api.get('/api/listings/my/listings');
      setListings(data.listings || []);
      
      const pending = data.listings.filter(l => l.status === 'pending').length;
      const approved = data.listings.filter(l => l.status === 'approved').length;
      const rejected = data.listings.filter(l => l.status === 'rejected').length;
      
      setStats({
        total: data.listings.length,
        pending,
        approved,
        rejected
      });
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to fetch your listings');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e, field) => {
    const files = e.target.files;
    if (field === 'productImages') {
      setFormData({ ...formData, productImages: Array.from(files) });
    } else {
      setFormData({ ...formData, billImage: files[0] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.productImages.length || !formData.billImage) {
      toast.error('Please upload product images and bill');
      return;
    }

    if (formData.imei.length !== 15) {
      toast.error('IMEI must be exactly 15 digits');
      return;
    }

    setSubmitting(true);
    setUploadingImages(true);

    try {
      // Upload product images
      toast.info('Uploading product images...');
      const productImageUrls = await uploadMultipleToCloudinary(formData.productImages, 'trustfhone/products');
      
      // Upload bill image
      toast.info('Uploading bill...');
      const billImageUrl = await uploadToCloudinary(formData.billImage, 'trustfhone/bills');
      
      setUploadingImages(false);

      // Create listing
      toast.info('Running AI fraud detection...');
      const listingData = {
        brand: formData.brand,
        model: formData.model,
        price: parseFloat(formData.price),
        condition: formData.condition,
        imei: formData.imei,
        hasBox: formData.hasBox,
        hasOriginalParts: formData.hasOriginalParts,
        description: formData.description,
        images: productImageUrls,
        billImage: billImageUrl
      };

      const { data } = await api.post('/api/listings', listingData);
      
      toast.success(`Listing created! Fraud Score: ${data.fraudScore}/100`);
      setCreateDialogOpen(false);
      
      // Reset form
      setFormData({
        brand: '',
        model: '',
        price: '',
        condition: 'Used',
        imei: '',
        hasBox: false,
        hasOriginalParts: false,
        description: '',
        productImages: [],
        billImage: null
      });
      
      // Refresh listings
      fetchListings();
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error.response?.data?.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
      setUploadingImages(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full text-xs font-bold">Pending Review</span>,
      approved: <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-full text-xs font-bold">Approved</span>,
      rejected: <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-full text-xs font-bold">Rejected</span>
    };
    return badges[status];
  };

  return (
    <div className="min-h-screen py-8" data-testid="seller-dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-white mb-2" data-testid="dashboard-title">Seller Dashboard</h1>
            <p className="text-slate-400">Manage your listings and track performance</p>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-white" data-testid="create-listing-button">
                <Plus className="w-5 h-5 mr-2" />
                Create Listing
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-white/10 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-white">Create New Listing</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4 mt-4" data-testid="create-listing-form">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brand">Brand*</Label>
                    <Input
                      id="brand"
                      required
                      value={formData.brand}
                      onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      className="bg-slate-950 border-white/10 text-white"
                      placeholder="Apple, Samsung, etc."
                      data-testid="brand-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="model">Model*</Label>
                    <Input
                      id="model"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="bg-slate-950 border-white/10 text-white"
                      placeholder="iPhone 14 Pro"
                      data-testid="model-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (₹)*</Label>
                    <Input
                      id="price"
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="bg-slate-950 border-white/10 text-white"
                      placeholder="50000"
                      data-testid="price-input"
                    />
                  </div>
                  <div>
                    <Label htmlFor="condition">Condition*</Label>
                    <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                      <SelectTrigger className="bg-slate-950 border-white/10 text-white" data-testid="condition-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Like New">Like New</SelectItem>
                        <SelectItem value="Used">Used</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="imei">IMEI Number (15 digits)*</Label>
                  <Input
                    id="imei"
                    required
                    maxLength={15}
                    value={formData.imei}
                    onChange={(e) => setFormData({ ...formData, imei: e.target.value.replace(/\D/g, '') })}
                    className="bg-slate-950 border-white/10 text-white font-mono"
                    placeholder="123456789012345"
                    data-testid="imei-input"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-slate-950 border-white/10 text-white"
                    rows={3}
                    placeholder="Additional details about your phone..."
                    data-testid="description-input"
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={formData.hasBox}
                      onChange={(e) => setFormData({ ...formData, hasBox: e.target.checked })}
                      className="rounded border-white/10"
                      data-testid="has-box-checkbox"
                    />
                    Box Available
                  </label>
                  <label className="flex items-center gap-2 text-white">
                    <input
                      type="checkbox"
                      checked={formData.hasOriginalParts}
                      onChange={(e) => setFormData({ ...formData, hasOriginalParts: e.target.checked })}
                      className="rounded border-white/10"
                      data-testid="has-original-parts-checkbox"
                    />
                    Original Parts
                  </label>
                </div>

                <div>
                  <Label htmlFor="productImages">Product Images* (Min 2)</Label>
                  <Input
                    id="productImages"
                    type="file"
                    accept="image/*"
                    multiple
                    required
                    onChange={(e) => handleFileChange(e, 'productImages')}
                    className="bg-slate-950 border-white/10 text-white"
                    data-testid="product-images-input"
                  />
                  <p className="text-xs text-slate-400 mt-1">Upload at least 2 clear images of the phone</p>
                </div>

                <div>
                  <Label htmlFor="billImage">Purchase Bill Image*</Label>
                  <Input
                    id="billImage"
                    type="file"
                    accept="image/*"
                    required
                    onChange={(e) => handleFileChange(e, 'billImage')}
                    className="bg-slate-950 border-white/10 text-white"
                    data-testid="bill-image-input"
                  />
                  <p className="text-xs text-slate-400 mt-1">Upload a clear image of the original purchase bill</p>
                </div>

                <Button
                  type="submit"
                  className="w-full gradient-primary text-white"
                  disabled={submitting}
                  data-testid="submit-listing-button"
                >
                  {uploadingImages ? 'Uploading Images...' : submitting ? 'Running AI Verification...' : 'Create Listing'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Listings</p>
                <p className="text-3xl font-black text-white mt-1">{stats.total}</p>
              </div>
              <Package className="w-10 h-10 text-purple-400" />
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending</p>
                <p className="text-3xl font-black text-yellow-400 mt-1">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Approved</p>
                <p className="text-3xl font-black text-green-400 mt-1">{stats.approved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </Card>
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Rejected</p>
                <p className="text-3xl font-black text-red-400 mt-1">{stats.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
          </Card>
        </div>

        {/* Listings Table */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">My Listings</h2>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          ) : listings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="listings-table">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Product</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Price</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">IMEI</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Fraud Score</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Views</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map((listing) => (
                    <tr key={listing._id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={listing.images?.[0]?.url}
                            alt={listing.model}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-white font-medium">{listing.brand} {listing.model}</p>
                            <p className="text-xs text-slate-400">{listing.condition}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-white font-bold">₹{listing.price?.toLocaleString()}</td>
                      <td className="py-4 px-4 text-slate-300 font-mono text-sm">{listing.imei}</td>
                      <td className="py-4 px-4">
                        <span className={`font-bold ${
                          listing.fraudScore < 30 ? 'text-green-400' :
                          listing.fraudScore < 60 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {listing.fraudScore}/100
                        </span>
                      </td>
                      <td className="py-4 px-4">{getStatusBadge(listing.status)}</td>
                      <td className="py-4 px-4 text-slate-400">{listing.views || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No listings yet. Create your first listing!</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default SellerDashboard;
