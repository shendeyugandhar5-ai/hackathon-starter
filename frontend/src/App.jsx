import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentBrain from './pages/StudentBrain';
import ProgressRoadmap from './pages/ProgressRoadmap';
import Tutor from './pages/Tutor';
import KnowledgeMap from './pages/KnowledgeMap';
import History from './pages/History';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Marketing & Auth Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected / Core Cognitive Workspace Routes */}
        <Route path="/app" element={<AppShell />}>
          <Route index element={<Navigate to="/app/student-brain" replace />} />
          <Route path="student-brain" element={<StudentBrain />} />
          <Route path="progress" element={<ProgressRoadmap />} />
          <Route path="tutor" element={<Tutor />} />
          <Route path="knowledge-map" element={<KnowledgeMap />} />
          <Route path="history" element={<History />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
