import Table from 'react-bootstrap/Table';
import React, { useEffect, useState } from "react";
import Axios from "axios";
import { Box, Hidden, Input } from "@mui/material";
import Form from 'react-bootstrap/Form';
import { Button, Card, Col, Row } from "react-bootstrap";
import { color, fontSize, height } from '@mui/system';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import clsx from 'clsx';
import {ExportToExcel} from '../Excel/Excel_Export'
//----------------------
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
//----------------------

export default function App() {
  const [lista, setLista] = useState([]);

  
 

  useEffect(() => {
    Axios.get("http://105.103.39.102:8080/getSlip").then((response) => {
      setLista(response.data);
    });
  }, []);

  const columns = [
          { field: 'id', hideable: false,
          align:'center', minWidth: 10, headerAlign:'center', headerClassName:'headerr'},
          { field: 'Data', hideable: false, headerName:'Data',
          minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'slip', hideable: false, headerName:'SLIP',
          minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'cn', hideable: false, headerName:'CN',
          minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'resultado', hideable: false, headerName:'Resultado',
          minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
  ];


  const fileName = "Analysis Data"; // here enter filename for your excel file


  return (
<>

      <Box style={{marginTop:170}}
      sx={{
        '& .super-app-theme--cell': {
           backgroundColor: 'rgba(224, 183, 60, 0.55)',
           color: '#1a3e72',
           fontWeight: '600',
         },
         '& .super-app.negative': {
           backgroundColor: '#d47483',
           color: '#1a3e72',
           fontWeight: '600',
         },
         '& .super-app.positive': {
           backgroundColor: 'rgba(157, 255, 118, 0.49)',
           color: '#1a3e72',
           fontWeight: '600',
         },
       }}>
        
<div style={{marginTop: -170, height: '80vh' , width: '100%', padding:'5px'}}><h1 align='center' > Histórico de CN's</h1>
<div style={{marginLeft:-200}}>
<ExportToExcel apiData={lista} fileName={fileName} /> 
</div>
              <DataGrid hover={true}className='tabelass'
        
        columns={
          columns
          }   
        rows = {lista}
      
        slots={{
        toolbar: GridToolbar,
      }}
      style={{ fontSize: "15px"}}

      slotProps={{
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 500 },
        },      
      }}
      />
   </div>
   </Box>
<br>
</br>    
    </>
  );
}