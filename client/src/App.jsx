import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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

import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen">
          <Navbar />
          <main className="pt-16">
            <Routes>
              {/* Landing Page with embedded Sign Up and Sign In */}
              <Route path="/" element={<LandingPage />} />

              {/* Protected Main Features: Directed here once signed in/up */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/setup"
                element={
                  <ProtectedRoute>
                    <RoleSelectPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/interview/:sessionId"
                element={
                  <ProtectedRoute>
                    <InterviewPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/report/:sessionId"
                element={
                  <ProtectedRoute>
                    <ReportPage />
                  </ProtectedRoute>
                }
              />

              <Route path="/resume" element={<ResumeAnalysisPage />} />
              <Route path="/resume/upload" element={<ResumeUploadPage />} />
              <Route path="/login/*" element={<LoginPage />} />
              <Route path="/signup/*" element={<SignupPage />} />
              <Route path="/profile/complete" element={<ProfileCompletePage />} />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
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
