import { API_URL } from '../../../config/api';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import {ExportToExcel} from '../Excel/Excel_Export'

export default function Tabela() {

  const [values, setValues] = useState();
    const [listCard, setListCard] = useState([]);


    useEffect(() => {
      Axios.get(`${API_URL}/getReparoDetalhado`)
        .then(response => {
          setListCard(response.data);
        })
        .catch(error => {
          console.error('Erro ao buscar dados no Reparo Inventario:', error);
        });
    }, []);
   
    const fileName = "Entrance Data"; // here enter filename for your excel file

  return (
<>
    <h2 className='h2' style={{height:0}}> Movimentação de Placas - Reparo (Detalhado)</h2>

    <div style={{height:'82vh' , width: '100%', padding:'5px'}}>
    <ExportToExcel apiData={listCard} fileName={fileName}/>      
      <DataGrid hover={true} className='tabelass' 
      
      //----------------------------------Entrada Reparo-----------------------------------
      columns={[
          { field: 'id', hideable: false,
          minWidth: 10, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Data1', flex: 2, headerName:'Data',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Data_Feedback', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Halb', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Modelo', flex: 1,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Linha', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Turno', flex: 2, headerName:'Turno',
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Responsavel', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Processo', flex: 2, headerName:'Processo',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Fase', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Origem_SMD', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Origem_Main', flex: 2, headerName:'Origem Main',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Causa', flex: 3, headerName:'Defeito',
          minWidth: 180, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Sintoma', flex: 2, headerName:'Sintoma',
          minWidth: 120, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Status', flex: 2,
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Detalhe', flex: 2, headerName:'Observação',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Location', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'CN_rep', flex: 2, headerName:'CN',
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},

          //-------------------------Recebimento Reparo-------------------------------------------------------------

          { field: 'Entrada', flex: 2, headerName:'Processo - Entrada',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Tecnico', flex: 3,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'CN_recebrep', flex: 2, headerName:'CN Recebimento',
          minWidth: 120, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Data_receb1', flex: 2, headerName:'Data Recebimento',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},

          //------------------------------------Tecnico Reparo--------------------------------------------------

          
          {
            field: 'Data_reparo1', flex: 2, headerName: 'Data de Analise',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Tecnico_processo', flex: 2, headerName: 'Técnico de Reparo',
            minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Defeito_processo', flex: 2, headerName: 'Defeito - Técnico',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Detalhes_processo', flex: 2, headerName: 'Detalhes',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Location_processo', flex: 2, headerName: 'Location - Técnico',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
           {
            field: 'Status_processo', flex: 1, headerName: 'Status - Tecnico',
            minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
           {
            field: 'CN_processo', flex: 2, headerName: 'CN Tecnico',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },          
        
          //----------------------------Auxiliar Reparo----------------------------------------------------------

          {
            field: 'Data_auxiliar1', flex: 2, headerName: 'Data - Auxiliar',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Auxiliar', flex: 2, headerName: 'Tecnico Auxiliar',
            minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Defeito_auxiliar', flex: 2, headerName: 'Defeito',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Detalhe_auxiliar', flex: 2, headerName: 'Observação',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Location_auxiliar', flex: 2, headerName: 'Location',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
           {
            field: 'Status_auxiliar', flex: 1, headerName: 'Status',
            minWidth: 100, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
           {
            field: 'CN_auxiliar', flex: 2, headerName: 'CN',
            minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },          

          //-----------------------Saida Reparo---------------------------------------------------------------

          {
            field: 'Data_saida1', flex: 2, headerName: 'Data de Saída',
            minWidth: 180, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },  
          {
            field: 'Saida', flex: 2, 
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Linha_saida', flex: 2,
            minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Resp_saida', flex: 2, headerName: 'Responsavel saida',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Receb_saida', flex: 2, headerName: 'Recebedor saida',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
          {
            field: 'Saida_Processo', flex: 2, headerName: 'Saida do processo',
            minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'headerr'
          },
                        ]}

        rows = {listCard}
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
    </>
  );
}