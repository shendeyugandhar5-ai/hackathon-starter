import React from 'react';
import api from '../services/api';

export function QuickActions() {
  const links = [
    {
      title: 'Interactive Swagger UI',
      desc: 'Test endpoints, schemas & payloads interactively',
      url: `${api.baseUrl}/docs`,
      icon: '📖',
      tag: 'FastAPI /docs',
    },
    {
      title: 'ReDoc Documentation',
      desc: 'Clean, searchable OpenAPI specifications',
      url: `${api.baseUrl}/redoc`,
      icon: '📑',
      tag: 'FastAPI /redoc',
    },
    {
      title: 'Health Check Endpoint',
      desc: 'Raw JSON status output for monitoring',
      url: `${api.baseUrl}/api/health`,
      icon: '🩺',
      tag: 'GET /api/health',
    },
    {
      title: 'API Root Endpoint',
      desc: 'Service metadata and system status',
      url: `${api.baseUrl}/`,
      icon: '🌐',
      tag: 'GET /',
    },
  ];

  return (
    <div className="glass-card">
      <div className="card-header">
        <h3 className="card-title">
          <span>⚡</span> Quick Developer Links
        </h3>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {links.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block',
              textDecoration: 'none',
              padding: '1rem',
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.4)';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
              <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '4px', background: 'rgba(99,102,241,0.15)', color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>
                {item.tag}
              </span>
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
              {item.title}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {item.desc}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
