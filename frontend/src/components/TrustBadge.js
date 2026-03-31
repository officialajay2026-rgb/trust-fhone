import React from 'react';
import { ShieldCheck, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const TrustBadge = ({ verified = false, animated = true, size = 'md' }) => {
  const badgeClass = size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-4 py-2 text-base' : 'px-3 py-1 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4';

  if (!verified) return null;

  const Badge = (
    <div
      className={`inline-flex items-center ${badgeClass} bg-green-500/10 border border-green-500/30 rounded-full font-bold neon-green ${animated ? 'trust-pulse' : ''}`}
      data-testid="trust-badge"
    >
      <Zap className={`${iconSize} mr-1`} />
      AI Verified
    </div>
  );

  return animated ? (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 10 }}
    >
      {Badge}
    </motion.div>
  ) : Badge;
};

export default TrustBadge;