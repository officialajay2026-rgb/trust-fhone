import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Menu, X, LogOut, User, Bell, MessageCircle, Heart, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import api from '../utils/api';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const notifRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCounts();
      const interval = setInterval(fetchUnreadCounts, 15000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCounts = async () => {
    try {
      const [notifRes, chatRes] = await Promise.all([
        api.get('/api/notifications/unread-count'),
        api.get('/api/chat/unread-count')
      ]);
      setUnreadCount(notifRes.data.count || 0);
      setChatUnread(chatRes.data.count || 0);
    } catch (err) {}
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications?limit=10');
      setNotifications(data.notifications || []);
    } catch (err) {}
  };

  const toggleNotif = () => {
    if (!notifOpen) fetchNotifications();
    setNotifOpen(!notifOpen);
  };

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {}
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      await api.put(`/api/notifications/read/${notif._id}`).catch(() => {});
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
  ];

  if (isAuthenticated && user?.role === 'seller') {
    navLinks.push({ name: 'Dashboard', path: '/seller-dashboard' });
  }
  if (isAuthenticated && user?.role === 'admin') {
    navLinks.push({ name: 'Admin', path: '/admin-dashboard' });
  }

  const notifIcon = (type) => {
    if (type === 'listing_approved') return '✅';
    if (type === 'listing_rejected') return '❌';
    if (type === 'new_message') return '💬';
    if (type === 'new_review') return '⭐';
    return '🔔';
  };

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/70 border-b border-white/10"
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
            <Shield className="w-8 h-8 neon-green" />
            <span className="text-xl font-black tracking-tight text-white">
              TrustFhone <span className="neon-green">Delhi</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                data-testid={`nav-${link.name.toLowerCase()}`}
                className={`text-sm font-medium transition-colors ${
                  location.pathname === link.path ? 'text-purple-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                {/* Wishlist */}
                <Link to="/wishlist" data-testid="nav-wishlist" className="relative text-slate-300 hover:text-red-400 transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>

                {/* Chat */}
                <Link to="/chat" data-testid="nav-chat" className="relative text-slate-300 hover:text-purple-400 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  {chatUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-purple-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {chatUnread > 9 ? '9+' : chatUnread}
                    </span>
                  )}
                </Link>

                {/* Notifications */}
                <div className="relative" ref={notifRef}>
                  <button onClick={toggleNotif} data-testid="nav-notifications" className="relative text-slate-300 hover:text-yellow-400 transition-colors">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50" data-testid="notifications-dropdown">
                      <div className="p-3 border-b border-white/10 flex items-center justify-between">
                        <h3 className="text-white font-bold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1">
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-6 text-center text-slate-500 text-sm">No notifications</div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif._id}
                              onClick={() => handleNotifClick(notif)}
                              className={`w-full p-3 text-left border-b border-white/5 hover:bg-white/5 transition-colors ${
                                !notif.read ? 'bg-purple-500/5' : ''
                              }`}
                              data-testid={`notification-${notif._id}`}
                            >
                              <div className="flex gap-2">
                                <span className="text-lg">{notifIcon(notif.type)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${notif.read ? 'text-slate-400' : 'text-white'}`}>{notif.title}</p>
                                  <p className="text-xs text-slate-500 truncate">{notif.message}</p>
                                  <p className="text-[10px] text-slate-600 mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                                </div>
                                {!notif.read && <span className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 shrink-0" />}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link to="/profile" data-testid="profile-button">
                  <Button variant="outline" size="sm" className="border-white/20">
                    <User className="w-4 h-4 mr-2" />
                    {user?.name}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} data-testid="logout-button" className="text-slate-300 hover:text-white">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}

            {!isAuthenticated && (
              <Link to="/auth" data-testid="login-button">
                <Button className="gradient-primary text-white">Login / Sign Up</Button>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white" data-testid="mobile-menu-button">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="md:hidden py-4 border-t border-white/10" data-testid="mobile-menu">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-white">
                {link.name}
              </Link>
            ))}
            {isAuthenticated && (
              <>
                <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-slate-300 hover:text-white">
                  <Heart className="w-4 h-4" /> Wishlist
                </Link>
                <Link to="/chat" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2 py-2 text-slate-300 hover:text-white">
                  <MessageCircle className="w-4 h-4" /> Messages
                  {chatUnread > 0 && <span className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full">{chatUnread}</span>}
                </Link>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-300 hover:text-white">
                  Profile
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block py-2 text-slate-300 hover:text-white w-full text-left">
                  Logout
                </button>
              </>
            )}
            {!isAuthenticated && (
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-purple-400 font-medium">
                Login / Sign Up
              </Link>
            )}
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
};

export default Navbar;
