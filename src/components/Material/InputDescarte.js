import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Button } from "react-bootstrap";
import {Container} from "@mui/material";
import { Box } from "@mui/material";
import Index from '../../index'
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { randomNumberBetween } from "@mui/x-data-grid/utils/utils";
import clsx from 'clsx';

export default function FormControlInput() {
  const [formData, setFormData] = useState({
    itens: [],
    });
    
    const [listCard, setListCard] = useState([]);
    const [lista, setLista] = useState([]);
    const [count, setCount] = useState(1);
    
    console.log(listCard);

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

    

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleAddItem = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
      
      itens: [...formData.itens, {id:count,
      Line: formData.Line,
      Shift: turno,
      Reel_ID: formData.Reel_ID,
      Basic_Model: formData.Basic_Model.substring(13, 33),
      Halb: formData.Basic_Model.substring(0, 11),
      Barcode: formData.Barcode,
      Part_Number:formData.Barcode.slice(0,11),
      Qty_Discard: formData.Barcode.slice(formData.Barcode.length-6,
      formData.Barcode.length),
      User: formData.User,
      Registry_ID: formData.Registry_ID}]
      });
      limpaCampos()
    };
  
    function limpaCampos() {
      const element1  = document.getElementsByName("Barcode"); // Limpa o campo
      element1.forEach(element => {
        console.log(element);
        element.value = '';
      })
        
      const element2  = document.getElementsByName("Reel_ID"); // Limpa o campo
      element2.forEach(element => {
        console.log(element);
        element.value = '';
        element.focus();
        setCount(count+1);
      })
    }

  const handleSubmit = (event) => {
    
      event.preventDefault();
      const array = formData.itens.map(item=>({Line:item.Line, Shift:item.Shift,
        Reel_ID:item.Reel_ID,Barcode:item.Barcode,Halb:item.Halb,Basic_Model:item.Basic_Model,
        Part_Number:item.Part_Number,Qty_Discard:item.Qty_Discard,User:item.User,Registry_ID:item.Registry_ID}))
        Axios.post('http://105.103.39.102:8080/descarte', array)
        .then((response)=>{
          window.location.reload(false)
        })
      }

      useEffect(() => {
        Axios.get("http://105.103.39.102:8080/getModelo").then((response) => {
          setLista(response.data);
        });
      }, []);


      return (
<>
        <Box className='lista2' style={{ marginLeft: 10, background: '#eeeef3', borderRadius: 8 }}>
        <Form className="EntranceInput1" method="post" type='submit' onSubmit={handleAddItem}>
            <h2 style={{textAlign:'center'}}> Reel Discard </h2>
            
            <Form.Group className="mb-3" style={{ marginBottom: 15}}>
          <Form.Label>Matrícula</Form.Label>
          <Form.Control rules={[{required: true, message: 'Please input Gen Id!',},]}
          defaultValue="" placeholder="Scan ou digite a Matrícula" maxLength={8} id="Registry_ID"  onChange={handleChange} name='Registry_ID' required />
        </Form.Group>

          <Form.Group style={{ marginBottom: 10, color: 'black' }}>
            <Form.Label style={{ fontSize: 'medium', marginBottom: '-10px' }} > Halb | Model </Form.Label>
            <Form.Select defaultValue="Choose..." name='Basic_Model' onChange={handleChange} placeholder='choose a line' required>
              <option></option>
          {lista.map((val, index) => (
          <option key={index}>{val.Halb + ' | ' + val.Basic_Model}</option>
          ))}

            </Form.Select>
          </Form.Group>

          <Form.Group style={{ marginBottom: 15, color:'black' }}>
              <Form.Label style={{fontSize:'medium', marginBottom:'-10px'}} > Line </Form.Label>
              <Form.Select defaultValue="Choose..." id='Line' name='Line' onChange={handleChange} placeholder='choose a line' required>
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

              <Form.Group style={{ marginBottom: 15, color:'black' }}>
              <Form.Label style={{fontSize:'medium', marginBottom:'-10px'}} > Reel ID </Form.Label>
              <Form.Control type='text' maxLength={26} id='Reel_ID' name='Reel_ID' onChange={handleChange} placeholder="Scan Reel ID code" />
            </Form.Group>

            <Form.Group style={{ marginBottom: 15, color:'black' }}>
            <Form.Label style={{fontSize:'medium', marginBottom:'-10px'}} > Barcode </Form.Label>
            <Form.Control placeholder="Scan Reel Label" minLength={25} maxLength={45} onChange={handleChange} 
            id='Barcode' name='Barcode' required />
          </Form.Group>

          <Button style={{backgroundColor:'#0e87e2', color:'white', borderColor:'transparent',
              borderRadius:5, paddingInline:5, height:40, marginBottom:10, MarginTop:10}}
             type="submit" onSubmit={handleAddItem}>Adicionar itens</Button><br></br> 

          </Form>
          </Box>

          <Box style={{marginLeft:330}}>

          <Button style={{width:'18%', height:40, marginTop:10, marginBottom:-30,
        borderColor:'transparent', fontSize:18}} type="submit"
    onClick={handleSubmit}>Registrar</Button>

          <h2 style={{marginTop:5, marginBottom:10}} className='h2'> Lista de Itens a serem inputados</h2><br></br>
    <div style={{ height:520 , width:'99.9%', padding:'2px', marginTop:'-30px'}}>
    
      <DataGrid  hover={true} 
        columns={[
          { field: 'id', flex: 2,
          minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr', headerName:'ID'},
          { field: 'Line', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Registry_ID', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Shift', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Halb', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Basic_Model', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Reel_ID', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Barcode', flex: 2,
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Part_Number', flex: 1,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Discard', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
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
          </>
      )
    }
