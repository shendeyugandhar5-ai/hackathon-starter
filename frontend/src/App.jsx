import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./i18n";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import ErrorBoundary from "./components/ui/ErrorBoundary";

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentBrain from "./pages/StudentBrain";
import ProgressRoadmap from "./pages/ProgressRoadmap";
import Tutor from "./pages/Tutor";
import KnowledgeMap from "./pages/KnowledgeMap";
import History from "./pages/History";
import Agents from "./pages/Agents";
import Profile from "./pages/Profile";
import AuthCallback from "./pages/AuthCallback";

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Marketing & Auth Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Protected Application Workspace Routes */}
              <Route
                path="/app"
                element={
                  <ProtectedRoute>
                    <AppShell />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/app/tutor" replace />} />
                <Route path="tutor" element={<Tutor />} />
                <Route path="student-brain" element={<StudentBrain />} />
                <Route path="knowledge-map" element={<KnowledgeMap />} />
                <Route path="progress" element={<ProgressRoadmap />} />
                <Route path="history" element={<History />} />
                <Route path="agents" element={<Agents />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Fallback redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
