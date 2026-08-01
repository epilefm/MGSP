import { API_URL } from '../../config/api';
import Table from 'react-bootstrap/Table';
import React, { useEffect, useState } from "react";
import Axios from "axios";
import { Box, Hidden, Input } from "@mui/material";
import Form from 'react-bootstrap/Form';
import { Button, Card, Col, Row } from "react-bootstrap";
import Calendar from "react-calendar";
import { color, height } from '@mui/system';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Divider } from 'antd';
import ApexCharts from 'apexcharts';
import clsx from 'clsx';
import {ExportToExcel} from '../Excel/Excel_Export'

export default function App() {
  const [values, setValues] = useState([]);
  const [entra,setEntra] = useState([]);
  const [listsaida, setListsaida] = useState([]);
  const [listdescarte, setListdescarte] = useState([]);
  const [listretorno, setListretorno] = useState([]);
  const [listclassea, setListclassea] = useState([]);
  const [listCards, setListCards] = useState([]);
  const [listhalb, setListHalb] = useState([]);
  const [listPO, setListPO] = useState([]);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [date, setDate] = useState(new Date());
  const [datef, setDatef] = useState(new Date());
  

  const handleCalendar = () => {
    setMostrarCalendario(!mostrarCalendario);
  };
  const oculta = () => {
    setMostrarCalendario(false);
  };
  console.log(listsaida);

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };
  
  const handleDataInicialChange = (event) => {
    
    var mess = (date.getMonth());
    if ((date.getMonth() + 1) < 10) {
      mess = '0' + (date.getMonth() + 1);
    } else {
      mess = (date.getMonth() + 1);
    };
    var diass = (date.getDate());
    if ((date.getDate()) < 10) {
     diass = '0' + (date.getDate())
    } else {
      diass = (date.getDate());
    };
    
    setDate(event.target.value);
    setMostrarCalendario(false)
  };

  const handleDataFinalChange = (event) => {
    setDatef(event.target.value);
    setMostrarCalendario(false)
  };
  
  const handleSubmit = (event) => {   
    
    var mesf = (date[1].getMonth());
    if ((date[1].getMonth() + 1) < 10) {
      mesf = '0' + (date[1].getMonth() + 1);
    } else {
      mesf = (date[1].getMonth() + 1);
    };
    var diasf = (date[1].getDate());
    if ((date[1].getDate()) < 10) {
     diasf = '0' + (date[1].getDate())  
    } else {
      diasf = (date[1].getDate());
    };
    var mess = (date[0].getMonth());
    if ((date[0].getMonth() + 1) < 10) {
      mess = '0' + (date[0].getMonth() + 1);
    } else {
      mess = (date[0].getMonth() + 1);
    };
    var diass = (date[0].getDate());
    if ((date[0].getDate()) < 10) {
     diass = '0' + (date[0].getDate())
    } else {
      diass = (date[0].getDate());
    };
    
    Axios.all([
      
      Axios.get(`${API_URL}/getProcesso?Line=${values.Line}&PO=${values.PO}&Halb=
        ${values.Halb.substring(0,11)}&datei=${date[0].getFullYear()+''+mess+
          ''+diass}&datef=${date[1].getFullYear()+''+mesf+''+diasf}`),

    ]).then(Axios.spread((Processo) =>{
      setEntra(Processo.data);      
    }))
  }

  // useEffect(() => {
  //   Axios.get(`${API_URL}/getDescarte`).then((response) => {
  //     setListCards(response.data);
  //   });
  // }, []);
  

  useEffect(() => {
    Axios.get(`${API_URL}/getModelo`).then((response) => {
      setListHalb(response.data);
    });
  }, []);


  const columns = [
    { field: 'id', hideable: false,
          align:'center', minWidth: 10, headerAlign:'center', headerClassName:'headerr'},
          { field: 'Date', hideable: false, headerName:'Data',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Line', hideable: false, headerName:'Linha',
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'PO', hideable: false, headerName:'PO',
          minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Basic_Model', flex: 2, headerName:'Modelo',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Halb', flex: 2, 
          minWidth: 130, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Part_Number', flex: 2, headerName:'Part Number',
          minWidth: 130, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'QTY_Entrada', flex: 2, headerName:'Qty Entrada',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'QTY_Saida', flex: 2, headerName:'Qty Saida',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          {
            field: 'Remain_in_Process',
            type: 'number',
            align:'center', headerName:'Em processo',
            width: 140,
            cellClassName: (params) => {
              if (params.value == null) {
                return '';
              }
        
              return clsx('super-app', {
                negative: params.value <0,
                positive: params.value > 0,
              });
            },
          },
          { field: 'Estoque_Wip', flex: 2, headerName:'Estoque',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          {
            field: 'Pend_to_Process', headerName:'Pend p/ Processo',
            type: 'number',
            align:'center',
            width: 140,
            cellClassName: (params) => {
              if (params.value == null) {
                return '';
              }
        
              return clsx('super-app', {
                negative: params.value <0,
                positive: params.value > 0,
              });
            },
          },
          { field: 'QTY_Return', flex: 2, headerName:'Qty Devolucao',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'QTY_Discard', flex: 2, headerName:'Qty Descarte',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          
    
  ];

  const fileName = "Analysis Data"; // here enter filename for your excel file


  return (
<>
{/* ---------------------------------------------------------------------------------- */}

<Box style={{ marginLeft: 10, background: '#eeeef3', borderRadius: 8, height: 150, width:300 }}>
        <Form style={{width: '10%', marginTop: 20}} >
          <Col style={{height: 470, marginTop: 10,  width: 300, background: '#eeeef3', textAlign: 'center', borderRadius: 10, padding: 5 }}>
            <div className='app'>
      <div className='calendar-container'>
      <div class='h6'>Calendar</div>
        <Calendar
          onChange={setDate}
          value={date}
          selectRange={true}
         />
      </div>

      {date.length > 0 ? (
        <p className='text-center' style={{marginTop:10}}>
          <span style={{fontWeight:'bold'}}>Start:</span> &nbsp; {' '}
          {date[0].toDateString()}
          &nbsp; | &nbsp;
          <span style={{fontWeight:'bold'}}>End:</span>  &nbsp; {date[1].toDateString()}
        </p>
      ) : (
        <p className='text-center' style={{marginTop:10}}>
          <span className='bold'>Default selected date:</span> &nbsp; {' '}
          {date.toDateString()}
        </p>
      )}
    </div>

            <Form.Label>Halb | Model</Form.Label>
            <Form.Select onClick={oculta} defaultValue="Choose..." id='Halb' name='Halb' onChange={handleChange} placeholder='Choose Halb' required>
              <option></option>
              <option value=''>All</option>
          {listhalb.map((val, index) => (
          <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
          ))}
            </Form.Select>

            <div>
              <Form.Label>Line</Form.Label>
              <Form.Select style={{ width: '100%' }}
                defaultValue="Choose..." id='Line' name='Line' onChange={handleChange} placeholder='choose a line' required>
                <option></option>
                <option value=''>All</option>
                <option>SMD-01</option>
                <option>SMD-02</option>
                <option>SMD-03</option>
                <option>SMD-04</option>
                <option>SMD-05</option>
                <option>SMD-06</option>
                <option>SMD-07</option>
                <option>SMD-08</option>
                <option>SMD-09</option>
                <option>SMD-10</option>
                <option>SMD-11</option>
                <option>SMD-12</option>
                <option>SMD-13</option>
                <option>SMD-14</option>
                <option>SMD-15</option>
                <option>SMD-16</option>
                <option>SMD-17</option>
                <option>SMD-18</option>
                <option>SMD-19</option>
                <option>SMD-20</option>
                <option>SMD-37</option>
                <option>SMD-38</option>
              </Form.Select>
            </div>


            <Button align='center'style={{ marginTop: 23, width: '50%' }} type="button" onClick={handleSubmit}>Procurar</Button>
          </Col>
        </Form>
      </Box>

{/* //------------------------------------------------------------------------------------------------ */}

      <Box style={{marginLeft:330}}
      sx={{
        '& .super-app-theme--cell': {
           backgroundColor: 'rgba(224, 183, 60, 0.55)',
           color: '#1a3e72',
           fontWeight: '600',
         },
         '& .super-app.negative': {
           backgroundColor: '#d47483',
           color: '#1a3e72',
           fontWeight: '600',
         },
         '& .super-app.positive': {
           backgroundColor: 'rgba(157, 255, 118, 0.49)',
           color: '#1a3e72',
           fontWeight: '600',
         },
       }}>
        
<div style={{marginTop: -170, height: 700 , width: '100%', padding:'5px'}}><h1 align='center' > MATERIAL CONTROL IN PROCESS</h1>
<div style={{marginLeft:-200}}>
<ExportToExcel apiData={entra} fileName={fileName} /> 
</div>
              <DataGrid hover={true}className='tabelass'
        columns={
          columns
          }   
        rows = {entra}
        slots={{
        toolbar: GridToolbar,
      }}
      slotProps={{
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 500 },
        },      
      }}
      />
   </div>
   </Box>
<br>
</br>    
    </>
  );
}