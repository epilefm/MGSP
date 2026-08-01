import React from 'react';
import { Eye, DollarSign, CheckCircle2 } from 'lucide-react';

const RegistroPreview = ({ 
  formData, 
  employee, 
  linhas, 
  origens, 
  equipamentos, 
  causas, 
  observacaoEquipamento, 
  observacaoCausa,
  formatCurrency 
}) => {
  // Cores do tema
  const C = {
    bg: '#f6f8fa', card: '#ffffff', card2: '#f6f8fa', border: '#d0d7de',
    text: '#1f2328', textSec: '#656d76', textMuted: '#9198a1',
    accent: '#0969da', accentBg: 'rgba(9,105,218,0.08)',
    input: '#ffffff', hover: '#f6f8fa', divider: '#eaecef',
    success: '#22c55e', warning: '#f59e0b', error: '#ef4444',
  };

  // Cor dinâmica baseada no valor
  const custoColor = formData.custoTotal > 5000 ? '#ef4444' : formData.custoTotal > 1000 ? '#f59e0b' : '#22c55e';

  // Função para obter nome do equipamento
  const getEquipamentoNome = () => {
    const eq = equipamentos.find(e => e.id == formData.equipamentoId);
    if (!eq) return 'Não definido';
    if (eq.nome.toLowerCase().includes('outros') && observacaoEquipamento) {
      return `Outros - ${observacaoEquipamento}`;
    }
    return eq.nome;
  };

  // Função para obter nome da causa
  const getCausaNome = () => {
    const c = causas.find(c => c.id == formData.causaId);
    if (!c) return 'Não definido';
    if (c.nome.toLowerCase().includes('outros') && observacaoCausa) {
      return `Outros - ${observacaoCausa}`;
    }
    return c.nome;
  };

  // Componente pRow
  const pRow = (label, val, mono) => (
    <div key={label} style={{
      display: 'grid',
      gridTemplateColumns: '40% 60%',
      gap: 4,
      padding: '4px 0',
      borderBottom: `1px solid ${C.divider}`
    }}>
      <span style={{ fontSize: 11, color: C.textMuted, fontWeight: 500 }}>{label}</span>
      <span style={{
        fontSize: 12,
        color: val ? C.text : C.textMuted,
        fontWeight: val ? 600 : 400,
        textAlign: 'right',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: 'break-all'
      }}>
        {val || '—'}
      </span>
    </div>
  );

  // Calcular progresso
  const required = ['matricula', 'tipoScrap', 'tipoPlaca', 'modeloId', 'linhaId', 'turno', 'causaId', 'causaRaiz', 'acaoCorretiva', 'contramedida'];
  const done = required.filter(k => formData[k] && String(formData[k]).trim()).length;
  const pct = Math.round((done / required.length) * 100);

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
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* ══ CUSTO TOTAL ══ */}
        <div style={{
          borderRadius: 8,
          padding: 14,
          textAlign: 'center',
          border: `1px solid ${custoColor}30`,
          background: `${custoColor}08`
        }}>
          <div style={{
            fontSize: 10,
            fontWeight: 700,
            color: C.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 4
          }}>
            CUSTO TOTAL DO SCRAP
          </div>
          <div style={{
            fontSize: 28,
            fontWeight: 800,
            color: custoColor,
            lineHeight: 1.1,
            fontFamily: "'DM Mono', monospace"
          }}>
            {formatCurrency(formData.custoTotal)}
          </div>
          {formData.custoUnitario > 0 && (
            <div style={{ fontSize: 11, color: C.textSec, marginTop: 4 }}>
              {formData.qty || 0} × {formatCurrency(formData.custoUnitario)} / un.
            </div>
          )}
        </div>

        {/* ══ DADOS DO REGISTRO ══ */}
        <div style={{
          background: C.card2,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 12
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 10,
            paddingBottom: 8,
            borderBottom: `1px solid ${C.divider}`
          }}>
            <Eye size={13} style={{ color: C.accent }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>Dados do Registro</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pRow('Responsável', employee ? `${employee.nome} (${formData.matricula})` : formData.matricula)}
            {pRow('Tipo de Scrap', formData.tipoScrap)}
            {pRow('Tipo de Placa', formData.tipoPlaca)}
            {pRow('Modelo', formData.modeloNome)}
            {formData.halb && pRow('HALB', formData.halb, true)}
            {formData.cn && pRow('CN', formData.cn, true)}
            {pRow('Quantidade', formData.qty)}
            {pRow('Linha', linhas.find(l => l.id === formData.linhaId)?.nome)}
            {pRow('Turno', formData.turno)}
            {formData.origemId && pRow('Origem', origens.find(o => o.id == formData.origemId)?.nome)}
            {formData.equipamentoId && pRow('Equipamento', getEquipamentoNome())}
            {formData.causaId && pRow('Causa', getCausaNome())}
            {formData.causaRaiz && pRow('Causa Raiz', formData.causaRaiz)}
            {formData.acaoCorretiva && pRow('Ação Corretiva', formData.acaoCorretiva)}
            {formData.contramedida && pRow('Contramedida', formData.contramedida)}
          </div>
        </div>

        {/* ══ BARRA DE PROGRESSO ══ */}
        <div style={{
          background: C.card2,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 12
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted }}>Preenchimento</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: pct === 100 ? C.success : C.accent }}>
              {done}/{required.length} campos
            </span>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: C.divider, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              borderRadius: 4,
              background: pct === 100
                ? `linear-gradient(90deg, #22c55e, #16a34a)`
                : `linear-gradient(90deg, ${C.accent}, #58a6ff)`,
              width: `${pct}%`,
              transition: 'width 0.3s'
            }} />
          </div>
          {pct === 100 && employee && (
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

        {/* ══ DATA/HORA ══ */}
        <div style={{
          textAlign: 'right',
          fontSize: 11,
          color: C.textSec,
          fontFamily: "'DM Mono', monospace",
          marginTop: 4
        }}>
          {new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </div>
  );
};

export default RegistroPreview;
