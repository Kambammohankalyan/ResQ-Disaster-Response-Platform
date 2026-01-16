import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { axiosInstance } from '../lib/axios';

interface User {
  id: string;
  email: string; // Decoded might not have email depending on backend, but let's assume standard payload
  scopes: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, refreshToken: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from storage on mount
  useEffect(() => {
    const initAuth = () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded = jwtDecode<any>(token);
          // Check expiry
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            setUser({
              id: decoded.id,
              email: decoded.email || '', 
              scopes: decoded.scopes || []
            });
            axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          }
        } catch (e) {
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string, refreshToken: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('refreshToken', refreshToken); // For the axios interceptor
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    const decoded = jwtDecode<any>(token);
    setUser({
      id: decoded.id,
      email: decoded.email || '',
      scopes: decoded.scopes || []
    });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    delete axiosInstance.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    // Admin override (assuming 'admin:access' implies superuser, or check specific scope)
    if (user.scopes.includes('admin:access')) return true; 
    return user.scopes.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]) => {
    if (!user) return false;
    if (user.scopes.includes('admin:access')) return true;
    return permissions.some(p => user.scopes.includes(p));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user, 
      isLoading, 
      login, 
      logout,
      hasPermission,
      hasAnyPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
