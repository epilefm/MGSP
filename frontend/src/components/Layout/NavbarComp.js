import React, { useState } from 'react';
import { Navbar, Nav, NavDropdown, Container, Offcanvas } from 'react-bootstrap';
import { Box } from '@mui/material';
import '../../Aapp.css';

function NavbarComp() {
  const [showOffcanvas, setShowOffcanvas] = useState(false);

  // Função para fechar o offcanvas quando um item for clicado
  const handleNavClick = () => {
    setShowOffcanvas(false);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Navbar 
        bg="dark" 
        variant="dark" 
        expand="lg" 
        className="shadow-sm"
        style={{ 
          padding: '0.5rem 1rem',
          backgroundColor: '#1a1a1a !important',
          height: '45px' // Tema mais escuro
        }}
      >
        <Container fluid>
          {/* Logo/Brand */}
          <Navbar.Brand 
             href="http://105.103.112.18:3000" 
            style={{
              border: '0.1rem solid',
              borderColor: '#007bff',
              borderRadius: '8px',
              padding: '8px 15px',
              fontStyle: 'italic',
              fontSize: '18px',
              fontWeight: '600',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              backgroundColor: 'rgba(0, 123, 255, 0.1)',
              cursor: 'pointer'
            }}
            className="hover-effect"
          >
            MTS
          </Navbar.Brand>

          {/* Botão de toggle para mobile */}
          <Navbar.Toggle 
            aria-controls="navbar-responsive" 
            onClick={() => setShowOffcanvas(!showOffcanvas)}
            style={{
              border: '1px solid #007bff',
              borderRadius: '6px',
              padding: '5px 10px',
              backgroundColor: 'rgba(0, 123, 255, 0.1)'
            }}
          />

          {/* Menu para desktop */}
          <Navbar.Collapse id="navbar-responsive" className="d-none d-lg-block">
            <Nav className="me-auto">
              {/* Material */}
              <NavDropdown 
                title="Material" 
                id="material-dropdown" 
                className="mx-2 nav-dropdown-custom"
                style={{
                  backgroundColor: 'transparent'
                }}
              >
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Controle de Material</NavDropdown.Header>
                <NavDropdown.Item href="Material_Analysis">Análise de Material</NavDropdown.Item>
                <NavDropdown.Item href="Charts">Dashboards</NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Lavagem e Reposição</NavDropdown.Header>
                <NavDropdown.Item href='LavEnt'>Lavagem de Componentes</NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Registros</NavDropdown.Header>
                <NavDropdown.Item href="InputScreenEntrada">Registro de Entrada</NavDropdown.Item>
                <NavDropdown.Item href="InputScreenSaida">Registro de Saída</NavDropdown.Item>
                <NavDropdown.Item href="InputScreenDevolucao">Registro de Devolução</NavDropdown.Item>
                <NavDropdown.Item href="InputScreenDescarte">Registro de Descarte</NavDropdown.Item>
                <NavDropdown.Item href="Inventario">Registro de Inventário</NavDropdown.Item>
              </NavDropdown>

              {/* Quality / Repair */}
              <NavDropdown 
                title="Qualidade / Reparo" 
                id="quality-dropdown" 
                className="mx-2 nav-dropdown-custom"
              >
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Controle de Qualidade</NavDropdown.Header>
                <NavDropdown.Item href='Bloq_Mat'>Bloqueio de Materiais</NavDropdown.Item>
                <NavDropdown.Item href='ESD'>Controle ESD</NavDropdown.Item>
                <NavDropdown.Item href='Version'>Monitoramento de Versão</NavDropdown.Item>
                <NavDropdown.Item href='Mapping'>Mapeamento 2D</NavDropdown.Item>
                <NavDropdown.Item href='Baking'>Controle MSL</NavDropdown.Item>
                <NavDropdown.Item href='PlantScreen'>Monitoramento de Planta</NavDropdown.Item>
                <NavDropdown.Item href='SubScreen'>Gestão de Materiais</NavDropdown.Item>
                <NavDropdown.Item href='KPIQuality'>KPI Status Trend</NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Reparo</NavDropdown.Header>
                <NavDropdown.Item href='RepairScreen'>Reparo - Entrada</NavDropdown.Item>
                <NavDropdown.Item href='RepairProcess'>Reparo - Processo</NavDropdown.Item>
                <NavDropdown.Item href='RepairSaida'>Reparo - Saída</NavDropdown.Item>
                <NavDropdown.Item href='RepairAnalysis'>Reparo - Análise</NavDropdown.Item>
              <NavDropdown.Item href='Estoque_comp'>Estoque de Componentes</NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Inspeção MX</NavDropdown.Header>
                <NavDropdown.Item href='InspecMX'>Inspeção MX</NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Offline</NavDropdown.Header>
                <NavDropdown.Item href='OfflineSaida'>Offline - Saída</NavDropdown.Item>
              </NavDropdown>

              {/* Production */}
              <NavDropdown 
                title="Produção" 
                id="production-dropdown" 
                className="mx-2 nav-dropdown-custom"
              >
              <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Monitoramento</NavDropdown.Header>
              <NavDropdown.Item href='HoraHora'>Produção Mounter</NavDropdown.Item>
              <NavDropdown.Item href='HoraPlanResult'>Hora Resultado</NavDropdown.Item>
              <NavDropdown.Item href='2D_CN'>Gravação CN - Todos os Turnos</NavDropdown.Item>
              <NavDropdown.Item href='HoraDropW'>50 Piores Indicadores</NavDropdown.Item>
              <NavDropdown.Item href='prod'>Plano de Produção</NavDropdown.Item>
              
              <NavDropdown.Divider />
              <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Router / Corte</NavDropdown.Header>
              <NavDropdown.Item href='Monit_Router'>Monitor Router</NavDropdown.Item>
                
                <NavDropdown.Divider />
                {/* <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Scrap</NavDropdown.Header>
                <NavDropdown.Item href='Scrap_entrada'>Scrap - Entrada</NavDropdown.Item>
                <NavDropdown.Item href='Scrap_Receb'>Scrap - Recebimento</NavDropdown.Item>
                <NavDropdown.Item href='Scrap_reposicao'>Scrap - Reposição</NavDropdown.Item>
                <NavDropdown.Item href='Scrap_saida'>Scrap - Saída</NavDropdown.Item>
                <NavDropdown.Item href='ScrapInv'>Scrap - Análise</NavDropdown.Item>
                 */}
                <NavDropdown.Divider />
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Splicing</NavDropdown.Header>
                <NavDropdown.Item href='SplicingScreen'>Monitoramento</NavDropdown.Item>
                <NavDropdown.Item href='SlipScreen'>Duplo Check CN</NavDropdown.Item>
                
                <NavDropdown.Divider />
                <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Outros</NavDropdown.Header>
                <NavDropdown.Item href='Mapa'>Mapa</NavDropdown.Item>
                <NavDropdown.Item href='Pgto'>Pagamento</NavDropdown.Item>
                <NavDropdown.Item href="Virtual_Label">Virtual T/O</NavDropdown.Item>
              </NavDropdown>

              {/* Maintenance */}
              <NavDropdown 
                title="Manutenção" 
                id="maintenance-dropdown" 
                className="mx-2 nav-dropdown-custom"
              >
                <NavDropdown.Item href="SM_Slots">Monitoramento Smart Rack</NavDropdown.Item>
                <NavDropdown.Item href="Control_Temp">Controle de Temperatura</NavDropdown.Item>
                <NavDropdown.Item href="InputSpindle">Reflow - Perfis</NavDropdown.Item>
                <NavDropdown.Item href="Spindle">Monitoramento Spindle</NavDropdown.Item>
              <NavDropdown.Item href="Feeder">Registro de Feeder</NavDropdown.Item>
              <NavDropdown.Item href="BadHead">Auditoria BadHead</NavDropdown.Item>
              <NavDropdown.Item href="MFM">Auditoria MFM</NavDropdown.Item>
              <NavDropdown.Item href="FTSkipMonitoringV2">FT Skip Monitoring</NavDropdown.Item>
              </NavDropdown>

              {/* Support */}
              <NavDropdown 
                title="Suporte" 
                id="support-dropdown" 
                className="mx-2 nav-dropdown-custom"
              >
                <NavDropdown.Item href="spareparts">Peças de Reposição</NavDropdown.Item>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Offcanvas para mobile */}
      <Offcanvas 
        show={showOffcanvas} 
        onHide={() => setShowOffcanvas(false)} 
        placement="end"
        style={{ width: '300px' }}
      >
        <Offcanvas.Header closeButton className="bg-dark text-white">
          <Offcanvas.Title>Menu Principal</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0" style={{ backgroundColor: '#2c2c2c' }}>
          <Nav className="flex-column">
            <Nav.Link href="Home" onClick={handleNavClick} className="py-3 border-bottom" style={{ color: '#fff' }}>
              <i className="bi bi-house me-2"></i>Home
            </Nav.Link>
            
            {/* Material */}
            <NavDropdown title="Material" className="py-2 border-bottom" style={{ backgroundColor: '#3a3a3a' }}>
              <NavDropdown.Item href="Material_Analysis" onClick={handleNavClick} style={{ color: '#fff' }}>Análise de Material</NavDropdown.Item>
              <NavDropdown.Item href="Charts" onClick={handleNavClick} style={{ color: '#fff' }}>Dashboards</NavDropdown.Item>
              <NavDropdown.Item href='LavEnt' onClick={handleNavClick} style={{ color: '#fff' }}>Lavagem de Componentes</NavDropdown.Item>
              <NavDropdown.Item href="InputScreenEntrada" onClick={handleNavClick} style={{ color: '#fff' }}>Registro de Entrada</NavDropdown.Item>
              <NavDropdown.Item href="InputScreenSaida" onClick={handleNavClick} style={{ color: '#fff' }}>Registro de Saída</NavDropdown.Item>
              <NavDropdown.Item href="InputScreenDevolucao" onClick={handleNavClick} style={{ color: '#fff' }}>Registro de Devolução</NavDropdown.Item>
              <NavDropdown.Item href="InputScreenDescarte" onClick={handleNavClick} style={{ color: '#fff' }}>Registro de Descarte</NavDropdown.Item>
              <NavDropdown.Item href="Inventario" onClick={handleNavClick} style={{ color: '#fff' }}>Registro de Inventário</NavDropdown.Item>
            </NavDropdown>

            {/* Quality / Repair */}
            <NavDropdown title="Qualidade / Reparo" className="py-2 border-bottom" style={{ backgroundColor: '#3a3a3a' }}>
              <NavDropdown.Item href='Bloq_Mat' onClick={handleNavClick} style={{ color: '#fff' }}>Bloqueio de Materiais</NavDropdown.Item>
              <NavDropdown.Item href='ESD' onClick={handleNavClick} style={{ color: '#fff' }}>Controle ESD</NavDropdown.Item>
              <NavDropdown.Item href='Version' onClick={handleNavClick} style={{ color: '#fff' }}>Monitoramento de Versão</NavDropdown.Item>
              <NavDropdown.Item href='Mapping' onClick={handleNavClick} style={{ color: '#fff' }}>Mapeamento 2D</NavDropdown.Item>
              <NavDropdown.Item href='Baking' onClick={handleNavClick} style={{ color: '#fff' }}>Controle MSL</NavDropdown.Item>
              <NavDropdown.Item href='PlantScreen' onClick={handleNavClick} style={{ color: '#fff' }}>Monitoramento de Planta</NavDropdown.Item>
              <NavDropdown.Item href='SubScreen' onClick={handleNavClick} style={{ color: '#fff' }}>Gestão de Materiais</NavDropdown.Item>
              <NavDropdown.Item href='RepairScreen' onClick={handleNavClick} style={{ color: '#fff' }}>Reparo - Entrada</NavDropdown.Item>
              <NavDropdown.Item href='RepairProcess' onClick={handleNavClick} style={{ color: '#fff' }}>Reparo - Processo</NavDropdown.Item>
              <NavDropdown.Item href='RepairSaida' onClick={handleNavClick} style={{ color: '#fff' }}>Reparo - Saída</NavDropdown.Item>
              <NavDropdown.Item href='RepairAnalysis' onClick={handleNavClick} style={{ color: '#fff' }}>Reparo - Análise</NavDropdown.Item>
              <NavDropdown.Item href='Estoque_comp' onClick={handleNavClick} style={{ color: '#fff' }}>Estoque de Componentes</NavDropdown.Item>
              <NavDropdown.Item href='OfflineSaida' onClick={handleNavClick} style={{ color: '#fff' }}>Offline - Saída</NavDropdown.Item>
            </NavDropdown>

            {/* Production */}
            <NavDropdown title="Produção" className="py-2 border-bottom" style={{ backgroundColor: '#3a3a3a' }}>
              <NavDropdown.Item href='HoraHora' onClick={handleNavClick} style={{ color: '#fff' }}>Produção Mounter</NavDropdown.Item>
              <NavDropdown.Item href='2D_CN' onClick={handleNavClick} style={{ color: '#fff' }}>Gravação CN - Todos os Turnos</NavDropdown.Item>
              <NavDropdown.Item href='HoraDropW' onClick={handleNavClick} style={{ color: '#fff' }}>50 Piores Indicadores</NavDropdown.Item>
              <NavDropdown.Item href='prod' onClick={handleNavClick} style={{ color: '#fff' }}>Plano de Produção</NavDropdown.Item>
              <NavDropdown.Item href='Scrap_entrada' onClick={handleNavClick} style={{ color: '#fff' }}>Scrap - Entrada</NavDropdown.Item>
              <NavDropdown.Item href='Scrap_Receb' onClick={handleNavClick} style={{ color: '#fff' }}>Scrap - Recebimento</NavDropdown.Item>
              <NavDropdown.Item href='Scrap_reposicao' onClick={handleNavClick} style={{ color: '#fff' }}>Scrap - Reposição</NavDropdown.Item>
              <NavDropdown.Item href='Scrap_saida' onClick={handleNavClick} style={{ color: '#fff' }}>Scrap - Saída</NavDropdown.Item>
              <NavDropdown.Item href='ScrapInv' onClick={handleNavClick} style={{ color: '#fff' }}>Scrap - Análise</NavDropdown.Item>
              
              <NavDropdown.Divider />
              <NavDropdown.Header style={{ color: '#007bff', fontWeight: 'bold' }}>Router / Corte</NavDropdown.Header>
              <NavDropdown.Item href='Monit_Router' onClick={handleNavClick} style={{ color: '#fff' }}>Monitor Router</NavDropdown.Item>
              
              <NavDropdown.Item href='SplicingScreen' onClick={handleNavClick} style={{ color: '#fff' }}>Monitoramento Splicing</NavDropdown.Item>
              <NavDropdown.Item href='SlipScreen' onClick={handleNavClick} style={{ color: '#fff' }}>Duplo Check CN</NavDropdown.Item>
              <NavDropdown.Item href='Mapa' onClick={handleNavClick} style={{ color: '#fff' }}>Mapa</NavDropdown.Item>
              <NavDropdown.Item href='Pgto' onClick={handleNavClick} style={{ color: '#fff' }}>Pagamento</NavDropdown.Item>
              <NavDropdown.Item href="Virtual_Label" onClick={handleNavClick} style={{ color: '#fff' }}>Virtual T/O</NavDropdown.Item>
            </NavDropdown>

            {/* Maintenance */}
            <NavDropdown title="Manutenção" className="py-2 border-bottom" style={{ backgroundColor: '#3a3a3a' }}>
              <NavDropdown.Item href="SM_Slots" onClick={handleNavClick} style={{ color: '#fff' }}>Monitoramento Smart Rack</NavDropdown.Item>
              <NavDropdown.Item href="Control_Temp" onClick={handleNavClick} style={{ color: '#fff' }}>Controle de Temperatura</NavDropdown.Item>
              <NavDropdown.Item href="InputSpindle" onClick={handleNavClick} style={{ color: '#fff' }}>Reflow - Perfis</NavDropdown.Item>
              <NavDropdown.Item href="Spindle" onClick={handleNavClick} style={{ color: '#fff' }}>Monitoramento Spindle</NavDropdown.Item>
              <NavDropdown.Item href="Feeder" onClick={handleNavClick} style={{ color: '#fff' }}>Registro de Feeder</NavDropdown.Item>
              <NavDropdown.Item href="BadHead" onClick={handleNavClick} style={{ color: '#fff' }}>Auditoria BadHead</NavDropdown.Item>
              <NavDropdown.Item href="MFM" onClick={handleNavClick} style={{ color: '#fff' }}>Auditoria MFM</NavDropdown.Item>
              <NavDropdown.Item href="FTSkipMonitoringV2" onClick={handleNavClick} style={{ color: '#fff' }}>FT Skip Monitoring</NavDropdown.Item>
            </NavDropdown>

            {/* Support */}
            <NavDropdown title="Suporte" className="py-2 border-bottom" style={{ backgroundColor: '#3a3a3a' }}>
              <NavDropdown.Item href="spareparts" onClick={handleNavClick} style={{ color: '#fff' }}>Peças de Reposição</NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Estilos personalizados */}
      <style jsx>{`
        .nav-dropdown-custom:hover {
          background-color: rgba(0, 123, 255, 0.2);
          border-radius: 6px;
        }
        
        .nav-dropdown-custom .dropdown-menu {
          background-color: #2c2c2c;
          border: 1px solid #444;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
        
        .nav-dropdown-custom .dropdown-item {
          color: #fff;
          transition: all 0.2s ease;
        }
        
        .nav-dropdown-custom .dropdown-item:hover {
          background-color: rgba(0, 123, 255, 0.3);
          color: #fff;
        }
        
        .nav-dropdown-custom .dropdown-header {
          color: #007bff !important;
        }
        
        .nav-dropdown-custom .dropdown-divider {
          border-top: 1px solid #444;
        }
        
        .hover-effect:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        }
        
        .nav-link {
          transition: all 0.3s ease;
        }
        
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        @media (max-width: 991px) {
          .navbar-collapse {
            display: none !important;
          }
        }
      `}</style>
    </Box>
  );
}

export default NavbarComp;


 
