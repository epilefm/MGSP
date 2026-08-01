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
import { ExportToExcel } from '../Excel/Excel_Export'
import NavbarComp from '../Layout/NavbarComp'

export default function App() {

  const [formData, setFormData] = useState({ itens: [], });
  const [values, setValues] = useState();
  const [listhalb, setListHalb] = useState([]);
  const [listModelo, setListModelo] = useState([]);
  const [lista, setLista] = useState([]);

  console.log(listModelo);


  // dias conforme o filtro do gmes


  const handleSubmit = (event) => {
    event.preventDefault();
    Axios.post('http://105.103.39.102:808080/scrap', {
      id: values.id,
      Processo: values.Processo,
      CN: values.CN,
      Phase: values.Phase,
      Halb: values.Halb,
      Basic_Model: values.Basic_Model,
      Line: values.Line,
      Shift: values.Shift,
      Origin: values.Origin,
      Reason: values.Reason,
      Equip: values.Equip,
      Cause: values.Cause,
      Action: values.Action,
      ActionPlan: values.ActionPlan,
      Operador: values.Operador,
      Tecnico: values.Tecnico,
      Leader: values.Leader,
      Maintenance: values.Maintenance,
      Quality: values.Quality,
      Production: values.Production,
      Data: values.Data
    }).catch(error => {
      console.error(error);
      alert('Ocorreu um erro ao enviar a mensagem.' + error);
    });
  };

  const handleaddValues = (value) => {
    setValues((prevValues) => ({
      ...prevValues,
      [value.target.name]: value.target.value,
    }));
  };

  useEffect(() => {
    Axios.get("http://105.103.39.102:808080/getscrap").then((response) => {
      setLista(response.data);
    });
  }, []);

  useEffect(() => {
    Axios.get("http://105.103.39.102:808080/getModelo").then((response) => {
      setListModelo(response.data);
    });
  }, []);

  const fileName = "Scrap Register"; // here enter filename for your excel file

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
    Axios.get("http://105.103.39.102:808080/getModelo").then((response) => {
      setListHalb(response.data);
    });
  }, []);

  // const getCn = (valorProcurado, date) => {
  //   Axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=pcb2new_bottom_paoi_history&date=${date}`)
  //     .then((response) => {
  //       let total = response.data.length
  //       for (let i = 0; i < total; i++) {
  //         if (response.data[i].PRODC_MAGT_NO == valorProcurado) {
  //           console.log(response.data[i])
  //         }
  //       }
  //       console.log("CN NÃO ENCONTRADA")
  //     })
  // }

  // getCn("1362111850M03", "20230622")


  return (
    <>
<NavbarComp/>
      <div class='row col-12'>
        <Box style={{ background: 'transparent', borderRadius: 8, width: '100%' }}>

          <h2 style={{ textAlign: 'center' }}> Input Scrap / Washboard </h2>

          <Form style={{ border: 'solid 0.1rem', borderColor: '#84aac6', borderRadius: 10, marginLeft: 20, marginBottom: 30 }} onSubmit={handleSubmit}>

            <div style={{ marginLeft: 20 }}>
              <Row style={{ justifyContent: 'center', width: '100%' }} >

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Processo</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Processo' name='Processo' onChange={handleaddValues} required>
                      <option></option>
                      <option>Scrap de Processo</option>      <option>Wash Board</option>    
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                <Form.Label style={{marginTop:10}}>Halb | Modelo</Form.Label>
          <Form.Select defaultValue="Choose..." id='Basic_Model' name='Basic_Model' onChange={handleaddValues} placeholder='choose a line' required>
          <option></option>
          {listhalb.map((val, index) => (
          <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
          ))}
          </Form.Select>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Linha</Form.Label>
                    <Form.Select rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue="" maxLength={25} id="Line" onChange={handleaddValues} name='Line' required>
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
                    <Form.Select defaultValue="Choose..." id='Phase' name='Phase' onChange={handleaddValues} required>
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
                    <Form.Select defaultValue="Choose..." id='Shift' name='Shift' onChange={handleaddValues} required>
                      <option></option>
                      <option>1T</option>
                      <option>2T</option>
                      <option>3T</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

              </Row>

              <Row style={{ justifyContent: 'center', width: '100%' }}>
 
                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Origem</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Origin' name='Origin' onChange={handleaddValues} required>
                      <option></option>
                      <option>Fornecedor</option>
                      <option>Máquina / Equipamento</option>
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
                    <Form.Label>Motivo</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Reason' name='Reason' onChange={handleaddValues} required>

                      <option></option>
                      <option>Alimentação Errada</option>     <option>1° Corte Router</option>        <option>Cobre Exposto</option>
                      <option>Comp. Alterado</option>         <option>Comp. Danificado</option>       <option>Comp. Deslocado</option>
                      <option>Cobre Faltando</option>         <option>Contam. Solda</option>          <option>Danif. Reparo</option>
                      <option>Excesso de Retrabalho</option>  <option>Excesso de Solda</option>       <option>Excesso de Underfill</option>
                      <option>Gravação Errada</option>        <option>Insuficiencia de Solda</option> <option>Loss de Processo</option>
                      <option>Magazine desajustado</option>   <option>Material Segregado</option>     <option>PCB Alagado</option>
                      <option>PCB Batida</option>             <option>PCB com Bolha</option>          <option>PCB Delaminada</option>
                      <option>PCB Empenada</option>           <option>PCB Encontrada</option>         <option>PCB Furada</option>
                      <option>PCB Grudada</option>            <option>PCB Não Curada</option>         <option>PCB Obsoleta</option>
                      <option>PCB Quebrada</option>           <option>PCB Queimada</option>           <option>PCB Riscada</option>
                      <option>PCB Sem Fiducial</option>       <option>PCB Segregada</option>          <option>Pitch Errado</option>
                      <option>Reposição de Scrap</option>     <option>Sensor</option>                 <option>Trilha Rompida</option>
                      <option>Validação de Linhas</option>

                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Equipamento</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Equip' name='Equip' onChange={handleaddValues} required>
                      <option></option>
                      <option>Adesivadora</option>              <option>ATE</option>                            <option>C-Mounter 1</option>              
                      <option>C-Mounter 2</option>              <option>C-Mounter 3</option>                    <option>C-Mounter 4</option>
                      <option>C-Mounter 5</option>              <option>C-Mounter 6</option>                    <option>C-Mounter 7</option>  
                      <option>Chamber</option>                  <option>Chip Mounter</option>                   <option>Conveyor</option>
                      <option>Dispenser / Underfill</option>    <option>Entrada Reflow</option>                 <option>Equipamentos de Reparo</option>
                      <option>Falha de Impressão</option>       <option>Falta de Energia</option>               <option>flex Mounter</option>
                      <option>Function Test</option>            <option>Gate Conveyor</option>                  <option>ICT</option>
                      <option>Impressão</option>                <option>Inverter</option>                       <option>Jig Carrier P-AOI</option>
                      <option>Jig Carrier S-AOI</option>        <option>Jig Test</option>                       <option>Loader</option>
                      <option>Magazine Empenado</option>        <option>M-Mounter 1</option>                    <option>M-Mounter 2</option>
                      <option>M-Mounter 3</option>              <option>Magazine Quebrado</option>              <option>Manuseio Incorreto</option>
                      <option>Manutenção Preventiva</option>    <option>M-AOI</option>                          <option>M-AOI Bot</option>
                      <option>Jig Test</option>                 <option>M-AOI Top</option>                      <option>Máquina de Solda</option>
                      <option>Mounter (SCM)</option>            <option>Mounter POP</option>                    <option>Multi Unloader</option>
                      <option>Ng-buffer/M-AOI</option>          <option>Ng-buffer/P-AOI</option>                <option>Ng-buffer/S-AOI</option>
                      <option>Obsoleto</option>                 <option>P-AOI</option>                          <option>P-AOI Bot</option>
                      <option>P-AOI Top</option>                <option>Printer</option>                        <option>PRO-500</option>
                      <option>Qr-Code</option>                  <option>Qualidade</option>                      <option>Rack Buf/Buf</option>
                      <option>Reflow</option>                   <option>Reparo</option>                         <option>Router</option>
                      <option>Saída/Reflow</option>             <option>S-AOI</option>                          <option>Scara-Robô</option>
                      <option>SCM Shield</option>               <option>SCM Tape</option>                       <option>SCM TIM</option>
                      <option>Shuttle Con'v (Front)</option>    <option>Shuttle Con'v (Rear) Buf/Buf</option>   <option>Shuttle P-AOI</option>
                      <option>Side Tray POP</option>            <option>Unloader</option>                       <option>Unloader Chamber</option>
                      <option>Vaccum Loader</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Causa Raiz</Form.Label>
                    <Form.Control as='textarea' rules={[{ required: true, message: 'Insira o motivo do controle de MSL', },]}
                      defaultValue="" maxLength={200} id="Cause" onChange={handleaddValues} name='Cause' required />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Ação Imediata</Form.Label>
                    <Form.Control as='textarea' rules={[{ required: true, message: 'Insira o motivo do controle de MSL', },]}
                      defaultValue="" maxLength={200} id="Action" onChange={handleaddValues} name='Action' required />
                  </Form.Group>
                </Col>

              </Row>

              <Row style={{ justifyContent: 'center', width: '100%' }}>
                                
                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Ação Imediata</Form.Label>
                    <Form.Control as='textarea' rules={[{ required: true, message: 'Insira o motivo do controle de MSL', },]}
                      defaultValue="" maxLength={200} id="Action" onChange={handleaddValues} name='Action' required />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Plano de Ação</Form.Label>
                    <Form.Control as='textarea' rules={[{ required: true, message: 'Insira o motivo do controle de MSL', },]}
                      defaultValue="" maxLength={200} id="ActionPlan" onChange={handleaddValues} name='ActionPlan' required />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0 }}>
                    <Form.Label>Operador</Form.Label>
                    <Form.Control rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue="" maxLength={25} id="Operador" Placeholder='Inserir a Matrícula' onChange={handleaddValues} name='Operador' required />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>PQC</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Leader' name='Leader' onChange={handleaddValues} required>
                      <option></option>
                      <option>Altiana</option>
                      <option>Ana Alice</option>
                      <option>Arquimedes</option>
                      <option>Jocy</option>
                      <option>Maiane</option>
                    </Form.Select>
                  </Form.Group>
                  </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0 }}>
                    <Form.Label>MK</Form.Label>
                    <Form.Control rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue="" maxLength={25} id="Tecnico" Placeholder='Inserir a Matrícula' onChange={handleaddValues} name='Tecnico' required />
                  </Form.Group>
                </Col>


              </Row>

              {/* //--------------------------------------------- */}

              <Row style={{ justifyContent: 'center', width: '100%' }}>
                
                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Líder</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Leader' name='Leader' onChange={handleaddValues} required>
                      <option></option>
                      <option>Altiana</option>
                      <option>Ana Alice</option>
                      <option>Arquimedes</option>
                      <option>Jocy</option>
                      <option>Maiane</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Manutenção</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Maintenance' name='Maintenance' onChange={handleaddValues} required>
                      <option></option>
                      <option>Ayala</option>
                      <option>Marcelo</option>
                      <option>Mauro</option>
                      <option>Wilson</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Qualidade</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Quality' name='Quality' onChange={handleaddValues} required>
                      <option></option>
                      <option>Kellen</option>
                      <option>Francis</option>
                      <option>Danielma</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>Produção</Form.Label>
                    <Form.Select defaultValue="Choose..." id='Production' name='Production' onChange={handleaddValues} required>
                      <option></option>
                      <option>Ailton</option>
                      <option>Fabrício</option>
                      <option>Geilson</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
