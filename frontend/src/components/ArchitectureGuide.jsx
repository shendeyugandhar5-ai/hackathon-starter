import React from 'react';

export function ArchitectureGuide() {
  const steps = [
    {
      title: '1. Add SQLAlchemy Model (Backend)',
      desc: 'Define your table structure in backend/app/models/ (e.g. item.py) inheriting from Base.',
      badge: 'models/',
    },
    {
      title: '2. Define Pydantic Schemas (Backend)',
      desc: 'Create request/response validation schemas in backend/app/schemas/ (e.g. item.py).',
      badge: 'schemas/',
    },
    {
      title: '3. Write Service & Route Handler (Backend)',
      desc: 'Implement business logic in services/ and expose REST endpoints in routes/, registering them in api.py.',
      badge: 'routes/ & services/',
    },
    {
      title: '4. Call API & Render UI (Frontend)',
      desc: 'Use the centralized api service in frontend/src/services/api.js and build clean components in components/.',
      badge: 'frontend/src/',
    },
  ];

  return (
    <div className="glass-card">
      <div className="card-header">
        <h3 className="card-title">
          <span>🏗️</span> Hackathon Rapid Workflow Guide
        </h3>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>Modular Extension Pattern</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {steps.map((step, idx) => (
          <div key={idx} className="step-item">
            <div className="step-num">{idx + 1}</div>
            <div className="step-content" style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                <h4>{step.title}</h4>
                <code style={{ fontSize: '0.72rem', background: 'rgba(255,255,255,0.05)', padding: '0.15rem 0.4rem', borderRadius: '4px', color: '#cbd5e1' }}>
                  {step.badge}
                </code>
              </div>
              <p>{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArchitectureGuide;
