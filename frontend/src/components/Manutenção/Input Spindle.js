import { API_URL } from '../../config/api';
import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import { ListItem, ListItemText } from "@mui/material";
import Calendar from "react-calendar";
import { DatePicker } from "antd";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {ExportToExcel} from '../Excel/Excel_Export'
import NavbarComp from '../Layout/NavbarComp'
import moment from "moment-timezone";
import clsx from 'clsx';



export default function App() {

  const [values, setValues] = useState();
  const [lista, setLista] = useState([]);

// dias conforme o filtro do gmes

  const handleSubmit = () => {
    Axios.post(`${API_URL}/spindle`,{
        id:values.id,
        data_manutencao:values.data_manutencao,
        pecas_trocadas:values.pecas_trocadas,
        codigo_spindle:values.codigo_spindle,
        periodicidade:values.data_manutencao,
        tecnico:values.tecnico,
        matricula:values.matricula,
        linha:values.linha,
        contagem:values.contagem,
  }).catch(error => {
    console.error(error);
    alert('Ocorreu um erro ao enviar a mensagem.'+error);
  });
};

const handleaddValues = (value) => {
  setValues((prevValues) => ({
    ...prevValues,
    [value.target.name]: value.target.value,
  }));
};

useEffect(() => {
  Axios
  .get(`${API_URL}/getspindle`)
  .then(response=>setLista(response.data))
}, []);

  const columns=[

    { field: 'id', hideable: false,
          minWidth: 10, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'data_manutencao', flex: 2,
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'tecnico', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'matricula', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'linha', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'codigo_spindle', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'pecas_trocadas', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'periodicidade', flex: 1,
          minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
{
  field: 'contagem',
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
]


  const fileName = "Relatório Spindle"; // here enter filename for your excel file

  // -----------------------------------------------------------------------------------------------------------------------------------
      
  return (
      <>
      <NavbarComp/>
      <div class='row d-flex justify-content-center' style={{width:'100%'}}>
      <Box style={{background: 'transparent', borderRadius:8, width:'90%',
       marginBottom:20, marginTop:5, marginLeft:19
    }}>
  
  <h2 style={{textAlign:'center'}}> Registro da Manutenção de Spindles - Router </h2>
  
        <Form className='row justify-content-around'
        style={{border:'solid 0.1rem', borderColor:'#84aac6',borderRadius:10}} onSubmit={handleSubmit}>

<Row style={{justifyContent:'center'}} >    
<Col>
        <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Id Spindle - QrCode</Form.Label>
          <Form.Control defaultValue="" id='codigo_spindle' name='codigo_spindle' onChange={handleaddValues} placeholder='Ler QrCode' required>
          </Form.Control>
          </Form.Group>      
          </Col>

<Col>
<Form.Group style={{width:'100%', marginTop:10, marginLeft:0, textAlign:'center' }}>
          <Form.Label>Linha</Form.Label>
          <Form.Select defaultValue=" " id='linha' name='linha' onChange={handleaddValues} placeholder='Insert PO' required>
          <option></option>
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
              <option>SMD-11</option>
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
        </Form.Group>
        </Col>

<Col>
        <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Técnico</Form.Label>
          <Form.Control defaultValue="" id='tecnico' name='tecnico' onChange={handleaddValues} placeholder='Insira o nome do tecnico' required>
          </Form.Control>
          </Form.Group>      
          </Col>

<Col>
          <Form.Group style={{width:'80%', marginLeft:20, marginTop:10, textAlign:'center' }}>
          <Form.Label>Matrícula</Form.Label>
          <Form.Control defaultValue="" maxLength={8} id='matricula' name='matricula' onChange={handleaddValues} placeholder='insira a matricula' required>
          </Form.Control>
          </Form.Group>
          </Col>

<Col>
        <Form.Group style={{width:'100%', marginLeft:0, marginTop:10, textAlign:'center' }}>
          <Form.Label>Peças Trocadas</Form.Label>
          <Form.Control as='textarea' rules={[{required: true, message: 'Insira o motivo do controle de MSL',},]} 
          defaultValue="" maxLength={200} id="pecas_trocadas" name='pecas_trocadas' placeholder='max 200 caractere' onChange={handleaddValues}  required />
        </Form.Group>
        </Col>
        </Row>
       
        <Row style={{width:'100%', justifyContent:'center'}}>
        <Button style={{width:'20%', marginTop:20, marginBottom:10, height:'40'}} type="submit" onSubmit={handleSubmit}>Registrar</Button>
        </Row> 

        </Form>
        </Box>
        </div>


        <h2 style={{marginTop:-10}} className='h2'>Histórico</h2>
    <div style={{ height:500 , width:'98%', padding:'2px', marginTop:'-30px', marginLeft:'0.5%'}}>

<div>
    <ExportToExcel apiData={lista} fileName={fileName}/>
    </div>

<Box
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
 }}
>

      <DataGrid hover={true} 
        columns={columns}

        rows = {lista}
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
      </Box>
    </div>
      </>
    )
  }
  