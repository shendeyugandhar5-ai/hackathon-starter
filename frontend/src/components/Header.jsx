import React from 'react';

export function Header({ backendStatus }) {
  const isHealthy = backendStatus?.ok;

  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-icon">⚡</div>
        <div>
          <div className="brand-title">Hackathon Starter</div>
          <div className="brand-tag">FastAPI + React + PostgreSQL Infrastructure</div>
        </div>
      </div>
      
      <div>
        {backendStatus === null ? (
          <span className="badge badge-neutral">
            <span className="pulse-dot"></span> Checking API...
          </span>
        ) : isHealthy ? (
          <span className="badge badge-success">
            <span className="pulse-dot"></span> API Connected ({backendStatus.latencyMs}ms)
          </span>
        ) : (
          <span className="badge badge-error">
            <span className="pulse-dot"></span> API Disconnected
          </span>
        )}
      </div>
    </header>
  );
}

export default Header;
