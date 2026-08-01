import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Axios from 'axios';
import { Box } from "@mui/system";
import Table from 'react-bootstrap/Table'
import NavbarComp from '../Layout/NavbarComp'

//import tdetalhado from 'C:/Users/f.miguel/boots/src/components/Repair/detalhado.css' // arquivo de estilos CSS

export default function Tabela() {
  const [listCard, setListCard] = useState([]);

  useEffect(() => {
    Axios.get('http://105.103.39.102:8080/get2DMapping')
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
    { Header: 'Date', accessor: 'Date' },
    { Header: 'Line', accessor: 'LINE_NM' },
    { Header: 'Basic Model', accessor: 'BASIC_MODEL_CODE' },
    { Header: 'Board Type', accessor: 'PROD_BOARD_TYPE' },
    { Header: 'PAOI BOT', accessor: 'PAOI_IN_BOT' },
    { Header: 'PAOI TOP', accessor: 'PAOI_IN_TOP' },
    { Header: 'MAOI BOT', accessor: 'MAOI_IN_BOT' },
    { Header: 'MAOI TOM', accessor: 'MAOI_IN_TOP' },
    { Header: 'SAOI BOT', accessor: 'SAOI_IN_BOT' },
    { Header: 'SAOI TOP', accessor: 'SAOI_IN_TOP' },
    { Header: 'FT', accessor: 'FT_IN' },
    { Header: 'Result', accessor: 'FINAL_IN' },    
  ], []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    page,
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
    <NavbarComp/>
<div class='justify-content-center'>

    <Box>
      <h2 className='h2' style={{ marginTop: 10, marginBottom: 20, fontSize: '30px' }}>
        2D Mapping Summary
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

<div style={{overflowX:'auto', whiteSpace:'nowrap'}}>
  
      <table style={{marginTop:-10, textAlign:'center'}} {...getTableProps()} className='table-container'>
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
      {page.map(row => {
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

<div style={{marginTop:20}}>
      <div class="pagination" >
        <button style={{marginLeft:5, borderRadius:5, width:40, height:40}} onClick={() => gotoPage(0)} disabled={!canPreviousPage}>
          {'<<'}
        </button>{' '}
        <button style={{marginLeft:5, borderRadius:5, width:40, height:40}} onClick={() => previousPage()} disabled={!canPreviousPage}>
          {'<'}
        </button>{' '}
        <button style={{marginLeft:5, borderRadius:5, width:40, height:40}} onClick={() => nextPage()} disabled={!canNextPage}>
          {'>'}
        </button>{' '}
        <button style={{marginLeft:5, borderRadius:5, width:40, height:40}} onClick={() => gotoPage(pageCount - 1)} disabled={!canNextPage}>
          {'>>'}
        </button>{' '}
        <span style={{marginLeft:30, borderRadius:5, width:150, height:40, fontSize:'18px', marginTop:8}}>
          Página{' '}
          <strong>
            {pageIndex + 1} de {pageOptions.length}
          </strong>{' '}
        </span>
        <span style={{marginRight:20, borderRadius:5, width:200, height:40, fontSize:'18px', marginTop:5}}>
          | Ir para página:{' '}
              <input
                type="number"
                defaultValue={pageIndex + 1}
                onChange={e => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  gotoPage(page);
                }}
                style={{ width: '50px' }}
              />
            </span>{' '}

            <div style={{marginRight:30}}>
            <select style={{borderRadius:5, width:250, height:40, fontSize:'15px'}}
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
              }}
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  Mostrar {pageSize}
                </option>
              ))}
            </select>
            </div>

          </div>   
          </div>

          </Box>   

          </div>    
        </>
      );
    }

    // Restante do código permanece o mesmo
