import { API_URL } from '../../../../config/api';
import React, { Component } from "react";
import Chart from "react-apexcharts";
import Axios from "axios";
import {useEffect, useState } from "react";
import { Box } from "@mui/system";
import Card from '@mui/material/Card';
import { CardActionArea } from '@mui/material';
import { Row, Col } from "react-bootstrap";
import Bar2 from './Bar2'
import Pie from './Pie'
import Button from "@mui/material";


const Teste = () => {
  const [chartData, setChartData] = useState({

    options: {
        chart:{
            toolbar:{
                show:true,
                filter:true,
                tools:{
                    download:true,
                    selection:{enable:true},
                    zoom:{
                        enable:true,
                        type:'x',
                        zoomedArea: {
                            fill: {
                              color: '#90CAF9',
                              opacity: 0.4
                            },
                            stroke: {
                              color: '#0D47A1',
                              opacity: 0.4,
                              width: 1
                            }
                          }
                    },
                    zoomin:true,
                    pan: true,
                }
            },
            animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 200,
                animateGradually: {
                    enabled: true,
                    delay: 150
                },
                dynamicAnimation: {
                    enabled: true,
                    speed: 350
                },
                filter:true
            },
   
            },
          theme: {
          monochrome: {
            enabled: true,
            color: '#255aee',
            shadeTo: 'light',
            shadeIntensity: 0.1
          }
        },
        responsive: [{
          breakpoint: undefined,
          options: {},
      }],
      dataLabels: {
        enabled: true,
        color:'black'
      },
      stroke: {
        width: 1,
        colors: ["#fff"]
      },
        
      // --------------------------------Chart options-----------------------
      xaxis: {
        categories: ['Line'],
      },
    },

    series: [],
  });

 
  useEffect(() => {
    // Fetch or update your chart data here
    const fetchData = async () => {
      try {
        const response = await Axios.get(`${API_URL}/getDiscardChart`);
        const data = response.data;
        console.log(data);

        // Update the chart data state
         const seriesData = data.map((item) => ({
          categories:[item.Line] ,
          name: [item.Line],
           data: [item.Qty],
           
         }));

        setChartData(prevChartData => ({
          ...prevChartData,
          series: seriesData,
        }));
      } catch (error) {
        console.error('Error fetching chart data:', error);
      }
    };

    fetchData();
  }, []); // The empty dependency array ensures this effect runs only once

  // ------------------------------------------------------------------------------------------------------------------------------------------------

  return (
    <>

    <div>
<Box style={{height:80800, border:'0.01rem solid', borderColor:'#DEDEDE', borderRadius:15}}>

<Row className='row d-flex justify-content-around mt-1 col-12'>
<Card style={{border:'solid', height:60, width:200,
              borderRadius:10, borderColor:'#E41e1d', fontSize:14, textAlign:'center'}}>
                 <CardActionArea style={{width:'100%', justifyContent:'stretch'}}> Total de Descarte
                  <div style={{fontSize:22, fontFamily:'sans-serif, Geologica', fontWeight:"unset"}}> 2500 </div>
                    </CardActionArea>
</Card>

<Card style={{border:'solid', height:60, width:200,
              borderRadius:10, borderColor:'#B5d2e6', fontSize:14, textAlign:'center'}}>
                 <CardActionArea style={{width:'100%', justifyContent:'stretch'}}> Total por Part Number
                  <div style={{fontSize:22, fontFamily:'sans-serif, Geologica', fontWeight:"unset"}}> 2500 </div>
                    </CardActionArea>
</Card>

<Card style={{border:'solid', height:60, width:200,
              borderRadius:10, borderColor:'#B5d2e6', fontSize:14, textAlign:'center'}}>
                 <CardActionArea style={{width:'100%', justifyContent:'stretch'}}> Total por Linha
                  <div style={{fontSize:22, fontFamily:'sans-serif, Geologica', fontWeight:"unset"}}> 2500 </div>
                    </CardActionArea>
</Card>

<Card style={{border:'solid', height:60, width:200,
              borderRadius:10, borderColor:'#B5d2e6', fontSize:14, textAlign:'center'}}>
                 <CardActionArea style={{width:'100%', justifyContent:'stretch'}}> Total por Turno
                  <div style={{fontSize:22, fontFamily:'sans-serif, Geologica', fontWeight:"unset"}}> 2500 </div>
                    </CardActionArea>
</Card>

</Row>

<Row style={{width:'100%'}}>
  <Col>
     {chartData.series.length > 0 ? (
    <Chart
      options={chartData.options}
      series={chartData.series}
      type="bar" // Change the chart type as needed
      height={'300hv'} // Set the chart height as desired
      width={'100%'}
      borderRadius={'4px'}
      />) : ( <div>Loading chart data...</div> )}
</Col>
<Col>
    <Bar2/>
</Col>
</Row>

<Row style={{width:'100%'}}>
  <Col>
  <Pie/>
</Col>
<Col>
     {chartData.series.length > 0 ? (
    <Chart
      options={chartData.options}
      series={chartData.series}
      type="bar" // Change the chart type as needed
      height={'300hv'} // Set the chart height as desired
      width={'100%'}
      />) : ( <div>Loading chart data...</div> )}
</Col>
</Row>

    </Box>
     </div>
     </>
    );
};

export default Teste;
