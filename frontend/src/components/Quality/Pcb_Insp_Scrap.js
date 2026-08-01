import { API_URL } from '../../config/api';
import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import { ListItem, ListItemText } from "@mui/material";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ExportToExcel } from '../Excel/Excel_Export'
import { randomNumberBetween } from "@mui/x-data-grid/utils/utils";
import NavbarComp from '../Layout/NavbarComp'

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from '@mui/x-data-grid';

export default function App() {

  const [formData, setFormData] = useState({ itens: [], });
  const [listCard, setListCard] = useState([App]);
  const [values, setValues] = useState();
  const [listhalb, setListHalb] = useState([]);
  const [listModelo, setListModelo] = useState([]);
  const [lista, setLista] = useState([]);
  const [count, setCount] = useState(1);
  const [rows, setRows] = React.useState(formData.itens);
  const [rowModesModel, setRowModesModel] = React.useState({}); 

  console.log(listCard);

  // dias conforme o filtro do gmes

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  function limpaCampos() {
    const element1  = document.getElementsByName("CN"); // Limpa o campo
    element1.forEach(element => {
      console.log(element);
      element.value = '';
      element.focus();
      setCount(count+1);
    })
  }

  const handleAddItem = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
      itens: [...formData.itens, {
        id:count,
        CN: formData.CN,
        Fase: formData.Fase,
        Halb: formData.Modelo.substring(0, 11),
        Modelo: formData.Modelo.slice(13, 25),
        Turno: formData.Turno,
        Linha: formData.Linha,
        Processo: formData.Processo, 
        Equipamento: formData.Equipamento,
        Origem: formData.Origem,
        Motivo: formData.Motivo,
        Causa_raiz: formData.Causa_raiz,
        Corretiva: formData.Corretiva,
        Preventiva: formData.Preventiva,
        Operador: formData.Operador,
        PQC: formData.PQC,
        MK: formData.MK,
        Lider:formData.Lider,
        Sup_Manut: formData.Sup_Manut,
        Sup_Qualidade: formData.Sup_Qualidade,
        Sup_Prod: formData.Sup_Prod,
      }],
      });
      limpaCampos()
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const array = formData.itens.map(item => ({
      CN: item.CN,
      Fase: item.Fase,
      Halb: item.Modelo,
      Modelo: item.Modelo,
      Linha: item.Linha,
      Turno: item.Turno,
      Processo: item.Processo,
      Equipamento: item.Equipamento,
      Origem: item.Origem,
      Motivo: item.Motivo,
      Causa_raiz: item.Causa_raiz,
      Corretiva: item.Corretiva,
      Preventiva: item.Preventiva,
      Operador: item.Operador,
      PQC: item.PQC,
      MK: item.MK,
      Lider:item.Lider,
      Sup_Manut: item.Sup_Manut,
      Sup_Qualidade: item.Sup_Qualidade,
      Sup_Prod: item.Sup_Prod
    }))

    Axios.post(`${API_URL}/Scrap`, array)
      .then((response)=>{
        if(response.data.success){
          alert(response.data.msg)
          ;
        }
    })
      .catch(error => {
        console.error(error);
        alert('Ocorreu um erro ao enviar a mensagem.');  
        alert('Dados Não salvos!') 
      });
      window.location.reload()
  }; 



  useEffect(() => {
    Axios.get(`${API_URL}/getScrap`)
      .then(response => {
        setLista(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar dados no Reparo Inventario:', error);
      });
  }, []);


  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };


  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id) => () => {
    const updatedItems = formData.itens.filter((item) => item.id !== id);
    const updatedFormData = { ...formData, itens: updatedItems };
    setFormData(updatedFormData);
    console.log("delete: ", id);
  };
  
  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = formData.find((row) => row.id === id);
    if (editedRow.isNew) {
      setFormData(formData.itens.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false };
    setFormData(formData.itens.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };
  const toInputUppercase = e => {
    e.target.value = ("" + e.target.value).toUpperCase();
  };

  const fileName = "Controle de  Placa no Reparo"; // here enter filename for your excel file

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
    Axios.get(`${API_URL}/getModeloReparo`).then((response) => {
      setListHalb(response.data);
    });
  }, []);

  const contagem = (count) => {
    setCount(count + 1);
  }

  return (
    <>
<NavbarComp/>
      <div className='row col-12'>
        <Box style={{ background: 'transparent', borderRadius: 8, width: '100%' }}>

          <h2 style={{ textAlign: 'center' }}> Input - Scrap de Placas </h2>

          <Form style={{ border: 'solid 0.1rem', borderColor: '#84aac6', borderRadius: 10, 
          marginLeft: 20, marginBottom: 30 }} onSubmit={handleAddItem}>

            <div style={{ marginLeft: 20 }}>
              <Row style={{ justifyContent: 'center', width: '100%' }} >

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0 }}>
                    <Form.Label>Responsável (MK)</Form.Label>
                    <Form.Control 
                      maxLength={8} id="MK" placeholder='Inserir a Matrícula' onChange={handleChange} name='MK' required />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Entrada</Form.Label>
                    <Form.Select  id='Processo' name='Processo' onChange={handleChange} required>
                      <option></option>
                      <option>Scrap</option>  <option>Wash Board</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Halb | Basic Model</Form.Label>
                    <Form.Select rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue=""  id="Modelo" onChange={handleChange} name='Modelo' required >
                      <option></option>
                      {listhalb.map((val, index) => (
                        <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Linha</Form.Label>
                    <Form.Select rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue="" id="Linha" onChange={handleChange} name='Linha' required>
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
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Fase</Form.Label>
                    <Form.Select id='Fase' name='Fase' onChange={handleChange} >
                      <option></option>
                      <option>Bottom</option>
                      <option>Top</option>
                      <option>Limpa</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

              </Row>

              <Row style={{ justifyContent: 'center', width: '100%' }}>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Turno</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Turno' name='Turno' onChange={handleChange} required>
                      <option></option>
                      <option>1T</option>
                      <option>2T</option>
                      <option>3T</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Origem</Form.Label>
                    <Form.Select id='Origem' name='Origem' onChange={handleChange} required>
                      <option></option>
                      <option>Fornecedor</option>
                      <option>Máquina</option>
                      <option>Método</option>
                      <option>Operacional</option>
                      <option>Processo</option>
                      <option>Qualidade</option>
                      <option>Reparo</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Equipamento</Form.Label>
                    <Form.Select id='Equipamento' name='Equipamento' onChange={handleChange} required>
                      <option></option>
                      <option>Adesivadora</option>                <option>ATE</option>                            <option>C-Mounter 1</option>
                      <option>C-Mounter 2</option>               <option>C-Mounter 3</option>                              <option>C-Mounter 4</option>
                      <option>C-Mounter 5</option>               <option>C-Mounter 5</option>                              <option>C-Mounter 6</option>
                      <option>C-Mounter 7</option>            <option>Chamber</option>                                    <option>Chip Mounter</option>
                      <option>Conveyor</option>             <option>Dispenser / Underfill</option>                              <option>Entrada Reflow</option>
                      <option>Falha de impressão</option>       <option>Falta de energia</option>                                <option>Flex Mounter</option>
                      <option>Function Test</option>            <option>Gate conveyor</option>                  <option>ict</option>
                      <option>Inverter</option>                <option>Jig Carrier P-AOI</option>             <option>Jig Carrier S-AOI</option>
                      <option>Jig Test</option>              <option>Loader</option>                       <option>Magazine Empenado</option>
                      <option>Magazine Quebrado</option>          <option>Magazine Incorreto</option>                    <option>Manutenção Preventiva</option>
                      <option>M-AOI Bot</option>              <option>M-AOI Top</option>                       <option>Máquina de Solda</option>
                      <option>NG-Buffer / S-AOI</option>                 <option>Obsoleto</option>                          <option>P-AOI Bot</option>
                      <option>P-AOI Top</option>                   <option>Printer Bot</option>                      <option>Printer Top</option>
                      <option>PRO-500</option>                   <option>Qr-Code</option>                    <option>Qualidade</option>
                      <option>Reflow</option>         <option>Reparo</option>                  <option>Router</option>
                      <option>S-AOI</option>                 <option>Scara-Robô</option>                  <option>SCM Shield</option>
                      <option>SCM Tape</option>                <option>SCM Tim</option>                        <option>Shuttle Con'v (Front)</option>
                      <option>Speed Shuttle Con'v (Rear)</option>                  <option>Shuttle P-AOI</option>                      <option>Unloader</option>
                      <option>Unloader Chamber</option>                   <option>Vacuum Loader</option>                        
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Motivo</Form.Label>
                    <Form.Select id='Motivo' name='Motivo' onChange={handleChange} required>
                      <option></option>
                      <option>Alimentação Errada</option>         <option>1° Corte - Setup/LQV</option>           <option>Cobre Exposto</option>
                      <option>Componente Alterado</option>        <option>Componente Contaminado</option> 
                      <option>Componente Danificado - Processo</option>      <option>Componente Danificado - Reparo</option>     <option>Componente Danificado - Rolo / Vendor</option>
                      <option>Componente Deslocado</option>
                      <option>Componente Faltando</option>        <option>Contaminação de Solda</option>   <option>Excesso de Solda</option>
                      <option>Excesso de Underfill</option>       <option>Gravação Errada</option>       <option>Insuficiência de Solda</option>
                      <option> Loss de Processo</option>       <option>Magazine Desajustado</option>       <option>Material Segregado</option>
                      <option>PCB Contaminada</option>       <option>PCB Danificada</option>        <option>PCB Empenada</option>
                      <option>PCB Encontrada</option>     <option>PCB Furada</option>     <option>PCB Grudada</option>
                      <option>PCB Não Curada</option>     <option>PCB Obsoleta</option>     <option>PCB Quebrada</option>
                      <option>PCB Queimada</option>     <option>PCB Riscada</option>     <option>PCB Sem Fiducial</option>
                      <option>PCB Segregada</option>     <option>Pitch Errado</option>     <option>Retrabalho</option>
                      <option>Reposição de Scrap</option>     <option>Sensor</option>      <option>Trilha Rompida</option>
                                      
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                <Form.Group style={{ minWidth: '100%', marginTop: 10 }}>
                    <Form.Label>Causa Raiz</Form.Label>
                    <Form.Control as ='textarea'
                      maxLength={200} id="Causa_raiz" onChange={handleChange} placeholder='Insira a Causa Raiz do Scrap' name='Causa_raiz' />
                  </Form.Group>
                </Col>

              </Row>

              <Row style={{ justifyContent: 'center', width: '100%' }}>

                <Col>
                <Form.Group style={{ minWidth: '100%', marginTop: 10 }}>
                    <Form.Label>Ação Corretiva</Form.Label>
                    <Form.Control as ='textarea'
                      maxLength={200} id="Corretiva" onChange={handleChange} placeholder='Insira a Ação Corretiva' name='Corretiva' />
                  </Form.Group>
                </Col>

                <Col>
                <Form.Group style={{ minWidth: '100%', marginTop: 10 }}>
                    <Form.Label>Ação Preventiva</Form.Label>
                    <Form.Control as ='textarea'
                      maxLength={200} id="Preventiva" onChange={handleChange} placeholder='Insira a Ação Preventiva' name='Preventiva' />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0 }}>
                    <Form.Label>Operador</Form.Label>
                    <Form.Control 
                      maxLength={8} id="Operador" placeholder='Inserir a Matrícula' onChange={handleChange} name='Operador' required />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>PQC</Form.Label>
                    <Form.Select id='PQC' name='PQC' onChange={handleChange} required>
                      <option></option>
                      <option>Ana Caroline</option>   
                      <option>Andreza Rodrigues</option>
                      <option>Cleane Coelho</option>
                      <option>Danielle Saraiva</option>
                      <option>Eliane Correa</option>
                      <option>Fabian Oliveira</option>
                      <option>Fabio Oliveira</option>
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
                      <option>Rafaela de Castro</option>
                      <option>Talissa Camurca</option>
                      <option>Wendeu Figueira</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Líder</Form.Label>
                    <Form.Select id='Lider' name='Lider' onChange={handleChange} required>
                      <option></option>
                      <option>Altiana</option>  <option>Ana Alice</option>  <option>Arquimedes</option>    <option>Ádria</option>
                      <option>Jocy</option>    <option>Maiane</option>  
                    </Form.Select>
                  </Form.Group>
                </Col>

              </Row>

              <Row style={{ justifyContent: 'center', width: '100%' }}>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Superv. Manutenção</Form.Label>
                    <Form.Select id='Sup_Manut' name='Sup_Manut' onChange={handleChange} required>
                      <option></option>
                      <option>Ayala</option>  <option>Marcelo</option>  <option>Mauro</option>    <option>Wilson</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Superv. Qualidade</Form.Label>
                    <Form.Select id='Sup_Qualidade' name='Sup_Qualidade' onChange={handleChange} required>
                      <option></option>
                      <option>Francis</option>  <option>Kellen</option>  <option>Danielma</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Superv. Produção</Form.Label>
                    <Form.Select id='Sup_Prod' name='Sup_Prod' onChange={handleChange} required>
                      <option></option>
                      <option>Ailton</option>  <option>Fabrício</option>  <option>Geilson</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>CN (SN) Input</Form.Label>
                    <Form.Control 
                      minLength={10} maxLength={13} onInput={(e) => e.target.value = ("" + e.target.value).toUpperCase()}
                      id="CN" onChange={handleChange} placeholder='Input da CN' name='CN' required />
                  </Form.Group>
                </Col>

              </Row>

              <Col style={{ marginTop: 13 }}>
                <Row style={{ justifyContent: 'center' }}>
                  <Button style={{ width: '20%', marginBottom: 10, height: 40 }} type="submit"
                  onSubmit={handleAddItem}>Adicionar Itens</Button>

                  <Button style={{ width: '20%', marginBottom: 10, height: 40, marginLeft: 10 }}
                    type="reset" onSubmit={handleReset}>Reset</Button>
                </Row>
              </Col>

              {/* //--------------------------------------------- */}

              <Row style={{ justifyContent: 'center', width: '100%' }}>
              </Row>



            </div>
          </Form>
        </Box>
      </div>

      <Box style={{marginLeft:20}}>

<Button style={{width:'18%', height:40, marginTop:10, marginBottom:-30, backgroundColor:'#0e87e2',
borderColor:'transparent', fontSize:18}} type="submit"
onClick={handleSubmit}>Registrar</Button>

  <h2 style={{marginTop:5, marginBottom:10}} className='h2'> Lista de Itens a serem inputados</h2><br></br>
<div style={{ height:300 , width:'99%', padding:'2px', marginTop:'-30px'}}>

<DataGrid  hover={true} 
columns={[
  { field: 'id', flex: 2,
  minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr', headerName:'ID'},
  { field: 'MK', flex: 1,
  minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Processo', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Halb', flex: 2,
  minWidth: 120, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Modelo', flex: 2,
  minWidth: 120, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Linha', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Fase', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Turno', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Origem', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Equipamento', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Motivo', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Causa_raiz', flex: 2,
  minWidth: 300, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Corretiva', flex: 2,
  minWidth: 300, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Preventiva', flex: 2,
  minWidth: 300, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Operador', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'PQC', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Lider', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Sup_Manut', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Sup_Qualidade', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Sup_Prod', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'CN', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions',
    width: 100,
    cellClassName: 'actions',

    getActions: ({ id }) => {
      const isInEditMode = rowModesModel[formData.itens.id]?.mode === GridRowModes.Edit;

          return [

            <GridActionsCellItem
              icon={<DeleteIcon />}
              label="Delete"
              onClick={handleDeleteClick(id)}
              color="inherit"
        />,
      ];
    },
  }
]}

rows = {formData.itens}
slots={{
}}
initialState={{
  sorting: {
    sortModel: [{ field: 'id', sort: 'desc' }],
  },
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

  <Box style={{marginLeft:20, marginTop:30}}>

  <h2 style={{marginTop:5, marginBottom:10}} className='h2'> Lista dos Inputs</h2><br></br>
<div style={{ height:300 , width:'99%', padding:'2px', marginTop:'-30px'}}>

<DataGrid  hover={true} 
columns={[
  { field: 'id', flex: 2,
  minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr', headerName:'ID'},
  { field: 'MK', flex: 1,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Processo', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Halb', flex: 2,
  minWidth: 120, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Modelo', flex: 2,
  minWidth: 120, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Linha', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Fase', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Turno', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Origem', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Equipamento', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Motivo', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Causa_raiz', flex: 2,
  minWidth: 300, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Corretiva', flex: 2,
  minWidth: 300, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Preventiva', flex: 2,
  minWidth: 300, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Operador', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'PQC', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Lider', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Sup_Manut', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Sup_Qualidade', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'Sup_Prod', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'CN', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},

]}

rows = {lista}
slots={{
}}
initialState={{
  sorting: {
    sortModel: [{ field: 'id', sort: 'desc' }],
  },
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

</>
  )
}
