import React, { useState, useMemo } from 'react';
import axios from 'axios';
import { useTable, useSortBy } from 'react-table';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Form, Table, Badge, Alert } from 'react-bootstrap';
import { TextField, Button } from '@mui/material';
import Header from '../Layout/MGSPHead/Header';

const DefectTrackingPage = () => {
  const [cn, setCn] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [testTypesCount, setTestTypesCount] = useState(0);
  const [passedCount, setPassedCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [currentStatus, setCurrentStatus] = useState('');

  const fetchData = async () => {
    if (!cn) {
      setError('Por favor, insira um código de produto válido');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=defect&cn=${cn}`);
      setData(response.data);
      
      // Calcular contadores
      calculateCounters(response.data);
      
      // Definir status atual (mais recente)
      if (response.data.length > 0) {
        const latest = response.data[0]; // Assumindo que os dados já estão ordenados por data
        setCurrentStatus(latest.PASS_YN === 'Y' ? 'OK' : 'NG');
      }
    } catch (err) {
      setError('Erro ao buscar dados. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateCounters = (data) => {
    // Contar tipos de testes únicos (baseado em INSP_LOCATION)
    const testTypes = [...new Set(data.map(item => item.INSP_LOCATION))];
    setTestTypesCount(testTypes.length);
    
    // Contar itens aprovados e reprovados
    const passed = data.filter(item => item.PASS_YN === 'Y').length;
    const failed = data.filter(item => item.PASS_YN === 'N').length;
    
    setPassedCount(passed);
    setFailedCount(failed);
  };

  const columns = React.useMemo(() => [
    {
      Header: 'Data',
      accessor: 'INSP_YMD',
      Cell: ({ value }) => {
        if (!value) return '-';
        // Formatar data de YYYYMMDD para DD/MM/YYYY
        const year = value.substring(0, 4);
        const month = value.substring(4, 6);
        const day = value.substring(6, 8);
        return `${day}/${month}/${year}`;
      }
    },
    {
      Header: 'Horário',
      accessor: 'INSP_DT',
      Cell: ({ value }) => {
        if (!value) return '-';
        // Formatar hora de YYYYMMDDHHMMSS para HH:MM:SS
        const hour = value.substring(8, 10);
        const minute = value.substring(10, 12);
        const second = value.substring(12, 14);
        return `${hour}:${minute}:${second}`;
      }
    },
    {
      Header: 'Modelo',
      accessor: 'BASIC_MODEL_CODE',
    },
    {
      Header: 'Linha',
      accessor: 'LINE_NM',
    },
    {
      Header: 'Estação',
      accessor: 'INSP_LOCATION',
    },
    {
      Header: 'Equipamento / Jig',
      accessor: 'INSP_MACHN_NM',
      Cell: ({ value }) => value || '-'
    },
    {
      Header: 'Resultado',
      accessor: 'PASS_YN',
      Cell: ({ value }) => (
        <Badge bg={value === 'Y' ? 'success' : 'danger'} className="fs-6 py-2 px-3">
          {value === 'Y' ? 'OK' : 'NG'}
        </Badge>
      )
    },
    {
      Header: 'Defeito',
      accessor: 'DEFT_NM',
      Cell: ({ value }) => value || '-'
    },
    {
      Header: 'Planta',
      accessor: 'PLANT',
    },
    {
      Header: 'BCR IP',
      accessor: 'BCR_IP',
      Cell: ({ value }) => value || '-'
    },
  ], []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
  } = useTable(
    {
      columns,
      data: data, // Usar todos os dados, não apenas os filtrados
      initialState: { 
        sortBy: [
          {
            id: 'INSP_YMD',
            desc: true
          },
          {
            id: 'INSP_DT',
            desc: true
          }
        ]
      }
    },
    useSortBy
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchData();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // Fazer a pesquisa com o valor atual antes de limpar
      fetchData();
      // Limpar o campo de entrada após a pesquisa
      setCn('');
      // Previne o comportamento padrão do Enter (submit do formulário)
      e.preventDefault();
    }
  };

  return (
    <div>
      <Header />
      <Container fluid className="mt-3" >
        <Row>
          <Col>
            <h2 className="mb-3" style={{textAlign:'center'}}>PBA Test tracking</h2>
          </Col>
        </Row>

        <div className="mb-2" style={{zIndex: 1, position: 'relative'}}>
          <Form onSubmit={handleSubmit}>
            <div className="mb-1">
              <label className="form-label fw-bold" style={{ fontSize: '0.9rem' }}>Pesquisar CN</label>
            </div>
            <div className="d-flex align-items-center">
              <div className="me-2">
                <TextField
                  variant="outlined"
                  placeholder="Digite o código"
                  value={cn}
                  onChange={(e) => setCn(e.target.value)}
                  onKeyDown={handleKeyDown}
                  inputProps={{ maxLength: 20 }}
                  size="small"
                  style={{ width: 250 }}
                />
              </div>
              <Button 
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
                style={{ height: '36px', width: '100px' }}
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </Button>
            </div>
          </Form>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        {data.length > 0 && (
          <>
            <div className="mb-3" style={{position: 'relative', zIndex: 0,marginTop:-50 }}>
              <Row className="g-2">
                <Col xs={6} md={3}>
                  <Card className="text-center shadow-sm h-100">
                    <Card.Body className="py-1 px-1" style={{marginBottom:5}}>
                      <Card.Title className="fs-6 mb-0">Tipos de Testes</Card.Title>
                      <Card.Text className="mb-0 d-flex align-items-center justify-content-center" 
                      style={{ height: '100%', marginTop:-20 }}>
                        <h4 className="text-primary mb-0" style={{ fontSize: '1.3rem' }}>{testTypesCount}</h4>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="text-center shadow-sm h-100">
                    <Card.Body className="py-1 px-1" style={{marginBottom:5}}>
                      <Card.Title className="fs-6 mb-0">Aprovados (OK)</Card.Title>
                      <Card.Text className="mb-0 d-flex align-items-center justify-content-center"
                       style={{ height: '100%', marginTop:-20 }}>
                        <h4 className="text-success mb-0" style={{ fontSize: '1.3rem' }}>{passedCount}</h4>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className="text-center shadow-sm h-100">
                    <Card.Body className="py-1 px-1" style={{marginBottom:5}}>
                      <Card.Title className="fs-6 mb-0">Reprovados (NG)</Card.Title>
                      <Card.Text className="mb-0 d-flex align-items-center justify-content-center"
                       style={{ height: '100%', marginTop:-20 }}>
                        <h4 className="text-danger mb-0" style={{ fontSize: '1.3rem' }}>{failedCount}</h4>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
                <Col xs={6} md={3}>
                  <Card className={`text-center shadow-sm h-100 ${currentStatus === 'OK' ? 'border-success' : currentStatus === 'NG' ? 'border-danger' : ''}`} 
                        style={{ 
                          borderWidth: '2px',
                          backgroundColor: currentStatus === 'OK' ? 'rgba(40, 167, 69, 0.1)' : currentStatus === 'NG' ? 'rgba(220, 53, 69, 0.1)' : 'transparent'
                        }}>
                    <Card.Body className="py-1 px-1" style={{marginBottom:5}}>
                      <Card.Title className="fs-6 mb-0">Status Atual</Card.Title>
                      <Card.Text className="mb-0 d-flex align-items-center justify-content-center" 
                      style={{ height: '100%', marginTop:-20 }}>
                        <h2 className={`mb-0 fw-bold ${currentStatus === 'OK' ? 'text-success' : 'text-danger'}`} 
                            style={{ fontSize: '2rem' }}>
                          {currentStatus || '-'}
                        </h2>
                      </Card.Text>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            <Card className="shadow-sm">
              <Card.Body className="p-2">
                <Card.Title className="mb-2">Histórico de Testes Completo</Card.Title>
                <div className="table-responsive">
                  <Table {...getTableProps()} hover className="table-bordered mb-0">
                    <thead className="table-primary">
                      {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()}>
                          {headerGroup.headers.map(column => (
                            <th 
                              {...column.getHeaderProps(column.getSortByToggleProps())}
                              className="fw-bold py-2 px-2"
                              style={{ fontSize: '0.85rem' }}
                            >
                              {column.render('Header')}
                              <span>
                                {column.isSorted
                                  ? column.isSortedDesc
                                    ? ' 🔽'
                                    : ' 🔼'
                                  : ''}
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
                          <tr 
                            {...row.getRowProps()} 
                            className="table-row-hover"
                          >
                            {row.cells.map(cell => {
                              return (
                                <td 
                                  {...cell.getCellProps()}
                                  className="py-2 px-2"
                                  style={{ fontSize: '0.85rem' }}
                                >
                                  {cell.render('Cell')}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>
              </Card.Body>
            </Card>
          </>
        )}
      </Container>
      
      <style jsx>{`
        .table-row-hover:hover {
          background-color: #f8f9fa !important;
        }
        
        .table-bordered th, 
        .table-bordered td {
          border: 1px solid #dee2e6 !important;
        }
        
        .fs-6 {
          font-size: 0.875rem !important;
        }
        
        h4 {
          font-size: 1.3rem !important;
        }
        
        .card-title {
          font-size: 0.8rem !important;
        }
      `}</style>
    </div>
  );
};

export default DefectTrackingPage;
