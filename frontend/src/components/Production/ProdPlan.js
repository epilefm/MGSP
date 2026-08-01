import { API_URL } from '../../config/api';
import { DataGrid, GridToolbar, GridToolbarQuickFilter } from '@mui/x-data-grid';
import { Box, Grid } from '@mui/material';
import NavbarComp from '../Layout/NavbarComp';
import Axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Alert, Button, ListGroup } from "react-bootstrap";
import {ExportToExcel} from '../Excel/Excel_Export'


function Production() {
  
  const [values, setValues] = useState();
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

  
  const [producao, setproducao] = useState([]);
    const [dados, setDados] = useState([]);

    useEffect(() => {
    let period = [curDate];
    Axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=get_productionplanbyorder&date=${curDate}`).then(response => {
      // 2. Extrai as informações relevantes da resposta
      console.log(response);
      setDados(response.data);
    })
    .catch(error => {
      console.log(error);
    });
}, []);

useEffect(() => {
  let period = [curDate];
  Axios.get(`${API_URL}/getprod`).then(response => {
    // 2. Extrai as informações relevantes da resposta
    console.log(response);
    setproducao(response.data);
  })
  .catch(error => {
    console.log(error);
  });
}, []);

function handleSalvar() {
  
  Axios.delete(`${API_URL}/deleteprod`);
  const array = dados.map(item=>
    ({
      MASTER_LINE:item.MASTER_LINE,
      DEFT_QTY:item.DEFT_QTY,
      BASIC_MODEL_CODE:item.BASIC_MODEL_CODE,
      MODEL_CODE:item.MODEL_CODE,
      PLAN_QTY:item.PLAN_QTY,
      REM_QTY:item.REM_QTY,
      PROD_TIME:item.PROD_TIME,
      FST_ACRS_DT:item.FST_ACRS_DT,
      FNL_ACRS_DT:item.FNL_ACRS_DT}))

    const response = Axios.post(`${API_URL}/registerprod`, array)
    .then(response => {
      console.log('Dados salvos com sucesso!', response);
    })
    .catch(error => {
      console.error('Erro ao salvar os dados:', error);
      console.log('OS dados são parte erro:', array);
    });
    refreshPage();
  } 

  function refreshPage() {
    window.location.reload(false);
  }
const columns =[
  { field: 'id', hideable: false, 
  minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'MASTER_LINE', flex: 2,
  minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
 //  { field: 'MODEL_CODE', flex: 2,
 //  minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'BASIC_MODEL_CODE', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'PLANNED_QTY', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'PROD_QTY', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'REMAIN_QTY', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: "DEFT_QTY", flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'PLANNED_PROD_TIME', flex: 2,
  minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
  { field: 'COMPLETION_STATUS', flex: 2,
  minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
]

  const getRowClassName = (params) => {
    const porcentagem = parseFloat (params.row.porcentagem);

    if (porcentagem >=50) {return 'row-verde';}
    else if (porcentagem >=25) {return 'row-amarela';}
    else {return 'row-vermelha'}
};

  const fileName = "Plan Vs Result Data"; // here enter filename for your excel file

  return (
    <>

    <h2 className='h2' style={{height:0}}> Plan Vs Result     </h2>

      <div style={{height:'82vh' , width: '100%', padding:'5px'}}>
      <ExportToExcel apiData={listCard} fileName={fileName}/>     
  
      <DataGrid  hover={true}  className='tabelass' style={{cellSpacing:'0'}}
        columns={columns}

        rows = {producao}
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
    <Button variant="success" backgroundColor='black' type="submit" style={{height: 30, width: 80}} onClick={handleSalvar}>
    Atualizar
  </Button>

   </>
  );
}

export default Production;

