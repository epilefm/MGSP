import { API_URL } from '../../../config/api';
import React, { useEffect, useState } from "react";
import { useTable, useSortBy, usePagination, useGlobalFilter } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';
import { SplicingExportToExcel } from './Splicing_NoExport';
import Splicing_graph from './Splicing_graph';
import './Splicing.css'; // Importando o CSS específico
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { Typography } from '@mui/material';
import Header from "../../Layout/MGSPHead/Header";

export default function Tabela() {
  const [listCard, setListCard] = useState([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [turno, setTurno] = useState('todos');

  const fileName = "Splicing_data_" + date;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${API_URL}/splicing?data=${date}`);
        setListCard(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados', error);
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

  const data = React.useMemo(() => listCard, [listCard]);
  const columns = React.useMemo(() => [
    { Header: 'Data', accessor: 'data' },
    { Header: 'Linha', accessor: 'Linha' },
    { Header: '1T', accessor: '1T' },
    { Header: '2T', accessor: '2T' },
    { Header: '3T', accessor: '3T' },
  ], []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    prepareRow,
    rows,
    state: { globalFilter },
    setGlobalFilter,
  } = useTable(
    { columns, data },
    useGlobalFilter,
    useSortBy
  );

  // Função para determinar a classe CSS condicional
  const getValueClass = (value) => {
    if (value === 'Not Update' || value === null || value === undefined) return 'splicing-value-not-update';
    if (value >= 80) return 'splicing-value-excellent';
    if (value < 40) return 'splicing-value-critical';
    if (value >= 21 && value <= 79) return 'splicing-value-warning';
    return '';
  };

  // Função para formatar valores
  const formatValue = (value) => {
    if (value === 'Not Update' || value === null || value === undefined) return 'N/A';
    return value;
  };

    function handleClick(event) {
    console.info('You clicked a breadcrumb.');
}

  return (
    <>
    <Header/>
    <div className="splicing-container">
      {/* Cabeçalho e Filtros Unificados */}
      <div className="splicing-header-filters">
        <div className="splicing-header-content">
          <h1 className="splicing-title">Monitoramento de Splicing</h1>
          {/* <p className="splicing-subtitle">Acompanhamento em tempo real do desempenho de splicing por linha e turno</p> */}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div className="splicing-breadcrumb">
            <Breadcrumbs aria-label="breadcrumb" style={{ backgroundColor: 'transparent' }}>
              <Typography sx={{ 
                color: 'white', 
                fontWeight: 600, 
                fontSize: '14px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)'
              }}>
                Splicing - Geral
              </Typography>
              <Link 
                underline="hover" 
                href="/splicing_ops" 
                onClick={handleClick}
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.9)', 
                  fontWeight: 600, 
                  fontSize: '14px', 
                  textDecoration: 'none',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                Splicing - Operador
              </Link>
            </Breadcrumbs>
          </div>

          <div className="splicing-filters">
            <form onSubmit={handleSubmit} className="splicing-date-form">
              <label className="splicing-date-label">
                Selecionar Data:
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="splicing-date-input"
                />
              </label>
            </form>

            <form className="splicing-turno-form">
              <label className="splicing-turno-label">
                Selecionar Turno:
                <select
                  value={turno}
                  onChange={(e) => setTurno(e.target.value)}
                  className="splicing-turno-select"
                >
                  <option value="todos">Todos</option>
                  <option value="1T">1º Turno</option>
                  <option value="2T">2º Turno</option>
                  <option value="3T">3º Turno</option>
                </select>
              </label>
            </form>

            <div className="splicing-export-container">
              <SplicingExportToExcel apiData={listCard} fileName={fileName} className="splicing-export-btn" />
            </div>
          </div>
        </div>
      </div>

      {/* Gráfico e Indicadores */}
      <div className="splicing-graph-section">
        <Splicing_graph type="date" value={date} turno={turno} />
      </div>

      {/* Controles superiores */}
      <div className="splicing-controls">
        <div className="splicing-search-container">
          <input
            value={globalFilter || ''}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Buscar linhas..."
            className="splicing-search-input"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="splicing-table-container">
        <div style={{ overflowX: 'auto' }}>
          <table {...getTableProps()} className="splicing-table-wrapper">
            <thead className="splicing-table-header">
              {headerGroups.map(headerGroup => (
                <tr {...headerGroup.getHeaderGroupProps()}>
                  {headerGroup.headers.map(column => (
                    <th
                      {...column.getHeaderProps(column.getSortByToggleProps())}
                      className={column.canSort ? "splicing-table-th splicing-table-th-sortable" : "splicing-table-th"}
                    >
                      {column.render('Header')}
                      <span className="splicing-sort-indicator">
                        {column.isSorted ? (column.isSortedDesc ? ' 🔽' : ' 🔼') : ''}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...getTableBodyProps()} className="splicing-table-tbody">
              {rows.map(row => {
                prepareRow(row);
                return (
                  <tr {...row.getRowProps()}>
                    {row.cells.map(cell => (
                      <td {...cell.getCellProps()} className={`splicing-table-td ${getValueClass(cell.value)}`}>
                        {formatValue(cell.value)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
</>
  );
}
