import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Axios from 'axios';
import { Box } from "@mui/system";
import Table from 'react-bootstrap/Table'
import NavbarComp from '../Layout/NavbarComp'
import {ExportToExcel} from '../Excel/Excel_Export'

//import tdetalhado from 'C:/Users/f.miguel/boots/src/components/Repair/detalhado.css' // arquivo de estilos CSS

export default function Tabela() {
  const [listCard, setListCard] = useState([]);

  const fileName = "Version Data"; // here enter filename for your excel file

  useEffect(() => {
    Axios.get('http://105.103.39.102:8080/getPlantHistory')
      .then(response => {
        setListCard(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar dados no Reparo Inventario:', error);
      });
  }, []);

  // setTimeout(function() {
  //   window.location.reload(1);
  // }, 60000); // 1 minuto

  const data = React.useMemo(() => listCard, [listCard]);
  const columns = React.useMemo(() => [
    { Header: 'Data', accessor: 'Data' },
    { Header: 'Linha', accessor: 'LINE_NM' },
    { Header: 'Modelo', accessor: 'MODEL_CODE' },
    { Header: 'CN', accessor: 'CN' },
    { Header: 'Planta P-AOI', accessor: 'PLANT_CODE_PAOI' },
    { Header: 'Planta Correta', accessor: 'PLANT_CODE_MASTER' },
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
<div class='justify-content-center'>

    <Box>
      <h2 className='h2' style={{ marginTop: 10, marginBottom: 20, fontSize: '30px' }}>
        Wrong Plant Monitoring
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
              const Wrong = value === 'Wrong Plant';

              

              const style = {
                // Base style for all cells
                fontSize: '15px',
                // Conditional styles for 'Pendente' and 'OK'
                ...(Wrong && { color: 'red', fontWeight: 'bold'}),
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
