import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box, TableRow, tableCell, Buttom } from "@mui/material";
import { ListGroup } from "react-bootstrap";
import { Button } from "@mui/material";
import { ListItem, ListItemText } from "@mui/material";
import { DataGrid, GridToolbar, useGridApiContext  } from '@mui/x-data-grid';
import Select from '@mui/material/Select';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { styled } from '@mui/material/styles';
import { PanoramaFishEyeSharp } from "@mui/icons-material";
import ApproverSelect from "./ReflowDatagrid";
import ApproverSelect2 from "./ReflowDatagrid2";


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
  const [values, setValues] = useState({
    Tecnico: "",
    Turno: "",
    Linha: "",
    Modelo: "",
    Arquivo: null
  });
  const [lista, setLista] = useState([]);
  const [listhalb, setListHalb] = useState([] );

  const [selectedRows, setSelectedRows] = useState([]);
  const [approvador, setApprovador] = useState({name: null, index: null});
  const [status, setStatus] = useState(null);
  const [approvador2, setApprovador2] = useState({name: null, index: null});
  // const [approvador2, setApprovador2] = useState(null);
  const [status2, setStatus2] = useState(null);

 //nao mexer
 useEffect(() => {
  Axios.get("http://105.103.39.102:8080/getModelo").then((response) => {
    const listHalb = response.data;
    listHalb.sort((a, b) => a.Basic_Model.localeCompare(b.Basic_Model)); // Ordenando em ordem alfabética
    setListHalb(listHalb);
  });
}, []);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setValues({ ...values, arquivo: file });
  }

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append('tecnico', values.tecnico);
    formData.append('turno', values.turno);
    formData.append('linha', values.linha);
    formData.append('modelo', values.modelo);
    formData.append('arquivo', values.arquivo);
  
    Axios.post('http://105.103.39.102:8080/profile', formData)
      .then(response => {
        console.log();
        alert('Salvou, ta top');
      })
      .catch(error => {
        console.error(error);
        alert('Ocorreu um erro ao enviar a mensagem.'+error);
      });
  }

const handleaddValues = (value) => {
  setValues((prevValues) => ({
    ...prevValues,
    [value.target.name]: value.target.value,
  }));
};
//---------------------------------------------------------------------------------------------------
const updateStatus = (Aprovador, Aprovador2, Status, Status2, id) => {
  const row = lista.find(i => i.id === id);
  Axios.put(`http://105.103.39.102:8080/PendProfile`, {
    Aprovador: Aprovador ?? row.Aprovador,
    Status: Status ?? row.Status,
    Aprovador2: Aprovador2 ?? row.Aprovador2,
    Status2: Status2 ?? row.Status2,
    id: id
  })
  .then(response => {
    window.location.reload();
    console.log(response.data.MSG);
    // Atualiza o estado local ou realiza outras ações necessárias
  })
  .catch(error => {
    console.error(error);
  });
};


function renderSaveButtonCell(params) {
  return (
  <div style={{ display: 'flex', justifyContent: 'center' }}>
  <Button variant="contained" onChange={(updateStatus) => alert(`Save row ${params.row.id}`)} onClick={() => {
    updateStatus(approvador.name, approvador2.name, status, status2, params.row.id);
  }}>
  Salvar
  </Button>
  </div>
  );
  }

  function handleApproval(id, aprovador) {
    updateStatus(",", ",", id)}

    function handleApproval2(id, aprovador2) {
      updateStatus(",", ",", id)
    }
//------------------------------------------------------------------------------------------------------

