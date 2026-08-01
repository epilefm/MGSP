import { API_URL } from '../../config/api';
import { DataGrid, GridToolbar, GridToolbarDensitySelector } from '@mui/x-data-grid';
import Axios from "axios";
import { textAlign } from "@mui/system";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import { getRowIdFromRowModel } from '@mui/x-data-grid/internals';
import { Button, Col, Row } from "react-bootstrap";
import Form from 'react-bootstrap/Form';
import {ExportToExcel} from '../Excel/Excel_Export'
import clsx from 'clsx';
import { Box, Hidden, Input } from "@mui/material";


export default function Tabela() {

  const handleCalendar = () => {
    setMostrarCalendario(!mostrarCalendario);
  };
  const handleCalendar1 = () => {
    setMostrarCalendario1(!mostrarCalendario1);
  };
  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
    };

    const [values, setValues] = useState();
    const [entra,setEntra] = useState([]);
    const [listsaida, setListsaida] = useState([]);
    const [listdescarte, setListdescarte] = useState([]);
    const [listretorno, setListretorno] = useState([]);
    const [listclassea, setListclassea] = useState([]);
    const [listCards, setListCards] = useState([]);
    const [listhalb, setListHalb] = useState([]);
    const [mostrarCalendario, setMostrarCalendario] = useState(false);
    const [mostrarCalendario1, setMostrarCalendario1] = useState(false);
    const [ocultarCalendario, setOcultartCalendario] = useState(false);
    const [date, setDate] = useState(new Date());
    const [datef, setDatef] = useState(new Date());

  const [listCard, setListCard] = useState([]);

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
      let curDate = current.getFullYear() + '' + mes + '' + dias;
    
      const [data, setData] = useState([]);
      const [registerkit, setregisterkit] = useState([]);

      const handleSubmit = (event) => {   
        
        var mesf = (datef.getMonth());
        if ((datef.getMonth() + 1) < 10) {
          mesf = '0' + (datef.getMonth() + 1);
        } else {
          mesf = (datef.getMonth() + 1);
        };
        var diasf = (datef.getDate());
        if ((datef.getDate()) < 10) {
         diasf = '0' + (datef.getDate())  
        } else {
          diasf = (datef.getDate());
        };
        var mess = (date.getMonth());
        if ((date.getMonth() + 1) < 10) {
          mess = '0' + (date.getMonth() + 1);
        } else {
          mess = (date.getMonth() + 1);
        };
        var diass = (date.getDate());
        if ((date.getDate()) < 10) {
         diass = '0' + (date.getDate())
        } else {
          diass = (date.getDate());
        };
        
        Axios.all([
          Axios.get(`${API_URL}/getDescarteResumo?Line=${values.Line}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
          Axios.get(`${API_URL}/getSaidaResumo?Line=${values.Line}&Halb=${values.Halb}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
          Axios.get(`${API_URL}/getResumo?Line=${values.Line}&Halb=${values.Halb}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
          Axios.get(`${API_URL}/getReturnResumo?Line=${values.Line}&Halb=${values.Halb}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
          Axios.get(`${API_URL}/getClasseAResumo?Line=${values.Line}&datei=${date.getFullYear()+''+mess+''+diass}&datef=${datef.getFullYear()+''+mesf+''+diasf}`),
        ])
    
        .then(Axios.spread((DescarteResumoRes, SaidaResumoRes, Entrares,RetornoResumoRes,ClasseAResumoRes) =>{
          setListdescarte(DescarteResumoRes.data);
          setListsaida(SaidaResumoRes.data);
          setEntra(Entrares.data);
          setListretorno(RetornoResumoRes.data);
          setListclassea(ClasseAResumoRes.data)
          setMostrarCalendario(false)
        }))
      }
  
    useEffect(() => {
      Axios
      .get(`${API_URL}/getCardRast`)
      .then(response=>setListCard(response.data))
      setMostrarCalendario(false)
    }, []);

    useEffect(() => {
      let period = [curDate]
      Axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=get_productionplanbyorder&date=${curDate}`).then((response) => {
        setData(response.data)
      });
    }, [])

    const fileName = "Class A Data"; // here enter filename for your excel file

    const columns = [
      { field: 'id', hideable: true,
      minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Date', flex: 2,
      minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Halb', flex: 2,
      minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Basic_Model', flex: 2, headerName:'Basic Model',
      minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Line', flex: 2,
      minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
      // { field: 'Plant', flex: 2,
      // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Part_Number', flex: 2, headerName:'Part Number',
      minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
      // { field: "PLAN_QTY", flex: 2,
      // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
      // { field: 'Kit_Plan', flex: 2,
      // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Entrance', flex: 2,
      minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Output', flex: 2,
      minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
      // { field: 'Prod_Qty', flex: 2,
      // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Material_Return', flex: 2, headerName:'Material Return',
      minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
      { field: 'Discard_Qty', flex: 2,
      minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
           {
        field: 'Diff',
        headerName:'Diff', headerAlign:'center',
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
    ];

  return (
<>
   
    <h2 className='h2' style={{height:0}}> Class A Control - (Comparison)     </h2>

    <Box style={{}}
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

    <div style={{height:'82vh' , width: '100%', padding:'5px'}}>
    <ExportToExcel apiData={setData} fileName={fileName}/>

      <DataGrid  hover={true}  className='tabelass'
        columns={columns}

        rows = {listCard}
        slots={{
        toolbar: GridToolbar,
        }}
        slotProps={{
        toolbar: {
          showQuickFilter: true,
          quickFilterProps: { debounceMs: 500 },
          date
          
        },
        
      }}
    
      />
    </div>
    </Box>
    
    </>
  );
}