import { API_URL } from '../../../../config/api';
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

export default function App() {
  const [values, setValues] = useState([]);
  const [entra,setEntra] = useState([]);
  const [listsaida, setListsaida] = useState([]);
  const [listdescarte, setListdescarte] = useState([]);
  const [listretorno, setListretorno] = useState([]);
  const [listclassea, setListclassea] = useState([]);
  const [listCards, setListCards] = useState([]);
  const [listhalb, setListHalb] = useState([]);
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
    
    var mesf = (datef.getMonth());
    if ((datef.getMonth() + 1) < 10) {
      mesf = '0' + (datef.getMonth() + 1);
    } else {
      mesf = (datef.getMonth() + 1);
    };
    var diasf = (datef.getDate());
    if ((datef.getDate()) < 10) {
     diasf = '0' + (datef.getDate())  
    } else {
      diasf = (datef.getDate());
    };
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
    
    Axios.all([
      Axios.get(`${API_URL}/getDescarteResumo?Line=${values.Line}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
      Axios.get(`${API_URL}/getSaidaResumo?Line=${values.Line}&Halb=${values.Halb.substring(0,11)}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
      Axios.get(`${API_URL}/getEstoque?Line=${values.Line}&Halb=${values.Halb.substring(0,11)}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
      Axios.get(`${API_URL}/getReturnResumo?Line=${values.Line}&Halb=${values.Halb.substring(0,11)}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
      Axios.get(`${API_URL}/getClasseAResumo?Line=${values.Line}&Halb=${values.Halb.substring(0,11)}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),

    ]).then(Axios.spread((DescarteResumoRes, SaidaResumoRes, Entrares,RetornoResumoRes,ClasseAResumoRes) =>{
      setListdescarte(DescarteResumoRes.data);
      setListsaida(SaidaResumoRes.data);
      setEntra(Entrares.data);
      setListretorno(RetornoResumoRes.data);
      setListclassea(ClasseAResumoRes.data)
    }))
  }

  useEffect(() => {
    Axios.get(`${API_URL}/getDescarte`).then((response) => {
      setListCards(response.data);
    });
  }, []);
  

  useEffect(() => {
    Axios.get(`${API_URL}/getModelo`).then((response) => {
      setListHalb(response.data);
    });
  }, []);

  const columns = {
    
    cellClassName: (params) => {
      if (params.value == null) {
        return '';
      }

      return clsx('super-app', {
        negative: params.value < 0,
        positive: params.value > 0,
      });
    },
  }



  return (


<div className='row justify-content-center col-12'>
      <Box style={{marginTop:10, border:'0.1rem solid', borderColor:'#eeeef3', borderRadius:10, width:'98%'}}
      className='row justify-content-around col-12'>
      
        <Row>
        
        <Col>
              <div >Data Inicial
                <Button onClick={handleCalendar} style={{ marginBottom: 10, height: 40, width: '100%', alignItems: 'center', background: 'white',
                 color: 'black', borderColor:'#eeeef3' }}>
                  {date.toDateString()}</Button>
                {mostrarCalendario &&
                  <Calendar
                    onChange={setDate}
                    value={date}
                    selectRange={false}
                  // onClick={ocultarCalendario}
                  />}
              </div>
              </Col>

            <Col>
              <div className='calendar-container'>
                <div>Data Final</div>
                <Button onClick={handleCalendar} style={{ marginBottom: 10, height: 40, width: '100%', alignItems: 'center', background: 'white',
                color: 'black', borderColor:'#eeeef3' }}>
                  {datef.toDateString()}</Button>
                {mostrarCalendario &&
                  <Calendar
                    onChange={setDatef}
                    value={datef}
                    selectRange={false}
                  />}
              </div>
              </Col>

<Col>
            <Form.Label>Halb | Model</Form.Label>
            <Form.Select onClick={oculta} defaultValue="Choose..." id='Halb' name='Halb' onChange={handleChange} placeholder='Choose Halb' required>
              <option></option>
              <option value=''>All</option>
              {listhalb.filter(model => model.Plant.includes('P81J')).map((val, index) => (

                <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
              ))}
              {listhalb.filter(model => model.Plant.includes('P81L')).map((val, index) => (

                <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
              ))}
              {listhalb.filter(model => model.Plant.includes('P81M')).map((val, index) => (

                <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
              ))}
              {listhalb.filter(model => model.Plant.includes('P81N')).map((val, index) => (

                <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
              ))}
              {listhalb.filter(model => model.Plant.includes('P81P')).map((val, index) => (

                <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
              ))}
            </Form.Select>
            </Col>

<Col>
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
            </Col>

            <Col>
            <Button align='center'style={{ marginTop: 23, width: '100%' }} type="button" onClick={handleSubmit}>Procurar</Button>
            </Col>
            
            </Row>      
      </Box>
      </div>   
 
  );
}