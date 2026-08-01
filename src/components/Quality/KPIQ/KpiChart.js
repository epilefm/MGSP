import React from 'react';
import Chart from "react-apexcharts";

const KpiQualityChart = ({ data, turnoSelecionado = 'Todos' }) => {
  // Verificar se há dados para exibir
  if (!data || data.length === 0) {
    return (
      <div className="kpi-quality-chart-container">
        <h3 className="kpi-quality-chart-title">Tendência de Defeitos (PPM por Hora)</h3>
        <div className="kpi-quality-chart-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>
          <p>Nenhum dado disponível para o turno selecionado</p>
        </div>
      </div>
    );
  }
  
  // Usar os dados já processados
  const chartData = data;
  const categories = chartData.map(item => item.hora);

  const series = [
    {
      name: 'P-AOI',
      data: chartData.map(item => item.valores['P-AOI'] !== undefined ? item.valores['P-AOI'] : 0),
    },
    {
      name: 'M-AOI',
      data: chartData.map(item => item.valores['M-AOI'] !== undefined ? item.valores['M-AOI'] : 0),
    },
    {
      name: 'S-AOI',
      data: chartData.map(item => item.valores['S-AOI'] !== undefined ? item.valores['S-AOI'] : 0),
    },
    {
      name: 'FT',
      data: chartData.map(item => item.valores['FT'] !== undefined ? item.valores['FT'] : 0),
    },
  ];

  const options = {
    chart: {
      type: 'area',
      background: 'transparent',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
        offsetX: 0,
        offsetY: -30, // Mover a barra de ferramentas para cima
      },
      animations: {
        enabled: true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
      fontFamily: 'JetBrains Mono, monospace',
    },
    theme: {
      mode: 'dark',
    },
    colors: ['#0ea5e9', '#22c55e', '#f59e0b', '#ef4444'],
    stroke: {
      curve: 'smooth',
      width: 3,
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.4,
        opacityTo: 0.05,
        stops: [0, 90, 100],
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        colors: ['#e2e8f0'],
        fontSize: '12px',
        fontFamily: 'JetBrains Mono, monospace',
      },
      background: {
        enabled: true,
        foreColor: '#0f172a',
        padding: 4,
        borderRadius: 2,
        borderWidth: 0,
        borderColor: '#0f172a',
        opacity: 0.9,
      },
      offsetX: 0,
      offsetY: -10,
    },
    markers: {
      size: 5,
      strokeWidth: 2,
      hover: {
        size: 8,
      },
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '12px',
          fontFamily: 'JetBrains Mono, monospace',
        },
      },
      axisBorder: {
        color: '#334155',
      },
      axisTicks: {
        color: '#334155',
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: '#94a3b8',
          fontSize: '12px',
          fontFamily: 'JetBrains Mono, monospace',
        },
        formatter: (value) => {
          if (value === undefined || value === null) {
            return '0';
          }
          return value.toLocaleString('pt-BR');
        },
      },
    },
    grid: {
      borderColor: '#334155',
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: false,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    legend: {
      position: 'left',
      horizontalAlign: 'left',
      labels: {
        colors: '#ffffff',
        useSeriesColors: false,
      },
      markers: {
        size: 8,
        offsetX: -4,
      },
      itemMargin: {
        horizontal: 12,
      },
    },
    tooltip: {
      theme: 'dark',
      x: {
        show: true,
      },
      y: {
        formatter: (value) => {
          if (value === undefined || value === null) {
            return '0 PPM';
          }
          return `${value.toLocaleString('pt-BR')} PPM`;
        },
      },
      style: {
        fontSize: '12px',
        fontFamily: 'JetBrains Mono, monospace',
      },
    },
  };

  return (
    <div className="kpi-quality-chart-container">
      <h3 className="kpi-quality-chart-title">Tendência de Defeitos (PPM por Hora)</h3>
      <div className="kpi-quality-chart-wrapper">
        <Chart
          options={options}
          series={series}
          type="area"
          height="100%"
          width="100%"
        />
      </div>
    </div>
  );
};

export default KpiQualityChart;
