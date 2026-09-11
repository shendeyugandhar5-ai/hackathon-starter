import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppShell from './components/layout/AppShell';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentBrain from './pages/StudentBrain';
import ProgressRoadmap from './pages/ProgressRoadmap';
import Tutor from './pages/Tutor';
import KnowledgeMap from './pages/KnowledgeMap';
import History from './pages/History';
import Agents from './pages/Agents';
<<<<<<< HEAD
import Profile from './pages/Profile';
=======
>>>>>>> 7a83365997f7d8fa8cbcfd7b32a7d5b25feae5d7

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Marketing & Auth Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

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
<<<<<<< HEAD
            <Route path="profile" element={<Profile />} />
=======
>>>>>>> 7a83365997f7d8fa8cbcfd7b32a7d5b25feae5d7
          </Route>

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
