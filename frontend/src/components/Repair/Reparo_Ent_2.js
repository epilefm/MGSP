import { API_URL } from '../../config/api';
import React, { useEffect, useState } from "react";
import Axios from "axios";
import { Container, Row, Col, Form, Button, Card, Badge, Alert } from "react-bootstrap";
import Header from "../Layout/MGSPHead/Header";
import './Reparo_Ent_2.0.css';

export default function ReparoEnt2() {
  const [formData, setFormData] = useState({
    Responsavel: "",
    Recebimento: "",
    Processo: "",
    Modelo: "",
    Linha: "",
    Fase: "",
    Turno: "",
    Data_Feedback: "",
    Origem_SMD: "",
    Origem_Main: "",
    Sintoma: "",
    Location: "",
    Causa: "",
    Detalhe: "",
    CN_rep: ""
  });

  const [previewItems, setPreviewItems] = useState([]);
  const [listModelo, setListModelo] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    Axios.get(`${API_URL}/getModeloReparo`)
      .then((response) => {
        setListModelo(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar modelos:", error);
      });
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleCNChange = (event) => {
    const { value } = event.target;
    setFormData({ ...formData, CN_rep: value.toUpperCase() });
  };

  const handleCNKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addToPreview();
    }
  };

  const addToPreview = () => {
    if (!formData.CN_rep || formData.CN_rep.length < 10) {
      setErrorMessage("Por favor, insira uma CN válida (mínimo 10 caracteres)");
      return;
    }

    // Verificar se a CN já está na pré-visualização
    const exists = previewItems.some(item => item.CN_rep === formData.CN_rep);
    if (exists) {
      setErrorMessage("Esta CN já foi adicionada à pré-visualização");
      return;
    }

    // Criar um novo item com os dados do formulário
    const newItem = {
      id: Date.now(), // ID único para cada item
      ...formData,
      Halb: formData.Modelo.substring(formData.Modelo.lastIndexOf(" ") + 1, formData.Modelo.length),
      Modelo: formData.Modelo.replace('|', '').slice(0, -13),
    };

    setPreviewItems([...previewItems, newItem]);
    setFormData({ ...formData, CN_rep: "" }); // Limpar apenas o campo CN
    setErrorMessage("");
    setSuccessMessage("");

    // Focar novamente no campo CN
    setTimeout(() => {
      const cnInput = document.getElementById("CN_rep");
      if (cnInput) cnInput.focus();
    }, 100);
  };

  const removeItem = (id) => {
    setPreviewItems(previewItems.filter(item => item.id !== id));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    
    if (previewItems.length === 0) {
      setErrorMessage("Por favor, adicione pelo menos um item à pré-visualização");
      return;
    }

    // Preparar os dados para envio
    const itemsToSubmit = previewItems.map(item => ({
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
    }));

    Axios.post(`${API_URL}/ReparoEnt`, itemsToSubmit)
      .then((response) => {
        if (response.data.success) {
          setSuccessMessage(`Registrado com sucesso ${previewItems.length} placa(s)!`);
          setPreviewItems([]);
          setErrorMessage("");
          
          // Recarregar a página após 2 segundos
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          setErrorMessage("Erro ao registrar as placas. Por favor, tente novamente.");
        }
      })
      .catch(error => {
        console.error(error);
        setErrorMessage("Erro ao processar a solicitação. Por favor, tente novamente mais tarde.");
      });
  };

  const handleReset = (event) => {
    event.preventDefault();
    setFormData({
      Responsavel: "",
      Recebimento: "",
      Processo: "",
      Modelo: "",
      Linha: "",
      Fase: "",
      Turno: "",
      Data_Feedback: "",
      Origem_SMD: "",
      Origem_Main: "",
      Sintoma: "",
      Location: "",
      Causa: "",
      Detalhe: "",
      CN_rep: ""
    });
    setPreviewItems([]);
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <>
      <Header />
      <Container fluid className="mt-3">
        <Row>
          <Col>
            <h2 className="text-center mb-4">Entrada de Placas - Reparo 2.0</h2>
          </Col>
        </Row>

        {successMessage && <Alert variant="success">{successMessage}</Alert>}
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">Dados da Placa</h5>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={(e) => e.preventDefault()}>
              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Responsável</Form.Label>
                    <Form.Select
                      value={formData.Responsavel}
                      onChange={handleChange}
                      name="Responsavel"
                      required
                    >
                      <option value="">Selecione...</option>
                      <optgroup label="PQC">
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
                      </optgroup>
                      <optgroup label="Técnico">
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
                      </optgroup>
                      <optgroup label="Auxiliar">
                        <option>Andreza M</option>
                        <option>Francisco</option>
                        <option>Hudson</option>
                        <option>Juliana F.</option>
                        <option>Nubia</option>
                        <option>Suellem</option>
                      </optgroup>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Recebimento</Form.Label>
                    <Form.Select
                      value={formData.Recebimento}
                      onChange={handleChange}
                      name="Recebimento"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option>Bancada Feedback</option>
                      <option>Bancada Reparo</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Entrada</Form.Label>
                    <Form.Select
                      value={formData.Processo}
                      onChange={handleChange}
                      name="Processo"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option>Defeito</option>
                      <option>Feedback</option>
                      <option>Scrap de Halb</option>
                      <option>Offline / Análise de Qualidade</option>
                      <option>Defeito Epidêmico</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Halb | Basic Model</Form.Label>
                    <Form.Select
                      value={formData.Modelo}
                      onChange={handleChange}
                      name="Modelo"
                      required
                    >
                      <option value="">Selecione...</option>
                      {listModelo.map((val, index) => (
                        <option key={index} value={`${val.Basic_Model} | ${val.Halb}`}>
                          {val.Basic_Model} | {val.Halb}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Linha</Form.Label>
                    <Form.Select
                      value={formData.Linha}
                      onChange={handleChange}
                      name="Linha"
                      required
                    >
                      <option value="">Selecione...</option>
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

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Fase</Form.Label>
                    <Form.Select
                      value={formData.Fase}
                      onChange={handleChange}
                      name="Fase"
                    >
                      <option value="">Selecione...</option>
                      <option>Bottom</option>
                      <option>Top</option>
                      <option>Limpa</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Turno</Form.Label>
                    <Form.Select
                      value={formData.Turno}
                      onChange={handleChange}
                      name="Turno"
                      required
                    >
                      <option value="">Selecione...</option>
                      <option>1T</option>
                      <option>2T</option>
                      <option>3T</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Data de Origem (Gmes) - Feedback</Form.Label>
                    <Form.Control
                      type="date"
                      value={formData.Data_Feedback}
                      onChange={handleChange}
                      name="Data_Feedback"
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Origem SMD</Form.Label>
                    <Form.Select
                      value={formData.Origem_SMD}
                      onChange={handleChange}
                      name="Origem_SMD"
                      required
                    >
                      <option value="">Selecione...</option>
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

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Origem Main Line</Form.Label>
                    <Form.Select
                      value={formData.Origem_Main}
                      onChange={handleChange}
                      name="Origem_Main"
                    >
                      <option value="">Selecione...</option>
                      <option>BT (RF Call)</option>
                      <option>Calibração</option>
                      <option>LCIA</option>
                      <option>Radiação</option>
                      <option>ST (LCIA)</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Sintoma</Form.Label>
                    <Form.Select
                      value={formData.Sintoma}
                      onChange={handleChange}
                      name="Sintoma"
                    >
                      <option value="">Selecione...</option>
                      <option>Outros</option>
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

                <Col md={3}>
                  <Form.Group className="mb-3">
                    <Form.Label>Location</Form.Label>
                    <Form.Control
                      type="text"
                      value={formData.Location}
                      onChange={handleChange}
                      name="Location"
                      placeholder="Insira a posição mecânica"
                      maxLength={25}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Defeito</Form.Label>
                    <Form.Select
                      value={formData.Causa}
                      onChange={handleChange}
                      name="Causa"
                    >
                      <option value="">Selecione...</option>
                      <option>Alimentação Errada</option>
                      <option>AFC</option>
                      <option>Batida</option>
                      <option>Check Board</option>
                      <option>CN Divergente</option>
                      <option>CN Duplicada</option>
                      <option>Cobre Exposto</option>
                      <option>Comp. Alterado</option>
                      <option>Comp. Alto</option>
                      <option>Comp. Contaminado</option>
                      <option>Comp. Danificado</option>
                      <option>Comp. Deslocado</option>
                      <option>Comp. Errado</option>
                      <option>Comp. Extra</option>
                      <option>Comp. Faltando</option>
                      <option>Comp. Invertido</option>
                      <option>Comp. Jogado</option>
                      <option>Contaminado</option>
                      <option>Curto de Solda</option>
                      <option>Curto BGA</option>
                      <option>Danificado</option>
                      <option>Defeito Visual</option>
                      <option>Delaminado</option>
                      <option>Delete History</option>
                      <option>Excesso de Solder Ball</option>
                      <option>Excesso de Globtop</option>
                      <option>Excesso de Pasta Tim</option>
                      <option>Excesso de Pasta de Solda</option>
                      <option>Excesso de Underfill</option>
                      <option>Falha Falsa</option>
                      <option>Faltando QRCODE</option>
                      <option>Filete de Solda</option>
                      <option>Furo de Fresa</option>
                      <option>Gravação</option>
                      <option>Gravação Errada</option>
                      <option>Impureza</option>
                      <option>Input Errado</option>
                      <option>Lavagem</option>
                      <option>Montagem Errada</option>
                      <option>Não Liga</option>
                      <option>Não Scanea</option>
                      <option>Placa Duplicada</option>
                      <option>QrCode Divergente</option>
                      <option>QrCode Duplicado</option>
                      <option>Rebarba</option>
                      <option>Reflow</option>
                      <option>Resina</option>
                      <option>Retorno</option>
                      <option>Retrabalho</option>
                      <option>Rotacionado</option>
                      <option>Router</option>
                      <option>Scrap</option>
                      <option>Secundaria Alta</option>
                      <option>Sem coating</option>
                      <option>Sem Historico de Teste</option>
                      <option>Sem Imagem</option>
                      <option>Sem QrCode</option>
                      <option>Sem Solda</option>
                      <option>Skip</option>
                      <option>Soldabilidade</option>
                      <option>Solder Ball</option>
                      <option>Tape Azul</option>
                      <option>Tape Errada</option>
                      <option>Tombstone</option>
                      <option>Trilha alta</option>
                      <option>Trilha Rompida</option>
                      <option>Trincado</option>
                      <option>Vários deslocados</option>
                      <option>Versão Desatualizada</option>
                      <option>Virado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Spec da Falha</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={formData.Detalhe}
                      onChange={handleChange}
                      name="Detalhe"
                      placeholder="Detalhe da falha (máx. 200 caracteres)"
                      maxLength={200}
                    />
                  </Form.Group>
                </Col>

                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>CN (SN) Input</Form.Label>
                    <Form.Control
                      type="text"
                      id="CN_rep"
                      value={formData.CN_rep}
                      onChange={handleCNChange}
                      onKeyDown={handleCNKeyDown}
                      name="CN_rep"
                      placeholder="Insira a CN e pressione Enter"
                      minLength={10}
                      maxLength={13}
                      required
                    />
                    <Form.Text className="text-muted">
                      Pressione Enter para adicionar à pré-visualização
                    </Form.Text>
                  </Form.Group>

                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <Button variant="primary" onClick={addToPreview}>
                      Adicionar à Pré-visualização
                    </Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Card.Body>
        </Card>

        {previewItems.length > 0 && (
          <Card className="mb-4">
            <Card.Header className="bg-success text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Pré-visualização dos Registros</h5>
                <Badge bg="light" text="dark">
                  {previewItems.length} itens
                </Badge>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <table className="table table-striped table-hover">
                  <thead>
                    <tr>
                      <th>CN</th>
                      <th>Responsável</th>
                      <th>Modelo</th>
                      <th>Linha</th>
                      <th>Defeito</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewItems.map((item) => (
                      <tr key={item.id}>
                        <td>{item.CN_rep}</td>
                        <td>{item.Responsavel}</td>
                        <td>{item.Modelo}</td>
                        <td>{item.Linha}</td>
                        <td>{item.Causa}</td>
                        <td>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-grid gap-2 d-md-flex justify-content-md-end mt-3">
                <Button variant="secondary" onClick={handleReset} className="me-md-2">
                  Resetar Tudo
                </Button>
                <Button variant="success" onClick={handleSubmit}>
                  Registrar Todas as Placas
                </Button>
              </div>
            </Card.Body>
          </Card>
        )}
      </Container>
    </>
  );
}
