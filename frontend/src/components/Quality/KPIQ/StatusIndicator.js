import React from 'react';

const StatusIndicator = ({ indicator, value, target }) => {
  const isWithinTarget = (indicator, value) => {
    if (value === null || value === undefined) return null;
    
    const targets = {
      'P-AOI': 635,
      'M-AOI': 377,
      'S-AOI': 112,
      'FT': 1309,
      'TEACHING M': 2.0,
      'TEACHING S': 2.0
    };
    
    return value <= (targets[indicator] || 0);
  };

  const withinTarget = isWithinTarget(indicator, value);
  const isOk = withinTarget === true;
  
  const formatValue = () => {
    if (indicator === 'TEACHING M' || indicator === 'TEACHING S') {
      return value !== undefined ? value.toFixed(2) : '0.00';
    }
    return value !== undefined ? value.toLocaleString('pt-BR') : '0';
  };

  const formatTarget = () => {
    if (indicator === 'TEACHING M' || indicator === 'TEACHING S') {
      return target.toFixed(1);
    }
    return target.toLocaleString('pt-BR');
  };

  return (
    <div className="status-indicator-card">
      <div className="indicator-header">
        <p className="indicator-label">
          {indicator} {target && `(${indicator.includes('TEACHING') ? '%' : 'PPM'})`}
        </p>
        <div className={`status-badge ${isOk ? 'ok' : 'fora'}`}>
          {isOk ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="15" y1="9" x2="9" y2="15"></line>
              <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
          )}
          <span>{isOk ? 'OK' : 'FORA'}</span>
        </div>
      </div>
      <div className="indicator-content">
        <p className={`indicator-value ${isOk ? 'value-ok' : 'value-fora'}`}>
          {formatValue()}
        </p>
        <p className="indicator-target">
          meta: ≤{formatTarget()}
        </p>
      </div>
    </div>
  );
};

export default StatusIndicator;
