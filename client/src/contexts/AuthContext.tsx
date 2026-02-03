import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  _id: string;
  name: string;
  email: string;
  username: string;
  wishlist?: string[];
  profilePicture?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  currentUser?: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: User) => void;
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

// Use build-time constant for API URL
const API_URL = process.env.REACT_APP_API_URL;

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
      } catch (error) {
        console.error('AuthContext: Error parsing stored user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);
  // Helper to always get latest token from localStorage
  const getLatestToken = () => localStorage.getItem('token') || token;

  // Refresh auth state from localStorage on mount and window focus
  useEffect(() => {
    const refreshAuth = () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
        } catch (error) {
          console.error('AuthContext: Error parsing stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };
    refreshAuth();
    window.addEventListener('focus', refreshAuth);
    return () => window.removeEventListener('focus', refreshAuth);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log('🌐 API URL:', API_URL);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_URL}/api/users/logiranje`, {
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
      const response = await fetch(`${API_URL}/api/users/registracija`, {
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
      const response = await fetch(`${API_URL}/api/users/wishlist`, {
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
      const response = await fetch(`${API_URL}/api/users/wishlist/${dogId}`, {
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
      const response = await fetch(`${API_URL}/api/users/wishlist`, {
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
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  isInWishlist,
  isAuthenticated,
  loading,
};
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};