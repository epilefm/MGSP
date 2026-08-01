import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import HoraHoraMounter from './HoraHoraMounter';
import HoraProdLista from './HoraProdLista';
import HoraPlanResult from '../PlanResult/HoraPlanResult';
import Header from '../../Layout/MGSPHead/Header';

export default function HoraMounterContainer() {
  const [activeTab, setActiveTab] = useState('mounter');

  return (
    <>
      <Header />
      <Helmet>
        <title>Hora Mounter</title>
      </Helmet>

      {/* Abas - Compactas e elegantes */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderBottom: '2px solid #e0e0e0',
        paddingLeft: '20px',
        gap: '2px'
      }}>
        {['mounter', 'historico', 'planresult'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: activeTab === tab ? '700' : '500',
              border: 'none',
              backgroundColor: 'transparent',
              color: activeTab === tab ? '#393D7E' : '#666',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              borderBottom: activeTab === tab ? '3px solid #393D7E' : 'none',
              marginBottom: activeTab === tab ? '-2px' : '0'
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.color = '#393D7E';
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab) {
                e.currentTarget.style.color = '#666';
              }
            }}
          >
            {tab === 'mounter' ? '📊 Produção Mounter' : tab === 'historico' ? '📋 Histórico Mounter' : '📈 Plan vs Result'}
          </button>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      <div style={{ minHeight: 'calc(100vh - 100px)' }}>
        {activeTab === 'mounter' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <HoraHoraMounter />
          </div>
        )}

        {activeTab === 'historico' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <HoraProdLista />
          </div>
        )}

        {activeTab === 'planresult' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <HoraPlanResult />
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
