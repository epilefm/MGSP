import React, { useEffect, useRef, useState } from 'react';
import ApexCharts from 'apexcharts';
import axios from 'axios';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Box } from "@mui/system";
import { Card } from "react-bootstrap";
import { Row, Col } from "react-bootstrap";
import Chart from "react-apexcharts";

const PieChart = () => {
  const chartRef = useRef(null);
  const [dados, setDados] = useState([]);
  const [chartData, setChartData] = useState({

    options: {
      // Chart options
      xaxis: {
        categories: ['Line'],
      },
    },

    series: [],
  });
  useEffect(() => {
    
    const fetchsetDados = async () => {
      try {
        
        const response = await axios.get('http://105.103.39.102:8080/getPie');
        setDados(response.data);
      } catch (error) {
        console.error('Falha no carregamento dos dados de descarte:', error);
      }
    };
    fetchsetDados();

    return () => {
      if (chartRef && chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (dados.length === 0) return;
    const turnos = dados.map(item => item.shift);
    const quantidades = dados.map(item => item.Qty);

    const chartOptions = {
      series: quantidades,
      labels: turnos,
      chart: {
          type: 'pie',
         width: '300',
      },
      subtitle: {
        text: 'Disposal Material Per Shift',
        align: 'left',
        margin: 10,
        offsetX: -10,
        offsetY: 0,
        floating: false,
        style: {
          fontSize:  '12px',
          fontWeight:  'normal',
          fontFamily:  undefined,
          color:  '#9699a2'
        },
    },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: '10%',
            },
            legend: {
              show:true,
              position: 'center',
            },
          },
        },
      ],
    };

    if (chartRef && chartRef.current) {
      const chart = new ApexCharts(chartRef.current, chartOptions);
      chart.render();
    }
  }, [dados]);


  return (
  <>
  
  <Box style={{marginLeft:200}}>
<div ref={chartRef} />
</Box>

</>
)};

export default PieChart;
