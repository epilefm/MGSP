import React, { useState, useEffect } from 'react';

const HanaroScrap = () => {
  // Estados para os dados do formulário
  const [formData, setFormData] = useState({
    matricula: '',
    nomeOperador: '',
    tipoScrap: '',
    tipoPlaca: '',
    modeloId: '',
    modeloNome: '',
    halb: '',
    qty: 1,
    mm: false,
    linhaId: '',
    linhaNome: '',
    turno: '',
    plantaId: '',
    plantaNome: '',
    origemId: '',
    origemNome: '',
    equipamentoId: '',
    equipamentoNome: '',
    causaId: '',
    causaNome: '',
    causaRaiz: '',
    acaoCorretiva: '',
    contramedida: '',
    custoUnitario: 0,
    custoTotal: 0,
  });

  // Estados para dados de seleção (simulando dados do backend)
  const [modelos, setModelos] = useState([
    { id: '1', nome: 'Modelo A', halb: 'HALB001' },
    { id: '2', nome: 'Modelo B', halb: 'HALB002' },
    { id: '3', nome: 'Modelo C', halb: 'HALB003' },
  ]);

  const [linhas] = useState([
    { id: '1', nome: 'Linha 1' },
    { id: '2', nome: 'Linha 2' },
    { id: '3', nome: 'Linha 3' },
  ]);

  const [plantas] = useState([
    { id: '1', nome: 'Planta São Paulo' },
    { id: '2', nome: 'Planta Rio de Janeiro' },
    { id: '3', nome: 'Planta Minas Gerais' },
  ]);

  const [origens] = useState([
    { id: '1', codigo: 'OR001', nome: 'Origem 1' },
    { id: '2', codigo: 'OR002', nome: 'Origem 2' },
    { id: '3', codigo: 'OR003', nome: 'Origem 3' },
  ]);

  const [equipamentos] = useState([
    { id: '1', codigo: 'EQ001', nome: 'Equipamento 1' },
    { id: '2', codigo: 'EQ002', nome: 'Equipamento 2' },
    { id: '3', codigo: 'EQ003', nome: 'Equipamento 3' },
  ]);

  const [causas] = useState([
    { id: '1', codigo: 'CA001', nome: 'Causa 1' },
    { id: '2', codigo: 'CA002', nome: 'Causa 2' },
    { id: '3', codigo: 'CA003', nome: 'Causa 3' },
  ]);

  // Dados de custo simulados
  const [custoDB] = useState([
    { modelo_id: '1', tipo_placa: 'Bot', custo_unitario: 150.50 },
    { modelo_id: '1', tipo_placa: 'Top', custo_unitario: 200.75 },
    { modelo_id: '1', tipo_placa: 'Limpa', custo_unitario: 80.25 },
    { modelo_id: '2', tipo_placa: 'Bot', custo_unitario: 180.30 },
    { modelo_id: '2', tipo_placa: 'Top', custo_unitario: 220.60 },
    { modelo_id: '2', tipo_placa: 'Limpa', custo_unitario: 95.40 },
    { modelo_id: '3', tipo_placa: 'Bot', custo_unitario: 165.80 },
    { modelo_id: '3', tipo_placa: 'Top', custo_unitario: 210.90 },
    { modelo_id: '3', tipo_placa: 'Limpa', custo_unitario: 88.70 },
  ]);

  // Estados para controle da interface
  const [employee, setEmployee] = useState(null);
  const [saving, setSaving] = useState(false);

  // Constantes
  const TIPOS_SCRAP = ["Classe A", "Feedback", "Scrap", "Wash Board"];
  const TIPOS_PLACA = ["Bot", "Top", "Limpa"];
  const TURNOS = ["1T", "2T", "3T"];

  // Efeito para calcular custo total quando qty ou custoUnitario mudarem
  useEffect(() => {
    const custoUnitario = formData.custoUnitario || 0;
    const custoTotal = custoUnitario * (formData.qty || 1);
    setFormData(prev => ({ ...prev, custoTotal }));
  }, [formData.qty, formData.custoUnitario]);

  // Efeito para atualizar custo unitário quando modelo e tipo de placa mudarem
  useEffect(() => {
    if (formData.modeloId && formData.tipoPlaca) {
      const custo = custoDB.find(c => 
        c.modelo_id === formData.modeloId && c.tipo_placa === formData.tipoPlaca
      );
      const custoUnitario = custo ? custo.custo_unitario : 0;
      setFormData(prev => ({ ...prev, custoUnitario }));
    }
  }, [formData.modeloId, formData.tipoPlaca, custoDB]);

  // Função para lidar com mudanças no formulário
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Atualizar nome do operador quando matrícula mudar
    if (field === 'matricula' && value.length >= 2) {
      // Simulando busca de funcionário
      setTimeout(() => {
        setEmployee({ nome: `Funcionário ${value}` });
      }, 500);
    }
    
    // Atualizar HALB e nome do modelo quando modelo mudar
    if (field === 'modeloId') {
      const modelo = modelos.find(m => m.id === value);
      if (modelo) {
        setFormData(prev => ({ 
          ...prev, 
          modeloNome: modelo.nome,
          halb: modelo.halb
        }));
      }
    }
  };

  // Função para salvar registro
  const handleSave = () => {
    if (!formData.matricula || !formData.tipoScrap || !formData.tipoPlaca || !formData.modeloId || !formData.turno) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }
    
    setSaving(true);
    
    // Simulando salvamento
    setTimeout(() => {
      alert("Registro de scrap salvo com sucesso!");
      setSaving(false);
      
      // Reset form
      setFormData({
        matricula: '', nomeOperador: '', tipoScrap: '', tipoPlaca: '', modeloId: '',
        modeloNome: '', halb: '', qty: 1, mm: false, linhaId: '', linhaNome: '',
        turno: '', plantaId: '', plantaNome: '', origemId: '', origemNome: '',
        equipamentoId: '', equipamentoNome: '', causaId: '', causaNome: '',
        causaRaiz: '', acaoCorretiva: '', contramedida: '', custoUnitario: 0, custoTotal: 0,
      });
      setEmployee(null);
    }, 1000);
  };

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      margin: 0,
      padding: 0
    }}>
      {/* Header */}
      <nav style={{
        height: '3.5rem',
        borderBottom: '1px solid #e5e5e5',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '1rem',
        overflowX: 'auto'
      }}>
        <span style={{
          fontWeight: 'bold',
          fontSize: '1rem',
          marginRight: '1.5rem',
          whiteSpace: 'nowrap'
        }}>
          HANARO <span style={{ color: '#dc2626', fontFamily: 'monospace', fontSize: '0.75rem', marginLeft: '0.25rem' }}>SCRAP</span>
        </span>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.75rem 1rem',
          borderRadius: '0.375rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          backgroundColor: '#3b82f6',
          color: '#ffffff',
          whiteSpace: 'nowrap'
        }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
          </svg>
          Registro
        </div>
      </nav>

      {/* Main Content */}
      <div style={{
        height: 'calc(100vh - 3.5rem)',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '0'
      }}>
        {/* Left: Form */}
        <div style={{
          overflowY: 'auto',
          borderRight: '1px solid #e5e5e5',
          backgroundColor: '#ffffff',
          padding: '1.25rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              Registro de Scrap
            </h2>
          </div>

          {/* Matrícula */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Matrícula do Operador
            </label>
            <input
              type="text"
              placeholder="Digite a matrícula..."
              value={formData.matricula}
              onChange={(e) => handleFormChange('matricula', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}
            />
            {employee && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.875rem',
                color: '#3b82f6',
                fontWeight: '500',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '0.25rem',
                padding: '0.375rem 0.75rem',
                marginTop: '0.25rem'
              }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                {employee.nome}
              </div>
            )}
          </div>

          {/* Tipo de Scrap */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Tipo de Scrap
            </label>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              {TIPOS_SCRAP.map(tipo => (
                <label key={tipo} style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="tipoScrap"
                    value={tipo}
                    checked={formData.tipoScrap === tipo}
                    onChange={(e) => handleFormChange('tipoScrap', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: formData.tipoScrap === tipo ? '#3b82f6' : '#ffffff',
                    color: formData.tipoScrap === tipo ? '#ffffff' : '#1f2937',
                    ...(formData.tipoScrap === tipo ? {} : { ':hover': { backgroundColor: '#f3f4f6' } })
                  }}>
                    {tipo}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Tipo de Placa */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Tipo de Placa
            </label>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {TIPOS_PLACA.map(tipo => (
                <label key={tipo} style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="tipoPlaca"
                    value={tipo}
                    checked={formData.tipoPlaca === tipo}
                    onChange={(e) => handleFormChange('tipoPlaca', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: formData.tipoPlaca === tipo ? '#3b82f6' : '#ffffff',
                    color: formData.tipoPlaca === tipo ? '#ffffff' : '#1f2937',
                    ...(formData.tipoPlaca === tipo ? {} : { ':hover': { backgroundColor: '#f3f4f6' } })
                  }}>
                    {tipo}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Modelo */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Modelo
            </label>
            <select
              value={formData.modeloId}
              onChange={(e) => handleFormChange('modeloId', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Selecione o modelo</option>
              {modelos.map(modelo => (
                <option key={modelo.id} value={modelo.id}>{modelo.nome}</option>
              ))}
            </select>
          </div>

          {/* HALB (auto) */}
          {formData.halb && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                marginBottom: '0.25rem'
              }}>
                HALB (automático)
              </label>
              <div style={{
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                backgroundColor: '#f3f4f6',
                fontSize: '0.875rem',
                fontFamily: 'monospace'
              }}>
                {formData.halb}
              </div>
            </div>
          )}

          {/* QTY + MM */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.75rem',
            marginBottom: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                marginBottom: '0.25rem'
              }}>
                Quantidade
              </label>
              <input
                type="number"
                min="1"
                value={formData.qty}
                onChange={(e) => handleFormChange('qty', parseInt(e.target.value) || 1)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: '1px solid #d1d5db',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              />
            </div>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                marginBottom: '0.25rem'
              }}>
                MM
              </label>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginTop: '0.25rem'
              }}>
                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}>
                  <input
                    type="checkbox"
                    checked={formData.mm}
                    onChange={(e) => handleFormChange('mm', e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    width: '2.5rem',
                    height: '1.5rem',
                    borderRadius: '9999px',
                    backgroundColor: formData.mm ? '#3b82f6' : '#d1d5db',
                    position: 'relative',
                    transition: 'background-color 0.2s'
                  }}>
                    <span style={{
                      position: 'absolute',
                      top: '0.125rem',
                      left: formData.mm ? '1.125rem' : '0.125rem',
                      width: '1.25rem',
                      height: '1.25rem',
                      borderRadius: '9999px',
                      backgroundColor: '#ffffff',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                    }} />
                  </span>
                </label>
                <span style={{
                  fontSize: '0.875rem',
                  color: '#6b7280'
                }}>
                  {formData.mm ? "Sim" : "Não"}
                </span>
              </div>
            </div>
          </div>

          {/* Linha */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Linha
            </label>
            <select
              value={formData.linhaId}
              onChange={(e) => handleFormChange('linhaId', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Selecione a linha</option>
              {linhas.map(linha => (
                <option key={linha.id} value={linha.id}>{linha.nome}</option>
              ))}
            </select>
          </div>

          {/* Turno */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Turno
            </label>
            <div style={{
              display: 'flex',
              gap: '0.5rem'
            }}>
              {TURNOS.map(turno => (
                <label key={turno} style={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer'
                }}>
                  <input
                    type="radio"
                    name="turno"
                    value={turno}
                    checked={formData.turno === turno}
                    onChange={(e) => handleFormChange('turno', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{
                    padding: '0.375rem 1rem',
                    borderRadius: '0.375rem',
                    border: '1px solid #d1d5db',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    transition: 'all 0.2s',
                    backgroundColor: formData.turno === turno ? '#3b82f6' : '#ffffff',
                    color: formData.turno === turno ? '#ffffff' : '#1f2937',
                    ...(formData.turno === turno ? {} : { ':hover': { backgroundColor: '#f3f4f6' } })
                  }}>
                    {turno}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Planta */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Planta
            </label>
            <select
              value={formData.plantaId}
              onChange={(e) => handleFormChange('plantaId', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Selecione a planta</option>
              {plantas.map(planta => (
                <option key={planta.id} value={planta.id}>{planta.nome}</option>
              ))}
            </select>
          </div>

          {/* Origem */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Origem
            </label>
            <select
              value={formData.origemId}
              onChange={(e) => handleFormChange('origemId', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Selecione a origem</option>
              {origens.map(origem => (
                <option key={origem.id} value={origem.id}>{origem.codigo} - {origem.nome}</option>
              ))}
            </select>
          </div>

          {/* Equipamento */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Equipamento
            </label>
            <select
              value={formData.equipamentoId}
              onChange={(e) => handleFormChange('equipamentoId', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Selecione o equipamento</option>
              {equipamentos.map(equipamento => (
                <option key={equipamento.id} value={equipamento.id}>{equipamento.codigo} - {equipamento.nome}</option>
              ))}
            </select>
          </div>

          {/* Causa */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Causa
            </label>
            <select
              value={formData.causaId}
              onChange={(e) => handleFormChange('causaId', e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                backgroundColor: '#ffffff'
              }}
            >
              <option value="">Selecione a causa</option>
              {causas.map(causa => (
                <option key={causa.id} value={causa.id}>{causa.codigo} - {causa.nome}</option>
              ))}
            </select>
          </div>

          {/* Causa Raiz */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Causa Raiz
            </label>
            <textarea
              placeholder="Descreva a causa raiz..."
              value={formData.causaRaiz}
              onChange={(e) => handleFormChange('causaRaiz', e.target.value)}
              rows="2"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Ação Corretiva */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Ação Corretiva
            </label>
            <textarea
              placeholder="Descreva a ação corretiva..."
              value={formData.acaoCorretiva}
              onChange={(e) => handleFormChange('acaoCorretiva', e.target.value)}
              rows="2"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Contramedida */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#6b7280',
              marginBottom: '0.25rem'
            }}>
              Contramedida
            </label>
            <textarea
              placeholder="Descreva a contramedida..."
              value={formData.contramedida}
              onChange={(e) => handleFormChange('contramedida', e.target.value)}
              rows="2"
              style={{
                width: '100%',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.375rem',
                border: '1px solid #d1d5db',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '0.375rem',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              fontSize: '1rem',
              fontWeight: '500',
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginTop: '1rem'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            {saving ? "Salvando..." : "Salvar Registro"}
          </button>
        </div>

        {/* Right: Preview */}
        <div style={{
          overflowY: 'auto',
          backgroundColor: '#f9fafb',
          padding: '1.25rem'
        }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{
              fontSize: '1.125rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
              Resumo do Registro
            </h2>

            {/* Cost highlight */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              backdropFilter: 'blur(4px)',
              border: '1px solid rgba(229, 231, 235, 0.5)',
              borderRadius: '0.5rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              padding: '1.5rem',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#6b7280',
                marginBottom: '0.25rem'
              }}>
                Custo do Scrap
              </p>
              <p style={{
                fontSize: '2.25rem',
                fontWeight: '800',
                color: '#dc2626',
                fontFamily: 'monospace'
              }}>
                {formatCurrency(formData.custoTotal)}
              </p>
              {formData.custoUnitario > 0 && (
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280',
                  marginTop: '0.25rem'
                }}>
                  {formData.qty} × {formatCurrency(formData.custoUnitario)} / unidade
                </p>
              )}
            </div>

            {!formData.tipoScrap && !formData.modeloNome && !formData.matricula ? (
              <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                <p>Preencha o formulário para ver o resumo em tempo real</p>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                flex: 1,
                overflowY: 'auto'
              }}>
                {/* Operador */}
                {employee && (
                  <div style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(229, 231, 235, 0.5)',
                    borderRadius: '0.5rem',
                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                    padding: '0.75rem'
                  }}>
                    <p style={{
                      fontSize: '0.75rem',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: '#6b7280',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem'
                    }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      Operador
                    </p>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Matrícula
                      </span>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.matricula}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Nome
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {employee.nome}
                      </span>
                    </div>
                  </div>
                )}

                {/* Scrap Info */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.75rem'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m7.5 4.27 9 5.15"/>
                      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                      <path d="m3.3 2.1 8.7 5 8.7-5"/>
                      <path d="M12 22V12"/>
                    </svg>
                    Informações do Scrap
                  </p>
                  {formData.tipoScrap && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Tipo
                      </span>
                      <span style={{
                        padding: '0.125rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        backgroundColor: 'rgba(220, 38, 38, 0.1)',
                        color: '#dc2626'
                      }}>
                        {formData.tipoScrap}
                      </span>
                    </div>
                  )}
                  {formData.tipoPlaca && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Placa
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.tipoPlaca}
                      </span>
                    </div>
                  )}
                  {formData.modeloNome && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Modelo
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.modeloNome}
                      </span>
                    </div>
                  )}
                  {formData.halb && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        HALB
                      </span>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.halb}
                      </span>
                    </div>
                  )}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>
                      Quantidade
                    </span>
                    <span style={{
                      fontFamily: 'monospace',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      {formData.qty}
                    </span>
                  </div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>
                      MM
                    </span>
                    <span style={{
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      {formData.mm ? "Sim" : "Não"}
                    </span>
                  </div>
                </div>

                {/* Produção */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.75rem'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="16" height="10" x="2" y="7" rx="2" ry="2"/>
                      <line x1="22" x2="22" y1="11" y2="13"/>
                      <line x1="6" x2="6" y1="7" y2="17"/>
                      <line x1="10" x2="10" y1="7" y2="17"/>
                      <line x1="14" x2="14" y1="7" y2="17"/>
                    </svg>
                    Produção
                  </p>
                  {formData.linhaNome && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Linha
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.linhaNome}
                      </span>
                    </div>
                  )}
                  {formData.turno && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Turno
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.turno}
                      </span>
                    </div>
                  )}
                  {formData.plantaNome && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Planta
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.plantaNome}
                      </span>
                    </div>
                  )}
                </div>

                {/* Análise */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.75rem'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Análise
                  </p>
                  {formData.origemNome && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Origem
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.origemNome}
                      </span>
                    </div>
                  )}
                  {formData.equipamentoNome && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Equipamento
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.equipamentoNome}
                      </span>
                    </div>
                  )}
                  {formData.causaNome && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Causa
                      </span>
                      <span style={{
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.causaNome}
                      </span>
                    </div>
                  )}
                  {formData.causaRaiz && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '0.25rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Causa Raiz
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.causaRaiz}
                      </span>
                    </div>
                  )}
                  {formData.acaoCorretiva && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '0.25rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Ação Corretiva
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.acaoCorretiva}
                      </span>
                    </div>
                  )}
                  {formData.contramedida && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '0.25rem',
                      padding: '0.25rem 0.75rem',
                      borderRadius: '0.25rem',
                      fontSize: '0.875rem'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#6b7280'
                      }}>
                        Contramedida
                      </span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        color: '#1f2937'
                      }}>
                        {formData.contramedida}
                      </span>
                    </div>
                  )}
                </div>

                {/* Data */}
                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(4px)',
                  border: '1px solid rgba(229, 231, 235, 0.5)',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                  padding: '0.75rem'
                }}>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#6b7280',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                  }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Data/Hora
                  </p>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '0.25rem',
                    fontSize: '0.875rem'
                  }}>
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#6b7280'
                    }}>
                      Registro
                    </span>
                    <span style={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      fontWeight: '500',
                      color: '#1f2937'
                    }}>
                      {formatDate(new Date())}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScrapGuardian;