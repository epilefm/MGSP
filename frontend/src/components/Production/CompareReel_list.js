import { API_URL } from '../../config/api';
import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Axios from 'axios';
import { Box, fontSize, width } from "@mui/system";
import Table from 'react-bootstrap/Table'
import { Modal, Button } from 'react-bootstrap'
//import tdetalhado from 'C:/Users/f.miguel/boots/src/components/Repair/detalhado.css' // arquivo de estilos CSS
import OffSplicing_Modal from "./Splicing/OffSplicing_Modal";
import { ExportToExcel } from "../Excel/Excel_Export";


export default function Tabela() {
        const [listCard, setListCard] = useState([]);
        const [showModal, setShowModal] = useState(false);
        const [modalData, setModalData] = useState(null);
        
        const handleCNClick = (Barcode) => {
          console.log("clicked Barcode:", Barcode);
          // Fetch process data
          Axios.get(`${API_URL}/getModalOffSplicing?Barcode=${Barcode}`)
             .then(response => {
              setModalData({ process: response.data});
              setShowModal(true)
                // Handle the process data (response.data)
                console.log("Process Data:", response.data);
             })
             .catch(error => {
                console.error('Error fetching process data:', error);
              }); 
       };
       

        useEffect(() => {
          Axios.get(`${API_URL}/getSplicingOffline`)
            .then(response => {
              setListCard(response.data);
            })
            .catch(error => {
              console.error('Erro ao buscar dados no Reparo Inventario:', error);
            });
        }, []);

       
  const data = React.useMemo(() => listCard, [listCard]);
  const columns = React.useMemo(() => [
    { Header: 'Data', accessor: 'Data' },
    { Header: 'Operador', accessor: 'operador' },
    { Header: 'Modelo', accessor: 'Modelo' },
    { Header: 'Linha', accessor: 'Linha' },
    { Header: 'Reel ID', accessor: 'Reel_ID' },
    { Header: 'Part Number', accessor: 'Codigo' },
    { Header: 'Qty', accessor: 'Qty' },
    { Header: 'Barcode', accessor: 'Barcode' },
    { Header: 'Status Barcode', accessor: 'Status_barcode' },
    { Header: 'Status Part Number', accessor: 'Status_codigo' },
    { Header: 'Splicing', accessor: 'Qty_Splicing' },
   
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

  const fileName = "Inventário - Reparo"; // here enter filename for your excel file

  return (
    <>
{showModal && (
  <OffSplicing_Modal 
  show ={ showModal }
  handleClose={ () => setShowModal(false)}
  modalData = {modalData}
  />
)}

<div class='justify-content-center'>
    <Box>
      <h2 className='h2' style={{ marginTop: 10, marginBottom: 20, fontSize: '30px' }}>
        Splicing Offline
      </h2>

<div style={{marginBottom:-40}}>
<ExportToExcel apiData={listCard} fileName={fileName}/>
</div>

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
  
      <table style={{marginTop:-10}} {...getTableProps()} className='table-container'>
        <thead class='tdetalhado' >

        <tr style={{height:5, textAlign:'center', borderBottom:'solid', backgroundColor:'white'}}>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}> </th>
    <th style={{width:150, fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'15px', backgroundColor:'white'}}></th>
    <th style={{fontSize:'25px', backgroundColor:'white', color:'black'}}></th>
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
            {row.cells.map((cell, index) => {
              const value = cell.value;
              const ok = value === 'Correto';
              const ng = value === 'Incorreto';
              const isBarcodeColumn = index === 7;
              const isClickable = isBarcodeColumn;

              const style = {
                // Base style for all cells
                fontSize: '15px',
                // Conditional styles for 'Pendente' and 'OK'
                ...(ok && { color: 'green', fontWeight: 'bold'}),
                ...(ng && { color: 'red', fontWeight: 'bold' }),
         
              };

              return (
                <td {...cell.getCellProps()} style={style}>
                {isClickable ? (
                  <>
                    <button onClick={() => handleCNClick(row.original.Barcode
                    )}
                     className='modalButtonOffSplicing'
                    type='button'>
                      {cell.render('Cell')}
                    </button>
                    
                  </>
                ) : (
                  cell.render('Cell')
                )}
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

