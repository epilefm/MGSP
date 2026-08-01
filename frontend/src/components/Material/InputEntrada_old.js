import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import Calendar from "react-calendar";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import NavbarComp from '../Layout/NavbarComp';



export default function App() {
  const [formData, setFormData] = useState({itens: [],});
  const [values, setValues] = useState();
  const [listCard, setListCard] = useState([App]);
  const [lista, setLista] = useState([]);
  const [lista2, setLista2] = useState([]);
  const [date, setDate] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [ocultarCalendario, setOcultarCalendario] = useState(false);
  const [count, setCount] = useState(1);
  console.log(listCard);

  var a = console.log(date.getFullYear()+'0'+(date.getMonth()+1)+'0'+date.getDate());

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
    event.preventDefault();
    setFormData({ ...formData, [event.target.name]: event.target.value });    
    if (event.key==9){
      handleAddItem()
    }
    };

   
  
  const handleAddItem = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
      itens: [...formData.itens, {id:count, PO: formData.PO.substring(0,14),
        Kitting_Plan: formData.PO.substring(formData.PO.lastIndexOf(" ")+1,formData.PO.length),
        Line: formData.PO.substring(15,22),
        Basic_Model: formData.Basic_Model.substring(formData.Basic_Model.lastIndexOf(" ")+2, formData.Basic_Model.length),
        Shift: turno,
        Reel_ID: formData.Reel_ID,
        Barcode: formData.Barcode, 
        Part_Number: formData.Barcode.slice(0,11),
        Qty: formData.Barcode.slice(formData.Barcode.length-6, formData.Barcode.length),
        User: formData.User,
        Registry_ID: formData.Registry_ID.substring(0,8),
        Halb: formData.Basic_Model.slice(0,11),
      }],
      });
      limpaCampos()   
      
  };

  function limpaCampos() {
    
    const element2  = document.getElementsByName("Barcode"); // Limpa o campo
    element2.forEach(element => {
      console.log(element);
      element.value = '';

      const element1  = document.getElementsByName("Reel_ID"); // Limpa o campo
    element1.forEach(element => {
      console.log(element);
      element.value = '';
      element.focus();
      setCount(count+1);
    })
    })
  }

