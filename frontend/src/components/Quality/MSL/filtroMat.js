import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Button } from "react-bootstrap";
import {Container} from "@mui/material";
import { Box } from "@mui/material";
import styles from '../../../styles.css';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { randomNumberBetween } from "@mui/x-data-grid/utils/utils";

export default function FormControlInput() {

  const [formData, setFormData] = useState({
    itens: [], 
    });

  const [values, setValues] = useState();
  const [listCard, setListCard] = useState([]);
  const [lista, setLista] = useState([]);
  const [lista2, setLista2] = useState([]);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [date, setDate] = useState(new Date());

  console.log(listCard);

  const handleCalendar = () => {
    setMostrarCalendario(!mostrarCalendario);
  };
  const oculta = () => {
    setMostrarCalendario(false);
  };

  let current = new Date();
  let mes = (current.getMonth());
  if ((current.getMonth() + 1) < 10) {
    mes = '0' + (current.getMonth() + 1)
  } else {
    mes = (current.getMonth() + 1);
  };

  let hora = (current.getHours());
  if ((current.getHours()) < 10) {
    hora = '0' + (current.getHours())
  } else {
    hora = (current.getHours());
  };

  let min = (current.getMinutes());
  if ((current.getMinutes()) < 10) {
    min = '0' + (current.getMinutes())
  } else {
    min = (current.getMinutes());
  };

  let sec = (current.getSeconds());
  if ((current.getSeconds()) < 10) {
    sec = '0' + (current.getSeconds())
  } else {
    sec = (current.getSeconds());
  };

  let cDate = current.getFullYear() + '-' + mes + '-' + current.getDate();
  let cTime = hora + ":" + min + ":" + sec;
  let dateTime = (cDate + ' ' + cTime);
  let data = dateTime;
  let turno = '';
  let horario = new Date();
  let horas = (horario.getHours());
  let minutos = (horario.getMinutes());

  if (horas < 14 && minutos < 55) {
    turno = '1T'
  }
  else if (horas < 6 && minutos < 55) {
    turno = '3T'
  } else {
    turno = '2T'
  }

// dias conforme o filtro do gmes
  let dias = (current.getDate());
  if ((current.getDate()) < 10) {
    dias = '0' + (current.getDate())
  } else {
    dias = (current.getDate());
  };
  let curDate1 = current.getFullYear()+''+ mes +''+ dias;

  const handleAddItem = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
      itens: [...formData.itens, {      
        Line: formData.Line,
        Basic_Model: formData.Basic_Model.substring(13,33),
        Shift: turno,
        Reel_ID: formData.Reel_ID,
        Barcode: formData.Barcode,
        Part_Number: formData.Barcode.slice(0,11),
        Qty_Return: formData.Barcode.slice(formData.Barcode.length-6, formData.Barcode.length),
        User: formData.User,
        Registry_ID: formData.Registry_ID,
        Halb: formData.Basic_Model.substring(0,11),
        Plant: formData.PO}]

      });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const array = formData.itens.map(item=>({
      Line:item.Line,
      Shift:item.Shift,
      Basic_Model: item.Basic_Model,
      Halb: item.Halb,
      Reel_ID:item.Reel_ID,
      Barcode:item.Barcode,
      Part_Number:item.Part_Number,
      Qty_Return:item.Qty_Return,
      User:item.User,
      Registry_ID:item.Registry_ID}))
    
      Axios.post('http://105.103.188.56:8080/registerdevolucao', array)
      .then(response => {
        console.log(array);
        alert('Mensagem enviada com sucesso!');
      })
      .catch(error => {
        console.error(error);
        alert('Ocorreu um erro ao enviar a mensagem.');
      });
      window.location.reload();
  };

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };


    useEffect(() => {
      Axios.get("http://http://105.103.188.56:8080/getModelo").then((response) => {
        setLista2(response.data);
      });
    }, []);

    return (
      <>

<Box className='lista2' style={{ marginLeft: 10, background: '#eeeef3', borderRadius: 8 }}>
<Form style={{marginTop:5, marginLeft:5}} className="EntranceInput1" onSubmit={handleSubmit}>
          <h2 style={{textAlign:'center'}}> Devolucão de Material </h2>

          <Form.Group className="mb-3" style={{ marginBottom: 15 }}>
          <Form.Label>Matrícula</Form.Label>
          <Form.Control rules={[{required: true, message: 'Please input Gen Id!',},]} 
          defaultValue="" placeholder="Scan ou digite a Matrícula" maxLength={8} id="Barcode"  onChange={handleChange} name='Registry_ID' required ={true} />
        </Form.Group>

        <Form.Label>Linha</Form.Label>
          <Form.Select style={{width:'100%'}}
          defaultValue="Choose..." id='Line' name='Line' onChange={handleChange} placeholder='choose a line' required>
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
            <Form.Group style={{ marginBottom: 15, color:'black' }}>
            <Form.Label style={{fontSize:'medium', marginBottom:'-10px'}} > Halb | Modelo </Form.Label>
            <Form.Select defaultValue="Choose..." name='Basic_Model' onChange={handleChange} placeholder='choose a line' required>
            <option></option>
          {lista2.map((val, index) => (
          <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
          ))}

            </Form.Select>
            </Form.Group>

          <Form.Group style={{ marginBottom: 15, color:'black' }}>
            <Form.Label style={{fontSize:'medium', marginBottom:'-10px'}} > Reel ID </Form.Label>
            <Form.Control type='text' maxLength={15} name='Reel_ID' onChange={handleChange} placeholder="Scan Reel ID code" />
          </Form.Group>
  
          <Form.Group style={{ marginBottom: 15, color:'black' }}>
          <Form.Label style={{fontSize:'medium', marginBottom:'-10px'}} > Barcode </Form.Label>
          <Form.Control placeholder="Scan Reel Label" maxLength={45} onChange={handleChange} name='Barcode' required />
        </Form.Group>

            <button style={{backgroundColor:'#0e87e2', color:'white', borderColor:'transparent',
              borderRadius:5, paddingInline:5, height:40, marginBottom:10, MarginTop:10}}
              type="button" onClick={handleAddItem}>Adicionar itens</button><br></br>
              

            </Form>
        </Box>

        <Box style={{marginLeft:330}}>

        <Button style={{width:'18%', height:40, marginTop:10, marginBottom:-30, backgroundColor:'#0e87e2',
        borderColor:'transparent', fontSize:18}} type="submit"
    onClick={handleSubmit}>Registrar</Button>
    
          <h2 style={{marginTop:5, marginBottom:10}} className='h2'> Lista de Itens a serem inputados</h2><br></br>
    <div style={{ height:520 , width:'99.9%', padding:'2px', marginTop:'-30px'}}>
    
      <DataGrid  hover={true} 
        columns={[
          
          // { field: 'Date', flex: 2,
          // minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Shift', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'User', flex: 2,
          // minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Registry_ID', flex: 2,
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Halb', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Basic_Model', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Line', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Reel_ID', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Barcode', flex: 2,
          minWidth: 280, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Part_Number', flex: 2,
          minWidth: 280, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'Qty_Entrance', flex: 2,
          // minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'Qty_Output', flex: 2,
          // minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Return', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
        ]}
        
        rows = {formData.itens}
        getRowId={randomNumberBetween(1,1,100)}
        slots={{
       
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
  