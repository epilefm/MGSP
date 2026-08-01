import * as React from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import { Box } from '@mui/material';
import { Row, Col } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import styles from '../../styles.css'
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';

// Dados dos departamentos e seus itens
const departments = [
  {
    id: 'material',
    name: 'Material',
    image: '/images/film reel.png',
    description: '',
    items: [
      { name: 'Análise de Material', href: 'Material_Analysis' },
      { name: 'Dashboards', href: 'Charts' },
      { name: 'Lavagem de Componentes', href: 'LavEnt' },
      { name: 'Registro de Entrada', href: 'InputScreenEntrada' },
      { name: 'Registro de Saída', href: 'InputScreenSaida' },
      { name: 'Registro de Devolução', href: 'InputScreenDevolucao' },
      { name: 'Registro de Descarte', href: 'InputScreenDescarte' },
      { name: 'Registro de Inventário', href: 'Inventario' }
    ]
  },
  {
    id: 'quality',
    name: 'Qualidade / Reparo',
    image: '/images/checklist.png',
    description: '',
    items: [
      { name: 'Bloqueio de Materiais', href: 'Bloq_Mat' },
      { name: 'Controle ESD', href: 'ESD' },
      { name: 'Monitoramento de Versão', href: 'Version' },
      { name: 'Mapeamento 2D', href: 'Mapping' },
      { name: 'Controle MSL', href: 'Baking' },
      { name: 'Monitoramento de Planta', href: 'PlantScreen' },
      { name: 'Gestão de Materiais', href: 'SubScreen' },
      { name: 'Reparo - Entrada', href: 'RepairScreen' },
      { name: 'Reparo - Processo', href: 'RepairProcess' },
      { name: 'Reparo - Saída', href: 'RepairSaida' },
      { name: 'Reparo - Análise', href: 'RepairAnalysis' },
      { name: 'Estoque de Componentes', href: 'Estoque_comp' },
      { name: 'Offline - Saída', href: 'OfflineSaida' },
      { name: 'Controle POP', href: 'POPControl' }
    ]
  },
  {
    id: 'production',
    name: 'Produção',
    image: '/images/statistic.png',
    description: '',
    items: [
      { name: 'Produção Mounter', href: 'HoraHora' },
      { name: 'Hora Resultado', href: 'HoraPlanResult' },
      { name: '50 Piores Indicadores', href: 'WorstDrop50' },
      { name: 'Plano de Produção', href: 'prod' },
      { name: 'Scrap - Entrada', href: 'Scrap_entrada' },
      { name: 'Scrap - Recebimento', href: 'Scrap_Receb' },
      { name: 'Scrap - Reposição', href: 'Scrap_reposicao' },
      { name: 'Scrap - Saída', href: 'Scrap_saida' },
      { name: 'Scrap - Análise', href: 'ScrapInv' },
      { name: 'Monitoramento Splicing', href: 'SplicingScreen' },
      { name: 'Duplo Check CN', href: 'SlipScreen' },
      { name: 'Mapa', href: 'Mapa' },
      { name: 'Pagamento', href: 'Pgto' },
      { name: 'Virtual T/O', href: 'Virtual_Label' }
    ]
  },
  {
    id: 'maintenance',
    name: 'Manutenção',
    image: '/images/maintenance.png',
    description: '',
    items: [
      { name: 'Monitoramento Smart Rack', href: 'SM_Slots' },
      { name: 'Controle de Temperatura', href: 'Control_Temp' },
      { name: 'Reflow - Perfis', href: 'InputSpindle' },
      { name: 'Monitoramento Spindle', href: 'Spindle' },
      { name: 'Registro de Feeder', href: 'Feeder' },
      { name: 'Auditoria BadHead', href: 'BadHead'},
      { name: 'MFM', href: 'MFM' },
      { name: 'FT Skip Monitoring', href: 'FTSkipMonitoringV2' },
      { name: 'Armários SMD', href: 'Armarios' }
    ]
  },
  {
    id: 'support',
    name: 'Suporte',
    image: '/images/puzzle.png',
    description: '',
    items: [
      { name: 'Peças de Reposição', href: 'spareparts' }
    ]
  }
];

