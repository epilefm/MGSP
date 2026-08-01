import React, { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Axios from "axios";
import { Box } from "@mui/material";
import { ListGroup } from "react-bootstrap";
import { Button } from "@mui/material";
import { ListItem, ListItemText } from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ExportToExcel } from "../Excel/Excel_Export";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import NavbarComp from "../Layout/NavbarComp";

export default function App() {
  const [formData, setFormData] = useState({ itens: [] });
  const [listCard, setListCard] = useState([App]);
  const [values, setValues] = useState();
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
    const element1 = document.getElementsByName("CN_processo"); // Limpa o campo
    element1.forEach((element) => {
      console.log(element);
      element.value = "";
      element.focus();
      setCount(count + 1);
    });
  }

  const handleAddItem = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
      itens: [
        ...formData.itens,
        {
          id: count,
          Tipo: formData.Tipo,
          Tecnico: formData.Tecnico,
          Bancada: formData.Bancada,
          Troca_Comp: formData.Troca_Comp,
          Status: formData.Status,
          Detalhes: formData.Detalhes,
          Defeito: formData.Defeito,
          Location: formData.Location,
          CN_processo: formData.CN_processo,
        },
      ],
    });
    limpaCampos();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const array = formData.itens.map((item) => ({
      id: item.id,
      Tipo: item.Tipo,
      Tecnico: item.Tecnico,
      Troca_Comp: item.Troca_Comp,
      Bancada: item.Bancada,
      Status: item.Status,
      Detalhes: item.Detalhes,
      Defeito: item.Defeito,
      Location: item.Location,
      CN_processo: item.CN_processo,
    }));
  
    Axios.post("http://105.103.39.102:8080/ReparoProcess", array)
    .then((response) => {
      if (response.data.success) {
        alert('Input da CN ' + formData.CN_processo + ' salvo com sucesso na Análise do Técnico de Reparo');
        window.location.reload();
      } else {
        alert('Falha de input: Não foi possivel encontrar CN ' + formData.CN_processo +
         ' cadastrada na tela de Entrada de placa do Reparo');
      }
    })
    .catch(error => {
      console.error(error);
      alert('Erro ao processar a solicitação. Por favor, tente novamente mais tarde.');
    });
}; 

  useEffect(() => {
    Axios.get("http://105.103.39.102:8080/getReparoProcess")
      .then((response) => {
        setLista(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados no Reparo Processo:", error);
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
    setFormData(
      formData.itens.map((row) => (row.id === newRow.id ? updatedRow : row))
    );
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };
  const toInputUppercase = (e) => {
    e.target.value = ("" + e.target.value).toUpperCase();
  };

  const fileName = "Análise de placas - Reparo"; // here enter filename for your excel file

  const handleReset = (event) => {
    event.preventDefault();
    Array.from(document.querySelectorAll("input")).forEach(
      (input) => (input.value = "")
    );
    this.setState({
      itemvalues: [{}],
    });
  };

  const contagem = (count) => {
    setCount(count + 1);
  };

  return (
    <>
<NavbarComp />
      <div class="row col-12">
      <Box style={{marginLeft:45, marginTop:10, background: 'White', boxShadow: '2px 2px 5px gray', 
      borderRadius:8, width:'96%'}}> 
          <h2 style={{ textAlign: "center" }}>
            {" "}
            Reparo MX - Diagnóstico de Placas{" "}
          </h2>

          <Form
          onSubmit={handleAddItem}>
            <div style={{ marginLeft: 20 }}>
              <Row style={{ justifyContent: "center", width: "76%" }}>
                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Ocupação</Form.Label>
                    <Form.Select
                      defaultValue=""
                      maxLength={25}
                      id="Tipo"
                      onChange={handleChange}
                      name="Tipo"
                      required
                    >
                      <option></option>
                      <option>Auxiliar de Reparo</option>
                      <option>Técnico de Reparo</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Responsável</Form.Label>
                    <Form.Select
                      defaultValue=""
                      maxLength={25}
                      id="Tecnico"
                      onChange={handleChange}
                      name="Tecnico"
                      required>
                
                      <option>Adelane</option>
                      <option>Amarildo</option>
                      <option>Andreza R</option>
                      <option>Donald</option>
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
                  <Form.Label>Bancada</Form.Label>
                    <Form.Select 
                      defaultValue="" maxLength={25} id="Bancada" onChange={handleChange} name='Bancada' required>
                       <option></option>
          <option>Bancada Feedback</option>
          <option>Bancada Reparo</option>
         
        </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Defeito</Form.Label>
                    <Form.Select
                      defaultValue=""
                      maxLength={25}
                      id="Defeito"
                      onChange={handleChange}
                      name="Defeito"
                      required>
                      <option></option>
                      <option>Alimentação Errada</option> <option>AFC</option>{" "}
                      <option>Batida</option> <option>Check Board</option>
                      <option>CN Divergente</option>{" "}
                      <option>CN Duplicada</option>{" "}
                      <option>Cobre Exposto</option>{" "}
                      <option>Comp. Alterado</option>{" "}  <option>Comp. Alto</option>
                      <option>Comp. Contaminado</option>
                      <option>Comp. Danificado</option>{" "}
                      <option>Comp. Deslocado</option>{" "}
                      <option>Comp. Errado</option> <option>Comp. Extra</option>{" "}  <option>Comp. Faltando</option>
                      <option>Comp. Invertido</option>  <option>Comp. Jogado</option>
                      <option>Contaminado</option>
                      <option>Curto de Solda</option> <option>Curto BGA</option>{" "}
                      <option>Danificado</option>{" "}
                      <option>Defeito Visual</option>
                      <option>Delaminado</option>{" "}
                      <option>Delete History</option>{" "}
                      <option>Excesso de Solder Ball</option>{" "}
                      <option>Excesso de Globtop</option>
                      <option>Excesso de Pasta Tim</option>{" "}
                      <option>Excesso de Pasta de Solda</option>{" "}
                      <option>Excesso de Underfill</option>
                      <option>Falha Falsa</option>{" "}
                      <option>Faltando QRCODE</option>{" "}
                      <option>Filete de Solda</option>
                      <option>Furo de Fresa</option>{" "}
                      <option>Gravação</option> <option>Impureza</option>{" "}
                      <option>Input Errado</option>
                      <option>Lavagem</option> <option>Montagem Errada</option>{" "}
                      <option>Não Liga</option> <option>Não Scanea</option>
                      <option>Placa Duplicada</option>{" "}
                      <option>QrCode Divergente</option>{" "}
                      <option>QrCode Duplicado</option> <option>Rebarba</option>
                      <option>Reflow</option> <option>Resina</option>{" "}
                      <option>Retorno</option> <option>Retrabalho</option>
                      <option>Rotacionado</option> <option>Router</option>{" "}
                      <option>Scrap</option> <option>Secundaria Alta</option>
                      <option>Sem coating</option>{" "}
                      <option>Sem Historico de Teste</option>{" "} <option>Sem Imagem</option> 
                      <option>Sem QrCode</option> <option>Sem Solda</option>
                      <option>Sem Video</option>
                      <option>Skip</option> <option>Soldabilidade</option>{" "}
                      <option>Solder Ball</option> <option>Tape Azul</option>
                      <option>Tape Errada</option> <option>Tombstone</option>{" "}
                      <option>Trilha alta</option>{" "}
                      <option>Trilha Rompida</option>
                      <option>Trincado</option>{" "}
                      <option>Vários deslocados</option>{" "}
                      <option>Versão Desatualizada</option>{" "}
                      <option>Virado</option>


                      <option>Outros</option>   
<option disabled></option>   
<option>[Battery] Scratch</option>
<option>5G TX</option>
<option>Acceleration Sensor </option>
<option>AF Charge</option>              
<option>AGPS</option>      
<option>ANT SW MIPI</option>
<option>ANT VSWR</option>
<option>AP Interface</option>
<option>API TEST</option>
<option>AT CMD FAIL</option>
<option>ATCMD</option>
<option>Audio não atua</option>
<option>B/T Entering </option>
<option>Barometer</option>
<option>Battery</option>
<option>BCMSG</option>
<option>Bluetooth ON</option>
<option>Bluetooth Search</option>
<option>Booting</option>
<option>BT</option>
<option>Camera</option>
<option>CP Crash</option>
<option>DCS RX</option>
<option>Direct Charge</option>
<option>DL UPLOAD</option>
<option>DOWNLOAD NG</option>
<option>DP Switch IC</option>
<option>DPS</option>
<option>DRX</option>
<option>Earjack</option>
<option>Emergency Download NG</option>
<option>Emergency USB NG</option>
<option>Emergency</option>
<option>Enter DL Mode Fail</option>
<option>ERM</option>
<option>FEMID</option>
<option>Finger Print</option>
<option>Flash </option>
<option>Flash Current</option>
<option>Flicker</option>
<option>FM Radio</option>
<option>FT UPLOAD</option>
<option>Fuel Gauge</option>
<option>General</option>
<option>Giroscópio</option>
<option>GM Sensor</option>
<option>GPS</option>
<option>Grip Sensor</option>
<option>GSM Done</option>
<option>GSM850</option>
<option>Gyro Sensor </option>
<option>H/W Versão</option>
<option>Hall IC </option>
<option>Hall IC2</option> 
<option>Illumination Sensor </option>
<option>Insert RF</option>
<option>Interposer Detect</option>
<option>Interposer</option>
<option>Kernel</option>
<option>Key Recognition </option>
<option>KeyShort</option>
<option>Knox</option>
<option>LEAKAGE CURRENT  AT Test</option>
<option>Leakage Current</option>
<option>Leakage</option>
<option>Light Sensor</option>
<option>LTE (B2) PRX</option>
<option>LTE Max</option>
<option>LTE TX Feedback</option>
<option>Magnetic Sensor </option>
<option>Memory Size Check</option>
<option>MFC</option>
<option>MIC 1</option>
<option>MIC 2</option>
<option>MIC GAIN CHECK</option>
<option>Mic Gain</option>
<option>MIPI (MODEM CRASH)</option>
<option>MIPI</option>
<option>Motor</option>
<option>NAD Check</option>
<option>NAD Clear</option>
<option>NAD(NTF Auto Detector)</option>
<option>NFC</option>
<option>NO POWER</option>
<option>No WLAN Entering</option>
<option>Normal USB NG</option>
<option>NR</option>
<option>NVM Self Test</option>
<option>Octa IDE</option>
<option>OIS Firmware</option>
<option>OIS Gyro</option>
<option>OTG</option>
<option>Payload</option>
<option>PCS1900</option>
<option>Pen</option>
<option>Phone Unknown</option>
<option>Proximity Sensor </option>
<option>Proximity</option>                 
<option>Ram Size Check</option>
<option>Ranging Sensor</option>
<option>RCV</option>
<option>Receiver</option>
<option>Result 5G</option>
<option>RF BackOff</option>
<option>RFIC CH2</option>
<option>RFIC</option>
<option>SAR</option>
<option>SD CARD</option>
<option>Sensor Magnetico</option>
<option>Sensor</option> 
<option>SHORT</option>
<option>SIM Card</option>
<option>SIM Tray</option>
<option>SIM TRAY</option>
<option>Sleep / WakeUp test error</option>
<option>Sleep Current</option>
<option>SLEEP CURRENT</option>
<option>Speaker</option>
<option>Speed Sensor</option>
<option>SPEN</option>
<option>TCP IP Error</option>
<option>TEMP CODE (THERMISTOR)</option>
<option>Thermistor</option>
<option>Upload</option>
<option>USB</option> 
<option>UWB</option>
<option>Visual</option>
<option>Voltage</option>
<option>WakeUP</option>
<option>Watchdog</option>
<option>WCDMA TX Feedback</option>
<option>WCDMA TX</option>
<option>WIFI AP Access</option>
<option>Wifi</option>
<option>WLAN</option>

<option></option>   
<option disabled placeholder="TNP Defects"></option>   

<option>adb_Check_software_version</option>
<option>AT_CheckOmit_Flag</option>
<option>AT_WriteOmit_Flag</option>
<option>Check Android Boot Up</option>
<option>Check CPU Freq</option>
<option>Check Md5 with server</option>
<option>Check Provision File</option>
<option>Check PSN Excel</option>
<option>Check Ram</option>
<option>Check Rom</option>
<option>Check SN before end</option>
<option>CheckCpuFreq</option>
<option>CheckGRDMTEST</option>
<option>CheckOSReady</option>
<option>CheckPowerOn</option>
<option>CheckPSNRule</option>
<option>CheckSSDLFlag</option>
<option>CompareSlot_SnValue</option>
<option>CompareSnValue_Test</option>
<option>CompareSoftWare_Path</option>
<option>Connect</option>
<option>Connect Sahara</option>
<option>Delay_Time_1s</option>
<option>Delay_Time_35s</option>
<option>Delay_Time_5s</option>
<option>Delay_Time_PowerOff</option>
<option>Delay_Time_QCloaderPort</option>
<option>Delay_Time_QCloaderPort1</option>
<option>Delay_Time_Reset</option>
<option>Do DownLoad</option>
<option>DownloadMTK</option>
<option>DUT_Reset_By_FH_loader</option>
<option>Enter Test Mode</option>
<option>Erase Flash</option>
<option>Execute CmdLine Success</option>
<option>ExecuteCmdLine</option>
<option>FirehoseToEDLByQSaharaServer</option>
<option>FirehoseToEDLByQSaharaServer1</option>
<option>FlatBuild_Download_UFS_By_FH_loader</option>
<option>FlatBuild_UFS_PROVISION_By_FH_loader</option>
<option>Get Provision File</option>
<option>Get Ufs Flash Brand</option>
<option>Get_Config_XML_Version</option>
<option>GetComPort</option>
<option>GetDLConfigData</option>
<option>GetModemort</option>
<option>GetQCloaderPort</option>
<option>GetQCloaderPort1</option>
<option>GETSTORAGEINF_ERASE</option>
<option>GRDMTEST</option>
<option>Init_Test_Parameters</option>
<option>Kill_Process</option>
<option>Micron Fw Upgrade</option>
<option>Patch_Download_UFS_By_FH_loader</option>
<option>Read Board ID</option>
<option>read Psn from Nv</option>
<option>Read SamSung DownLoad Flag</option>
<option>ReadAdbDeviceIDByHubLoaction</option>
<option>ReadSarSensorId</option>
<option>Release_Test_Parameters</option>
<option>Reset_DUT_AfterProvision</option>
<option>Run Provision</option>
<option>SarSensor ID</option>
<option>Search Diag Port 66</option>
<option>Set_Software_Path</option>
<option>Set_Software_Ver</option>
<option>SETACTIVEPARTITION_By_FH_loader</option>
<option>SetSlot_SnValue</option>
<option>SleepTime</option>
<option>Test End</option>
<option>The port was not found in Device Manager.</option>
<option>UFS_LOADER_ERASE0</option>
<option>UFS_LOADER_ERASE1</option>
<option>UFS_LOADER_ERASE2</option>
<option>UFS_LOADER_ERASE4</option>
<option>UFS_LOADER_ERASE5</option>
<option>Waiting_For_UUT</option>
<option>Write EFS Psn</option>
<option>write Psn to NV</option>
<option>Write SamSung DownLoad Flag</option>
<option>Write_Test_Flag_NV</option>
<option>writePsn</option>
<option>WritePsn2EFS</option>
<option>WriteSamSungDownLoadFlag[P]</option>
<option>WriteSSDLFlag</option>



                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Trocou de Componente?</Form.Label>
                    <Form.Select
                      defaultValue="Choose..."
                      id="Troca_Comp"
                      name="Troca_Comp"
                      onChange={handleChange}
                      
                    >
                      <option></option>
                      <option>Sim</option>
                      <option>Não</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

               </Row>
              
              <Row>
              <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Posição Mecânica</Form.Label>
                    <Form.Control
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      onInput={(e) =>
                        (e.target.value = ("" + e.target.value).toUpperCase())
                      }
                      id="Location"
                      maxLength={10}
                      onChange={handleChange}
                      placeholder="Insira a Location"
                      name="Location"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      defaultValue="Choose..."
                      id="Status"
                      name="Status"
                      onChange={handleChange}
                      required
                    >
                      <option></option>
                      <option>Good</option>
                      <option>Scrap</option>
                      <option>NG</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group
                    style={{ width: "100%", marginTop: 10, marginBottom: 10 }}
                  >
                    <Form.Label>Detalhes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rules={[
                        {
                          required: true,
                          message: "Insira o motivo do controle de MSL",
                        },
                      ]}
                      defaultValue=""
                      maxLength={200}
                      id="Detalhes"
                      onChange={handleChange}
                      name="Detalhes"
                      
                    />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>CN (SN) Input</Form.Label>
                    <Form.Control
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      minLength={10}
                      maxLength={13}
                      onInput={(e) =>
                        (e.target.value = ("" + e.target.value).toUpperCase())
                      }
                      id="CN_processo"
                      onChange={handleChange}
                      placeholder="Input da CN"
                      name="CN_processo"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col style={{ marginTop: -30 }}>
                  <Row style={{ justifyContent: "center" }}>
                  <Button variant="contained" style={{ width:'85%', marginBottom: 10, height: 40, marginLeft:9 }}
                  type="submit" 
                  onSubmit={handleAddItem}>Adicionar</Button>
                  
                  <Button variant="contained" style={{ width: '85%', marginBottom: 10, height: 40, marginLeft: 10 }}
                    type="reset" onSubmit={handleReset}>Resetar</Button>
                  </Row>
                </Col>
              </Row>

              {/* //--------------------------------------------- */}

              <Row style={{ justifyContent: "center", width: "100%" }}></Row>
            </div>
          </Form>
        </Box>
      </div>

      <Button variant="contained" color="success" style={{width:'18%', height:40, marginTop:10, marginBottom:-30,
       marginLeft:20 ,borderColor:'transparent', fontSize:16}} type="submit"
        onClick={handleSubmit}
      >
        Registrar
      </Button>

      <h2 style={{ marginTop: -10 }} className="h2">
        {" "}
        Lista dos dados a serem inputados{" "}
      </h2>
      <div
        style={{
          height: 300,
          width: "100%",
          padding: "2px",
          marginTop: -30,
          justifyContent: "center",
        }}
      >
        <ExportToExcel apiData={lista} fileName={fileName} />

        <DataGrid
          hover={true}
          columns={[
            {
              field: "id",
              flex: 2,
              minWidth: 120,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Tecnico",
              flex: 2,
              minWidth: 120,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Bancada",
              flex: 2,
              headerName: "Bancada",
              minWidth: 120,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Defeito",
              flex: 2,
              headerName: "Defeito - Tecnico",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Detalhes",
              flex: 2,
              headerName: "Detalhes",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Location",
              flex: 2,
              headerName: "Location",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Status",
              flex: 1,
              headerName: "Status - Tecnico",
              minWidth: 75,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "CN_processo",
              flex: 1,
              headerName: "CN - Tecnico",
              minWidth: 75,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "actions",
              type: "actions",
              headerName: "Actions", headerClassName:'MUIhAction',
              width: 100,
              cellClassName: "actions",

              getActions: ({ id }) => {
                const isInEditMode =
                  rowModesModel[formData.itens.id]?.mode === GridRowModes.Edit;

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
          ]}
          rows={formData.itens}
          slots={{}}
          initialState={{
            sorting: {
              sortModel: [{ field: "id", sort: "desc" }],
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

      <Box style={{ marginLeft: 0, marginTop: 60 }}>
        <h2 style={{ marginTop: 5, marginBottom: 10 }} className="h2">
          {" "}
          Lista dos Inputs
        </h2>
        <br></br>
        <div
          style={{
            height: 300,
            width: "100%",
            padding: "2px",
            marginTop: "-30px",
          }}
        >
          <ExportToExcel apiData={lista} fileName={fileName} />
          <DataGrid
            hover={true}
            columns={[
              {
                field: "Data",
                flex: 2,
                headerName: "Data de Input",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Tecnico",
                flex: 2,
                minWidth: 120,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Bancada",
                flex: 2,
                minWidth: 120,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Defeito",
                flex: 2,
                headerName: "Defeito - Tecnico",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Detalhes",
                flex: 2,
                headerName: "Detalhes",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Location",
                flex: 2,
                headerName: "Location",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Status",
                flex: 1,
                headerName: "Status - Tecnico",
                minWidth: 75,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "CN_processo",
                flex: 1,
                headerName: "CN - Tecnico",
                minWidth: 75,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
            ]}
            rows={lista}
            slots={{}}
            initialState={{
              sorting: {
                sortModel: [{ field: "id", sort: "desc" }],
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
  );
}
