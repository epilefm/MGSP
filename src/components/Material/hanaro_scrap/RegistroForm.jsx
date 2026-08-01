import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Tag, QrCode, Layers, Factory, Hash, Navigation, Clock, MapPin, 
  Wrench, AlertTriangle, HelpCircle, CheckCircle, ShieldAlert, Save, 
  RefreshCw, ChevronDown, AlertCircle, CheckCircle2, XCircle, ClipboardList, Plus 
} from 'lucide-react';

const RegistroForm = ({ 
  formData, 
  setFormData, 
  employee, 
  setEmployee,
  requiredFields, 
  setRequiredFields,
  fieldsWithError,
  cnDuplicada,
  setCnDuplicada,
  verificandoCn,
  verificarCnDuplicada,
  cnsInseridas,
  setCnsInseridas,
  cnInput,
  setCnInput,
  adicionarCn,
  removerCn,
  modelos,
  modeloDropdownOpen,
  setModeloDropdownOpen,
  modeloSearch,
  setModeloSearch,
  modeloSelectedIndex,
  setModeloSelectedIndex,
  modeloDropdownRef,
  modeloItemRefs,
  linhas,
  origens,
  equipamentos,
  observacaoEquipamento,
  setObservacaoEquipamento,
  causas,
  observacaoCausa,
  setObservacaoCausa,
  inputRefs,
  handleFormChange,
  handleEnterKeyPress,
  handleSave,
  saving,
  TIPOS_SCRAP,
  TIPOS_PLACA
}) => {
  // Calcular progresso
  const required = ['matricula', 'tipoScrap', 'tipoPlaca', 'modeloId', 'linhaId', 'turno', 'causaId', 'causaRaiz', 'acaoCorretiva', 'contramedida'];
  const filledCount = required.filter(field => {
    const value = formData[field];
    return value && String(value).trim() !== '';
  }).length;
  const progressPercent = Math.round((filledCount / required.length) * 100);
  
  // Cores do tema
  const C = {
    bg: '#f6f8fa', card: '#ffffff', card2: '#f6f8fa', border: '#d0d7de',
    text: '#1f2328', textSec: '#656d76', textMuted: '#9198a1',
    accent: '#0969da', accentBg: 'rgba(9,105,218,0.08)',
    input: '#ffffff', hover: '#f6f8fa', divider: '#eaecef',
    success: '#22c55e', warning: '#f59e0b', error: '#ef4444',
  };

  // Style helpers
  const inp = (fieldId, extra = {}) => {
    const hasError = fieldsWithError?.[fieldId];
    // Se tiver extra com border definido manualmente, usar o extra
    if (extra && extra.border) {
      return {
        width: '100%', height: 36, padding: '0 10px', boxSizing: 'border-box',
        borderRadius: 6,
        background: hasError && !extra.background ? 'rgba(239, 68, 68, 0.05)' : (extra.background || C.input),
        color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
        boxShadow: hasError && !extra.boxShadow ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : (extra.boxShadow || 'none'),
        transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
        ...extra,
      };
    }
    return {
      width: '100%', height: 36, padding: '0 10px', boxSizing: 'border-box',
      border: hasError ? `2px solid ${C.error}` : `1px solid ${C.border}`, 
      borderRadius: 6,
      background: hasError ? 'rgba(239, 68, 68, 0.05)' : C.input,
      color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
      boxShadow: hasError ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
      transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
      ...extra,
    };
  };
  
  // Helper para selects com erro
  const selectInp = (fieldId, extra = {}) => ({
    width: '100%', height: 36, padding: '0 10px', boxSizing: 'border-box',
    border: fieldsWithError?.[fieldId] ? `2px solid ${C.error}` : `1px solid ${C.border}`,
    borderRadius: 6,
    background: fieldsWithError?.[fieldId] ? 'rgba(239, 68, 68, 0.05)' : C.input,
    color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
    boxShadow: fieldsWithError?.[fieldId] ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
    cursor: 'pointer',
    transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
    ...extra,
  });
  
  // Helper para textarea com erro
  const textareaInp = (fieldId, extra = {}) => ({
    width: '100%', padding: '8px 10px', boxSizing: 'border-box',
    border: fieldsWithError?.[fieldId] ? `2px solid ${C.error}` : `1px solid ${C.border}`,
    borderRadius: 6,
    background: fieldsWithError?.[fieldId] ? 'rgba(239, 68, 68, 0.05)' : C.input,
    color: C.text, fontSize: 13, outline: 'none', fontFamily: 'inherit',
    boxShadow: fieldsWithError?.[fieldId] ? '0 0 0 3px rgba(239, 68, 68, 0.1)' : 'none',
    resize: 'vertical',
    transition: 'border 0.2s, background 0.2s, box-shadow 0.2s',
    ...extra,
  });
  
  // Helper para toggle button com erro
  const toggleError = (fieldId, active, color = C.accent) => {
    const hasError = fieldsWithError?.[fieldId];
    if (hasError && !active) {
      return {
        padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
        border: `2px solid ${C.error}`,
        background: 'rgba(239, 68, 68, 0.1)',
        color: C.error, transition: 'all 0.15s',
        boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.1)',
      };
    }
    return {
      padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
      border: `1px solid ${active ? color : C.border}`,
      background: active ? `${color}18` : 'transparent',
      color: active ? color : C.textSec, transition: 'all 0.15s',
    };
  };
  
  const lbl = {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 600, color: C.textMuted,
    marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em',
  };
  
  const toggle = (active, color = C.accent) => ({
    padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: active ? 600 : 400,
    border: `1px solid ${active ? color : C.border}`,
    background: active ? `${color}18` : 'transparent',
    color: active ? color : C.textSec, transition: 'all 0.15s',
  });
  
  const section = (color) => ({
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 11, fontWeight: 700, color: color || C.textMuted,
    textTransform: 'uppercase', letterSpacing: '0.08em',
    paddingBottom: 8, marginBottom: 12,
    borderBottom: `1px solid ${C.divider}`,
  });

  // Filtrar modelos
  const filterModelos = (search) => {
    if (!search) return modelos;
    const searchLower = search.toLowerCase();
    const exactMatch = modelos.filter(m => m.nome.toLowerCase() === searchLower || (m.halb && m.halb.toLowerCase() === searchLower));
    const startsWith = modelos.filter(m => (m.nome.toLowerCase().startsWith(searchLower) || (m.halb && m.halb.toLowerCase().startsWith(searchLower))) && m.nome.toLowerCase() !== searchLower);
    const contains = modelos.filter(m => (m.nome.toLowerCase().includes(searchLower) || (m.halb && m.halb.toLowerCase().includes(searchLower))) && !m.nome.toLowerCase().startsWith(searchLower) && m.nome.toLowerCase() !== searchLower);
    return [...exactMatch, ...startsWith, ...contains];
  };

  // Handler para navegação com teclado
  const handleModeloKeyDown = (e) => {
    const filteredModelos = filterModelos(modeloSearch);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setModeloDropdownOpen(true);
      setModeloSelectedIndex(prev => {
        const newIndex = prev < filteredModelos.length - 1 ? prev + 1 : 0;
        setTimeout(() => {
          if (modeloItemRefs.current[newIndex]) {
            modeloItemRefs.current[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }, 50);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setModeloSelectedIndex(prev => {
        const newIndex = prev > 0 ? prev - 1 : filteredModelos.length - 1;
        setTimeout(() => {
          if (modeloItemRefs.current[newIndex]) {
            modeloItemRefs.current[newIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          }
        }, 50);
        return newIndex;
      });
    } else if (e.key === 'Enter' && modeloSelectedIndex >= 0 && modeloSelectedIndex < filteredModelos.length) {
      e.preventDefault();
      const modelo = filteredModelos[modeloSelectedIndex];
      setFormData(prev => ({ ...prev, modeloId: modelo.id, modeloNome: modelo.nome, halb: modelo.halb || '' }));
      setModeloSearch('');
      setModeloDropdownOpen(false);
      setModeloSelectedIndex(-1);
      const nextRef = inputRefs.current.qty;
      if (nextRef) nextRef.focus();
    } else if (e.key === 'Escape') {
      setModeloDropdownOpen(false);
      setModeloSelectedIndex(-1);
    }
  };

  const eqOtros = equipamentos.find(e => e.id == formData.equipamentoId)?.nome?.toLowerCase().includes('outros');
  const causaOtros = causas.find(c => c.id == formData.causaId)?.nome?.toLowerCase().includes('outros');

  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      height: '100%',
      minHeight: 0
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes _spin { to { transform: rotate(360deg); } }
        select, textarea, input { box-sizing: border-box; }
      `}</style>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ══ IDENTIFICAÇÃO ══ */}
        <div>
          <div style={section('#0969da')}>
            <User size={12} style={{ color: '#0969da' }} />
            Identificação
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, marginBottom: 10 }}>
            <div>
              <div style={lbl}>Matrícula *</div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="MAT001"
                  maxLength={8}
                  value={formData.matricula}
                  onChange={e => handleFormChange('matricula', e.target.value.toUpperCase())}
                  onBlur={() => {
                    if (formData.matricula.trim()) {
                      fetch(`http://105.103.39.102:8080/verifyMatricula/${formData.matricula}`)
                        .then(res => res.json())
                        .then(data => {
                          if (data && data.exists) {
                            setEmployee({ nome: data.nome });
                          } else {
                            setEmployee(null);
                          }
                        });
                    }
                  }}
                  ref={el => inputRefs.current.matricula = el}
                  style={inp({
                    border: `1px solid ${employee ? C.success : (formData.matricula ? C.error : C.border)}`,
                    paddingRight: 26
                  })}
                />
                {employee && <CheckCircle2 size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: C.success }} />}
                {!employee && formData.matricula && <XCircle size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: C.error }} />}
              </div>
            </div>
            <div>
              <div style={lbl}>Funcionário</div>
              <input
                type="text"
                value={employee ? employee.nome : ''}
                readOnly
                placeholder="Preenche automático"
                style={inp({
                  background: C.hover,
                  cursor: 'not-allowed',
                  color: employee ? C.text : C.textMuted
                })}
              />
            </div>
          </div>
          <div style={lbl}>
            <ClipboardList size={12} />
            Tipo de Scrap *
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TIPOS_SCRAP.map(t => (
              <button
                key={t}
                onClick={() => handleFormChange('tipoScrap', t)}
                style={toggle(formData.tipoScrap === t, '#ef4444')}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* ══ DADOS DA PLACA ══ */}
        <div>
          <div style={section('#8957e5')}>
            <QrCode size={12} style={{ color: '#8957e5' }} />
            Dados da Placa
          </div>

          {/* CN com Múltiplas Entradas */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ ...lbl, justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <QrCode size={11} />
                CN da Placa (Múltiplas) *
              </div>
              {cnsInseridas.length > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: C.success,
                  background: `${C.success}18`,
                  padding: '2px 8px',
                  borderRadius: 10
                }}>
                  {cnsInseridas.length} CN(s) inserida(s)
                </span>
              )}
            </div>
            
            {/* Campo de entrada de CN */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Digite a CN (13 caracteres)"
                  maxLength={13}
                  value={cnInput}
                  onChange={e => {
                    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setCnInput(value);
                    setFormData(prev => ({ ...prev, cn: value }));
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      adicionarCn(cnInput);
                    }
                  }}
                  style={inp({
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    border: `1px solid ${cnDuplicada ? C.error : C.border}`
                  })}
                />
              </div>
              <button
                onClick={() => adicionarCn(cnInput)}
                disabled={!cnInput || cnInput.length !== 13 || verificandoCn}
                style={{
                  height: 36,
                  padding: '0 16px',
                  borderRadius: 6,
                  border: 'none',
                  background: cnInput && cnInput.length === 13 && !verificandoCn ? C.success : C.border,
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: cnInput && cnInput.length === 13 && !verificandoCn ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s'
                }}
              >
                {verificandoCn ? <RefreshCw size={14} style={{ animation: '_spin 1s linear infinite' }} /> : <Plus size={14} />}
                Adicionar
              </button>
            </div>
            
            {/* Lista de CNs inseridas */}
            {cnsInseridas.length > 0 && (
              <div style={{
                background: C.hover,
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: 8,
                maxHeight: 120,
                overflowY: 'auto'
              }}>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6
                }}>
                  {cnsInseridas.map((cn, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        background: '#fff',
                        border: `1px solid ${C.success}40`,
                        borderRadius: 4,
                        padding: '4px 8px',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        color: C.text
                      }}
                    >
                      <span style={{ color: C.success }}>✓</span>
                      {cn}
                      <button
                        onClick={() => removerCn(cn)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          color: C.error,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Remover CN"
                      >
                        <XCircle size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <p style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>
              💡 Pressione Enter para adicionar ou clique em "Adicionar". A quantidade será preenchida automaticamente.
            </p>
            
            {cnDuplicada && (
              <p style={{ fontSize: 11, color: C.error, marginTop: 3 }}>Esta CN já foi registrada!</p>
            )}
          </div>

          {/* Tipo Placa + Modelo + Qty */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 72px', gap: 8, alignItems: 'start' }}>
            <div>
              <div style={lbl}>
                <Layers size={11} />
                Tipo *
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {TIPOS_PLACA.map(t => (
                  <button
                    key={t}
                    onClick={() => handleFormChange('tipoPlaca', t)}
                    style={toggle(formData.tipoPlaca === t, '#8957e5')}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div ref={modeloDropdownRef} style={{ position: 'relative' }}>
              <div style={lbl}>
                <Factory size={11} />
                Modelo *
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Buscar modelo..."
                  value={modeloSearch || formData.modeloNome || ''}
                  onChange={e => {
                    setModeloSearch(e.target.value);
                    setModeloDropdownOpen(true);
                    setModeloSelectedIndex(-1);
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, modeloId: '', modeloNome: '', halb: '' }));
                    }
                  }}
                  onFocus={() => setModeloDropdownOpen(true)}
                  onKeyDown={handleModeloKeyDown}
                  ref={el => inputRefs.current.modeloId = el}
                  style={inp({ paddingRight: 26 })}
                />
                <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: C.textMuted, pointerEvents: 'none' }} />
              </div>
              {modeloDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 9999,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderRadius: 6,
                  marginTop: 2,
                  maxHeight: 200,
                  overflowY: 'auto',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.2)'
                }}>
                  {filterModelos(modeloSearch).length === 0 ? (
                    <div style={{ padding: '10px 12px', textAlign: 'center', color: C.textMuted, fontSize: 12 }}>Nenhum modelo encontrado</div>
                  ) : (
                    filterModelos(modeloSearch).map((m, i) => (
                      <div
                        key={m.id + i}
                        ref={el => modeloItemRefs.current[i] = el}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, modeloId: m.id, modeloNome: m.nome, halb: m.halb || '' }));
                          setModeloSearch('');
                          setModeloDropdownOpen(false);
                          setModeloSelectedIndex(-1);
                        }}
                        onMouseEnter={() => setModeloSelectedIndex(i)}
                        style={{
                          padding: '7px 10px',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: modeloSelectedIndex === i ? 700 : 500,
                          color: modeloSelectedIndex === i ? C.accent : C.text,
                          background: modeloSelectedIndex === i ? C.accentBg : (formData.modeloId === m.id ? `${C.accent}08` : 'transparent'),
                          borderLeft: `2px solid ${modeloSelectedIndex === i ? C.accent : 'transparent'}`,
                          borderBottom: `1px solid ${C.divider}`,
                          transition: 'all 0.1s'
                        }}
                      >
                        {m.nome}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div>
              <div style={lbl}>Qtd *</div>
              <input
                type="number"
                min="1"
                placeholder="1"
                value={formData.qty}
                onChange={e => handleFormChange('qty', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                ref={el => inputRefs.current.qty = el}
                style={inp()}
              />
            </div>
          </div>

          {/* HALB condicional */}
          {formData.halb && (
            <div style={{ marginTop: 8 }}>
              <div style={lbl}>HALB</div>
              <input
                type="text"
                value={formData.halb}
                readOnly
                style={inp({
                  fontFamily: 'monospace',
                  fontWeight: 700,
                  background: C.hover,
                  cursor: 'not-allowed',
                  color: C.accent
                })}
              />
            </div>
          )}
        </div>

        {/* ══ LOCALIZAÇÃO ══ */}
        <div>
          <div style={section('#1a7f37')}>
            <MapPin size={12} style={{ color: '#1a7f37' }} />
            Localização
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 8, alignItems: 'start' }}>
            <div>
              <div style={lbl}>Linha *</div>
              <select
                value={formData.linhaId}
                onChange={e => handleFormChange('linhaId', e.target.value)}
                ref={el => inputRefs.current.linhaId = el}
                style={inp({ cursor: 'pointer' })}
              >
                <option value="">Selecione...</option>
                {linhas.map(l => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <div style={lbl}>
                <Clock size={11} />
                Turno *
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['1T', '2T', '3T'].map(t => (
                  <button
                    key={t}
                    onClick={() => handleFormChange('turno', t)}
                    style={toggle(formData.turno === t, '#1a7f37')}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={lbl}>Origem</div>
              <select
                value={formData.origemId}
                onChange={e => handleFormChange('origemId', e.target.value)}
                ref={el => inputRefs.current.origemId = el}
                style={inp({ minWidth: 110, cursor: 'pointer' })}
              >
                <option value="">Nenhuma</option>
                {origens.map(o => (
                  <option key={o.id} value={o.id}>{o.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ══ FALHA ══ */}
        <div>
          <div style={section('#9a6700')}>
            <AlertTriangle size={12} style={{ color: '#9a6700' }} />
            Falha
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <div style={lbl}>Equipamento</div>
              <select
                value={formData.equipamentoId}
                onChange={e => {
                  handleFormChange('equipamentoId', e.target.value);
                  const selected = equipamentos.find(eq => eq.id == e.target.value);
                  if (!selected?.nome?.toLowerCase().includes('outros')) {
                    setObservacaoEquipamento('');
                  }
                }}
                ref={el => inputRefs.current.equipamentoId = el}
                style={inp({ cursor: 'pointer' })}
              >
                <option value="">Selecione...</option>
                {equipamentos.map(e => (
                  <option key={e.id} value={e.id}>{e.nome}</option>
                ))}
              </select>
              {eqOtros && (
                <input
                  type="text"
                  placeholder="Descreva o equipamento..."
                  value={observacaoEquipamento}
                  onChange={e => setObservacaoEquipamento(e.target.value)}
                  style={inp({
                    marginTop: 6,
                    border: `1px solid ${!observacaoEquipamento ? C.warning : C.border}`
                  })}
                />
              )}
            </div>
            <div>
              <div style={lbl}>Causa *</div>
              <select
                value={formData.causaId}
                onChange={e => {
                  handleFormChange('causaId', e.target.value);
                  const selected = causas.find(c => c.id == e.target.value);
                  if (!selected?.nome?.toLowerCase().includes('outros')) {
                    setObservacaoCausa('');
                  }
                }}
                ref={el => inputRefs.current.causaId = el}
                style={inp({ cursor: 'pointer' })}
              >
                <option value="">Selecione...</option>
                {causas.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {causaOtros && (
                <input
                  type="text"
                  placeholder="Descreva a causa..."
                  value={observacaoCausa}
                  onChange={e => setObservacaoCausa(e.target.value)}
                  style={inp({
                    marginTop: 6,
                    border: `1px solid ${!observacaoCausa ? C.warning : C.border}`
                  })}
                />
              )}
            </div>
          </div>
        </div>

        {/* ══ ANÁLISE ══ */}
        <div>
          <div style={section('#cf222e')}>
            <HelpCircle size={12} style={{ color: '#cf222e' }} />
            Análise
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div>
              <div style={lbl}>
                <HelpCircle size={11} />
                Causa Raiz *
              </div>
              <textarea
                placeholder="Descreva a causa raiz..."
                value={formData.causaRaiz}
                onChange={e => handleFormChange('causaRaiz', e.target.value)}
                ref={el => inputRefs.current.causaRaiz = el}
                rows={3}
                style={inp({
                  height: 'auto',
                  padding: '8px 10px',
                  resize: 'vertical',
                  minHeight: 68
                })}
              />
            </div>
            <div>
              <div style={lbl}>
                <CheckCircle size={11} />
                Ação Corretiva *
              </div>
              <textarea
                placeholder="Ação tomada..."
                value={formData.acaoCorretiva}
                onChange={e => handleFormChange('acaoCorretiva', e.target.value)}
                ref={el => inputRefs.current.acaoCorretiva = el}
                rows={3}
                style={inp({
                  height: 'auto',
                  padding: '8px 10px',
                  resize: 'vertical',
                  minHeight: 68
                })}
              />
            </div>
          </div>
          <div>
            <div style={lbl}>
              <ShieldAlert size={11} />
              Contramedida *
            </div>
            <textarea
              placeholder="Como evitar reincidência..."
              value={formData.contramedida}
              onChange={e => handleFormChange('contramedida', e.target.value)}
              ref={el => inputRefs.current.contramedida = el}
              rows={2}
              style={inp({
                height: 'auto',
                padding: '8px 10px',
                resize: 'vertical',
                minHeight: 52
              })}
            />
          </div>
        </div>

        {/* ══ BARRA DE PROGRESSO ══ */}
        <div style={{
          background: C.card2,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 12,
          marginBottom: 8
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted }}>Preenchimento</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: progressPercent === 100 ? C.success : C.accent }}>
              {filledCount}/{required.length} campos
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: C.divider, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 4,
              background: progressPercent === 100
                ? `linear-gradient(90deg, #22c55e, #16a34a)`
                : `linear-gradient(90deg, ${C.accent}, #58a6ff)`,
              width: `${progressPercent}%`,
              transition: 'width 0.3s'
            }} />
          </div>
          {progressPercent === 100 && employee && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 8,
              padding: '6px 10px',
              background: `${C.success}18`,
              borderRadius: 6,
              border: `1px solid ${C.success}40`
            }}>
              <CheckCircle2 size={13} style={{ color: C.success }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: C.success }}>Pronto para salvar</span>
            </div>
          )}
        </div>

        {/* ══ BOTÃO SALVAR ══ */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            width: '100%',
            height: 44,
            borderRadius: 8,
            border: 'none',
            cursor: saving ? 'not-allowed' : 'pointer',
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: saving ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {saving ? (
            <RefreshCw size={15} style={{ animation: '_spin 1s linear infinite' }} />
          ) : (
            <Save size={15} />
          )}
          {saving ? 'Salvando...' : 'Salvar Registro de Scrap'}
        </button>
      </div>
    </div>
  );
};

export default RegistroForm;