export default function ActionAreaCard() {
  const [expandedDepartment, setExpandedDepartment] = useState(null);
  const navigate = useNavigate();
  const departmentRefs = useRef({});
  const { user, logout } = useAuth();

  const allowedDepartments = departments.filter(
    (dept) => user?.departments?.includes(dept.id)
  );

  const handleLogout = () => {
    logout();
    navigate('/Login', { replace: true });
  };

  const handleDepartmentClick = (deptId) => {
    setExpandedDepartment(expandedDepartment === deptId ? null : deptId);
  };

  const handleItemClick = (href) => {
    navigate(`/${href}`);
  };

  // Fechar a lista ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expandedDepartment) {
        const isClickInside = Object.values(departmentRefs.current).some(el => 
          el && el.contains(event.target)
        );
        if (!isClickInside) {
          setExpandedDepartment(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedDepartment]);

  return (
    <>
      <Box style={{fontFamily: 'SamsungOne', fontSize:72, textAlign: 'center', marginTop:40}}>
        <img src='/images/logo.png' alt="Logo" style={{maxWidth: '300px'}}/>
      </Box>

      {user && (
        <Box style={{textAlign:'center', marginTop: 10}}>
          <span style={{marginRight: 15}}>Olá, {user.nome}</span>
          <Button variant="outline-secondary" size="sm" onClick={handleLogout}>Sair</Button>
        </Box>
      )}

      {/* Exibir lista de departamentos com itens expandidos abaixo, filtrada pela permissão do usuário */}
      <Box style={{marginTop:'40px', textAlign:'center'}} className='d-flex justify-content-center'>
        <Row>
          {allowedDepartments.map((dept) => (
            <Col key={dept.id} style={{marginBottom: '20px'}}>
              <div 
                ref={el => departmentRefs.current[dept.id] = el}
                style={{ position: 'relative', display: 'inline-block' }}
              >
                {/* Card do departamento */}
                <Card 
                  style={{ width:250, height: '100%', transition: 'transform 0.3s', cursor: 'pointer' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDepartmentClick(dept.id);
                  }}
                >
                  <CardActionArea>
                    <CardMedia
                      component="img"
                      height='140'
                      image={dept.image}
                      alt={dept.name.toLowerCase()}
                    />
                    <CardContent>
                      <Typography gutterBottom component="div" variant='h5' style={{fontWeight: 'bold'}}>
                        {dept.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" style={{fontSize:15}}>
                        {dept.description.split(' | ').map((line, i) => (
                          <span key={i}>{line}<br/></span>
                        ))}
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>

                {/* Itens do departamento (exibidos abaixo quando expandido) */}
                {expandedDepartment === dept.id && (
                  <Box 
                    style={{ 
                      width: '250px',
                      maxHeight: '350px',
                      overflowY: 'auto',
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '0 0 8px 8px', 
                      padding: '15px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      border: '1px solid #e0e0e0',
                      borderTop: 'none',
                      marginTop: '5px',
                      position: 'absolute',
                      top: '100%',
                      left: '0',
                      zIndex: 1000
                    }}
                  >
                    <Typography variant="h6" style={{fontWeight: 'bold', color: '#007bff', marginBottom: '10px', fontSize: '16px'}}>
                      Itens:
                    </Typography>
                    <Box style={{textAlign: 'left'}}>
                      {dept.items.map((item, index) => (
                        <Button
                          key={index}
                          onClick={() => handleItemClick(item.href)}
                          style={{
                            display: 'block',
                            width: '100%',
                            marginBottom: '8px',
                            backgroundColor: '#ffffff',
                            color: '#333',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            fontWeight: '500',
                            fontSize: '13px',
                            padding: '8px',
                            textAlign: 'left',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#007bff';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#007bff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#333';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                          }}
                        >
                          {item.name}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                )}
              </div>
            </Col>
          ))}
        </Row>
      </Box>

      <div style={{textAlign:'center', marginTop:300, marginBottom:20, color: '#666', fontSize: '14px'}}>
        SEDA(M) - MX SMD <br/> 
        CONTACT: F.MIGUEL - F.JARLENJ <br/> 
        © 2023 COPYRIGHT: SAMSUNG.COM
      </div>
    </>
  );
}
