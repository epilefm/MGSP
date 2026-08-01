import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box } from "@mui/material";
import { ListGroup } from "react-bootstrap";
import { Button } from "@mui/material";
import { ListItem, ListItemText } from "@mui/material";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ExportToExcel } from '../Excel/Excel_Export'
import { randomNumberBetween } from "@mui/x-data-grid/utils/utils";

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from '@mui/x-data-grid';
import NavbarComp from "../Layout/NavbarComp";

export default function App() {

  const [formData, setFormData] = useState({ itens: [], });
  const [listCard, setListCard] = useState([App]);
  const [values, setValues] = useState();
  const [listhalb, setListHalb] = useState([] );
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
    const element1  = document.getElementsByName("CN_rep"); // Limpa o campo
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
      CN_rep: formData.CN_rep,
      Fase: formData.Fase,
      Halb: formData.Modelo.substring(formData.Modelo.lastIndexOf(" ")+1, formData.Modelo.length),
      Modelo: formData.Modelo.replace('|','').slice(0, -13),
      Linha: formData.Linha,
      Turno: formData.Turno,
      Responsavel: formData.Responsavel,
      Recebimento: formData.Recebimento,
      Processo: formData.Processo,
      Origem_SMD: formData.Origem_SMD,
      Causa: formData.Causa,
      Sintoma: formData.Sintoma,
      Origem_Main: formData.Origem_Main,
      Detalhe: formData.Detalhe,
      Location: formData.Location,
      Data_Feedback: formData.Data_Feedback
      }],
      });
      limpaCampos()
  };


  const handleSubmit = (event) => {
    event.preventDefault();
    const array = formData.itens.map(item => ({
      CN_rep: item.CN_rep,
      Fase: item.Fase,
      Halb: item.Halb,
      Modelo: item.Modelo,
      Linha: item.Linha,
      Turno: item.Turno,
      Responsavel: item.Responsavel,
      Recebimento: item.Recebimento,
      Processo: item.Processo,
      Origem_SMD: item.Origem_SMD,
      Causa: item.Causa,
      Sintoma: item.Sintoma,
      Origem_Main: item.Origem_Main,
      Detalhe: item.Detalhe,
      Location: item.Location,
      Data_Feedback: item.Data_Feedback
    }))

    Axios.post('http://105.103.39.102:8080/ReparoEnt', array)
    .then((response) => {
      if (response.data.success) {
        alert('Input da CN ' + formData.CN_rep + ' salvo com sucesso no registro de Placa(s)');
        window.location.reload();
      } else {
        alert('CN' + ' ' + formData.CN_rep + ' ' + 'registrada anteriormente, insira uma nova CN!');
      }
    })
    .catch(error => {
      console.error(error);
      alert('Erro ao processar a solicitação. Por favor, tente novamente mais tarde.');
    });
}; 

  useEffect(() => {
    Axios.get('http://105.103.39.102:8080/getReparo')
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
    Axios.get("http://105.103.39.102:8080/getModeloReparo").then((response) => {
      setListHalb(response.data);
    });
  }, []);

  const contagem = (count) => {
    setCount(count + 1);
  }

  return (
    <>
    
<NavbarComp/>
      <div class='row col-12' style={{justifyContent:'center'}}>
      <Box style={{marginLeft:20, marginTop:10, background: 'White', boxShadow: '2px 2px 5px gray', 
      borderRadius:8, width:'96%'}}> 
  
          <h2 style={{ textAlign: 'center' }}> Input - Entrada de Placas </h2>

          <Form style={{marginLeft: 20, marginBottom: 10 }} onSubmit={handleAddItem}>

            <div style={{ marginLeft: 20 }}>
              <Row style={{ justifyContent: 'center', width: '100%' }} >

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0 }}>
                    <Form.Label>Responsável</Form.Label>
                    <Form.Select

                      id="Responsavel"
                      onChange={handleChange}
                      name='Responsavel'>
                      <option></option>
                      <option style={{color:'Black', fontWeight:'bold'}} value='Técnico' disabled>PQC</option>
                    
                      <option>Arlison Oliveira</option>
                      <option>Cleane Coelho</option>
                      <option>Danielle Saraiva</option>
                      <option>Deysiane Brandão</option>
                      <option>Eliane Correa</option>
                      <option>Fabian Oliveira</option>
                      <option>Francis Jarlen</option>
                      <option>Geziane Cardoso</option>
                      <option>Gustavo Viana</option>
                      <option>Jhems Nogueira</option>
                      <option>Larissa Caldas</option>
                      <option>Larissa Trindade</option>
                      <option>Manoel Soares</option>
                      <option>Marcivone Bentes</option>
                      <option>Natanael Dias</option>
                      <option>Rafaela de Castro</option>
                      <option>Talissa Camurca</option>
                      <option disabled></option>

         <option style={{color:'Black', fontWeight:'bold'}} value='Técnico' disabled>Técnico</option>
                      <option>Adelane</option>
                      <option>Amarildo</option>
                      <option>Andreza R</option>
                      <option>Donald</option>
                      <option>Gabriel</option>
                      <option>Janderson</option>
                      <option>Kaline</option>
                      <option>Marcos</option>
                      <option>Maria</option>
                      <option>Mirian</option>
                      <option>Monica</option>
                      <option>Nelciane</option>
                      <option>Orilene</option>
                      <option>Paula</option>
                      <option>Ronan</option>
                      <option>Tarcilia</option>
                      <option>Thiago</option>
                      <option disabled></option>

         <option style={{color:'Black', fontWeight:'bold'}} value='Auxiliar' disabled>Auxiliar</option>
                      <option>Andreza M</option>
                      <option>Francisco</option>
                      <option>Hudson</option>
                      <option>Juliana F.</option>
                      <option>Nubia</option>
                      <option>Suellem</option>
                      
                      
                      </Form.Select>

                  </Form.Group>
                </Col>

                <Col>
                <Form.Group style={{ width: "100%", marginTop: 10 }}>
                  <Form.Label>Recebimento</Form.Label>
                    <Form.Select 
                    defaultValue="" maxLength={25} id="Recebimento" onChange={handleChange} name='Recebimento' required>
                       <option></option>
          <option>Bancada Feedback</option>
          <option>Bancada Reparo</option>
        </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Entrada</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Processo' name='Processo' onChange={handleChange} required>
                      <option></option>
                      <option>Defeito</option>  <option>Feedback</option> <option>Scrap de Halb</option>
                      <option>Offline / Análise de Qualidade</option>  <option>Defeito Epidêmico</option>
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
                        <option key={index}>{val.Basic_Model + ' | ' + val.Halb}</option>
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
                      <option>Feedback</option>
                      <option>PBA</option>
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
              </Row>

              <Row style={{ justifyContent: 'center', width: '100%' }}>
              <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Fase</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Fase' name='Fase' onChange={handleChange} >
                      <option></option>
                      <option>Bottom</option>
                      <option>Top</option>
                      <option>Limpa</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

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
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0 }}>
                    <Form.Label>Data de Origem (Gmes) - Feedback</Form.Label>
                    <Form.Control maxLength={10} id="Data_Feedback" onChange={handleChange} name='Data_Feedback'
                      placeholder='Digite a Data' />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Origem SMD</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Origem_SMD' name='Origem_SMD' onChange={handleChange} required>
                      <option></option>
                      <option>Análise</option>
                      <option>Bancada</option>
                      <option>DL</option>
                      <option>BT</option>
                      <option>FT</option>
                      <option>Offline</option>
                      <option>Raio-X</option>
                      <option>Revisão</option>
                      <option>S-AOI Bottom</option>
                      <option>S-AOI Top</option>
                      <option>SMD FT</option>
                      <option>Visual</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Origem Main Line</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Origem_Main' name='Origem_Main' onChange={handleChange} >
                      <option></option>
                      <option>BT (RF Call)</option>
                      <option>Calibração</option>
                      <option>LCIA</option>
                      <option>Radiação</option>
                      <option>ST (LCIA)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row style={{ justifyContent: 'center', width: '100%' }}>
              <Col>
                <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Sintoma</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Sintoma' name='Sintoma' onChange={handleChange} >
                      <option></option>
                      <option>Outros</option>   
                      <option disabled></option>   
                      <option>AF Charge</option>              
