
import { Box } from '@mui/material';
import Axios from 'axios';
import React, { useEffect, useState} from 'react';
import { Button, Form } from "react-bootstrap";
import Calendar from "react-calendar";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';

function Kit(){

  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [date, setDate] = useState(new Date());
  const [lista, setLista] = useState([]);
  const [listabanco, setListabanco] = useState([]);
  const [listabancosum, setListabancosum] = useState([]);
  

  const handleCalendar = () => {
    setMostrarCalendario(!mostrarCalendario);
  };
  

  let current = new Date();
// dias conforme o filtro do gmes
let dias = (current.getDate());
if ((current.getDate()) < 10) {
  dias = '0' + (current.getDate())
} else {
  dias = (current.getDate());
};
let mes = (current.getMonth());
if ((current.getMonth() + 1) < 10) {
  mes = '0' + (current.getMonth() + 1)
} else {
  mes = (current.getMonth() + 1);
};


    const [data, setData] = useState([]);

    // useEffect(() => {
    //   Axios.get(`http://105.103.39.102:8080/getmappingsum`).then((response) => {
    //    setListabancosum(response.data)
    //    });
    //  }, [data])
    
    //   useEffect(() => {
    //    Axios.get(`http://105.103.39.102:8080/getmapping`).then((response) => {
    //     setListabanco(response.data)
    //     });
    //   }, [data])

    // useEffect(() => {
    //   let mess = (date.getMonth());
    //   if ((date.getMonth() + 1) < 10) {
    //     mess = '0' + (date.getMonth() + 1);
    //   } else {
    //     mess = (date.getMonth() + 1);
    //   };
    //   let diass = (date.getDate());
    //   if ((date.getDate()) < 10) {
    //    diass = '0' + (date.getDate());
    //   } else {
    //     diass = (date.getDate());
    //   };
    //     Axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=get_PCB_2D_Mapping_New_Sum&date=${date.getFullYear() +''+ mess+''+diass}`)
    //   .then((response) => {
    //     setData(response.data)
    // }).then(handleSalvar())
    // }, [date])

    //   function handleSalvar() {
    //     const array = data.map(item=>({INP_COMP_YMD:item.INP_COMP_YMD, MODEL_CODE:item.MODEL_CODE, BASIC_MODEL_CODE:item.BASIC_MODEL_CODE, PLANT_CODE:item.PLANT_CODE,
    //       LINE_NM:item.LINE_NM,PAOI_IN_CNT_BOT:item.PAOI_IN_CNT_BOT,PAOI_IN_CNT_TOP:item.PAOI_IN_CNT_TOP,MAOI_IN_CNT_BOT:item.MAOI_IN_CNT_BOT,MAOI_IN_CNT_TOP:item.MAOI_IN_CNT_TOP,
    //       SAOI_IN_CNT_BOT:item.SAOI_IN_CNT_BOT,SAOI_IN_CNT_TOP:item.SAOI_IN_CNT_TOP,FT_IN_CNT:item.FT_IN_CNT,FINAL_IN_CNT:item.FINAL_IN_CNT}))
    //       Axios.delete('http://105.103.39.102:8080/deleteMapping').then( Axios.post('http://105.103.39.102:8080/mapping', array).then((response) => {
    //         console.log(response.data)
            
    //       }))

    //     } 
    //     useEffect(() => {
    //       Axios.get("http://105.103.39.102:8080/getModelo").then((response) => {
    //         setLista(response.data)
    //         console.log('consultou mapping banco')
    //       })
    //     }, [])  

    return(
        <>
            <Box style={{ marginLeft: 10, background: '#eeeef3', borderRadius: 8, height: 150, width:300 }}>
            <div  display={'center'} style={{backgroundColor:'snow'}}>
        
            <div className='calendar-container'>
        <div className='calendar-container' display={'center'}>
          <div onClick={handleCalendar} ><Button variant="info" style={{ marginBottom: 10, height: 40, width: 300, alignItems: 'center' }}>{date.toDateString()}</Button></div>
          {mostrarCalendario &&

            <Calendar
              onChange={setDate}
              value={date}
              selectRange={false}
              
            />}
        </div>
        <div>
        <Form.Label>Line</Form.Label>
          <Form.Select id='Line' name='Line' type={Selection} required='true'>
          <option></option>
            <option value=''>All</option>
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
          </Form.Select >
          <Form.Label>Model</Form.Label>
          <Form.Select id='Line' name='Line' type={Selection} required='true'>
          <option></option>Halb, Basic_Model
            <option value=''>All</option>
            {lista.map((val, index) => (
              <option key={index}>{val.Halb + ' ' + val.Basic_Model}</option>

            ))}
          </Form.Select >
            {/* <Button variant="primary" type="submit" style={{ marginBottom: 10, height: 40, width: 300, alignItems: 'center' }} onSubmit={handleSalvar}>
          Inquiry
        </Button> */}
        </div>
      </div>
      

          {/* <div display={'flex'}>
      <div class="container-fluid" style={{ backgroundColor: 'snow' }}>
        <div>
          <div class="col-sm-5 offset-sm-0 mt- mb-1" style={{ color: "#292929", alignContent: 'flex-start' }}><h2><b>PCB 2D Mapping</b></h2></div>
        </div>
        <div class="row">
          <div class="table-responsive">
            <table class="table table-striped table-hover table-bordered">
              <thead style={{ backgroundColor: "#6495ed", textAlign: 'center', borderRadius: 5 }}>
                <tr>
                <th>LINE</th>
                  <th>BASIC_MODEL</th>
                  <th>BASIC_MODEL_CODE</th>
                  <th>PLANT_CODE</th>
                  <th>P-AOI_BOT</th>
                  <th>P-AOI_TOP</th>
                  <th>M-AOI_BOT</th>
                  <th>M-AOI_TOP</th>
                  <th>S-AOI_BOT</th>
                  <th>S-AOI_TOP</th>
                  <th>SMD_FT</th>
                  <th>SMD_FINAL</th>
                </tr>
              </thead>
              <tbody style={{ textAlign: 'center' }}>
                {listabanco.map((val, index) => (
                  <tr component='th' style={{ alignItems: 'center', fontSize: 16, fontWeight: 'lighter', fontFamily: 'Arial' }} key={index}
                    sx={{ width: '100%', '&:last-child td, &:last-child th': { border: 0 } }}>
                      <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.LINE}</th>
                    <th style={{ alignItems: 'content', fontSize: 16, fontWeight: 'lighter', fontFamily: 'Arial' }}>{val.HALB}</th>
                    <th style={{ alignItems: 'content', fontSize: 16, fontWeight: 'lighter', fontFamily: 'Arial' }}>{val.BASIC_MODEL}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.PLANT}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.PAOI_BOT}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.PAOI_TOP}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.MAOI_BOT}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.MAOI_TOP}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.SAOI_BOT}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.SAOI_TOP}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.SMD_FT}</th>
                    <th style={{alignItems:'content', fontSize:16, fontWeight:'lighter', fontFamily:'Arial'}}>{val.Result}</th>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div> */}

        </div>

        </Box>
        <Box style={{marginLeft:330, marginTop: 0}}>
<div style={{marginTop: -150, height: 450 , width: '100%', padding:'5px'}}><h1 align='center' > Mapping sum by Line</h1> <br/>
              <DataGrid hover={true}className='tabelass'
        columns={[
          { field: 'id', hideable: false,
          align:'center', minWidth: 20, headerAlign:'center', headerClassName:'headerr'},
          { field: 'Date', flex: 2,
          minWidth: 90, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'LINE', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'HALB', flex: 2,
          minWidth: 160, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'BASIC_MODEL', flex: 2,
          minWidth: 160, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'PLANT', flex: 2,
          minWidth: 75, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'PAOI_BOT', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'PAOI_TOP', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'MAOI_BOT', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'MAOI_TOP', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'SAOI_BOT', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'SAOI_TOP', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'SMD_FT', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Result', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          ]}
        rows = {listabancosum}
        slots={{
        toolbar: GridToolbar,
        
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
        <Box style={{marginLeft:330, marginTop: 0}}>
<div style={{marginTop: 100, height: 1000 , width: '100%', padding:'5px'}}><h1 align='center' > 2D Mapping Detail</h1> <br/>
              <DataGrid hover={true}className='tabelass'
        columns={[
          { field: 'id', hideable: false,
          align:'center', minWidth: 20, headerAlign:'center', headerClassName:'headerr'},
          { field: 'Date', flex: 2,
          minWidth: 90, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'LINE', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'HALB', flex: 2,
          minWidth: 160, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'BASIC_MODEL', flex: 2,
          minWidth: 160, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'PLANT', flex: 2,
          minWidth: 75, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'PAOI_BOT', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'PAOI_TOP', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'MAOI_BOT', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'MAOI_TOP', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'SAOI_BOT', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'SAOI_TOP', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'SMD_FT', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Result', flex: 2,
          minWidth: 80, align:'center', headerAlign:'center', headerClassName:'headerr'},
          ]}
        rows = {listabanco}
        slots={{
        toolbar: GridToolbar,
        
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

export default Kit;
