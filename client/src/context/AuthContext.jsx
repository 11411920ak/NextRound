import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded, isSignedIn } = useUser();
  const clerk = useClerk();

  const [dbUser, setDbUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [syncing, setSyncing] = useState(false);

  // Transfer any guest data (resumes, interview analyses) created before sign in
  const claimGuestData = useCallback(async () => {
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
  }, []);

  // Synchronize Clerk user with MongoDB backend
  useEffect(() => {
    if (!isLoaded) return;

    if (isSignedIn && clerkUser) {
      const syncUser = async () => {
        setSyncing(true);
        try {
          const primaryEmail = clerkUser.primaryEmailAddress?.emailAddress;
          if (!primaryEmail) return;

          const storedToken = localStorage.getItem('token');
          const storedUser = JSON.parse(localStorage.getItem('user') || 'null');

          // If already synced for this Clerk user, retain existing session
          if (storedToken && storedUser?.email === primaryEmail.toLowerCase()) {
            setToken(storedToken);
            setDbUser(storedUser);
            setSyncing(false);
            return;
          }

          const { data } = await api.post('/auth/clerk-sync', {
            clerkId: clerkUser.id,
            email: primaryEmail,
            name: clerkUser.fullName || clerkUser.firstName || primaryEmail.split('@')[0],
            imageUrl: clerkUser.imageUrl,
          });

          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setToken(data.token);
          setDbUser(data.user);
          await claimGuestData();
        } catch (error) {
          console.error('Clerk backend synchronization error:', error);
        } finally {
          setSyncing(false);
        }
      };

      syncUser();
    } else {
      // User signed out from Clerk
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('guest_resume_id');
      localStorage.removeItem('guest_analysis_ids');
      setToken(null);
      setDbUser(null);
    }
  }, [isLoaded, isSignedIn, clerkUser, claimGuestData]);

  const logout = useCallback(async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('guest_resume_id');
    localStorage.removeItem('guest_analysis_ids');
    setToken(null);
    setDbUser(null);
    try {
      await clerk.signOut();
    } catch (e) {
      console.warn('Clerk sign out error:', e);
    }
  }, [clerk]);

  const updateUser = useCallback((updatedUser) => {
    setDbUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const mergedUser = dbUser || (clerkUser ? {
    id: clerkUser.id,
    name: clerkUser.fullName || clerkUser.firstName || 'User',
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    profileComplete: true,
  } : null);

  return (
    <AuthContext.Provider
      value={{
        user: mergedUser,
        clerkUser,
        token,
        loading: !isLoaded || syncing,
        isAuthenticated: !!isSignedIn,
        isSignedIn: !!isSignedIn,
        profileComplete: true,
        logout,
        updateUser,
        openSignIn: clerk.openSignIn,
        openSignUp: clerk.openSignUp,
        openUserProfile: clerk.openUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