<option>AGPS</option>
<option>ANT SW MIPI</option>
<option>AP Interface</option>
<option>ATCMD</option>
<option>Audio não atua</option>
<option>Bluetooth</option>
<option>Camera</option>
<option>Check Android Boot Up</option>
<option>CheckEfuse Fail</option>
<option>CheckOmitData</option>
<option>CheckSSDLFlag</option>
<option>Connect</option>
<option>Connect Sahara</option>
<option>CPCrash</option>
<option>DCSRX</option>
<option>DirectCharge</option>
<option>DownloadMTK</option>
<option>DPS</option>
<option>DRX</option>
<option>Earjack</option>
<option>EDGE_UlChannel</option>
<option>Emergency</option>
<option>Enter Test Mode</option>
<option>ExecuteCMDLine</option>
<option>FEMID</option>
<option>FingerPrint</option>
<option>FlashCurrent</option>
<option>Flicker</option>
<option>FMRadio</option>
<option>FuelGauge</option>
<option>General</option>
<option>General: Tester control failed</option>
<option>General: Unexcepted exception</option>
<option>Get Ufs Flash Brand</option>
<option>Giroscópio</option>
<option>GMSensor</option>
<option>GPS</option>
<option>GPS CO-CLOCK</option>
<option>GPS_C1</option>
<option>GripSensor</option>
<option>GSM AGC Calibration: Done</option>
<option>GSM_Band1</option>
<option>GSM_DlChannel</option>
<option>GSM850</option>
<option>GSMDone</option>
<option>HallIC2</option>
<option>InsertRF</option>
<option>Interposer</option>
<option>Kernel</option>
<option>KeyShort</option>
<option>Knox</option>
<option>Leakage</option>
<option>LightSensor</option>
<option>LTE APC Calibration</option>
<option>LTE FHC Calibration</option>
<option>LTE NSFT</option>
<option>LTE_Band12</option>
<option>LTE_Band13</option>
<option>LTE_Band28</option>
<option>LTE_Band38</option>
<option>LTE_Band40</option>
<option>LTE_Band7</option>
<option>LTEMax</option>
<option>MFC</option>
<option>Mic1</option>
<option>Mic2</option>
<option>MicGain</option>
<option>MIPI</option>
<option>Motor</option>
<option>Motor</option>
<option>NADCheck</option>
<option>NADClear</option>
<option>NFC</option>
<option>NR</option>
<option>NVMSelfTest</option>
<option>OctaIDE</option>
<option>OISFirmware</option>
<option>OTG</option>
<option>Payload</option>
<option>PCS1900</option>
<option>Pen</option>
<option>PhoneUnknown</option>
<option>Proximity</option>
<option>RCV</option>
<option>Receiver</option>
<option>Result5G</option>
<option>RFBackOff</option>
<option>RFIC</option>
<option>RFICCH2</option>
<option>SAR</option>
<option>SDCARD</option>
<option>Search Diag Portt 66</option>
<option>Sensor</option>
<option>SensorMagnetico</option>
<option>SIMCard</option>
<option>SIMTray</option>
<option>SleepCurrent</option>
<option>Speaker</option>
<option>SpeedSensor</option>
<option>SPEN</option>
<option>Switch</option>
<option>T11_GSM_Band4</option>
<option>T11_WCDMA_Band5</option>
<option>T14_WCDMA_Band8</option>
<option>T17_LTE_Band7</option>
<option>T2_LTE_Band1</option>
<option>T2_WCDMA_Band1</option>
<option>T3_GSM_Band1</option>
<option>T36_LTE_Band28</option>
<option>T45_LTE_Band40</option>
<option>T48_LTE_Band41</option>
<option>T5_GSM_Band2</option>
<option>T8_GSM_Band3</option>
<option>TADC_RFIC0_TEMP0</option>
<option>Thermistor</option>
<option>Upload</option>
<option>USB</option>
<option>UWB</option>
<option>Visual</option>
<option>Voltage</option>
<option>WakeUP</option>
<option>Watchdog</option>
<option>WCDMA FHC</option>
<option>WCDMA NSFT</option>
<option>WCDMA_Band1</option>
<option>WCDMA_Band2</option>
<option>WCDMA_Band4</option>
<option>WCDMATX</option>
<option>Wifi</option>
<option>WLAN</option>

                    </Form.Select>
                  </Form.Group>
                </Col>


                <Col>
                <Form.Group style={{ minWidth: '100%', marginTop: 10 }}>
                    <Form.Label>Location</Form.Label>
                    <Form.Control rules={[{ required: true, message: 'Insira a posição mecânica do componente!', },]}
                      defaultValue="" onInput={(e) => e.target.value = ("" + e.target.value).toUpperCase()}
                      maxLength={25} id="Location" onChange={handleChange} placeholder=' Insira a Posição Mecânica' name='Location' />
                  </Form.Group>

                </Col>

                <Col>
                <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Defeito</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Causa' name='Causa' onChange={handleChange} >
                      <option></option>
                      <option>Alimentação Errada</option>     <option>AFC</option>      <option>Batida</option> <option>Check Board</option>
                      <option>CN Divergente</option>     <option>CN Duplicada</option>           <option>Cobre Exposto</option>          <option>Comp. Alterado</option>   <option>Comp. Alto</option>
                     <option>Comp. Contaminado</option>
                      <option>Comp. Danificado</option>       <option>Comp. Deslocado</option>        <option>Comp. Errado</option> <option>Comp. Extra</option>  <option>Comp. Faltando</option>
                      <option>Comp. Invertido</option>                       <option>Comp. Jogado</option>       
                      <option>Contaminado</option>
                      <option>Curto de Solda</option>         <option>Curto BGA</option>           <option>Danificado</option>    <option>Defeito Visual</option>
                      <option>Delaminado</option>             <option>Delete History</option>         <option>Excesso de Solder Ball</option>  <option>Excesso de Globtop</option>
                      <option>Excesso de Pasta Tim</option>   <option>Excesso de Pasta de Solda</option>     <option>Excesso de Underfill</option>
                      <option>Falha Falsa</option>            <option>Faltando QRCODE</option>     <option>Filete de Solda</option>
                      <option>Furo de Fresa</option>     <option>Gravação</option>       <option>Gravação Errada</option>     <option>Impureza</option> <option>Input Errado</option>
                      <option>Lavagem</option>                <option>Montagem Errada</option>     <option>Não Liga</option> <option>Não Scanea</option>
                      <option>Placa Duplicada</option>        <option>QrCode Divergente</option>     <option>QrCode Duplicado</option> <option>Rebarba</option>
                      <option>Reflow</option>                <option>Resina</option>                     <option>Retorno</option> <option>Retrabalho</option>
                      <option>Rotacionado</option>           <option>Router</option>                     <option>Scrap</option> <option>Secundaria Alta</option>
                      <option>Sem coating</option>           <option>Sem Historico de Teste</option>    <option>Sem Imagem</option>     <option>Sem QrCode</option> <option>Sem Solda</option>
                      <option>Skip</option>                <option>Soldabilidade</option>                 <option>Solder Ball</option> <option>Tape Azul</option>
                      <option>Tape Errada</option>         <option>Tombstone</option>                    <option>Trilha alta</option> <option>Trilha Rompida</option>
                      <option>Trincado</option>             <option>Vários deslocados</option>     <option>Versão Desatualizada</option> <option>Virado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

               

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10, marginBottom: 10 }}>
                    <Form.Label>Spec da Falha</Form.Label>
                    <Form.Control as='textarea' rules={[{ required: true, message: 'Insira o motivo do controle de MSL', },]}
                      defaultValue="" maxLength={200} id="Detalhe" onChange={handleChange} name='Detalhe' placeholder='Max. 200 caracteres' unrequired />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>CN (SN) Input</Form.Label>
                    <Form.Control rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      minLength={10} maxLength={13} onInput={(e) => e.target.value = ("" + e.target.value).toUpperCase()}
                      id="CN_rep" onChange={handleChange} placeholder='Input da CN' name='CN_rep' required />
                  </Form.Group>
                </Col>


              </Row>

              <Col style={{ marginTop: 13 }}>
                <Row style={{ justifyContent: 'center' }}>
                  <Button variant="contained" style={{ width: '20%', marginBottom: 10, height: 40 }} type="submit" 
                  onSubmit={handleAddItem}>Adicionar</Button>
                  
                  <Button variant="contained" style={{ width: '20%', marginBottom: 10, height: 40, marginLeft: 10 }}
                    type="reset" onSubmit={handleReset}>Resetar</Button>
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

