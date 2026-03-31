import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Mail, MapPin, Phone } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-slate-950 border-t border-white/10 mt-20" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="w-6 h-6 neon-green" />
              <span className="text-lg font-black text-white">
                TrustFhone <span className="neon-green">Delhi</span>
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Trusted Phones. Zero Fraud.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/marketplace" className="text-slate-400 hover:text-white text-sm">
                  Browse Phones
                </Link>
              </li>
              <li>
                <Link to="/auth" className="text-slate-400 hover:text-white text-sm">
                  Sell Your Phone
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-bold mb-4">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-center text-slate-400 text-sm">
                <Mail className="w-4 h-4 mr-2" />
                support@trustfhone.com
              </li>
              <li className="flex items-center text-slate-400 text-sm">
                <Phone className="w-4 h-4 mr-2" />
                +91 98765 43210
              </li>
              <li className="flex items-center text-slate-400 text-sm">
                <MapPin className="w-4 h-4 mr-2" />
                Delhi, India
              </li>
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h3 className="text-white font-bold mb-4">Trust & Safety</h3>
            <ul className="space-y-2">
              <li className="text-slate-400 text-sm">✓ AI-Powered Fraud Detection</li>
              <li className="text-slate-400 text-sm">✓ IMEI Verification</li>
              <li className="text-slate-400 text-sm">✓ Bill Authentication</li>
              <li className="text-slate-400 text-sm">✓ Verified Sellers</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-sm text-slate-400">
            © 2025 TrustFhone Delhi. All rights reserved. Built with AI-powered trust.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;