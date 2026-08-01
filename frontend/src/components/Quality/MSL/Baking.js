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

export default function App() {

  const [formData, setFormData] = useState({itens: [],});
  const [values, setValues] = useState();

  const [listModelo, setListModelo] = useState([]);
  const [lista, setLista] = useState([]);
 

  console.log(listModelo);

 
// dias conforme o filtro do gmes
 

  const handleSubmit = () => {
    Axios.post('http://105.103.39.102:8080/Baking',{
      Processo:values.Processo,
      Part_Number:values.Part_Number,
      MSL:values.MSL,
      Qty:values.Qty,
      Reel_ID:values.Reel_ID,
      Basic_Model:values.Basic_Model,
      Line:values.Line,
      turno:values.turno,
      Matricula:values.Matricula,
      Motivo:values.Motivo
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
    Axios.get("http://105.103.39.102:8080/getBaking").then((response) => {
      setLista(response.data);
    });
  }, []);

  useEffect(() => {
    Axios.get("http://105.103.39.102:8080/getModelo").then((response) => {
      setListModelo(response.data);
    });
  }, []);

      return (
      <>
      
      <div class='row justify-content-center'>
      <Box style={{margin:10, background: 'transparent', borderRadius:8, width:1200}}>
  
  <h2 style={{textAlign:'center'}}> Input de Material MSL (In Progress...) </h2>

        <Form style={{border:'solid 0.1rem', borderColor:'#84aac6',borderRadius:10, margin:20}} onSubmit={handleSubmit}>

<Row style={{justifyContent:'center'}} >
  
        <Form.Group style={{width:200, marginTop:10 }}>
          <Form.Label>Processo</Form.Label>
          <Form.Select defaultValue="Choose..." id='Processo' name='Processo' onChange={handleaddValues} required>
          <option></option>
          <option>WIP</option>
          <option>Produção</option>
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Modelo</Form.Label>
          <Form.Select defaultValue="Choose..." id='Basic_Model' name='Basic_Model' onChange={handleaddValues} required>
          <option></option>
          {listModelo.map((val, index) => (
          <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
          ))}

          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Line</Form.Label>
          <Form.Select defaultValue="Choose..." id='Line' name='Line' onChange={handleaddValues} required>
          <option></option>
          <option>SMD-01</option>   <option>SMD-02</option>   <option>SMD-03</option>   <option>SMD-04</option>   <option>SMD-05</option>
          <option>SMD-06</option>   <option>SMD-07</option>   <option>SMD-08</option>   <option>SMD-09</option>   <option>SMD-10</option>
          <option>SMD-11</option>   <option>SMD-12</option>   <option>SMD-13</option>   <option>SMD-14</option>   <option>SMD-15</option>
          <option>SMD-16</option>   <option>SMD-17</option>   <option>SMD-18</option>   <option>SMD-19</option>   <option>SMD-20</option>
          <option>SMD-37</option>   <option>SMD-38</option>   
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>MSL Level</Form.Label>
          <Form.Select defaultValue="Choose..." id='MSL' name='MSL' onChange={handleaddValues} required>
          <option></option>
          <option>MSL 1</option>
          <option>MSL 2</option>
          <option>MSL 2A</option>
          <option>MSL 3</option>
          <option>MSL 4</option>
          <option>MSL 5</option>
          <option>MSL 5A</option>
          <option>MSL 6</option>   
          
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Turno</Form.Label>
          <Form.Select defaultValue="Choose..." id='turno' name='Turno' onChange={handleaddValues} required>
          <option></option>
          <option>1T</option>
          <option>2T</option>
          <option>3T</option>
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Quantidade</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Qty"  onChange={handleaddValues} name='Qty' required />
        </Form.Group>
          </Row>

{/* //--------------------------------------------- */}

          <Row style={{justifyContent:'center'}} >
        <Form.Group style={{width:200, marginTop:10 }}>
          <Form.Label>Part Number</Form.Label>
          <Form.Control defaultValue="" id='Part_Number' name='Part_Number' onChange={handleaddValues} placeholder='Insira o Part Number' required>
          </Form.Control>
          </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Reel ID</Form.Label>
          <Form.Control defaultValue="" id='Reel_ID' name='Reel_ID' onChange={handleaddValues} placeholder='Insira o Reel_ID' required>
          </Form.Control>
          </Form.Group>

          {/* <Form.Group style={{width:200, marginLeft:20, marginTop:10}}>
          <Form.Label>Data de Entrada</Form.Label>
          <DatePicker onChange={handleChange} style={{width:200, height:28}} id='Data_Entrada' name='Data_Entrada' required/>
          </Form.Group> */}

          <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Matrícula</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a sua matrícula',},]} 
          defaultValue="" maxLength={10} id="Matricula"  onChange={handleaddValues} name='Matricula' required />
        </Form.Group>

        <Form.Group style={{width:200, marginLeft:20, marginTop:10 }}>
          <Form.Label>Observação</Form.Label>
          <Form.Control as='textarea' rules={[{required: true, message: 'Insira o motivo do controle de MSL',},]} 
          defaultValue="" maxLength={200} id="Motivo"  onChange={handleaddValues} name='Motivo' required />
        </Form.Group>

          </Row>

        <Row style={{justifyContent:'center'}}>
        <Button style={{width:'20%', marginTop:20, marginBottom:10, height:'40'}} type="submit" onSubmit={handleSubmit}>Register</Button>
        </Row> 

        </Form>
        </Box>
        </div>


        <h2 marginTop='20px' className='h2'> Material Entrance</h2>
    <div style={{ height: 870 , width:'auto', padding:'2px', marginTop:'10px', justifyContent:'center' }}>
    
      <DataGrid hover={true} className='' 
        columns={[
          { field: 'id', hideable: false,
          minWidth: 10, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Processo', flex: 2,
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Part_Number', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'MSL', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty', flex: 1,
          minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'User', flex: 2,
          // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Matricula', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Basic_Model', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Line', flex: 2,
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
  