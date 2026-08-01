import { API_URL } from '../../../config/api';
import React, { useState, useEffect } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Axios from 'axios';
import { Box } from "@mui/system";
import Table from 'react-bootstrap/Table'
import { SplicingExportToExcel } from './Splicing_NoExport'
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Splicing_graph from './Splicing_graph'
import { Card } from "react-bootstrap";
import Splicing_DefectCard from './Audit_History'

//import tdetalhado from 'C:/Users/f.miguel/boots/src/components/Repair/detalhado.css' // arquivo de estilos CSS
//import pulseClass from 'C:/Users/f.miguel/boots/src/components/Repair/detalhado.css' // arquivo de estilos CSS
import axios from "axios";

export default function Tabela() {
  const [listCard, setListCard] = useState([]);
  const [listCard2, setListCard2] = useState([]);
  const [listCard3, setListCard3] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  // const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  // const fileName = "Splicing data"; // here enter filename for your excel file
  // // Remove 3 horas da data atual
  // const horacorreta = new Date(new Date().setHours(new Date().getHours() - 3)).toISOString().slice(0, 10);

  // //-----listcard
  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       const response1 = await axios.get(`${API_URL}/splicingDefect?data=${horacorreta}`);
  //       setListCard(response1.data);

  const fileName = "Splicing data" // here enter filename for your excel file

  //-----listcard
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response1 = await axios.get(`${API_URL}/splicingDefect?data=${date}`);
        setListCard(response1.data);
        
        const response2 = await axios.get(`${API_URL}/splicingDefectQTY?data=${date}`);
        setListCard2(response2.data);
        
        const response3 = await axios.get(`${API_URL}/SplicingDefectLineQTY?data=${date}`);
        setListCard3(response3.data);
      } catch (error) {
        console.error('Erro ao buscar dados', error);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      fetchData();
    }, 120000);

    // Limpar o intervalo quando o componente é montado
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
<div >
    <Box style={{width:'100%', justifyContent: 'center'}} > 
      <h2 className='h2' style={{marginTop: 10, marginBottom: -30, marginLeft: 500, fontSize: '30px' }}>
Erros de Splicing
      </h2> 

<div>
  <table class='tablee' style={{display:'flex', flexWrap:'wrap'}} value={date} onChange={(e) => setDate(e.target.value)}>

                <div style={{writingMode:'vertical-rl', fontWeight:'bold'}}>Shift</div>
                <div style={{border:'solid 2px orange', verticalAlign:'center', marginRight:5}}></div>
                                       
                <div style={{marginLeft:5, width:50}}>
                <thead > 1T </thead>
                  <tbody>
                    {listCard2.map((item) => (
                    
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.primeiroT}</td>
                      </tr>
                      
                    ))}
                  </tbody>           
                  </div>

                  <div style={{marginLeft:5, width:50}}>
                <thead > 2T </thead>
                  <tbody >
                    {listCard2.map((item) => (
                    
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.segundoT}</td>
                      </tr>
                      
                    ))}
                  </tbody>           
                  </div>
                  
                  <div style={{marginLeft:5, width:50}}>
                <thead > 3T </thead>
                  <tbody >
                    {listCard2.map((item) => (
                    
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.terceiroT}</td>
                      </tr>
                      
                    ))}
                  </tbody>           
                  </div>

                  <div style={{marginLeft:50, writingMode:'vertical-rl', fontWeight:'bold'}}>Failures</div>
                <div style={{border:'solid 2px orange', verticalAlign:'center', marginRight:5}}></div>

                  <div style={{width:120, marginRight:-20}}>
                    <thead> Equal Reels</thead>
                  <tbody >
                    {listCard2.map((item) => (
                      <tr>
                        <td style={{ fontSize: 20 }}>{item.scanDif}</td>
                      </tr>
                    ))}
                  </tbody>
                  </div>

                  <div style={{marginLeft:20}}>
                    <thead> Different Reels </thead>
                  <tbody >
                    {listCard2.map((item) => (
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
  
  <table class='tablee' value={date} onChange={(e) => setDate(e.target.value)}>
    <thead >
      <tr>
      </tr>
    </thead>

    <tbody value={date} onChange={(e) => setDate(e.target.value)}>
    
      <tr class='tdetalhado' value={date} onChange={(e) => setDate(e.target.value)}>
        {listCard3.map((item) => (
          <>
            <td style={{backgroundColor:'rgb(0, 51, 161)', color:'white', height:10}}>{item.LINE}</td>
          </>
        ))}
      </tr>
    </tbody>

      <tbody>
      <tr>
        {listCard3.map((item) => (
          <>
            <td>{item.primT}</td>
          </>
        ))}
      </tr>
    </tbody>

    <tbody>
      <tr>
        {listCard3.map((item) => (
          <>
            <td>{item.secT}</td>
          </>
        ))}
      </tr>
    </tbody>

    <tbody>
      
      <tr>
        {listCard3.map((item) => (
          <>
          <td>{item.tercT}</td>
          </>
        ))}
      </tr>
    </tbody>

  </table>
</div>


{/* //------------------------------------------------------------------------------------------------------------------------------------------------------------------------// */}

<div class='d-lg-flex row-cols-12'>
<div> 
      <form onSubmit={handleSubmit} style={{marginLeft:100,
    border:'none'}} >
  <label style={{fontSize:'15px'}}> 
    <input style={{marginTop:2, border:'none', boxSizing:'border-box',
  borderBottom: '2px solid black'}} type="date" value={date} onChange={(e) => setDate(e.target.value)}/>
  </label>
</form>
</div>
<div>
      <input
        value={globalFilter || ''}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Buscar..."
        style={{marginLeft:20, marginBottom:-20, width:200, height:30, backgroundColor: 'white',
        backgroundPosition: '10px 10px', borderRadius:5, fontSize:'15px',
        backgroundRepeat: 'no-repeat',
        paddingLeft: '40px', transition: 'width 0.4s ease-in-out', focus:'width:100%'}}
      />
</div>
</div>
<div style={{marginRight:20}}>
        <SplicingExportToExcel apiData={listCard} fileName={fileName}  />     
</div>

<div style={{overflowX:'auto', whiteSpace:'nowrap'}}>
  
      <table style={{marginTop:-10}} {...getTableProps()} className='table-container'>
        <thead class='tdetalhado' >

        <tr style={{height:5, textAlign:'center', borderBottom:'solid', backgroundColor:'white'}}>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'10%'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'10%'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'10%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'10%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'10%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'10%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'15%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'15%'}}> </th>
    
  </tr>


          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps(column.getSortByToggleProps())}>
                  {column.render('Header')}
                  <span>
                    {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                  </span>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        
        <tbody {...getTableBodyProps()}>
      {rows.map(row => {
        prepareRow(row);
        return (
          <tr {...row.getRowProps()}>
            {row.cells.map(cell => {
              const value = cell.value;
              const erro = value === 'Scan em rolos diferentes';
            //  const pulseClass = erro ? 'pulse' : '';
              

              const style = {
                // Base style for all cells
                fontSize: '15px',
                // Conditional styles for 'Pendente' and 'OK'
                ...(erro && {backgroundColor:'red', fontWeight: 'bold'}),
              };

              return (
                <td {...cell.getCellProps()} style={style}>
                  {cell.render('Cell')}
                </td>
              );
            })}
          </tr>
        );
      })}
    </tbody>
      </table>
      </div>



          </Box>   

          </div>    
        </>
      );
    }
