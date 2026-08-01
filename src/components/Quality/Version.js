import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Axios from 'axios';
import { Box } from "@mui/system";
import Table from 'react-bootstrap/Table'
import {ExportToExcel} from '../Excel/Excel_Export'
import Header from "../Layout/MGSPHead/Header";

//import tdetalhado from 'C:/Users/f.miguel/boots/src/components/Repair/detalhado.css' // arquivo de estilos CSS

export default function Tabela() {
  const [listCard, setListCard] = useState([]);

  const fileName = "Version Data"; // here enter filename for your excel file

  useEffect(() => {
    Axios.get('http://105.103.112.18:8080/getVersion')
      .then(response => {
        setListCard(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar dados no Reparo Inventario:', error);
      });
  }, []);

  setTimeout(function() {
    window.location.reload(1);
  }, 60000); // 1 minuto

  const data = React.useMemo(() => listCard, [listCard]);
  const columns = React.useMemo(() => [
    { Header: 'Linha', accessor: 'LINE_NM' },
    { Header: 'Modelo', accessor: 'BASIC_MODEL_CODE' },
    { Header: 'Status SMD-Binary', accessor: 'SMD_BINARY_STATUS' },
    { Header: 'Versão PDA', accessor: 'PDA_VER' },
    // { Header: 'Versão CSC', accessor: 'CSC_VER' },
    { Header: 'Versão do FT', accessor: 'SW_VER_LINE' },
    { Header: 'Status', accessor: 'Status PDA' },
    // { Header: 'Versão CSC', accessor: 'Status CSC' },
    
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
    <Header/>
<div class='justify-content-center'>

    <Box>
      <h2 className='h2' style={{ marginTop: 10, marginBottom: 20, fontSize: '30px' }}>
        SW Version Monitoring
      </h2>

      <input
        value={globalFilter || ''}
        onChange={(e) => setGlobalFilter(e.target.value)}
        placeholder="Buscar..."
        style={{marginLeft:20, marginBottom:-20, width:200, height:30, backgroundColor: 'white',
        backgroundPosition: '10px 10px', borderRadius:5, fontSize:'15px',
        backgroundRepeat: 'no-repeat',
        paddingLeft: '40px', transition: 'width 0.4s ease-in-out', focus:'width:100%'}}
      />

        <ExportToExcel apiData={listCard} fileName={fileName}/>     
<div style={{overflowX:'auto', whiteSpace:'nowrap'}}>
  
      <table style={{marginTop:-10}} {...getTableProps()} className='table-container'>
        <thead class='tdetalhado' >

        <tr style={{height:5, textAlign:'center', borderBottom:'solid', backgroundColor:'white'}}>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}> </th>
    <th style={{width:150, fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    
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
              const isUpdate = value === 'Atualizado';
              const isnotUp = value === 'Desatualizado';
              const isbinary = value === 'Complete';
              const isNbinary = value === 'Not Update';
              

              const style = {
                // Base style for all cells
                fontSize: '15px',
                // Conditional styles for 'Pendente' and 'OK'
                ...(isUpdate && { color: 'Blue', fontWeight: 'bold'}),
                ...(isnotUp && { color: 'red', fontWeight: 'bold' }),
                ...(isbinary && { color: 'Blue', fontWeight: 'bold' }),
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

    // Restante do código permanece o mesmo
