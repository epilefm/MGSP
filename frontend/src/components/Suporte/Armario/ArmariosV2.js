import { API_URL } from '../../../config/api';
import React, { useState, useEffect } from 'react';
import Header from '../../Layout/MGSPHead/Header';
import './ArmariosV2.css';

const ArmariosV2 = () => {
  const [armarios, setArmarios] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [selectedArmario, setSelectedArmario] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para o formulário
  const [formData, setFormData] = useState({
    numero_armario: '',
    numero_real: '',
    pessoa_id: '',
    funcionario: '',
    matricula: '',
    turno: '',
    cargo: '',
    departamento: ''
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadArmarios();
    loadPessoas();
    
    // Carregar números dos armários salvos do localStorage
    const savedNumbers = localStorage.getItem('armarioNumbers');
    if (savedNumbers) {
      setArmarioNumbers(JSON.parse(savedNumbers));
    }
  }, []);

      // Função para carregar armários
      const loadArmarios = async () => {
        try {
          const response = await fetch(`${API_URL}/armarios`);
          const data = await response.json();
          setArmarios(data);
        } catch (error) {
          console.error('Erro ao carregar armários:', error);
        }
      };

  // Função para carregar pessoas
  const loadPessoas = async () => {
    try {
      const response = await fetch(`${API_URL}/pessoas`);
      const data = await response.json();
      setPessoas(data);
    } catch (error) {
      console.error('Erro ao carregar pessoas:', error);
    }
  };

  // Função para abrir modal
  const openModal = (armario = null) => {
    if (armario) {
      setSelectedArmario(armario);
      setFormData({
        numero_armario: armario.numero_armario || '',
        numero_real: armario.numero_real || '',
        pessoa_id: armario.pessoa_id || '',
        funcionario: armario.funcionario || '',
        matricula: armario.matricula || '',
        turno: armario.turno || '',
        cargo: armario.cargo || '',
        departamento: armario.departamento || ''
      });
    } else {
      setSelectedArmario(null);
      setFormData({
        numero_armario: '',
        numero_real: '',
        pessoa_id: '',
        funcionario: '',
        matricula: '',
        turno: '',
        cargo: '',
        departamento: ''
      });
    }
    setIsModalOpen(true);
  };

  // Função para fechar modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedArmario(null);
  };

  // Função para lidar com mudanças no formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Preencher dados automaticamente quando selecionar uma pessoa
    if (name === 'pessoa_id' && value) {
      const pessoa = pessoas.find(p => p.id == value);
      if (pessoa) {
        setFormData({
          ...formData,
          pessoa_id: value,
          funcionario: pessoa.funcionarios || '',
          matricula: pessoa.matricula || '',
          turno: pessoa.turno || '',
          cargo: pessoa.cargo || '',
          departamento: pessoa.departamento || ''
        });
      }
    }
    
    // Preencher dados automaticamente quando digitar a matrícula
    if (name === 'matricula' && value) {
      const pessoa = pessoas.find(p => p.matricula == value);
      if (pessoa) {
        setFormData({
          ...formData,
          pessoa_id: pessoa.id || '',
          funcionario: pessoa.funcionarios || '',
          matricula: pessoa.matricula || '',
          turno: pessoa.turno || '',
          cargo: pessoa.cargo || '',
          departamento: pessoa.departamento || ''
        });
      }
    }
  };

  // Função para salvar armário
  const saveArmario = async () => {
    try {
      const url = `${API_URL}/armario/${formData.numero_armario}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        await loadArmarios();
        closeModal();
        alert('Armário salvo com sucesso!');
      } else {
        throw new Error(result.error || 'Erro ao salvar armário');
      }
    } catch (error) {
      console.error('Erro ao salvar armário:', error);
      alert(error.message || 'Erro ao salvar armário');
    }
  };

  // Função para liberar armário
  const liberarArmario = async (numero_armario) => {
    if (window.confirm('Tem certeza que deseja liberar este armário?')) {
      try {
        const response = await fetch(`${API_URL}/armario/${numero_armario}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          await loadArmarios();
          alert('Armário liberado com sucesso!');
        } else {
          throw new Error('Erro ao liberar armário');
        }
      } catch (error) {
        console.error('Erro ao liberar armário:', error);
        alert('Erro ao liberar armário');
      }
    }
  };

  // Função para filtrar armários
  const filteredArmarios = armarios.filter(armario => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      armario.numero_armario.toString().includes(term) ||
      (armario.funcionario && armario.funcionario.toLowerCase().includes(term)) ||
      (armario.matricula && armario.matricula.toLowerCase().includes(term))
    );
  });

  // Estados para edição de números dos armários
  const [editingNumbers, setEditingNumbers] = useState(false);
  const [armarioNumbers, setArmarioNumbers] = useState({});

  // Função para alternar modo de edição de números
  const toggleEditingNumbers = () => {
    setEditingNumbers(!editingNumbers);
    // Inicializar números dos armários se estiver entrando no modo de edição
    if (!editingNumbers) {
      const numbers = {};
      // Carregar números atuais dos armários do banco de dados
      armarios.forEach(armario => {
        // Encontrar a posição do armário na grade
        for (let blocoIndex = 0; blocoIndex < 9; blocoIndex++) {
          for (let linha = 1; linha <= 10; linha++) {
            for (let coluna = 1; coluna <= 4; coluna++) {
              const numeroArmarioPadrao = (blocoIndex * 40) + ((coluna - 1) * 10) + linha;
              if (parseInt(armario.numero_armario) === numeroArmarioPadrao) {
                const chave = `${blocoIndex}-${linha}-${coluna}`;
                numbers[chave] = armario.numero_armario;
                break;
              }
            }
          }
        }
      });
      setArmarioNumbers(numbers);
    }
  };

  // Função para lidar com mudança de número de armário
  const handleArmarioNumberChange = (blocoIndex, linha, coluna, value) => {
    const chave = `${blocoIndex}-${linha}-${coluna}`;
    setArmarioNumbers({
      ...armarioNumbers,
      [chave]: value
    });
  };

  // Função para salvar números dos armários
  const saveArmarioNumbers = async () => {
    try {
      // Salvar números personalizados no localStorage
      localStorage.setItem('armarioNumbers', JSON.stringify(armarioNumbers));
      
      // Atualizar armários no banco de dados se necessário
      // Esta parte pode ser expandida para atualizar os números no backend
      // Por enquanto, apenas recarregamos os armários para refletir as mudanças
      await loadArmarios();
      
      setEditingNumbers(false);
      alert('Números dos armários salvos com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar números dos armários:', error);
      alert('Erro ao salvar números dos armários');
    }
  };

  // Renderizar grade de armários (estrutura original: 9 blocos de 4 colunas x 10 linhas)
  const renderGrid = () => {
    const blocos = [];
    
    // Criar 9 blocos
    for (let blocoIndex = 0; blocoIndex < 9; blocoIndex++) {
      const armariosBloco = [];
      
      // Cada bloco tem 4 colunas e 10 linhas (40 armários)
      // Numeração por coluna: 1, 2, 3, ..., 10 na primeira coluna, depois 11, 12, ..., 20 na segunda, etc.
      for (let linha = 1; linha <= 10; linha++) {
        const linhaArmarios = [];
        
        for (let coluna = 1; coluna <= 4; coluna++) {
          // Calcular o número do armário (numeração por coluna)
          const chave = `${blocoIndex}-${linha}-${coluna}`;
          const numeroArmarioPadrao = (blocoIndex * 40) + ((coluna - 1) * 10) + linha;
          const numeroArmario = editingNumbers 
            ? (armarioNumbers[chave] || numeroArmarioPadrao)
            : numeroArmarioPadrao;
          
          const armario = armarios.find(a => parseInt(a.numero_armario) === parseInt(numeroArmario));
          
          linhaArmarios.push(
            <div 
              key={`${blocoIndex}-${linha}-${coluna}`}
              className={`armario-card ${armario?.pessoa_id ? 'ocupado' : 'livre'}`}
              onClick={() => !editingNumbers && openModal(armario || { numero_armario: numeroArmario })}
            >
              {editingNumbers ? (
                <input
                  type="number"
                  className="armario-numero-input"
                  value={numeroArmario}
                  onChange={(e) => handleArmarioNumberChange(blocoIndex, linha, coluna, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="armario-numero">#{armario?.numero_real || numeroArmario}</div>
              )}
              {armario?.pessoa_id ? (
                <div className="armario-info">
                  <div className="armario-nome">{armario.funcionario}</div>
                  {/* <div className="armario-matricula">{armario.matricula}</div>
                  <div className="armario-turno">{armario.turno}</div> */}
                </div>
              ) : (
                <div className="armario-livre">Livre</div>
              )}
            </div>
          );
        }
        
        armariosBloco.push(
          <div key={`linha-${blocoIndex}-${linha}`} className="armario-row">
            {linhaArmarios}
          </div>
        );
      }
      
      blocos.push(
        <div key={`bloco-${blocoIndex}`} className="armario-bloco">
          <h3>Bloco {blocoIndex + 1}</h3>
          <div className="armario-bloco-content">
            {armariosBloco}
          </div>
        </div>
      );
    }
    
    return blocos;
  };

  // Renderizar lista de armários em formato de tabela
  const renderList = () => {
    if (filteredArmarios.length === 0) {
      return (
        <div className="armarios-list-container">
          <div className="table-empty">
            <h3>Nenhum armário encontrado</h3>
            <p>Não há armários que correspondam aos critérios de busca.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="armarios-list-container">
        <table className="armarios-table">
          <thead>
            <tr>
              <th>Número</th>
              <th>Status</th>
              <th>Nome</th>
              <th>Matrícula</th>
              {/* <th>Turno</th> */}
              {/* <th>Cargo</th>
              <th>Departamento</th> */}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredArmarios.map(armario => (
              <tr 
                key={armario.numero_armario} 
                className={armario.pessoa_id ? 'ocupado' : 'livre'}
              >
                <td>#{armario.numero_real || armario.numero_armario}</td>
                <td>
                  <span className={`status-badge ${armario.pessoa_id ? 'ocupado' : 'livre'}`}>
                    {armario.pessoa_id ? 'Ocupado' : 'Livre'}
                  </span>
                </td>
                <td>{armario.funcionario || '-'}</td>
                <td>{armario.matricula || '-'}</td>
                 {/* <td>{armario.turno || '-'}</td> */}
               {/* <td>{armario.cargo || '-'}</td>
                <td>{armario.departamento || '-'}</td> */}
                <td>
                  <div className="table-actions">
                    <button 
                      className="btn-table-edit"
                      onClick={() => openModal(armario)}
                    >
                      Editar
                    </button>
                    {armario.pessoa_id && (
                      <button 
                        className="btn-table-liberar"
                        onClick={() => liberarArmario(armario.numero_armario)}
                      >
                        Liberar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
<>
      <Header />
<div className="armarios-v2-container">
      <div className="armarios-v2-header">
        <h1>Gerenciamento de Armários </h1>
        <div className="armarios-v2-controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar armário, funcionário ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="view-toggle">
            <button 
              className={viewMode === 'grid' ? 'active' : ''}
              onClick={() => setViewMode('grid')}
            >
              Grade
            </button>
            <button 
              className={viewMode === 'list' ? 'active' : ''}
              onClick={() => setViewMode('list')}
            >
              Lista
            </button>
          </div>
          {viewMode === 'grid' && (
            <button 
              className={editingNumbers ? 'btn-secondary' : 'btn-primary'}
              onClick={editingNumbers ? saveArmarioNumbers : toggleEditingNumbers}
            >
              {editingNumbers ? 'Salvar Números' : 'Editar Números'}
            </button>
          )}
          <button className="btn-primary" onClick={() => openModal()}>
            + Novo Registro
          </button>
        </div>
      </div>

      <div className="armarios-v2-content">
        {viewMode === 'grid' ? (
          <div className="armarios-grid">
            {renderGrid()}
          </div>
        ) : (
          <div className="armarios-list-container">
            {renderList()}
          </div>
        )}
      </div>

      {/* Modal para edição/criação */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedArmario ? 'Editar Armário' : 'Atribuir Armário'}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Número do Armário:</label>
                <input
                  type="number"
                  name="numero_armario"
                  value={formData.numero_armario}
                  onChange={handleInputChange}
                  disabled={!!selectedArmario}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Número Real do Armário:</label>
                <input
                  type="text"
                  name="numero_real"
                  value={formData.numero_real}
                  onChange={handleInputChange}
                />
              </div>
              
              
              <div className="form-row">
                <div className="form-group">
                  <label>Matrícula:</label>
                  <input
                    type="text"
                    name="matricula"
                    value={formData.matricula}
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const pessoa = pessoas.find(p => p.matricula == e.target.value);
                        if (pessoa) {
                          setFormData({
                            ...formData,
                            matricula: pessoa.matricula || '',
                            pessoa_id: pessoa.id || '',
                            funcionario: pessoa.funcionarios || '',
                            turno: pessoa.turno || '',
                            cargo: pessoa.cargo || '',
                            departamento: pessoa.departamento || ''
                          });
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const pessoa = pessoas.find(p => p.matricula == e.target.value);
                      if (pessoa) {
                        setFormData({
                          ...formData,
                          matricula: pessoa.matricula || '',
                          pessoa_id: pessoa.id || '',
                          funcionario: pessoa.funcionarios || '',
                          turno: pessoa.turno || '',
                          cargo: pessoa.cargo || '',
                          departamento: pessoa.departamento || ''
                        });
                      }
                    }}
                    required
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Nome:</label>
                  <input
                    type="text"
                    name="funcionario"
                    value={formData.funcionario}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* <div className="form-group">
                  <label>Turno:</label>
                  <input
                    type="text"
                    name="turno"
                    value={formData.turno}
                    onChange={handleInputChange}
                  />
                </div> */}
                
                {/* <div className="form-group">
                  <label>Cargo:</label>
                  <input
                    type="text"
                    name="cargo"
                    value={formData.cargo}
                    onChange={handleInputChange}
                  />
                </div> */}
              </div>
              
              {/* <div className="form-group">
                <label>Departamento:</label>
                <input
                  type="text"
                  name="departamento"
                  value={formData.departamento}
                  onChange={handleInputChange}
                />
              </div> */}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeModal}>
                Cancelar
              </button>
              {selectedArmario && selectedArmario.pessoa_id && (
                <button 
                  className="btn-danger" 
                  onClick={() => {
                    if (window.confirm('Tem certeza que deseja liberar este armário?')) {
                      liberarArmario(selectedArmario.numero_armario);
                      closeModal();
                    }
                  }}
                  style={{marginRight: '10px'}}
                >
                  Liberar Armário
                </button>
              )}
              <button className="btn-primary" onClick={saveArmario}>
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
 </>
  );
};

export default ArmariosV2;
