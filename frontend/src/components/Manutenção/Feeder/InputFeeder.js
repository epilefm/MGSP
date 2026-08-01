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
import {ExportToExcel} from '../../Excel/Excel_Export'
import NavbarComp from '../../Layout/NavbarComp'
import clsx from 'clsx';


export default function App() {

  const [values, setValues] = useState();
  const [lista, setLista] = useState([]);

// dias conforme o filtro do gmes

  const handleSubmit = () => {
    Axios.post('http://105.103.39.102:8080/Feeder',{
        id:values.id,
        data:values.data,
        Turno:values.Turno,
        Tecnico:values.Tecnico,
        Codigo:values.Codigo,
        Tamanho:values.Tamanho,
        Ano:values.Ano,
        Status:values.Status,
        Manutencao:values.Manutencao,
        Peca:values.Peca,
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
  .get("http://105.103.39.102:8080/getFeeder")
  .then(response=>setLista(response.data))
}, []);


  const fileName = "Relatório Feeder"; // here enter filename for your excel file

  // -----------------------------------------------------------------------------------------------------------------------------------
      
  return (
      <>
      <NavbarComp/>
      <div class='row d-flex justify-content-center' style={{width:'100%'}}>
      <Box style={{background: 'transparent', borderRadius:8, width:'90%',
       marginBottom:20, marginTop:5, marginLeft:19
    }}>
  
  <h2 style={{textAlign:'center'}}> Registro da Manutenção de Feeder </h2>
  
        <Form className='row justify-content-around'
        style={{border:'solid 0.1rem', borderColor:'#84aac6',borderRadius:10}} onSubmit={handleSubmit}>

<Row style={{justifyContent:'center'}} >    
      <Col>
        <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
        <Form.Label>Turno</Form.Label>
        <Form.Select  maxLength={25} id="Turno" onChange={handleaddValues} name='Turno' required>
                       <option></option>
          <option>1T</option>
          <option>2T</option>
          <option>3T</option>
          </Form.Select>
          </Form.Group>    
          </Col>

          <Col>
          <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Tecnico</Form.Label>
        <Form.Select rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue="" maxLength={25} id="Tecnico" onChange={handleaddValues} name='Tecnico' required>
                       <option></option>
          <option>Camilo</option>
          <option>Carla</option>
          <option>Elenildo</option>
          <option>Harlyson</option>
          <option>Mauro</option>
          <option>Stanley</option>
          <option>Tatiane</option>
.        </Form.Select>     
      </Form.Group>
          </Col>


      <Col>
        <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Código</Form.Label>
          <Form.Control defaultValue="" id='Codigo' name='Codigo' onChange={handleaddValues} placeholder='Insira o código' required>
          </Form.Control>
          </Form.Group>      
          </Col>

          <Col>
          <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Tamanho</Form.Label>
        <Form.Select maxLength={25} id="Tamanho" onChange={handleaddValues} name='Tamanho' required>
                       <option></option>
          <option>8</option>
          <option>12</option>
          <option>16</option>
          <option>24</option>
          <option>32</option>
          <option>44</option>
          <option>56</option>
          <option>72</option>
.        </Form.Select>     
      </Form.Group>
          </Col>
          </Row>

          <Row style={{width:'100%', justifyContent:'center'}}>
          <Col>
        <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Ano</Form.Label>
          <Form.Control id='Ano' name='Ano' onChange={handleaddValues} placeholder='Insira o Ano' required>
          </Form.Control>
          </Form.Group>      
          </Col>

               <Col>
          <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Status</Form.Label>
        <Form.Select maxLength={25} id="Status" onChange={handleaddValues} name='Status' required>
                       <option></option>
          <option>PM</option>
          <option>Breakdown Repairment</option>
.        </Form.Select>     
      </Form.Group>
          </Col>

          <Col>
        <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Manutenção</Form.Label>
          <Form.Control id='Manutencao' name='Manutencao' onChange={handleaddValues} placeholder='Insira qual a Manutenção' required>
          </Form.Control>
          </Form.Group>      
          </Col>
          
          <Col>
        <Form.Group style={{width:'80%', marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Peça</Form.Label>
          <Form.Control id='Peca' name='Peca' onChange={handleaddValues} placeholder='Insira a Peça' required>
          </Form.Control>
          </Form.Group>      
          </Col>

          </Row> 

        <Row style={{width:'100%', justifyContent:'center'}}>

        <Button style={{width:'20%', marginTop:20, marginBottom:10, height:'40'}} type="submit" onSubmit={handleSubmit}>Registrar</Button>
        </Row> 

        </Form>                 
        </Box>
        </div>

<Box>
        <h2 style={{marginTop:-10}} className='h2'> Histórico de Entrada de MSL</h2>
    <div style={{ height:500 , width:'100%', padding:'2px', marginTop:'-30px', justifyContent:'center' }}>
    <ExportToExcel apiData={lista} fileName={fileName}/>
      <DataGrid hover={true} className='' 
        columns={[
          { field: 'id', hideable: false,
                minWidth: 10, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Data', flex: 2,
                minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Turno', flex: 2,
                minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Tecnico', flex: 2,
                minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Codigo', flex: 2,
                minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Tamanho', flex: 2,
                minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Ano', flex: 2,
                minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Status', flex: 1,
                minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Manutencao', flex: 1,
                minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
                { field: 'Peca', flex: 1,
                minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
              ]}

        rows = {lista}
        slots={{
        toolbar: GridToolbar,
    
      }}
      />
    </div>

             </Box>
   
      </>
    )
  }
  