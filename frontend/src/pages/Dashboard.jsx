import React, { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header';
import StatusCard from '../components/StatusCard';
import QuickActions from '../components/QuickActions';
import ArchitectureGuide from '../components/ArchitectureGuide';
import api from '../services/api';

export function Dashboard() {
  const [backendStatus, setBackendStatus] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const checkStatus = useCallback(async () => {
    const res = await api.getHealth();
    setBackendStatus(res);
    setIsInitialLoading(false);
  }, []);

  useEffect(() => {
    checkStatus();
    // Poll health every 15s to keep status indicator live
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <div className="app-container">
      <Header backendStatus={backendStatus} />

      <section className="hero">
        <h1>
          Ready for <span className="gradient-text">Hackathon Sprint</span>
        </h1>
        <p>
          Your clean full-stack starter is wired and ready. Start adding your schemas, endpoints, and UI components as soon as the problem statement is announced.
        </p>
      </section>

      <div className="grid-2">
        <StatusCard backendStatus={backendStatus} onRefresh={checkStatus} />
        <QuickActions />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <ArchitectureGuide />
      </div>
    </div>
  );
}

export default Dashboard;
