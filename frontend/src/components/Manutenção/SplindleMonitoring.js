import { API_URL } from '../../config/api';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import {ExportToExcel} from '../Excel/Excel_Export'
import NavbarComp from '../Layout/NavbarComp'
import { Box } from "@mui/material";
import clsx from 'clsx';
export default function Tabela() {

  const [values, setValues] = useState();
    const [listCard, setListCard] = useState([]);
    const [lista, setLista] = useState([]);
  
    useEffect(() => {
      Axios
      .get(`${API_URL}/getspindle`)
      .then(response=>setLista(response.data))
    }, []);
   
    const fileName = "Spindle Data"; // here enter filename for your excel file

    const columns=[

      { field: 'id', hideable: false,
            minWidth: 10, align:'center', headerAlign:'center', headerClassName:'headerr'},
            { field: 'data_manutencao', flex: 2,
            minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
            { field: 'tecnico', flex: 2,
            minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
            { field: 'matricula', flex: 2,
            minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
            { field: 'linha', flex: 2,
            minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
            { field: 'codigo_spindle', flex: 2,
            minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
            { field: 'pecas_trocadas', flex: 2,
            minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
            { field: 'periodicidade', flex: 1,
            minWidth: 250, align:'center', headerAlign:'center', headerClassName:'headerr'},
  {
    field: 'contagem',
    type: 'number',
    align:'center',
    width: 140,
    cellClassName: (params) => {
      if (params.value == null) {
        return '';
      }
  
      return clsx('super-app', {
        negative: params.value <0,
        positive: params.value > 0,
      });
    },
  },
  ]

  return (
<> <NavbarComp/>
    <h2 className='h2' style={{height:0}}> Monitoramento de Spindle </h2>

    <div style={{height:'82vh' , width: '100%', padding:'5px'}}>
    <ExportToExcel apiData={listCard} fileName={fileName}/>      


    <Box
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
 }}
>

      <DataGrid hover={true} 
        columns={columns}

        rows = {lista}
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
      </Box>
    </div>
      </>
    )
  }
  