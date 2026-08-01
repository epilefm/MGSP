// import React, { useEffect, useState } from "react";
// import Col from 'react-bootstrap/Col';
// import Form from 'react-bootstrap/Form';
// import Row from 'react-bootstrap/Row';
// import Axios from "axios";
// import { Box } from "@mui/material";
// import { Button, ListGroup } from "react-bootstrap";
// import { ListItem, ListItemText } from "@mui/material";
// import Calendar from "react-calendar";
// import { DatePicker } from "antd";
// import { DataGrid, GridToolbar } from '@mui/x-data-grid';
// import { ExportToExcel } from '../Excel/Excel_Export';
// import NavbarComp from '../Layout/NavbarComp'

// export default function App() {

//   const [formData, setFormData] = useState({ itens: [], });
//   const [values, setValues] = useState();
//   const [listhalb, setListHalb] = useState([]);
//   const [listModelo, setListModelo] = useState([]);
//   const [lista, setLista] = useState([]);

//   console.log(listModelo);

//   // dias conforme o filtro do gmes

//   const handleSubmit = (event) => {
//     event.preventDefault();
//     Axios.post(`${API_URL}/PlacaReceb`, {
//       id: values.id,
//       Entrada: values.Entrada,
//       Tecnico: values.Tecnico,
//       CN_receb: values.CN_receb,
//     }).catch(error => {
//       console.error(error);
//       alert('Ocorreu um erro ao enviar a mensagem.' + error);
//     });
//   };
//   function refreshPage() {
//     window.location.reload(false);
//   }

// const handleChange = (event) => {
//     setFormData({ ...formData, [event.target.name]: event.target.value });
//   };

//   const handleaddValues = (value) => {
//     setValues((prevValues) => ({
//       ...prevValues,
//       [value.target.name]: value.target.value,
//     }));
//   };

//   const fileName = "Scrap Register"; // here enter filename for your excel file

//   const handleReset = (event) => {
//     event.preventDefault();
//     Array.from(document.querySelectorAll("input")).forEach(
//       input => (input.value = "")
//     );
//     this.setState({
//       itemvalues: [{}]
//     });
//   };

//   useEffect(() => {
//     Axios
//     .get(`${API_URL}/getPlacaReceb`)
//     .then(response=>setLista(response.data))
//   }, []);



//   return (
// <>

//       <div class='row col-12'>
//         <Box style={{ background: 'transparent', borderRadius: 8, width: '100%' }}>

//           <h2 style={{ textAlign: 'center' }}> Recebimento de Placas </h2>

//           <Form style={{ border: 'solid 0.1rem', borderColor: '#84aac6', borderRadius: 10, marginLeft: 20, marginBottom: 30 }} onSubmit={handleSubmit}>

//             <div style={{ marginLeft: 20 }}>
//               <Row style={{ justifyContent: 'center', width: '100%' }} >
                      
//               <Col>
//                   <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0, marginBottom:10 }}>
//                     <Form.Label>Processo</Form.Label>
//                     <Form.Select rules={[{ required: true, message: 'Insira a Quantidade!', },]}
//                       defaultValue="" maxLength={25} id="Entrada" Placeholder='Inserir a CN' onChange={handleaddValues} name='Entrada' required>
//                        <option></option>
//           <option>HC29</option>
//           <option>Offline/Análise Qualidade</option>
//           <option>Reparo</option>
//           <option>Scrap - WIP</option>
//           <option>Washboard</option>
//           <option>WIP</option>
//         </Form.Select>
//                   </Form.Group>
//                 </Col>

//                 <Col>
//                   <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0,  marginBottom:10 }}>
//                     <Form.Label>Responsável</Form.Label>
//                     <Form.Control rules={[{ required: true, message: 'Insira a Quantidade!', },]}
//                       defaultValue="" maxLength={25} id="Tecnico" Placeholder='Inserir a Matrícula' onChange={handleaddValues} name='Tecnico' required />
//                   </Form.Group>
//                 </Col>

//                 <Col>
//                   <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0, marginBottom:10 }}>
//                     <Form.Label>CN</Form.Label>
//                     <Form.Control rules={[{ required: true, message: 'Insira a Quantidade!', },]}
//                       defaultValue="" maxLength={25} id="CN_receb" Placeholder='Inserir a CN' onChange={handleaddValues} name='CN_receb' required />
//                   </Form.Group>
//                 </Col>

//               </Row>

//               <Row style={{ justifyContent: 'center' }}>
//                 <Button style={{ width: '20%', marginTop: 20, marginBottom: 10, height: '40' }} type="submit" onSubmit={handleSubmit}>Registrar</Button>
//                 <Button style={{ width: '20%', marginTop: 20, marginBottom: 10, height: '40', marginLeft: 20 }} type="reset" onSubmit={handleReset}>Reset</Button>
//                 <Button style={{width:'20%', marginTop: 20, height: 30, marginLeft: 20, backgroundColor: '#0aa42f', border:'none'}} onClick={refreshPage}>Atualizar Página</Button>
//               </Row>

//             </div>
//           </Form>
//         </Box>
//       </div>


//       <h2 style={{ marginTop: -10 }} className='h2'> Histórico de Recebimento de Placas</h2>
//       <div style={{ height: 500, width: '100%', padding: '2px', marginTop: -30, justifyContent: 'center' }}>
//         <ExportToExcel apiData={lista} fileName={fileName} />
        
//         <DataGrid hover={true} className=''
//           columns={[
//             {
//               field: 'id', hideable: false,
//               minWidth: 10, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
//             },
//             {
//               field: 'Entrada', flex: 2,
//               minWidth: 180, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
//             },
//             {
//               field: 'Tecnico', flex: 2,
//               minWidth: 180, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
//             },
//             {
//               field: 'CN_receb', flex: 2,
//               minWidth: 180, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
//             },

//           ]}

//           rows={lista}
//           slots={{
//             toolbar: GridToolbar,

//           }}

//         />
//       </div>

//     </>

//   )
// }
