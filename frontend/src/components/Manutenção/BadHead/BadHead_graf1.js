import { API_URL } from '../../../config/api';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ApexCharts from 'apexcharts';

const App = () => {
  const [chartData1, setChartData1] = useState([]);
  const [chartData2, setChartData2] = useState([]);

  useEffect(() => {
    // Fetch data for the first chart
    axios.get(`${API_URL}/BadHead_graf1`)
      .then(response => {
        setChartData1(response.data);
        renderChart1(response.data);
      })
      .catch(error => console.error(error));

    // Fetch data for the second chart
    axios.get(`${API_URL}/BadHead_graf2`)
      .then(response => {
        setChartData2(response.data);
        renderChart2(response.data);
      })
      .catch(error => console.error(error));
  }, []);

  const renderChart1 = (data) => {
    const options = {
      chart: {
        type: 'pie',
        height: 350,
      },
      series: data.map(item => item.Total_Defeitos),
      labels: data.map(item => item.Linha),
      title: {
        text: 'Total de Defeitos por linha)',
      },
    };

    new ApexCharts(document.querySelector('#chart1'), options).render();
  };

  const renderChart2 = (data) => {
    const options = {
      chart: {
        toolbar: {
          show: false // Esconder barra de ferramentas
        },
        background: 'transparent', // Fundo transparente
        type: 'bar',
        height: 350,
      },
      series: [{
        name: 'Efficiencia',
        data: data.map(item => item.Eficiencia + 'r'),
      }],
      xaxis: {
        categories: data.map(item => item.linha),
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          show: false,
        },
        grid:{
          show: false
        },

      },
      yaxis: {
        labels: {
          show: false,
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        max: 100, // Limita o valor máximo do eixo Y a 100
        tickAmount: 5, // Define o número de divisões no eixo Y
        
      },
      title: {
        text: 'Eficiência por Linha (%)',
      },
  
      annotations:{
        yaxis:[{
          y:'',
          borderColor:'transparent',
          strokeDashArray:0
        }]
      },

      plotOptions: {
        bar: {
          distributed: true,
          dataLabels: {
            position: 'center', // top, center, bottom
            style: {
              colors: ['#000'],
              fontSize: '14px', // Aumenta o tamanho da fonte
            },
            formatter: function (Eficiencia) {
              return '%' ;
            },
          },
        },
        
      },
      colors: data.map(item => {
        const eficiencia = parseFloat(item.Eficiencia.replace('%', ''));
        if (eficiencia < 80) return '#FF0000'; // Vermelho forte
        if (eficiencia < 100) return '#FFA500'; // Amarelo quase laranja
        return '#1857df'; // Azul forte
      }),
      legend: {
        show: false,
      },
    };

    new ApexCharts(document.querySelector('#chart2'), options).render();
  };

  return (
    <div>
      <div id="chart1" style={{ width: '30%', float: 'left', marginTop:15 }}></div>
      <div id="chart2" style={{ width: '69%', float: 'right' }}></div>
    </div>
  );
};

export default App;