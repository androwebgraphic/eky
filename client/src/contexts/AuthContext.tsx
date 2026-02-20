import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  wishlist?: string[];
  profilePicture?: string;
  role?: string;
  _profilePicCacheBuster?: string;
}

interface AuthContextType {
  user: User | null;
  currentUser?: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: User) => void;
  refreshUser: () => Promise<void>;
  addToWishlist: (dogId: string) => Promise<{ success: boolean; error?: string }>;
  removeFromWishlist: (dogId: string) => Promise<{ success: boolean; error?: string }>;
  getWishlist: () => Promise<string[]>;
  isInWishlist: (dogId: string) => boolean;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Helper function to get API URL dynamically
const getApiUrl = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  // Dynamically construct API URL based on current hostname
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
  return `${protocol}//${hostname}:3001`;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper to always get latest token from localStorage
  const getLatestToken = () => localStorage.getItem('token') || token;

  const refreshUser = async () => {
    try {
      const latestToken = getLatestToken();
      console.log('[REFRESH USER] Starting refresh, token exists:', !!latestToken);
      if (!latestToken) {
        return;
      }

      const response = await fetch(`${getApiUrl()}/api/users/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${latestToken}`
        },
      });

      console.log('[REFRESH USER] Response status:', response.status);
      if (response.ok) {
        const userData = await response.json();
        console.log('[REFRESH USER] User data received:', userData.role, userData.email);
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.error('Failed to refresh user data:', response.status);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  };

  useEffect(() => {
    // Check if user is logged in on app start
    const storedToken = localStorage.getItem('token');
    console.log('[INIT] Stored token exists:', !!storedToken);
    
    if (storedToken) {
      // Set token first
      setToken(storedToken);
      // Then try to refresh user data from server
      refreshUser().then(() => {
        setLoading(false);
      }).catch(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  // Refresh user data from server on window focus (not localStorage)
  useEffect(() => {
    const handleFocus = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        console.log('[FOCUS] Refreshing user data');
        refreshUser();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🌐 API URL:', getApiUrl());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${getApiUrl()}/api/users/logiranje`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok) {
        setUser(data);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout. Please try again.' };
      }
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/users/registracija`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Registration failed' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const addToWishlist = async (dogId: string) => {
    try {
      const latestToken = getLatestToken();
      const response = await fetch(`${getApiUrl()}/api/users/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${latestToken}`
        },
        body: JSON.stringify({ dogId }),
      });

      const data = await response.json();

      if (response.ok) {
        // Use updated user from backend if available
        if (data && data.user) {
          updateUser(data.user);
        } else if (user) {
          // fallback: update manually if backend did not return user
          const updatedUser = {
            ...user,
            wishlist: [...(user.wishlist || []), dogId]
          };
          updateUser(updatedUser);
        }
        // If backend returns a populated wishlist, update user.wishlist for UI sync
        if (data && Array.isArray(data.wishlist)) {
          if (user) {
            const updatedUser = {
              ...user,
              wishlist: data.wishlist.map((dog: any) => dog._id)
            };
            updateUser(updatedUser);
          }
          return { success: true, wishlist: data.wishlist };
        }
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to add to wishlist' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const removeFromWishlist = async (dogId: string) => {
    try {
      const latestToken = getLatestToken();
      const response = await fetch(`${getApiUrl()}/api/users/wishlist/${dogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${latestToken}`
        },
      });

      const data = await response.json();

      if (response.ok) {
        // Use updated user from backend if available
        if (data && data.user) {
          updateUser(data.user);
        } else if (user) {
          // fallback: update manually if backend did not return user
          const updatedUser = {
            ...user,
            wishlist: (user.wishlist || []).filter(id => id !== dogId)
          };
          updateUser(updatedUser);
        }
        // If backend returns a populated wishlist, update user.wishlist for UI sync
        if (data && Array.isArray(data.wishlist)) {
          if (user) {
            const updatedUser = {
              ...user,
              wishlist: data.wishlist.map((dog: any) => dog._id)
            };
            updateUser(updatedUser);
          }
        }
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Failed to remove from wishlist' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const getWishlist = async () => {
    try {
      const latestToken = getLatestToken();
      const response = await fetch(`${getApiUrl()}/api/users/wishlist`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${latestToken}`
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('[WISHLIST FRONTEND DEBUG] Raw backend response:', data);
        // The backend returns { wishlist: [...] } where wishlist is an array of dog objects
        if (Array.isArray(data.wishlist)) {
          // Always update user.wishlist to match backend
          if (user) {
            const updatedUser = {
              ...user,
              wishlist: data.wishlist.map((dog: any) => dog._id)
            };
            updateUser(updatedUser);
          }
          return data.wishlist;
        }
        // fallback: if wishlist is array of IDs, return empty (should not happen)
        return [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('[WISHLIST FRONTEND DEBUG] Error:', error);
      return [];
    }
  };

  const isInWishlist = (dogId: string) => {
    return user?.wishlist?.includes(dogId) || false;
  };

  const updateUser = (userData: User) => {
    console.log('[AUTH CONTEXT] updateUser called with:', {
      ...userData,
      profilePicture: userData.profilePicture,
      _profilePicCacheBuster: userData._profilePicCacheBuster
    });
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    console.log('[AUTH CONTEXT] User state updated and saved to localStorage');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const isAuthenticated = !!user && !!token;

  const value: AuthContextType = {
    user,
    currentUser: user, 
    token,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    addToWishlist,
    removeFromWishlist,
    getWishlist,
    isInWishlist,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};