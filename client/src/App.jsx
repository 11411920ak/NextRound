import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import RoleSelectPage from './pages/RoleSelectPage';
import InterviewPage from './pages/InterviewPage';
import ReportPage from './pages/ReportPage';
import DashboardPage from './pages/DashboardPage';
import ProfileCompletePage from './pages/ProfileCompletePage';
import ResumeUploadPage from './pages/ResumeUploadPage';
import ResumeAnalysisPage from './pages/ResumeAnalysisPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

/**
 * ProfileGuard — wraps protected routes that require a complete profile.
 * Redirects to /profile/complete if the user hasn't filled in their profile yet.
 */
const ProfileGuard = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user && user.profileComplete === false) {
    return <Navigate to="/profile/complete" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
          <Navbar />
          <main className="pt-16">
            <Routes>
              {/* Public Application Routes */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/interview/setup" element={<RoleSelectPage />} />
              <Route path="/interview/:sessionId" element={<InterviewPage />} />
              <Route path="/report/:sessionId" element={<ReportPage />} />

              <Route path="/resume" element={<ResumeAnalysisPage />} />
              <Route path="/resume/upload" element={<ResumeUploadPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/profile/complete" element={<ProfileCompletePage />} />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>

          {/* Global toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
              },
              success: { iconTheme: { primary: '#6366f1', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
