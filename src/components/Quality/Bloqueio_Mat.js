import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box, TableRow, tableCell, Buttom, makeStyles } from "@mui/material";
import { ListGroup } from "react-bootstrap";
import { Button } from "@mui/material";
import { ListItem, ListItemText } from "@mui/material";
import { DataGrid, GridToolbar, useGridApiContext  } from '@mui/x-data-grid';
import Select from '@mui/material/Select';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { PanoramaFishEyeSharp } from "@mui/icons-material";
import {ExportToExcel} from '../Excel/Excel_Export'
import Header from "../Layout/MGSPHead/Header";

//-----renderização do upload-----
const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 10,
});

//-----------EXPORT--------
export default function App() {
const [listHalb, setListHalb] = useState ([]);
const [values, setValues] = useState();
const [lista, setLista] = useState([]);

 //nao mexer
 useEffect(() => {
  Axios.get("http://105.103.39.102:8080/getModelo").then((response) => {
    const orderedData = response.data.sort((a, b) => a.Basic_Model.localeCompare(b.Basic_Model)); // Ordenando os dados em ordem alfabética com base na propriedade "Basic_Model"
    setListHalb(orderedData);
  });
}, []);

const handleSubmit = () => {
  Axios.post('http://105.103.39.102:8080/BloqMat',{
    Basic_Model: values.Basic_Model,
    Linha: values.Linha,
    Turno: values.Turno,
    Defeito: values.Defeito,
    Qty_bloq: values.Qty_bloq,
    Qty_def: values.Qty_def,
    PIC: values.PIC,
    Equipamento: values.Equipamento,
    Obs: values.Obse
}).catch(error => {
  console.error(error);
  alert('Ocorreu um erro ao enviar a mensagem.');
});
alert(values.Qty_bloq + ' ' + 'materiais foram bloqueados do defeito' + ' ' + values.Defeito)

window.location.reload();
};


const handleaddValues = (value) => {
  setValues((prevValues) => ({
    ...prevValues,
    [value.target.name]: value.target.value,
  }));
};

const handleReset = (event) => {
  event.preventDefault();
  Array.from(document.querySelectorAll("input")).forEach(
    input => (input.value = "")
  );
  this.setState({
    itemvalues: [{}]
  });
};

useEffect(() => {
  Axios.get("http://105.103.39.102:8080/getBloqMat").then((response) => {
    setLista(response.data);
  });
}, []);


const fileName = "Material Bloqueado"; // here enter filename for your excel file

      return (
      <>
      <Header/>
      <div style={{width:'100%'}} class='row justify-content-center'>

  <h2 style={{textAlign:'center'}}> Bloqueio de Materiais </h2>
      <Box style={{margin:10, background: 'White', boxShadow: '2px 2px 5px gray', borderRadius:8, width:'90%'}}> 
  
        <Form onSubmit={handleSubmit}>

<Row style={{justifyContent:'center'}} >
  
          <Form.Group style={{ width:'11.25%', marginTop: 10 }}>
                    <Form.Label>Modelo</Form.Label>
                    <Form.Select 
                      id="Basic_Model" onChange={handleaddValues} name='Basic_Model' required >
                      <option></option>
                      {listHalb.map((val, index) => (
                        <option key={index}>{val.Basic_Model}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>

                  <Form.Group style={{width:'11.25%', marginTop:10 }}>
          <Form.Label>Linha</Form.Label>
          <Form.Select id='Linha' name='Linha' onChange={handleaddValues} required>
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
              <option>Coating 1</option>
              <option>Coating 2</option>
              <option>Coating 3</option>
              <option>Coating 4</option>
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:'11.25%', marginTop:10 }}>
          <Form.Label>Turno</Form.Label>
          <Form.Select defaultValue="Choose..." id='Turno' name='Turno' onChange={handleaddValues} required>
         <option></option>
         <option>1T</option>
         <option>2T</option>
         <option>3T</option>
          </Form.Select>
          </Form.Group>

          <Form.Group style={{ width:'11.25%', marginTop: 10 }}>
                    <Form.Label>Defeitos</Form.Label>
                    <Form.Control 
                      id="Defeito" onChange={handleaddValues} name='Defeito' required >
                    </Form.Control>
                  </Form.Group>

                  <Form.Group style={{ width:'11.25%', marginTop: 10 }}>
                    <Form.Label>Qty bloqueados</Form.Label>
                    <Form.Control 
                      id="Qty_bloq" onChange={handleaddValues} name='Qty_bloq' required >
                    </Form.Control>
                  </Form.Group>

                  <Form.Group style={{ width:'11.25%', marginTop: 10 }}>
                    <Form.Label>Qty defeitos</Form.Label>
                    <Form.Control 
                      id="Qty_def" onChange={handleaddValues} name='Qty_def' required >
                    </Form.Control>
                  </Form.Group>

<Form.Group style={{width:'11.25%', marginTop:10 }}>
          <Form.Label>PIC</Form.Label>
          <Form.Select id='PIC' name='PIC' onChange={handleaddValues} required>
         <option></option>
         <option>Danielle Saraiva</option>
         <option>Eliane Correa</option>
         <option>Fabian Oliveira</option>
         <option>Geziane Cardoso</option>
         <option>Gustavo Viana</option>
         <option>Jadson Araujo</option>
         <option>Jasson Silva</option>
         <option>Jhems Nogueira</option>
         <option>Larissa Caldas</option>
         <option>Larissa Trindade</option>
         <option>Manoel Soares</option>
         <option>Marcivone Bentes</option>
         <option>Natanael Dias</option>
         <option>Talissa Camurca</option>
          </Form.Select>
          </Form.Group>
          

          <Form.Group style={{width:'11.25%', marginTop:10 }}>
          <Form.Label>Equipamento</Form.Label>
          <Form.Select id='Equipamento' name='Equipamento' onChange={handleaddValues} required>
          <option></option>
            <option>Bancada de Download</option>
            <option>Chamber</option>
            <option>FT</option>
            <option>Mounter</option>
            <option>Pro-500</option>
            <option>Router</option>
            <option>SCM-Tim</option>
            <option>Underfill</option>
            <option>Unloader</option>
             
          </Form.Select>
          </Form.Group>

          <Form.Group style={{ width:'25%', marginBottom: 10, marginRight: 60 }}>
                    <Form.Label>Observação</Form.Label>
                    <Form.Control as='textarea'  defaultValue="" maxLength={200} id="Obs"
                   onChange={handleaddValues} name='Obs' placeholder='Max. 200 caracteres' required />
                  </Form.Group>

      
{/* ----------------------------------------------- */}
   

      {/* <input style={{width:'11.25%', marginTop:35}} type="file" id="Arquivo" name='Arquivo' onChange={(event) => setValues(event.target.files[0])} /> */}
   
          <Button variant="contained" style={{width:'20%', marginLeft: '0%', marginTop:25, marginBottom:10, height:40}} 
          type="submit" onSubmit={handleSubmit}>Register</Button>
          <Button variant="contained" style={{width:'20%', marginLeft: '5%', marginTop:25, marginBottom:10, height:40}}
           type="reset" onSubmit={handleReset}>Resetar</Button>
    </Row>
        </Form>
        </Box>
        </div>

        <h2 style={{marginTop:20}} className='h2'> Histórico de materiais bloqueados </h2>
    <div style={{ height:500 , width:'100%', padding:'2px', marginTop:-5, justifyContent:'center' }}>
  <ExportToExcel apiData={lista} fileName={fileName}/>
    <DataGrid hover={true} 
        columns={[
          { field: 'Data', headerName:'Data',flex: 2,
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Basic_Model', headerName:'Modelo',flex: 2,
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Linha', flex: 2, 
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Turno', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Defeito', flex: 1,
          minWidth: 50, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Qty_bloq', flex: 2,  headerName:'Qty Bloqueados',flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Qty_def', flex: 2,  headerName:'Qty Defeitos',flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'PIC', flex: 2, 
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Equipamento', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'header-class'},
        ]}
        rows = {lista}
        slots={{
        toolbar: GridToolbar,
      }}/>
  
    </div>


     </>
  
    )
  }
  