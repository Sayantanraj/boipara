import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  location?: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  time: string;
  link?: string;
  orderId?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<any>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  setUserFromToken: (token: string, userData: User) => void;
  loading: boolean;
  notifications: Notification[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData && userData !== 'undefined') {
      try {
        apiService.setToken(token);
        setUser(JSON.parse(userData));
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        apiService.setToken(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) return;
      try {
        const data = await apiService.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationRead = async (id: string) => {
    try {
      await apiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllNotificationsRead = async () => {
    try {
      await apiService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await apiService.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const login = async (email: string, password: string) => {
    const data = await apiService.login(email, password);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    apiService.setToken(data.token);
    setUser(data.user);
    return data;
  };

  const register = async (userData: any) => {
    const data = await apiService.register(userData);
    setUser(data.user);
  };

  const logout = () => {
    apiService.logout();
    apiService.setToken(null);
    setUser(null);
    // Clear user-specific cart and wishlist data
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (currentUser.id) {
      localStorage.removeItem(`cart_${currentUser.id}`);
      localStorage.removeItem(`wishlist_${currentUser.id}`);
    }
  };

  const setUserFromToken = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    apiService.setToken(token);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUserFromToken, loading, notifications, markNotificationRead, markAllNotificationsRead, deleteNotification }}>
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