import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box, TableRow, tableCell, Buttom } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import { ListItem, ListItemText } from "@mui/material";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {ExportToExcel} from '../Excel/Excel_Export'
import NavbarComp from '../Layout/NavbarComp'

export default function App() {

  const [formData, setFormData] = useState({itens: [],});
  const [values, setValues] = useState();

  const [listModelo, setListModelo] = useState([]);
  const [lista, setLista] = useState([]);
 

  console.log(listModelo);

// dias conforme o filtro do gmes

  const handleSubmit = () => {
    Axios.post('http://105.103.39.102:8080/Subsidiary',{
      turno:values.turno,
      type:values.type,
      code:values.code,
      line:values.line,
      side:values.side,
      codbarra:values.codbarra,



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
    Axios.get("http://105.103.39.102:8080/getSub").then((response) => {
      setLista(response.data);
    });
  }, []);


  const fileName = "type Baking"; // here enter filename for your excel file

      return (
      <>
      <div class='row justify-content-center'>
      <Box style={{margin:10, background: 'transparent', borderRadius:8, width:1200}}> 

  <h2 style={{textAlign:'center'}}> Input de Retorno de Produtos Químicos</h2>
  
        <Form style={{border:'solid 0.1rem', borderColor:'#84aac6',borderRadius:10, margin:20}} onSubmit={handleSubmit}>

<Row style={{justifyContent:'center'}} >
  
          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Turno</Form.Label>
          <Form.Select defaultValue="Choose..." id='turno' name='turno' onChange={handleaddValues} required>
         <option></option>
         <option>1T</option>
         <option>2T</option>
         <option>3T</option>
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Tipo</Form.Label>
          <Form.Select defaultValue="Choose..." id='type' name='type' onChange={handleaddValues} required>
          <option></option>
          <option>GI</option>   <option>GR</option>   <option>Mixing</option>   <option>Line GR</option>
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Código do produto</Form.Label>
          <Form.Control defaultValue="" id='code' name='code' onChange={handleaddValues} placeholder='Insira o código' required>
          </Form.Control>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Linha</Form.Label>
          <Form.Select defaultValue="Choose..." id='line' name='line' onChange={handleaddValues} required>
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
          </Form.Group>

          </Row>

{/* //--------------------------------------------- */}

          <Row style={{justifyContent:'center'}} >

        <Form.Group style={{width:200, marginTop:10, marginLeft:20 }}>
          <Form.Label>Código de barras</Form.Label>
          <Form.Control defaultValue="" id='codbarra' name='codbarra' onChange={handleaddValues} placeholder='Insira o codigo de barras' required>
          </Form.Control>
          </Form.Group>


          <Form.Group style={{width:200, marginLeft:20, marginTop:10, marginBottom:10 }}>
          <Form.Label>Lado / Fase</Form.Label>
          <Form.Select defaultValue="Choose..." id='side' name='side' onChange={handleaddValues} required>
          <option></option>
          <option>Bottom</option>   <option>Top</option>
          </Form.Select>
          </Form.Group>

          <Button style={{width:'20%', marginLeft: 20, marginTop:35, marginBottom:10, height:40}} type="submit" onSubmit={handleSubmit}>Register</Button>


          </Row>

        </Form>
        </Box>
        </div>


        <h2 style={{marginTop:-10}} className='h2'> Histórico de Entrada de Produtos</h2>
    <div style={{ height:500 , width:'100%', padding:'2px', marginTop:'-30px', justifyContent:'center' }}>
    <ExportToExcel apiData={lista} fileName={fileName}/>
      <DataGrid hover={true} className='' 
        columns={[
          { field: 'id', hideable: false,
          minWidth: 10, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Data', flex: 2, headerName:'Data de Entrada',
          minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'turno', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'type', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'code', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'line', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'side', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'codbarra', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'responsavel', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'saida', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'DataSaida', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},

        ]}

        rows = {lista}
        slots={{
        toolbar: GridToolbar,
    
      }}
      />
    </div>
    
      </>
  
    )
  }
  