<Col>

<Col>
                  <Form.Group style={{ width: '100%', marginTop: 10 }}>
                    <Form.Label>CN (SN) Input</Form.Label>
                    <Form.Control rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue="" maxLength={25} id="CN" onChange={handleaddValues} placeholder='Input da CN' name='CN' required />
                  </Form.Group>
                </Col>

</Col>
              </Row>

<Row style={{width:'50%', marginLeft:'25%'}}>
              <Col>
                <Button style={{ width: '100%', marginBottom: 10, marginTop: 10, height: '50' }} type="submit" onSubmit={handleSubmit}>Register</Button>
                </Col>

                <Col>
                <Button style={{ width: '100%', marginBottom: 10, marginTop: 10, height: '50'}}
                  type="reset" onSubmit={handleReset}>Reset</Button>
</Col>
</Row>

            </div>
          </Form>
        </Box>
      </div>


      <h2 style={{ marginTop: -10 }} className='h2'> Histórico de Entrada de Scrap</h2>
      <div style={{ height: 500, width: '100%', padding: '2px', marginTop: -30, justifyContent: 'center' }}>
        <ExportToExcel apiData={lista} fileName={fileName} />
        <DataGrid hover={true} className=''
          columns={[
            {
              field: 'id', hideable: false,
              minWidth: 10, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Data', flex: 2, headerName: 'Data de Input',
              minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Processo', flex: 2,
              minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'CN', flex: 2,
              minWidth: 180, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Phase', flex: 1,
              minWidth: 75, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Basic_Model', flex: 2,
              minWidth: 220, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Line', flex: 2,
              minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Shift', flex: 2,
              minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Origin', flex: 2,
              minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Reason', flex: 2,
              minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Equip', flex: 2,
              minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Cause', flex: 2, headerName: 'Causa Raiz',
              minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Action', flex: 2, headerName: 'Açaõ Imediata',
              minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'ActionPlan', flex: 2, headerName: 'Plano de Ação',
              minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Operador', flex: 2,
              minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Tecnico', flex: 2,
              minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Leader', flex: 2, headerName: 'Líder',
              minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Maintenance', flex: 2, headerName: 'Sup. Manutenção',
              minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Quality', flex: 2, headerName: 'Sup. Qualidade',
              minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },
            {
              field: 'Production', flex: 2, headerName: 'Sup. Produção',
              minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
            },

          ]}

          rows={lista}
          slots={{
            toolbar: GridToolbar,

          }}

        />
      </div>

    </>

  )
}
