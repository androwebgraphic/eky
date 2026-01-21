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
      const response = await fetch(`${API_URL}/api/users/wishlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ dogId }),
      });

      const data = await response.json();

      if (response.ok) {
        if (user) {
          const updatedUser = {
            ...user,
            wishlist: [...(user.wishlist || []), dogId]
          };
          updateUser(updatedUser);
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
      const response = await fetch(`${API_URL}/api/users/wishlist/${dogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      });

      if (response.ok) {
        if (user) {
          const updatedUser = {
            ...user,
            wishlist: (user.wishlist || []).filter(id => id !== dogId)
          };
          updateUser(updatedUser);
        }
        return { success: true };
      } else {
        const data = await response.json();
        return { success: false, error: data.message || 'Failed to remove from wishlist' };
      }
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const getWishlist = async () => {
    try {
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