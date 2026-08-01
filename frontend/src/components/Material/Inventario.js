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

export default function App() {

  const [formData, setFormData] = useState({itens: [],});
  const [values, setValues] = useState();

  const [listModelo, setListModelo] = useState([]);
  const [lista, setLista] = useState([]);
  console.log(listModelo);

 
// dias conforme o filtro do gmes
 

  const handleSubmit = () => {
    Axios.post('http://105.103.39.102:8080/inv',{
        Data:values.Data,
        Basic_Model:values.Basic_Model,
        Codigo:values.Codigo,
        Fase:values.Fase,
        Material:values.Material,
        Qty_Bottom:values.Qty_Bottom,
        Qty_Top:values.Qty_Top,
        Qty_Reparo:values.Qty_Reparo,
        Qty_Offline:values.Qty_Offline,
        Qty_Wip:values.Qty_Wip,
        Qty_Scrap:values.Qty_Scrap,
        Pend_Kitting:values.Pend_Kitting,
        Qty_Plano:values.Qty_Plano,
        Observacao:values.Observacao,
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
    Axios.get("http://105.103.39.102:8080/getinventario").then((response) => {
      setLista(response.data);
    });
  }, []);

  useEffect(() => {
    Axios.get("http://105.103.39.102:8080/getModelo").then((response) => {
      setListModelo(response.data);
    });
  }, []);

  const fileName = "Relatório Inventário"; // here enter filename for your excel file

  // -----------------------------------------------------------------------------------------------------------------------------------
      
  return (
      <>
      <NavbarComp/>
      <div class='row justify-content-center' style={{width:'100%'}}>
      <Box style={{margin:10, background: 'transparent', borderRadius:8, width:'80%'}}>
  
  <h2 style={{textAlign:'center'}}> Daily Inventory </h2>
  
        <Form style={{border:'solid 0.1rem', borderColor:'#84aac6',borderRadius:10, margin:20}} onSubmit={handleSubmit}>

        

<Row style={{justifyContent:'center'}} >
  
<Form.Group style={{width:200, marginLeft:20, marginTop:10, textAlign:'center' }}>
          <Form.Label>Modelo</Form.Label>
          <Form.Select defaultValue="Choose..." id='Basic_Model' name='Basic_Model' onChange={handleaddValues} required>
          <option></option>
          {listModelo.map((val, index) => (
          <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
          ))}

          </Form.Select>
          </Form.Group>
          

<Form.Group style={{width:200, marginTop:10, marginLeft:0, textAlign:'center' }}>
          <Form.Label>Código</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Codigo"  onChange={handleaddValues} name='Codigo' required />
        </Form.Group>

          <Form.Group style={{width:200, marginLeft:20, marginTop:10, textAlign:'center' }}>
          <Form.Label>Fase</Form.Label>
          <Form.Select defaultValue="Choose..." id='Fase' name='Fase' onChange={handleaddValues} required>
          <option></option>
          <option>Top</option>
          <option>Bottom</option>
          <option>PCB Limpa</option>
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:200, marginTop:10, marginLeft:0, textAlign:'center' }}>
          <Form.Label>Material</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Material"  onChange={handleaddValues} name='Material' required />
        </Form.Group>

          </Row>

{/* //--------------------------------------------- */}

          <Row style={{justifyContent:'center'}} >
    <div style={{marginTop:20}}>
    <strong style={{marginLeft:'45%', fontStyle:'bold', width:150}}>Quantidade de Placas</strong>
    </div>
         <div class='row' style={{border:'0.1rem solid', borderColor:'#E6e7e8', borderRadius:10, justifyContent:'space-around',
         width:'90%', marginTop:10, marginBottom:10, height:8080, textAlign:'center'
         }}>
          <Form.Group style={{width:150, marginTop:10, marginLeft:0, textAlign:'center'}}>
          <Form.Label>Qty Bottom</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Qty_Bottom"  onChange={handleaddValues} name='Qty_Bottom' required />
        </Form.Group>

        <Form.Group style={{width:150, marginTop:10, marginLeft:0, textAlign:'center' }}>
          <Form.Label>Qty Top</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Qty_Top"  onChange={handleaddValues} name='Qty_Top' required />
        </Form.Group>
          <Form.Group style={{width:150, marginTop:10, marginLeft:0, textAlign:'center' }}>
          <Form.Label>Qty Reparo</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Qty_Reparo"  onChange={handleaddValues} name='Qty_Reparo' />
        </Form.Group>

          <Form.Group style={{width:150, marginTop:10, marginLeft:0, textAlign:'center' }}>
          <Form.Label>Qty Offline</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Qty_Offline"  onChange={handleaddValues} name='Qty_Offline' />
        </Form.Group>

        <Form.Group style={{width:150, marginTop:10, marginLeft:0, textAlign:'center' }}>
          <Form.Label>Qty WIP</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Qty_Wip"  onChange={handleaddValues} name='Qty_Wip' />
        </Form.Group>

        <Form.Group style={{width:150, marginTop:10, marginLeft:0, textAlign:'center' }}>
          <Form.Label>Qty Scrap</Form.Label>
          <Form.Control rules={[{required: true, message: 'Insira a Quantidade!',},]} 
          defaultValue="" maxLength={10} id="Qty_Scrap"  onChange={handleaddValues} name='Qty_Scrap'/>
        </Form.Group>

        </div>

        </Row>
        
          <Row style={{justifyContent:'center'}}>

        <Form.Group style={{width:200, marginTop:10, marginLeft:20, textAlign:'center' }}>
          <Form.Label>Pend Kitting</Form.Label>
          <Form.Control defaultValue="" id='Pend_Kitting' name='Pend_Kitting' onChange={handleaddValues} placeholder='Insira a Qty Pendente do kit' required>
          </Form.Control>
          </Form.Group>      

          <Form.Group style={{width:200, marginLeft:20, marginTop:10, textAlign:'center' }}>
          <Form.Label>Qty Plano</Form.Label>
          <Form.Control defaultValue="" id='Qty_Plano' name='Qty_Plano' onChange={handleaddValues} placeholder='Insira a Qty do Plano' required>
          </Form.Control>
          </Form.Group>

        <Form.Group style={{width:475, marginLeft:20, marginTop:10, textAlign:'center' }}>
          <Form.Label>Observação</Form.Label>
          <Form.Control as='textarea' rules={[{required: true, message: 'Insira o motivo do controle de MSL',},]} 
          defaultValue="" maxLength={200} id="Observacao" name='Observacao' onChange={handleaddValues}  required />
        </Form.Group>

        </Row>
       

        <Row style={{justifyContent:'center'}}>
        <Button style={{width:'20%', marginTop:20, marginBottom:10, height:'40'}} type="submit" onSubmit={handleSubmit}>Register</Button>
        </Row> 

        </Form>
        </Box>
        </div>


        <h2 style={{marginTop:-10}} className='h2'>Inventory History</h2>
    <div style={{ height:500 , width:'99%', padding:'2px', marginTop:'-30px', marginLeft:'0.5%'}}>
    <ExportToExcel apiData={lista} fileName={fileName}/>
      <DataGrid hover={true} 
        columns={[
          { field: 'id', hideable: false,
          minWidth: 10, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Data', flex: 2,
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Basic_Model', flex: 2,
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Codigo', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Fase', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Material', flex: 1,
          minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'User', flex: 2,
          // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Bottom', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Top', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Reparo', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Offline', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Wip', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Scrap', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Pend_Kitting', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Plano', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Observacao', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
        ]}

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
    </div>
      </>
    )
  }
  