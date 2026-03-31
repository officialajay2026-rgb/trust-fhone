import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User, UserCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer'
  });
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.email, formData.password);
      } else {
        result = await signup(formData.name, formData.email, formData.password, formData.role);
      }

      if (result.success) {
        toast.success(isLogin ? 'Login successful!' : 'Account created successfully!');
        
        // Navigate based on role
        if (result.user.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (result.user.role === 'seller') {
          navigate('/seller-dashboard');
        } else {
          navigate('/marketplace');
        }
      } else {
        toast.error(result.message || 'Authentication failed');
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4" data-testid="auth-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Shield className="w-16 h-16 neon-green mx-auto mb-4" />
          <h1 className="text-3xl font-black text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Join TrustFhone'}
          </h1>
          <p className="text-slate-400">
            {isLogin ? 'Sign in to continue' : 'Create your account to get started'}
          </p>
        </div>

        <Card className="glass-card p-8" data-testid="auth-form-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {!isLogin && (
              <div>
                <Label htmlFor="name" className="text-white">Full Name</Label>
                <div className="relative mt-2">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="pl-10 bg-slate-950/50 border-white/10 text-white"
                    placeholder="John Doe"
                    data-testid="name-input"
                  />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="email" className="text-white">Email Address</Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 bg-slate-950/50 border-white/10 text-white"
                  placeholder="you@example.com"
                  data-testid="email-input"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-white">Password</Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 bg-slate-950/50 border-white/10 text-white"
                  placeholder="••••••••"
                  data-testid="password-input"
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <Label htmlFor="role" className="text-white">I want to</Label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'buyer' })}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.role === 'buyer'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-white/10 bg-slate-950/50 text-slate-400 hover:border-white/20'
                    }`}
                    data-testid="role-buyer-button"
                  >
                    <UserCircle className="w-6 h-6 mx-auto mb-2" />
                    Buy Phones
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, role: 'seller' })}
                    className={`p-4 rounded-lg border transition-all ${
                      formData.role === 'seller'
                        ? 'border-purple-500 bg-purple-500/10 text-white'
                        : 'border-white/10 bg-slate-950/50 text-slate-400 hover:border-white/20'
                    }`}
                    data-testid="role-seller-button"
                  >
                    <Shield className="w-6 h-6 mx-auto mb-2" />
                    Sell Phones
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full gradient-primary text-white"
              disabled={loading}
              data-testid="submit-button"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-slate-400 hover:text-white"
              data-testid="toggle-auth-mode"
            >
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <span className="text-purple-400 font-medium">{isLogin ? 'Sign Up' : 'Sign In'}</span>
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;