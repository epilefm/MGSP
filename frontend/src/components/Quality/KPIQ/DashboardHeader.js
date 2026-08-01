import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const DashboardHeader = ({ lastUpdate, onRefresh, isLoading, dataSelecionada, datasUnicas, handleDataChange, converterParaDate, isDataDisponivel, formatarData }) => {
  const formatarHora = (data) => {
    return data.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <header className="dashboardKPIQ-header-section">
      <div className="headerKPIQ-content">
        <div className="headerKPIQ-title">
          <div className="activity-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
            </svg>
          </div>
          <div>
            <h1 className="dashboardKPIQ-title">Dashboard KPI Qualidade AOI</h1>
            <p className="dashboardKPIQ-subtitle">Monitoramento de Índices de Produção</p>
          </div>
        </div>
        
        <div className="header-controls">
          <div className="update-info">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span>Última atualização: {lastUpdate ? formatarHora(lastUpdate) : '--:--:--'}</span>
          </div>
          
          <div className="headerKPIQ-actions">
            <div className="date-filterKPIQ">
              <DatePicker
                selected={converterParaDate(dataSelecionada)}
                onChange={handleDataChange}
                filterDate={isDataDisponivel}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecione uma data"
                className="quality-filter-date"
                locale="pt-BR"
                todayButton="Hoje"
                showYearDropdown
                scrollableYearDropdown
                yearDropdownItemNumber={15}
              />
            </div>
            
            <button 
              onClick={onRefresh}
              disabled={isLoading}
              className={`refresh-button ${isLoading ? 'loading' : ''}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"></path>
                <path d="M16 16h5v5"></path>
              </svg>
              {isLoading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
