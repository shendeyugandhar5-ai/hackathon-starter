import React, { useState } from 'react';
import api from '../services/api';

export function StatusCard({ backendStatus, onRefresh }) {
  const [testingEndpoint, setTestingEndpoint] = useState(null);
  const [customResponse, setCustomResponse] = useState(null);

  const handleTest = async (type) => {
    setTestingEndpoint(type);
    let res;
    if (type === 'root') {
      res = await api.getRoot();
    } else if (type === 'health') {
      res = await api.getHealth();
    }
    setCustomResponse(res);
    setTestingEndpoint(null);
    if (onRefresh) onRefresh();
  };

  return (
    <div className="glass-card">
      <div className="card-header">
        <h3 className="card-title">
          <span>🔌</span> Backend Health & Diagnostics
        </h3>
        <button
          className="btn btn-secondary"
          onClick={() => onRefresh()}
          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
        >
          🔄 Refresh
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Target Base URL</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#a5b4fc', wordBreak: 'break-all' }}>
              {api.baseUrl}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Endpoint Status</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              {backendStatus?.ok ? (
                <span style={{ color: 'var(--success)' }}>HTTP {backendStatus.status} OK</span>
              ) : (
                <span style={{ color: 'var(--error)' }}>Offline / Error</span>
              )}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>Latency</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {backendStatus ? `${backendStatus.latencyMs} ms` : '—'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => handleTest('health')}
            disabled={testingEndpoint !== null}
          >
            {testingEndpoint === 'health' ? 'Pinging...' : 'Test GET /api/health'}
          </button>

          <button
            className="btn btn-secondary"
            onClick={() => handleTest('root')}
            disabled={testingEndpoint !== null}
          >
            {testingEndpoint === 'root' ? 'Pinging...' : 'Test GET /'}
          </button>
        </div>

        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginBottom: '0.4rem' }}>
            Latest API Response:
          </div>
          <pre className="terminal-box">
            {JSON.stringify(customResponse || backendStatus || { message: 'Awaiting check...' }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export default StatusCard;