<Button variant="contained" color="success" style={{width:'18%', height:40, marginTop:10, marginBottom:-30,
borderColor:'transparent', fontSize:16}} type="submit"
onClick={handleSubmit}>Registrar</Button>

  <h2 style={{marginTop:5, marginBottom:10}} className='h2'> Lista de Itens a serem inputados</h2><br></br>
<div style={{ height:300 , width:'99%', padding:'2px', marginTop:'-30px'}}>

<DataGrid  hover={true} 
 columns={[{
  field: 'actions',
  type: 'actions',
  headerName: 'Actions', headerClassName:'MUIhAction',
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
},
  //  {
  //    field: 'id', hideable: false,
  //    minWidth: 10, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  //   },
    {
      field: 'CN_rep', flex: 2, headerName: 'CN',
      minWidth: 180, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    // {
    //   field: 'Data', flex: 2, headerName: 'Data de Input',
    //   minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    // },
    {
      field: 'Responsavel', flex: 2,
      minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Processo', flex: 2, headerName:'Entrada',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Halb', flex: 2, headerName: 'Halb',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Modelo', flex: 2, headerName: 'Modelo',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Linha', flex: 2, headerName: 'Linha',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Fase', flex: 1,
      minWidth: 75, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Turno', flex: 2, headerName: 'Turno',
      minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Data_Feedback', flex: 2, headerName: 'Data Feedback',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Origem_SMD', flex: 2, headerName: 'Origem SMD',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Origem_Main', flex: 2,
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Causa', flex: 2, headerName: 'Defeito',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Sintoma', flex: 2,
      minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },

    {
      field: 'Status', flex: 2,
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Location', flex: 2, headerName: 'Location',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Detalhe', flex: 2, hedarName: 'Spec da Falha',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
  
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
    {
      field: 'id', hideable: false,
      minWidth: 10, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'CN_rep', flex: 2, headerName: 'CN',
      minWidth: 180, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
},
    {
      field: 'Data', flex: 2, headerName: 'Data de Input',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Responsavel', flex: 2,
      minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Processo', flex: 2, headerName:'Entrada',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Halb', flex: 2, headerName: 'Halb',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Modelo', flex: 2, headerName: 'Modelo',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Linha', flex: 2, headerName: 'Linha',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Fase', flex: 1,
      minWidth: 75, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Turno', flex: 2, headerName: 'Turno',
      minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Data_Feedback', flex: 2, headerName: 'Data Feedback',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Origem_SMD', flex: 2, headerName: 'Origem SMD',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Origem_Main', flex: 2,
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Causa', flex: 2, headerName: 'Defeito',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Sintoma', flex: 2,
      minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },

    {
      field: 'Status', flex: 2,
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Location', flex: 2, headerName: 'Location',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
    {
      field: 'Detalhe', flex: 2, hedarName: 'Observação',
      minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
    },
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
