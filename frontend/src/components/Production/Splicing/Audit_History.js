import { API_URL } from '../../../config/api';
import React, { useState, useEffect } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Axios from 'axios';
import { Box } from "@mui/system";
import Table from 'react-bootstrap/Table'
import { ExportToExcel } from '../../Excel/Excel_Export'
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Splicing_graph from './Splicing_graph'
import { Card } from "react-bootstrap";
//import tablee from 'C:/Users/f.miguel/boots/src/components/Production/Splicing/Splicing.css'

import axios from "axios";

export default function Tabela() {
  const [listCard, setListCard] = useState([]);
  const [listCard2, setListCard2] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [card, setCard] = useState([])

  const fileName = "Splicing data" // here enter filename for your excel file

 useEffect(() => {
  const fetchData = async () => {
  try {
    const response = await 
    axios.get(`${API_URL}/splicingDefectQTY?data=${date}`);
    setListCard(response.data);
  } catch (error) {
    console.error ('Erro ao buscar dados', error);
  }
};
fetchData();
    
const interval = setInterval(() => {
  fetchData();
}, 120000);
// Limpar o intervalo quando o componente émontado
return () => clearInterval(interval);
}, [date]); 
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
useEffect(() => {
  const fetchData = async () => {
  try {
    const response = await 
    axios.get(`${API_URL}/SplicingDefectLineQTY?data=${date}`);
    setListCard2(response.data);
  } catch (error) {
    console.error ('Erro ao buscar dados', error);
  }
};
fetchData();
    
const interval = setInterval(() => {
  fetchData();
}, 120000);
// Limpar o intervalo quando o componente émontado
return () => clearInterval(interval);
}, [date]); 

//------------------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------------------
const handleSubmit = (event) => {
  event.preventDefault();
}

   setTimeout(function() {
     window.location.reload(1);
   }, 300000); // 5 minutos

  const data = React.useMemo(() => listCard, [listCard]);
  const columns = React.useMemo(() => [
    { Header: 'Data', accessor: 'data' },
    { Header: 'Hora', accessor: 'Hora' },
    { Header: 'Linha', accessor: 'LINE'},
    { Header: 'Operador', accessor: 'OPERATOR_NAME' },
    { Header: 'Part Number', accessor: 'PART_NO' },
    { Header: 'Comparison', accessor: 'COMPARISON_ID' },
    { Header: 'Falha Panacim', accessor: 'FAILURE_DESC' },
    { Header: 'Erro', accessor: 'Status' },
    
  ], []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
    rows,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize, globalFilter }, // Adicione globalFilter ao estado
    preGlobalFilteredRows,
    setGlobalFilter, // Função para definir o filtro global
  } = useTable(
    { columns, data },
    useGlobalFilter, // Adicione useGlobalFilter aqui
    useSortBy,
    usePagination
  );

  return (
    <>

<div>
  <table class='tablee' style={{display:'flex', flexWrap:'wrap'}}>

                <div style={{writingMode:'vertical-rl', fontWeight:'bold'}}>Shift</div>
                <div style={{border:'solid 2px orange', verticalAlign:'center', marginRight:5}}></div>
                                       
                <div style={{marginLeft:5, width:50}}>
                <thead > 1T </thead>
                  <tbody >
                    {listCard.map((item) => (
                    
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.primeiroT}</td>
                      </tr>
                      
                    ))}
                  </tbody>           
                  </div>

                  <div style={{marginLeft:5, width:50}}>
                <thead > 2T </thead>
                  <tbody >
                    {listCard.map((item) => (
                    
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.segundoT}</td>
                      </tr>
                      
                    ))}
                  </tbody>           
                  </div>
                  
                  <div style={{marginLeft:5, width:50}}>
                <thead > 3T </thead>
                  <tbody >
                    {listCard.map((item) => (
                    
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.terceiroT}</td>
                      </tr>
                      
                    ))}
                  </tbody>           
                  </div>

                  <div style={{marginLeft:50, writingMode:'vertical-rl', fontWeight:'bold'}}>Failures</div>
                <div style={{border:'solid 2px orange', verticalAlign:'center', marginRight:5}}></div>

                  <div style={{width:80}}>
                    <thead> Rolos Iguais </thead>
                  <tbody >
                    {listCard.map((item) => (
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.scanDif}</td>
                      </tr>
                    ))}
                  </tbody>
                  </div>

                  <div >
                    <thead> Rolos diferentes </thead>
                  <tbody >
                    {listCard.map((item) => (
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.ScanIgual}</td>
                      </tr>
                    ))}
                  </tbody>
                  </div>

                </table>
                </div>
{/* ---------------------------------------------------------------------------*/}

<div style={{display: 'flex',justifyContent: 'center'}}>

  <tr style={{textSize:18, fontWeight:'bold' ,marginLeft:5, marginTop:35, borderBottom:'none'}}>
  <Col style={{textSize:18, fontWeight:'bold' ,marginLeft:5, marginTop:22, marginBottom:10}}>1T</Col>
  <Col style={{textSize:18, fontWeight:'bold' ,marginLeft:5, marginTop:22}}>2T</Col>
  <Col style={{textSize:18, fontWeight:'bold' ,marginLeft:5, marginTop:22}}>3T</Col>
  </tr>

  
  
  <table class='tablee'>
    <thead >
      <tr>
      </tr>
    </thead>

    <tbody>
    
      <tr class='tdetalhado'>
        {listCard2.map((item) => (
          <>
            <td style={{backgroundColor:'rgb(0, 51, 161)', color:'white', height:10}}>{item.LINE}</td>
          </>
        ))}
      </tr>
    </tbody>

      <tbody>
      <tr>
        {listCard2.map((item) => (
          <>
            <td>{item.primT}</td>
          </>
        ))}
      </tr>
    </tbody>

    <tbody>
      <tr>
        {listCard2.map((item) => (
          <>
            <td>{item.secT}</td>
          </>
        ))}
      </tr>
    </tbody>

    <tbody>
      
      <tr>
        {listCard2.map((item) => (
          <>
          <td>{item.tercT}</td>
          </>
        ))}
      </tr>
    </tbody>

  </table>
</div>

        </>
      );
    }
