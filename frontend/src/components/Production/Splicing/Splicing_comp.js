import { API_URL } from '../../../config/api';
import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Axios from 'axios';
import { Box } from "@mui/system";
import Table from 'react-bootstrap/Table'
import {SplicingExportToExcel} from './Splicing_NoExport'
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';
import Splicing_graph from './Splicing_graph'
import { Card } from "react-bootstrap";

//import tdetalhado from 'C:/Users/f.miguel/boots/src/components/Repair/detalhado.css' // arquivo de estilos CSS
import axios from "axios";

export default function Tabela() {
  const [listCard, setListCard] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));

  const fileName = "Splicing data"; // here enter filename for your excel file

 useEffect(() => {
  const fetchData = async () => {
  try {
    const response = await 
    axios.get(`${API_URL}/SplicingComparison?data=${date}`);
    setListCard(response.data);
  } catch (error) {
    console.error ('Erro ao buscar dados', error);
  }
};
fetchData();
    
const interval = setInterval(() => {
  fetchData();
}, 120000);

// Limpar o intervalo quando o componente é desmontado
return () => clearInterval(interval);
}, [date]);  

const handleSubmit = (event) => {
  event.preventDefault();
}

  // setTimeout(function() {
  //   window.location.reload(1);
  // }, 120000); // 2 minutos

  const data = React.useMemo(() => listCard, [listCard]);
  const columns = React.useMemo(() => [
    { Header: 'Data', accessor: 'data' },
    { Header: 'Linha', accessor: 'Linha' },
    { Header: 'Turno', accessor: 'turno' },
    { Header: 'Operador', accessor: 'OPERATOR_NAME' },
    { Header: 'Rolo atual', accessor: 'COMPARISON_ID' },
    { Header: 'Rolo Splicing', accessor: 'PAC_PART_NO' },
    { Header: 'Status', accessor: 'Status' },
    
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
      <h2 className='h2' style={{ marginTop: 10, marginBottom: 20, fontSize: '30px' }}>
        Histórico de Splicing por operador
      </h2>

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
    <th style={{fontSize:'15px', backgroundColor:'white', width:'14%'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'14%'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'14%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'14%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'14%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'14%'}}> </th>
    <th style={{fontSize:'15px', backgroundColor:'white', width:'14%'}}> </th>
    
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
              const meta = value >= 80;
              const abaixo = value < 40;
              const entre = value >=21 && value <= 79;
              const isNbinary = value === 'Not Update';
              

              const style = {
                // Base style for all cells
                fontSize: '15px',
                // Conditional styles for 'Pendente' and 'OK'
                ...(meta && { color: 'blue', fontWeight: 'bold'}),
                ...(abaixo && { color: 'red', fontWeight: 'bold' }),
                ...(entre && { color: 'orange', fontWeight: 'bold' }),
                ...(isNbinary && { color: 'red', fontWeight: 'bold' }),
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
