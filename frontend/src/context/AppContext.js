import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  const addToWishlist = (listingId) => {
    if (!wishlist.includes(listingId)) {
      setWishlist([...wishlist, listingId]);
    }
  };

  const removeFromWishlist = (listingId) => {
    setWishlist(wishlist.filter(id => id !== listingId));
  };

  const addToRecentlyViewed = (listingId) => {
    setRecentlyViewed(prev => {
      const filtered = prev.filter(id => id !== listingId);
      return [listingId, ...filtered].slice(0, 20);
    });
  };

  const value = {
    wishlist,
    recentlyViewed,
    addToWishlist,
    removeFromWishlist,
    addToRecentlyViewed
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};