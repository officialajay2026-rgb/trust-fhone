import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Package, TrendingUp, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import FraudScoreMeter from '../components/FraudScoreMeter';
import api from '../utils/api';
import { toast } from 'sonner';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [fraudReport, setFraudReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionNotes, setActionNotes] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchListings(activeTab);
  }, [activeTab]);

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/api/admin/dashboard');
      setStats(data.stats);
      
      const usersData = await api.get('/api/admin/users');
      setUsers(usersData.data.users || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async (status) => {
    try {
      const { data } = await api.get(`/api/admin/listings?status=${status}`);
      setListings(data.listings || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const viewListingDetails = async (listingId) => {
    try {
      const { data } = await api.get(`/api/admin/listings/${listingId}`);
      setSelectedListing(data.listing);
      setFraudReport(data.fraudReport);
    } catch (error) {
      console.error('Error fetching listing details:', error);
      toast.error('Failed to load listing details');
    }
  };

  const handleApproveListing = async (listingId) => {
    setProcessingAction(true);
    try {
      await api.put(`/api/admin/approve/${listingId}`, {
        adminNotes: actionNotes
      });
      toast.success('Listing approved successfully');
      setSelectedListing(null);
      setActionNotes('');
      fetchListings(activeTab);
      fetchDashboardData();
    } catch (error) {
      console.error('Error approving listing:', error);
      toast.error('Failed to approve listing');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectListing = async (listingId) => {
    if (!actionNotes.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessingAction(true);
    try {
      await api.put(`/api/admin/reject/${listingId}`, {
        rejectionReason: actionNotes,
        adminNotes: actionNotes
      });
      toast.success('Listing rejected');
      setSelectedListing(null);
      setActionNotes('');
      fetchListings(activeTab);
      fetchDashboardData();
    } catch (error) {
      console.error('Error rejecting listing:', error);
      toast.error('Failed to reject listing');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleBanUser = async (userId, ban) => {
    try {
      await api.put(`/api/admin/users/${userId}/ban`, {
        isBanned: ban,
        reason: ban ? 'Multiple policy violations' : 'Ban lifted'
      });
      toast.success(`User ${ban ? 'banned' : 'unbanned'} successfully`);
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating user ban status:', error);
      toast.error('Failed to update user status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8" data-testid="admin-dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2" data-testid="admin-dashboard-title">Admin Dashboard</h1>
          <p className="text-slate-400">Manage listings, users, and platform security</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Listings</p>
                <p className="text-3xl font-black text-white mt-1">{stats?.listings?.total || 0}</p>
              </div>
              <Package className="w-10 h-10 text-purple-400" />
            </div>
            <div className="mt-4 text-xs text-slate-400">
              <span className="text-yellow-400">{stats?.listings?.pending || 0} pending</span>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Approved</p>
                <p className="text-3xl font-black text-green-400 mt-1">{stats?.listings?.approved || 0}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Users</p>
                <p className="text-3xl font-black text-white mt-1">{stats?.users?.total || 0}</p>
              </div>
              <Users className="w-10 h-10 text-blue-400" />
            </div>
            <div className="mt-4 text-xs text-slate-400">
              <span className="text-purple-400">{stats?.users?.sellers || 0} sellers</span>
            </div>
          </Card>

          <Card className="glass-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">High Fraud</p>
                <p className="text-3xl font-black text-red-400 mt-1">{stats?.listings?.highFraud || 0}</p>
              </div>
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
          </Card>
        </div>

        {/* Listings Management */}
        <Card className="glass-card p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Listing Management</h2>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-slate-950/50 mb-6">
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending ({stats?.listings?.pending || 0})
              </TabsTrigger>
              <TabsTrigger value="approved" data-testid="tab-approved">
                Approved ({stats?.listings?.approved || 0})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Rejected ({stats?.listings?.rejected || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab}>
              {listings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full" data-testid="admin-listings-table">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Product</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Seller</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Price</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Fraud Score</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Action</th>
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
                          <td className="py-4 px-4">
                            <p className="text-white">{listing.seller?.name}</p>
                            <p className="text-xs text-slate-400">{listing.seller?.email}</p>
                          </td>
                          <td className="py-4 px-4 text-white font-bold">₹{listing.price?.toLocaleString()}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${
                                listing.fraudScore < 30 ? 'text-green-400' :
                                listing.fraudScore < 60 ? 'text-yellow-400' : 'text-red-400'
                              }`}>
                                {listing.fraudScore}
                              </span>
                              {listing.fraudScore > 50 && <AlertTriangle className="w-4 h-4 text-red-400" />}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-400 text-sm">
                            {new Date(listing.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewListingDetails(listing._id)}
                              className="border-white/20 text-white"
                              data-testid={`view-details-${listing._id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-400">No {activeTab} listings</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </Card>

        {/* Users Management */}
        <Card className="glass-card p-6">
          <h2 className="text-xl font-bold text-white mb-4">User Management</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="users-table">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Role</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Listings</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Risk Score</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 10).map((user) => (
                  <tr key={user._id} className="border-b border-white/10 hover:bg-white/5">
                    <td className="py-4 px-4">
                      <p className="text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-white">{user.totalListings || 0}</td>
                    <td className="py-4 px-4">
                      <span className={`font-bold ${
                        user.riskScore < 30 ? 'text-green-400' :
                        user.riskScore < 60 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {user.riskScore || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      {user.isBanned ? (
                        <span className="px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs">
                          Banned
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded text-xs">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {user.role !== 'admin' && (
                        <Button
                          size="sm"
                          variant={user.isBanned ? 'outline' : 'destructive'}
                          onClick={() => handleBanUser(user._id, !user.isBanned)}
                          className="text-xs"
                          data-testid={`ban-user-${user._id}`}
                        >
                          {user.isBanned ? 'Unban' : 'Ban'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Listing Details Dialog */}
        <Dialog open={!!selectedListing} onOpenChange={() => setSelectedListing(null)}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Listing Review</DialogTitle>
            </DialogHeader>
            
            {selectedListing && (
              <div className="space-y-6 mt-4" data-testid="listing-details-modal">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <img
                      src={selectedListing.images?.[0]?.url}
                      alt={selectedListing.model}
                      className="w-full rounded-lg"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-4">
                      {selectedListing.brand} {selectedListing.model}
                    </h3>
                    <div className="space-y-2 mb-4">
                      <p className="text-slate-400">Price: <span className="text-white font-bold">₹{selectedListing.price?.toLocaleString()}</span></p>
                      <p className="text-slate-400">Condition: <span className="text-white">{selectedListing.condition}</span></p>
                      <p className="text-slate-400">IMEI: <span className="text-white font-mono">{selectedListing.imei}</span></p>
                      <p className="text-slate-400">Box: <span className="text-white">{selectedListing.hasBox ? 'Yes' : 'No'}</span></p>
                      <p className="text-slate-400">Original Parts: <span className="text-white">{selectedListing.hasOriginalParts ? 'Yes' : 'No'}</span></p>
                    </div>
                    
                    <div className="mt-6">
                      <FraudScoreMeter score={selectedListing.fraudScore} size="md" />
                    </div>
                  </div>
                </div>

                {/* Fraud Report */}
                {fraudReport && (
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-lg font-bold text-white mb-4">AI Fraud Analysis</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4">
                        <p className="text-slate-400 text-sm mb-2">IMEI Validation</p>
                        <p className={`font-bold ${fraudReport.checks?.imeiValidation?.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {fraudReport.checks?.imeiValidation?.passed ? '✓ Passed' : '✗ Failed'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{fraudReport.checks?.imeiValidation?.message}</p>
                      </div>
                      <div className="glass-card p-4">
                        <p className="text-slate-400 text-sm mb-2">Bill OCR</p>
                        <p className={`font-bold ${fraudReport.checks?.billOCR?.passed ? 'text-green-400' : 'text-red-400'}`}>
                          {fraudReport.checks?.billOCR?.passed ? '✓ Verified' : '✗ Issues Found'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{fraudReport.checks?.billOCR?.message}</p>
                      </div>
                    </div>
                    
                    {fraudReport.fraudReasons?.length > 0 && (
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 font-bold mb-2">Fraud Indicators:</p>
                        <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                          {fraudReport.fraudReasons.map((reason, index) => (
                            <li key={index}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Action */}
                {selectedListing.status === 'pending' && (
                  <div className="border-t border-white/10 pt-6">
                    <h4 className="text-lg font-bold text-white mb-4">Admin Action</h4>
                    <Textarea
                      placeholder="Add notes or rejection reason..."
                      value={actionNotes}
                      onChange={(e) => setActionNotes(e.target.value)}
                      className="bg-slate-950 border-white/10 text-white mb-4"
                      rows={3}
                      data-testid="admin-notes-input"
                    />
                    <div className="flex gap-4">
                      <Button
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleApproveListing(selectedListing._id)}
                        disabled={processingAction}
                        data-testid="approve-button"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Listing
                      </Button>
                      <Button
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                        onClick={() => handleRejectListing(selectedListing._id)}
                        disabled={processingAction}
                        data-testid="reject-button"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Listing
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminDashboard;
