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
  token: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (userData: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: User) => void;
  addToWishlist: (dogId: string) => Promise<{ success: boolean; error?: string }>;
  removeFromWishlist: (dogId: string) => Promise<{ success: boolean; error?: string }>;
  getWishlist: () => Promise<any[]>;
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

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Get API URL based on environment
  const getApiUrl = () => {
    if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return `http://${window.location.hostname}:3001`;
    }
    // For mobile/network access, use the network IP
    return `http://172.20.10.2:3001`;
  };

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

  const login = async (email: string, password: string) => {
    try {
      const API_URL = getApiUrl();
      console.log('🌐 API URL:', API_URL);
      
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
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
        console.log('✅ LOGIN SUCCESS - Setting user:', data);
        console.log('✅ LOGIN SUCCESS - User _id:', data._id);
        console.log('✅ LOGIN SUCCESS - Token:', data.token);
        setUser(data);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        console.log('✅ LOGIN SUCCESS - Data saved to localStorage');
        return { success: true };
      } else {
        console.log('❌ LOGIN FAILED - Server response:', data);
        return { success: false, error: data.message || 'Login failed' };
      }
    } catch (error) {
      console.error('❌ LOGIN NETWORK ERROR:', error);
      if (error.name === 'AbortError') {
        return { success: false, error: 'Request timeout. Please try again.' };
      }
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const register = async (userData: any) => {
    try {
      const API_URL = getApiUrl();
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
      console.error('Registration network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const addToWishlist = async (dogId: string) => {
    try {
      console.log('Adding to wishlist:', dogId);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/users/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dogId }),
      });

      const data = await response.json();
      console.log('Add to wishlist response:', data);

      if (response.ok) {
        // Update user's wishlist in state
        if (user) {
          const updatedUser = {
            ...user,
            wishlist: [...(user.wishlist || []), dogId]
          };
          updateUser(updatedUser);
          console.log('Updated user wishlist:', updatedUser.wishlist);
        }
        return { success: true };
      } else {
        console.error('Add to wishlist failed:', data);
        return { success: false, error: data.message || 'Failed to add to wishlist' };
      }
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const removeFromWishlist = async (dogId: string) => {
    try {
      console.log('Removing from wishlist:', dogId);
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/users/wishlist/${dogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      console.log('Remove from wishlist response status:', response.status);

      if (response.ok) {
        // Update user's wishlist in state
        if (user) {
          const updatedUser = {
            ...user,
            wishlist: (user.wishlist || []).filter(id => id !== dogId)
          };
          updateUser(updatedUser);
          console.log('Updated user wishlist after removal:', updatedUser.wishlist);
        }
        return { success: true };
      } else {
        const data = await response.json();
        console.error('Remove from wishlist failed:', data);
        return { success: false, error: data.message || 'Failed to remove from wishlist' };
      }
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const getWishlist = async () => {
    try {
      const API_URL = getApiUrl();
      const response = await fetch(`${API_URL}/api/users/wishlist`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        const wishlist = await response.json();
        return wishlist;
      } else {
        return [];
      }
    } catch (error) {
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