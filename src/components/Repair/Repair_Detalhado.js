import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import Axios from 'axios';
import { Box, width } from "@mui/system";
import Table from 'react-bootstrap/Table'
import { Modal, Button } from 'react-bootstrap'
import './repairDetalhado.css' // arquivo de estilos CSS
import ReparoModal from "./Modal_reparo";


export default function Tabela() {
        const [listCard, setListCard] = useState([]);
        const [showModal, setShowModal] = useState(false);
        const [modalData, setModalData] = useState(null);
        const [loading, setLoading] = useState(true);
        
        const handleCNClick = (cnProcess, cnAuxiliar) => {
          console.log("clicked CN Process:", cnProcess);
          console.log("clicked CN Auxiliar:", cnAuxiliar);
          
          // Mostrar o modal imediatamente para melhor experiência do usuário
          setShowModal(true);
          
          // Fetch both process and auxiliary data in parallel for better performance
          Promise.all([
            Axios.get(`http://105.103.39.102:8080/getModalReparoDetalhado?cnProcess=${cnProcess}`)
              .catch(error => {
                console.error('Error fetching process data:', error);
                return { data: [] };
              }),
            Axios.get(`http://105.103.39.102:8080/getModalAuxiliarDetalhado?cnAuxiliar=${cnAuxiliar}`)
              .catch(error => {
                console.error('Error fetching auxiliary data:', error);
                return { data: [] };
              })
          ])
          .then(([processResponse, auxiliarResponse]) => {
            setModalData({
              process: processResponse.data,
              auxiliar: auxiliarResponse.data
            });
            console.log("Process Data:", processResponse.data);
            console.log("Auxiliary Data:", auxiliarResponse.data);
          })
          .catch(error => {
            console.error('Error fetching modal data:', error);
            setModalData({ process: [], auxiliar: [] });
          });
       };
       

        useEffect(() => {
          setLoading(true);
          Axios.get('http://105.103.39.102:8080/getReparoDetalhado')
            .then(response => {
              setListCard(response.data);
              setLoading(false);
            })
            .catch(error => {
              console.error('Erro ao buscar dados no Reparo Inventario:', error);
              setLoading(false);
            });
        }, []);

       
  const data = React.useMemo(() => listCard, [listCard]);
  const columns = React.useMemo(() => [
    { Header: 'Status da placa', accessor: 'Status_reparo' },
    { Header: 'Data', accessor: 'Data' },
    { Header: 'CN', accessor: 'CN_rep' },
    { Header: 'Halb', accessor: 'Halb' },
    { Header: 'Modelo', accessor: 'Modelo' },
    { Header: 'Linha', accessor: 'Linha' },
    { Header: 'Fase', accessor: 'Fase' },
    { Header: 'Turno', accessor: 'Turno' },
    { Header: 'Responsavel', accessor: 'Responsavel' },
    { Header: 'Recebimento', accessor: 'Recebimento' },
    { Header: 'Entrada', accessor: 'Processo' },
    { Header: 'Origem SMD', accessor: 'Origem_SMD' },
    { Header: 'Data Feedback', accessor: 'Data_Feedback' },
    { Header: 'Origem Main Line', accessor: 'Origem_Main' },
    { Header: 'Defeito', accessor: 'Causa' },
    { Header: 'Sintoma', accessor: 'Sintoma' },
    { Header: 'Observação', accessor: 'Detalhe' },
    { Header: 'Location', accessor: 'Location_Ent'},
// -------------------------------------------------------------------
    { Header: 'Data Reparo', accessor: 'DataP' },
    { Header: 'Cargo', accessor: 'Tipo' },
    { Header: 'Responsável', accessor: 'Tecnico' },
    { Header: 'Bancada', accessor: 'Bancada' },
    { Header: 'Location', accessor: 'Location' },
    { Header: 'Detalhes Reparo', accessor: 'Detalhes' },
    { Header: 'Defeito Reparo', accessor: 'Defeito' },
    { Header: 'Status Reparo', accessor: 'Status' },
// -------------------------------------------------------------------     
{ Header: 'Data', accessor: 'DataS' },
    { Header: 'Saída', accessor: 'Saida' },
    { Header: 'Processo Saída', accessor: 'Saida_Processo' },
    { Header: 'Linha Saída', accessor: 'Linha_saida' },
    { Header: 'Responsável Saída', accessor: 'Resp_saida' },
    { Header: 'Recebedor Saída', accessor: 'Receb_saida' },
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
{showModal && (
  <ReparoModal 
  show ={ showModal }
  handleClose={ () => setShowModal(false)}
  modalData = {modalData}
  />
)}

<div class='justify-content-center'>

    <Box>
      <h2 className='h2' style={{ marginTop: 10, marginBottom: 20, fontSize: '30px' }}>
        Movimentação de Placas - Detalhado
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

{loading ? (
        <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
          <div>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <div className="mt-2">Carregando dados da tabela...</div>
          </div>
        </div>
      ) : (
        <div style={{overflowX:'auto', whiteSpace:'nowrap'}}>
          <table style={{marginTop:-10}} {...getTableProps()} className='repair-detalhado-container'>
            <thead className='tdetalhado' >
              <tr style={{height:5, textAlign:'center', borderBottom:'solid', backgroundColor:'white'}}>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}> </th>
                <th style={{width:150, fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'25px', backgroundColor:'white', color:'black', borderColor:'white'}}>Entrada de PCB's</th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{borderRight:'solid 2px',fontSize:'15px', backgroundColor:'white', borderColor:'black'}}></th>
                {/* ------------------------------------------------------------------------------------------------------------ */}
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'25px', backgroundColor:'white', color:'black', borderColor:'white'}}>Análise de Reparo</th>
                <th style={{fontSize:'25px', backgroundColor:'white', color:'black', borderColor:'white'}}> - Técnico</th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                {/* ------------------------------------------------------------------------------------------------------------ */}
                <th style={{borderRight:'solid 2px',fontSize:'15px', backgroundColor:'white', borderColor:'black'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{fontSize:'25px', backgroundColor:'white', color:'black', borderColor:'white'}}>Saida de PCB's</th>
                <th style={{fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
                <th style={{borderRight:'solid 2px', fontSize:'15px', backgroundColor:'white', borderColor:'white'}}></th>
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
                      const isPending = value === 'Pendente';
                      const isOK = value === 'OK';
                      const isReceb = value === 'Reparo';
                      const isBanc1 = value === 'Bancada SMD-06';
                      const isBanc2 = value === 'Bancada SMD-08';
                      const isBanc3 = value === 'Bancada SMD-10';
                      const isBanc4 = value === 'Bancada SMD-19';
                      const isOff = value === 'Offline';
                      const isCNColumn = index === 2;
                      const isClickable = isCNColumn;

                      const style = {
                        // Base style for all cells
                        fontSize: '15px',
                        // Conditional styles for 'Pendente' and 'OK'
                        ...(isPending && { color: 'red', fontWeight: 'bold'}),
                        ...(isOK && { color: 'green', fontWeight: 'bold' }),
                        ...(isReceb && { color: 'black', fontWeight: 'bold' }),
                        ...(isBanc1 && { color: 'Blue', fontWeight: 'bold' }),
                        ...(isBanc2 && { color: 'Blue', fontWeight: 'bold' }),
                        ...(isBanc3 && { color: 'Blue', fontWeight: 'bold' }),
                        ...(isBanc4 && { color: 'Blue', fontWeight: 'bold' }),
                        ...(isOff && { color: 'green', fontWeight: 'bold' })
                      };

                      return (
                        <td {...cell.getCellProps()} style={style}>
                          {isClickable ? (
                            <>
                              <button onClick={() => handleCNClick(row.original.CN_rep, row.original.CN_auxiliar
                              )}
                               className='repair-detalhado-modalButton'
                              type='button'>
                                {cell.render('Cell')}
                              </button>
                              <button onClick={() => (row.original)}>
                                {/* Render button for Auxiliar here */}
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
      )}

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
