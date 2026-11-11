import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { RecommendationsPage } from './pages/RecommendationsPage';
import { ResumePage } from './pages/ResumePage';
import { SkillsPage } from './pages/SkillsPage';
import { InterviewPage } from './pages/InterviewPage';
import { RoadmapPage } from './pages/RoadmapPage';
import { TrackerPage } from './pages/TrackerPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { AdminPage } from './pages/AdminPage';
import { NotFoundPage } from './pages/NotFoundPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 2-Minute Onboarding Wizard */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Application Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AppShell>
                  <DashboardPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ProfilePage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/career-ideas"
            element={
              <ProtectedRoute>
                <AppShell>
                  <RecommendationsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          {/* Keep /recommendations as alias to /career-ideas */}
          <Route path="/recommendations" element={<Navigate to="/career-ideas" replace />} />
          <Route
            path="/resume"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ResumePage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/skills"
            element={
              <ProtectedRoute>
                <AppShell>
                  <SkillsPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <AppShell>
                  <InterviewPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/roadmap"
            element={
              <ProtectedRoute>
                <AppShell>
                  <RoadmapPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          <Route
            path="/opportunities"
            element={
              <ProtectedRoute>
                <AppShell>
                  <TrackerPage />
                </AppShell>
              </ProtectedRoute>
            }
          />
          {/* Keep /tracker as alias to /opportunities */}
          <Route path="/tracker" element={<Navigate to="/opportunities" replace />} />
          <Route
            path="/resources"
            element={
              <ProtectedRoute>
                <AppShell>
                  <ResourcesPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Admin-Only Route */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AppShell>
                  <AdminPage />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* 404 Not Found */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
