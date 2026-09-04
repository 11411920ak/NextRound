import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On mount, verify token is still valid
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
        setToken(storedToken);
      } catch {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const claimGuestData = async () => {
    try {
      const guestResumeId = localStorage.getItem('guest_resume_id');
      const guestAnalysisIds = JSON.parse(localStorage.getItem('guest_analysis_ids') || '[]');
      if (guestResumeId || (Array.isArray(guestAnalysisIds) && guestAnalysisIds.length > 0)) {
        await api.post('/analysis/claim-guest', {
          resume_id: guestResumeId,
          analysis_ids: guestAnalysisIds,
        });
        localStorage.removeItem('guest_resume_id');
        localStorage.removeItem('guest_analysis_ids');
      }
    } catch (e) {
      console.warn('Failed to claim guest data:', e);
    }
  };

  const login = useCallback((tokenValue, userData) => {
    localStorage.setItem('token', tokenValue);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(tokenValue);
    setUser(userData);
    claimGuestData();
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guest_resume_id');
    localStorage.removeItem('guest_analysis_ids');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated: !!token,
      profileComplete: user?.profileComplete ?? false,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
