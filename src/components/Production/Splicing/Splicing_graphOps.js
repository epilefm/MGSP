import React, { useEffect, useState } from "react";
import axios from "axios";
import Chart from "react-apexcharts";

export default function Grafico({value, filteredData, turno}) {
  const [maiorChartData, setMaiorChartData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const maiorResponse = await
      axios.get (`http://105.103.39.102:8080/SplicingOpssMaior?data=${value}`);

      setMaiorChartData(maiorResponse.data);
      } catch (error) {
        console.error('Erro ao buscar dados', error);
      }
    };
    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 10000);
    
    // Limpar o intervalo quando o componente é desmontado
    return () => clearInterval(interval);
    }, [value]);

  // Filtrar dados por turno se necessário
  const chartData = React.useMemo(() => {
    if (turno === 'todos' || !filteredData) {
      return maiorChartData;
    }
    
    // Filtrar os dados do gráfico com base nos operadores do turno selecionado
    const filteredOperators = filteredData.map(item => item.OPERATOR_NAME);
    return maiorChartData.filter(data => filteredOperators.includes(data.OPERATOR_NAME));
  }, [maiorChartData, filteredData, turno]);

  // Cores personalizadas
  const colors = {
    primary: '#3498db', // Azul
    gradient: ['#3498db', '#2980b9']
  };

  const options = {
    chart: {
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: false,
          reset: true
        },
        export: {
          csv: {
            filename: undefined,
            columnDelimiter: ',',
            headerCategory: 'category',
            headerValue: 'value',
            dateFormatter(timestamp) {
              return new Date(timestamp).toDateString()
            }
          }
        }
      },
      background: 'transparent',
      fontFamily: 'Segoe UI, sans-serif',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    grid: {
      show: true,
      borderColor: '#e0e0e0',
      strokeDashArray: 3,
      position: 'back',
      xaxis: {
        lines: {
          show: false
        }
      },
      yaxis: {
        lines: {
          show: true
        }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    xaxis: {
      categories: chartData.map(data => data.OPERATOR_NAME),
      labels: {
        style: {
          colors: '#333',
          fontSize: '12px',
          fontWeight: 500,
          fontFamily: 'Segoe UI, sans-serif'
        },
        rotate: -45
      },
      axisBorder: {
        show: true,
        color: '#78909C',
        height: 1,
        width: '100%',
        offsetX: 0,
        offsetY: 0
      },
      axisTicks: {
        show: true,
        borderType: 'solid',
        color: '#78909C',
        height: 6,
        offsetX: 0,
        offsetY: 0
      }
    },
    yaxis: {
      min: 0,
      labels: {
        style: {
          colors: '#333',
          fontSize: '12px',
          fontWeight: 500,
          fontFamily: 'Segoe UI, sans-serif'
        },
        formatter: (value) => Math.round(value)
      },
      axisBorder: {
        show: true,
        color: '#78909C',
        offsetX: 0,
        offsetY: 0
      }
    },
    annotations: {
      yaxis: [{
        y: 80,
        borderColor: '#e74c3c',
        strokeDashArray: 5,
        borderWidth: 2,
        label: {
          borderColor: '#e74c3c',
          style: {
            color: '#fff',
            background: '#e74c3c',
            fontSize: '12px',
            fontWeight: 600,
            fontFamily: 'Segoe UI, sans-serif',
            padding: {
              left: 10,
              right: 10,
              top: 2,
              bottom: 2
            }
          },
          text: 'Meta (80)',
          position: 'right',
          offsetX: 0,
          offsetY: -5
        }
      }]
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '65%',
        distributed: false,
        borderRadius: 6,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        dataLabels: {
          position: 'top',
          hideOverflowingLabels: true
        },
        endingShape: 'rounded'
      }
    },
    dataLabels: {
      enabled: true,
      offsetY: -25,
      formatter: function (val) {
        return val !== null && val !== undefined ? Math.round(val) : '';
      },
      style: {
        fontSize: '13px',
        fontWeight: 700,
        fontFamily: 'Segoe UI, sans-serif',
        colors: ['#333']
      },
      background: {
        enabled: true,
        foreColor: '#fff',
        borderRadius: 4,
        padding: 2,
        opacity: 0.9,
        borderWidth: 1,
        borderColor: '#90A4AE',
        dropShadow: {
          enabled: false
        }
      }
    },
    legend: {
      show: true,
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '14px',
      fontFamily: 'Segoe UI, sans-serif',
      fontWeight: 600,
      formatter: undefined,
      inverseOrder: false,
      width: undefined,
      height: undefined,
      tooltipHoverFormatter: undefined,
      customLegendItems: [],
      offsetX: 0,
      offsetY: 10,
      labels: {
        colors: ['#333'],
        useSeriesColors: false
      },
      markers: {
        width: 14,
        height: 14,
        strokeWidth: 0,
        strokeColor: '#fff',
        fillColors: undefined,
        radius: 8,
        customHTML: undefined,
        onClick: undefined,
        offsetX: 0,
        offsetY: 0
      },
      itemMargin: {
        horizontal: 15,
        vertical: 8
      },
      onItemClick: {
        toggleDataSeries: true
      },
      onItemHover: {
        highlightDataSeries: true
      }
    },
    colors: [colors.primary],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.25,
        gradientToColors: [colors.gradient[1]],
        inverseColors: true,
        opacityFrom: 0.9,
        opacityTo: 0.8,
        stops: [0, 100],
        colorStops: []
      }
    },
    tooltip: {
      enabled: true,
      fixed: {
        enabled: true,
        position: 'topLeft',
        offsetX: 0,
        offsetY: 30,
      },
      theme: 'light',
      style: {
        fontSize: '13px',
        fontFamily: 'Segoe UI, sans-serif'
      },
      y: {
        formatter: function (val) {
          return Math.round(val)
        },
        title: {
          formatter: (seriesName) => seriesName,
        },
      },
      marker: {
        show: true,
      },
      onDatasetHover: {
        highlightDataSeries: true,
      }
    },
    states: {
      normal: {
        filter: {
          type: 'none',
          value: 0,
        }
      },
      hover: {
        filter: {
          type: 'lighten',
          value: 0.1,
        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'darken',
          value: 0.35,
        }
      }
    },
    stroke: {
      show: true,
      width: 2,
      colors: ['transparent']
    }
  };

  const seriesMaior = [
    {
      name: 'Produção',
      data: chartData.map(data => data['qty']),
    },
  ];

  return (
    <div className="splicing-chart-container">
      <div className="splicing-chart-header">
        <h2 className="splicing-chart-title">Ranking de Produção por Operador</h2>
        <p className="splicing-chart-subtitle">Comparação de produção - Data: {value}</p>
      </div>
      <Chart 
        options={options} 
        series={seriesMaior} 
        type="bar" 
        height={450} 
        className="splicing-chart"
      />
    </div>
  );
}
