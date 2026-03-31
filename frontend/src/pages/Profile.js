import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import TrustBadge from '../components/TrustBadge';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { toast } from 'sonner';

const Profile = () => {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/api/user/profile');
      setUser(data.user);
      setFormData({
        name: data.user.name || '',
        phone: data.user.phone || ''
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const { data } = await api.put('/api/user/profile', formData);
      setUser(data.user);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
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
    <div className="min-h-screen py-8" data-testid="profile-page">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl font-black text-purple-400">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-white mb-2" data-testid="profile-name">
              {user?.name}
            </h1>
            <div className="flex items-center justify-center gap-2">
              <span className="text-slate-400">{user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}</span>
              {user?.verificationBadge && <TrustBadge verified={true} size="sm" />}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="glass-card p-6 text-center">
              <p className="text-3xl font-black gradient-text">{user?.totalListings || 0}</p>
              <p className="text-sm text-slate-400 mt-2">Total Listings</p>
            </Card>
            <Card className="glass-card p-6 text-center">
              <p className="text-3xl font-black text-green-400">{user?.riskScore ? 100 - user.riskScore : 100}</p>
              <p className="text-sm text-slate-400 mt-2">Trust Score</p>
            </Card>
            <Card className="glass-card p-6 text-center">
              <p className="text-3xl font-black text-purple-400">{user?.wishlist?.length || 0}</p>
              <p className="text-sm text-slate-400 mt-2">Wishlist Items</p>
            </Card>
          </div>

          {/* Profile Form */}
          <Card className="glass-card p-6" data-testid="profile-form-card">
            <h2 className="text-2xl font-bold text-white mb-6">Profile Information</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-slate-950/50 border-white/10 text-white"
                    data-testid="name-input"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-white">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="pl-10 bg-slate-950/50 border-white/10 text-slate-500"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="phone" className="text-white">Phone Number</Label>
                <div className="relative mt-2">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="pl-10 bg-slate-950/50 border-white/10 text-white"
                    placeholder="+91 98765 43210"
                    data-testid="phone-input"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white">Role</Label>
                <div className="flex items-center gap-3 mt-2 p-3 bg-slate-950/50 rounded-lg border border-white/10">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">
                    {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                  </span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full gradient-primary text-white"
                disabled={saving}
                data-testid="save-profile-button"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