const contagem =(count)=> {
  setCount(count+1);
}

  const handleSubmit = async (event) => {
    event.preventDefault();
    const array = formData.itens.map(item=>({
      PO:item.PO ,
      Kitting_Plan:item.Kitting_Plan,
      Line:item.Line,
      Basic_Model:item.Basic_Model,
      Shift:item.Shift,
      Reel_ID:item.Reel_ID,
      Barcode:item.Barcode,
      Part_Number:item.Part_Number,
      Qty:item.Qty,User:item.User,
      Registry_ID:item.Registry_ID,
      Halb:item.Halb,
      Plant:item.Plant
    }))
    console.log(array)
    
      await Axios.post('http://105.103.39.102:8080/register', array)
        .then(response => {
          console.log(array);
          alert('Input de entrada de material salvo com sucesso!');
        })
        .catch((e) => {
          console.error(e.response.data.message);
          alert('Reel ID Duplicado');
        })
         window.location.reload();
  };

  const handleCalendar = () => {
   setMostrarCalendario(!mostrarCalendario);
      };
  
      useEffect(() => {
        let mess = (date.getMonth());
        if ((date.getMonth() + 1) < 10) {
          mess = '0' + (date.getMonth() + 1);
        } else {
          mess = (date.getMonth() + 1);
        };
        let diass = (date.getDate());
        if ((date.getDate()) < 10) {
         diass = '0' + (date.getDate())
        } else {
          diass = (date.getDate());
        };
        Axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=getsmdkitting&date=${date.getFullYear() +''+ mess+''+diass}`).then((response) => {
          setLista(response.data);
          setMostrarCalendario(false)
          console.log(date)
        });
      }, [date])
  
    useEffect(() => {
      Axios
      .get("http://105.103.39.102:8080/getCards")
      .then(response=>setListCard(response.data))
    }, []);
    
    useEffect(() => {
      Axios.get("http://105.103.39.102:8080/getModelo").then((response) => {
        setLista2(response.data);
      });
    }, []);


return (
      <>
<NavbarComp />
<Box className='lista2' style={{ marginLeft: 10, background: '#eeeef3', borderRadius: 8}}>

        <Form className="EntranceInput1" method="post" type='submit' onSubmit={handleAddItem}>
          <h2 style={{textAlign:'center'}}> Entrada de Material </h2>

<Form.Group className='calendar-container'> 
<Form.Group className='calendar-container'> 
<Form.Label>Data</Form.Label>

<Button style={{backgroundColor:'white', width:'100%', height:30 , color:'black', borderColor:'#DCDCDC', fontSize:14, marginBottom:15 }}
onClick={handleCalendar}> {date.toDateString()}  </Button>

{mostrarCalendario && 

<Calendar
  onChange={setDate}
  value={date}
  selectRange={false}
  onClickDay={setOcultarCalendario}
  hide={true}
/>}

</Form.Group>
</Form.Group>

<Form.Group className="mb-3" style={{ marginBottom: 15 }}>
          <Form.Label>Matrícula</Form.Label>
          <Form.Control rules={[{required: true, message: 'Please input Gen Id!',},]} 
          defaultValue="" placeholder="Scan ou digite a Matrícula" maxLength={8} id="Barcode"  onChange={handleChange} name='Registry_ID' required />
        </Form.Group>

          <Form.Group as={Col} style={{ marginBottom: 15 }}>
          <Form.Label>Halb | Modelo</Form.Label>
          <Form.Select defaultValue="Choose..." id='Basic_Model' name='Basic_Model' onChange={handleChange} placeholder='choose a line' >
          <option></option>
          {lista.filter(model => model.PLANT_CODE.includes('P81J') || model.PLANT_CODE.includes('P81L')|| model.PLANT_CODE.includes('P81M')|| model.PLANT_CODE.includes('P81N')|| model.PLANT_CODE.includes('P81P')).map((val, index) => (
          <option key={index}>{val.MODEL_CODE + ' | ' + val.BASIC_MODEL_CODE}</option>
          ))}
          </Form.Select>  
        </Form.Group>
        <Form.Group as={Col} style={{ marginBottom: 15 }}>
          <Form.Label>Kitting Number</Form.Label>
          <Form.Select defaultValue=" " id='PO' name='PO' onChange={handleChange} placeholder='Insert PO' required>
          <option></option>
          {lista.filter(model => model.PLANT_CODE.includes('P81J')).map((val, index) => (
            <option key={index}>{val.PRODC_INST_NO+' '+val.LINE_NM+' QTY: '+val.PLAN_QTY}</option>
            ))}
                      {lista.filter(model => model.PLANT_CODE.includes('P81L')).map((val, index) => (
            <option key={index}>{val.PRODC_INST_NO+' '+val.LINE_NM+' QTY: '+val.PLAN_QTY}</option>
            ))}
                      {lista.filter(model => model.PLANT_CODE.includes('P81M')).map((val, index) => (
            <option key={index}>{val.PRODC_INST_NO+' '+val.LINE_NM+' QTY: '+val.PLAN_QTY}</option>
            ))}
                      {lista.filter(model => model.PLANT_CODE.includes('P81N')).map((val, index) => (
            <option key={index}>{val.PRODC_INST_NO+' '+val.LINE_NM+' QTY: '+val.PLAN_QTY}</option>
            ))}
                      {lista.filter(model => model.PLANT_CODE.includes('P81P')).map((val, index) => (
            <option key={index}>{val.PRODC_INST_NO+' '+val.LINE_NM+' QTY: '+val.PLAN_QTY}</option>
            ))}


          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3" style={{ marginBottom: 15 }}>
          <Form.Label>Reel ID</Form.Label>
          <Form.Control defaultValue="" type='text' required maxLength={26} id="Reel_IDtxt" name='Reel_ID' onChange={handleChange} placeholder="Scan Reel ID code" />
        </Form.Group>

        <Form.Group className="mb-3" style={{ marginBottom: 15 }}>
          <Form.Label>Barcode</Form.Label>
          <Form.Control  minLength={20} maxLength={45} id="Barcode" type='text' onChange={handleChange} name='Barcode' required={true} />
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

          <h2 style={{marginTop:5, marginBottom:10}} className='h2'> Lista de Itens a serem inputados </h2><br></br>
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
          minWidth: 300, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Part_Number', flex: 1,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
        ]}
        initialState={{
          sorting: {
            sortModel: [{ field: 'id', sort: 'desc' }],
          },
        }}
        rows = {formData.itens}
        
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