useEffect(() => {
  Axios.get("http://105.103.39.102:8080/ListaProfile").then((response) => {
    setLista(response.data);
  });
}, []);


      return (
      <>
      <div className='row justify-content-center'>

  <h2 style={{textAlign:'center'}}> Input Profile </h2>
      <Box style={{margin:10, background: 'White', boxShadow: '2px 2px 5px gray', borderRadius:8, width:'90%'}}> 
  
        <Form onSubmit={handleSubmit}>

<Row style={{justifyContent:'center'}} >
  
<Form.Group style={{width:'15%', marginTop:10 }}>
          <Form.Label>Técnico</Form.Label>
          <Form.Select id='Tecnico' name='Tecnico' onChange={handleaddValues} required>
         <option></option>
         <option>Abraao Saraiva</option>
         <option>Arthur Jorge</option>
         <option>Clailton Campos</option>
         <option>Daniel Gouveia</option>
         <option>Daniela Brito</option>
         <option>David William</option>
         <option>Deimison Souza</option>
         <option>Diego Gato</option>
         <option>Edineia Bastos</option>
         <option>Erika Fernandes</option>
         <option>Igor Henrique</option>
         <option>Joicy Mara</option>
         <option>Jonathan Kley</option>
         <option>Karina Gloria</option>
         <option>Lindomar Ferreira</option>
         <option>Madson Bentes</option>
         <option>Malu Saturnino</option>
         <option>Matheus Rebello</option>
         <option>Pedro Pestana</option>
         <option>Rodrigo Oliveira</option>
         <option>Rubem Assis</option>
         <option>Swammy fonseca</option>
         <option>Tiago Martins</option>
         <option>Vanderlei Ferreira</option>
         <option>Whelica Thaiana</option>



          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:'15%', marginTop:10 }}>
          <Form.Label>Turno</Form.Label>
          <Form.Select defaultValue="Choose..." id='Turno' name='Turno' onChange={handleaddValues} required>
         <option></option>
         <option>1T</option>
         <option>2T</option>
         <option>3T</option>
          </Form.Select>
          </Form.Group>

          <Form.Group style={{width:'15%', marginTop:10 }}>
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
          </Form.Select>
          </Form.Group>

          <Form.Group style={{ width:'15%', marginTop: 10 }}>
                    <Form.Label>Halb | Basic Model</Form.Label>
                    <Form.Select rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      id="Modelo" onChange={handleaddValues} name='Modelo' required >
                      <option></option>
                      {listhalb.map((val, index) => (
                        <option key={index}>{val.Basic_Model}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
{/* ----------------------------------------------- */}
   
   <div style={{width:'15%', marginTop:30}}>
<Button
      component="label"
      role={undefined} variant="contained" tabIndex={-1} id="Arquivo" name="Arquivo"
      startIcon={<CloudUploadIcon />} onChange={(event) => setValues(event.target.files[0])}> Upload file
      <VisuallyHiddenInput type="file"/>
    </Button>
    </div>

      {/* <input style={{width:'15%', marginTop:35}} type="file" id="Arquivo" name='Arquivo' onChange={(event) => setValues(event.target.files[0])} /> */}
          <Button variant="contained" style={{width:'10%', marginLeft: -100, marginTop:25, marginBottom:10, height:40}} type="submit" onSubmit={handleSubmit}>Register</Button>
</Row>
        </Form>
        </Box>
        </div>

        <h2 style={{marginTop:20}} className='h2'> Profiles Pendentes </h2>
    <div style={{ height:500 , width:'100%', padding:'2px', marginTop:10, justifyContent:'center' }}>
  
      <DataGrid hover={true} className='' 
        columns={[
          // { field: 'id', hideable: true,
          //  align:'center', headerAlign:'center', headerClassName:'header-class'},
           { field: 'Pendencia', flex: 2, headerName:'Pendente',
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Data', flex: 2, headerName:'Data de Entrada',
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Turno', flex: 2, minWidth: 50, 
           align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Linha', flex: 2, minWidth: 50,
           align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Modelo', flex: 2, minWidth: 100,
           align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Tecnico', flex: 2, 
           align:'center', headerAlign:'center', headerClassName:'header-class'},
          { field: 'Arquivo', flex: 2, 
           align:'center', headerAlign:'center', headerClassName:'header-class'},
          {
            field: "Aprovador", minWidth: 150, headerClassName: "header-class",
            headerName: "Aprovador - Qualidade", value:'Aprovador',
            renderCell: (params) => {
              return [<ApproverSelect aprovador={params.value} aprovadorAtivo={approvador} 
                setAprovador={(value) => setApprovador(value)} index={params.id}/>];
            },},
          
          {
            field: "Status", minWidth: 150, headerClassName: "header-class",
            headerName: "Status", value:'Status',
            renderCell: (params) => {
              return [
                  <>
                  <select value={params.value} onChange={ (e) => setStatus(e.target.value)}>
                  <option value=''></option>
                    <option value='Aprovado'>Aprovado</option>
                    <option value='Rejeitado'>Rejeitado</option>
                    </select></>
              ]
          },},

          {
            field: "Aprovador2", minWidth: 150, headerClassName: "header-class",
            headerName: "Aprovador - Manutenção", value:'Aprovador2',
            renderCell: (params) => {
              return [<ApproverSelect2 aprovador2={params.value} aprovadorAtivo2={approvador2} 
                setAprovador2={(value) => setApprovador2(value)} index={params.id}/>];
            },
          },

          {
            field: "Status2", minWidth: 150, headerClassName: "header-class",
            headerName: "Status", value:'Status2',
            renderCell: (params) => {
              return [
                  <>
                  <select value={params.value} onChange={ (e) => setStatus2(e.target.value)}>
                  <option value=''></option>
                    <option value='Aprovado'>Aprovado</option>
                    <option value='Rejeitado'>Rejeitado</option>
                    </select></>
              ]
          },
          },
          {
            field: "Action", headerClassName: "header-class",
            headerName: "Action",
            width: 160,
            renderCell: renderSaveButtonCell,
          },
        ]}
        pageSize={5}
        autoPageSize
        disableSelectionOnClick
        density="compact"

        rows = {lista}
        slots={{
        toolbar: GridToolbar,
    
      }} />
    
    </div>
     </>
  
    )
  }
  