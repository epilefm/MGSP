import * as React from 'react';
import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import { CardActionArea } from '@mui/material';
import { Box } from '@mui/material';
import { Row, Col } from 'react-bootstrap';
import { Button } from 'react-bootstrap';
import { Lightbulb } from 'lucide-react';
import styles from '../../styles.css'
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { API_URL } from '../../config/api';

const GRUPOS = [
  { id: 'material', nome: 'Material', imagem: '/images/film reel.png' },
  { id: 'quality', nome: 'Qualidade / Reparo', imagem: '/images/checklist.png' },
  { id: 'production', nome: 'Produção', imagem: '/images/statistic.png' },
  { id: 'maintenance', nome: 'Manutenção', imagem: '/images/maintenance.png' },
  { id: 'inovacao', nome: 'Inovação', imagem: null },
  { id: 'support', nome: 'Suporte', imagem: '/images/puzzle.png' },
];

export default function ActionAreaCard() {
  const [expandedGrupo, setExpandedGrupo] = useState(null);
  const [telas, setTelas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();
  const grupoRefs = useRef({});
  const { user, logout, podeAcessar } = useAuth();

  useEffect(() => {
    axios.get(`${API_URL}/auth/screens`)
      .then((res) => setTelas(res.data))
      .catch(() => setTelas([]))
      .finally(() => setCarregando(false));
  }, []);

  // Só mostra telas que o usuário pode acessar (liberadas + públicas + tudo, se admin).
  const gruposComTelas = useMemo(() => {
    return GRUPOS
      .map((grupo) => ({
        ...grupo,
        itens: telas.filter((t) => t.grupo === grupo.id && podeAcessar(t.slug)),
      }))
      .filter((grupo) => grupo.itens.length > 0);
  }, [telas, podeAcessar]);

  const handleLogout = () => {
    logout();
    navigate('/Login', { replace: true });
  };

  const handleGrupoClick = (grupoId) => {
    setExpandedGrupo(expandedGrupo === grupoId ? null : grupoId);
  };

  const handleItemClick = (slug) => {
    navigate(`/${slug}`);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (expandedGrupo) {
        const isClickInside = Object.values(grupoRefs.current).some(el =>
          el && el.contains(event.target)
        );
        if (!isClickInside) {
          setExpandedGrupo(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [expandedGrupo]);

  return (
    <>
      <Box
        style={{
          background: 'linear-gradient(135deg, #0a1e5c 0%, #1428A0 55%, #1d63d1 100%)',
          padding: '48px 20px 56px',
          textAlign: 'center',
          color: '#fff',
        }}
      >
        <img src='/images/logo.png' alt="Logo" style={{ maxWidth: '260px' }} />
        <Typography style={{ fontFamily: 'SamsungOne', fontSize: 26, marginTop: 18, fontWeight: 600 }}>
          Intranet SMD
        </Typography>
        {user && (
          <Typography style={{ fontSize: 15, opacity: 0.85, marginTop: 4 }}>
            Bem-vindo(a), {user.nome}{user.isAdmin ? ' · administrador' : ''}
          </Typography>
        )}

        <Box style={{ marginTop: 20 }}>
          {user?.isAdmin && (
            <Button
              variant="outline-light"
              size="sm"
              style={{ marginRight: 10 }}
              onClick={() => navigate('/Admin')}
            >
              Painel Admin
            </Button>
          )}
          <Button variant="light" size="sm" onClick={handleLogout}>
            Sair
          </Button>
        </Box>
      </Box>

      <Box style={{ marginTop: '40px', textAlign: 'center', padding: '0 16px' }} className='d-flex justify-content-center'>
        {carregando ? (
          <Typography style={{ color: '#666' }}>Carregando suas telas...</Typography>
        ) : gruposComTelas.length === 0 ? (
          <Box style={{ maxWidth: 420, color: '#666' }}>
            <Typography variant="h6" style={{ marginBottom: 8 }}>Nenhuma tela liberada ainda</Typography>
            <Typography variant="body2">
              Fale com o administrador do sistema para que ele libere o acesso
              às telas que você precisa usar.
            </Typography>
          </Box>
        ) : (
          <Row>
            {gruposComTelas.map((grupo) => (
              <Col key={grupo.id} style={{ marginBottom: '24px' }}>
                <div
                  ref={el => grupoRefs.current[grupo.id] = el}
                  style={{ position: 'relative', display: 'inline-block' }}
                >
                  <Card
                    style={{
                      width: 260,
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      cursor: 'pointer',
                      borderRadius: 12,
                      overflow: 'hidden',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.08)';
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGrupoClick(grupo.id);
                    }}
                  >
                    <CardActionArea>
                      {grupo.imagem ? (
                        <CardMedia component="img" height="130" image={grupo.imagem} alt={grupo.nome.toLowerCase()} />
                      ) : (
                        <Box style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eef2fb' }}>
                          <Lightbulb size={48} color="#1428A0" strokeWidth={1.5} />
                        </Box>
                      )}
                      <CardContent>
                        <Typography gutterBottom component="div" variant='h6' style={{ fontWeight: 700, color: '#0a1e5c' }}>
                          {grupo.nome}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" style={{ fontSize: 13 }}>
                          {grupo.itens.length} tela(s) disponível(is)
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                  </Card>

                  {expandedGrupo === grupo.id && (
                    <Box
                      style={{
                        width: '260px',
                        maxHeight: '350px',
                        overflowY: 'auto',
                        backgroundColor: '#ffffff',
                        borderRadius: '0 0 12px 12px',
                        padding: '15px',
                        boxShadow: '0 10px 24px rgba(0,0,0,0.18)',
                        border: '1px solid #e0e0e0',
                        borderTop: 'none',
                        marginTop: '2px',
                        position: 'absolute',
                        top: '100%',
                        left: '0',
                        zIndex: 1000,
                        textAlign: 'left',
                      }}
                    >
                      {grupo.itens.map((item) => (
                        <Button
                          key={item.slug}
                          onClick={() => handleItemClick(item.slug)}
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
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#1428A0';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.borderColor = '#1428A0';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#ffffff';
                            e.currentTarget.style.color = '#333';
                            e.currentTarget.style.borderColor = '#e0e0e0';
                          }}
                        >
                          {item.nome}
                          {item.is_public && (
                            <span style={{ marginLeft: 6, fontSize: 11, color: '#888' }}>(pública)</span>
                          )}
                        </Button>
                      ))}
                    </Box>
                  )}
                </div>
              </Col>
            ))}
          </Row>
        )}
      </Box>

      <div style={{ textAlign: 'center', marginTop: 80, marginBottom: 20, color: '#666', fontSize: '14px' }}>
        SEDA(M) - MX SMD <br />
        CONTACT: F.MIGUEL - F.JARLENJ <br />
        © 2023 COPYRIGHT: SAMSUNG.COM
      </div>
    </>
  );
}
