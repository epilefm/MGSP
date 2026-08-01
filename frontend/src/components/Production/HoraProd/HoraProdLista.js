import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from "xlsx";
import './HoraProd.css';

const HoraProdLista = () => {
    const [data, setData] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [selectedLinha, setSelectedLinha] = useState('');
    const [linhas, setLinhas] = useState([]);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedHorario, setSelectedHorario] = useState(null);
    const [modalText, setModalText] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`http://105.103.39.102:8080/HoraProd_Lista?date=${date}`);
                setData(response.data);
                const uniqueLinhas = [...new Set(response.data.map(item => item.linha))];
                const sortedLinhas = uniqueLinhas.sort((a, b) => a.localeCompare(b));
                setLinhas(sortedLinhas);
                setSelectedLinha('');
            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            }
        };
        fetchData();
    }, [date]);
    
    // Obter horários únicos
    const getUniqueHorarios = () => {
        const horarios = [...new Set(data.map(item => item.Horario))];
        return horarios.sort();
    };

    // Separar horários por turnos
    const getHorariosByTurno = () => {
        const horarios = getUniqueHorarios();
        const turnos = {
            '1T': [],
            '2T': [],
            '3T': []
        };
        
        horarios.forEach(horario => {
            if (horario.includes('1T')) {
                turnos['1T'].push(horario);
            } else if (horario.includes('2T')) {
                turnos['2T'].push(horario);
            } else if (horario.includes('3T')) {
                turnos['3T'].push(horario);
            }
        });
        
        return turnos;
    };

    // Mapeamento fixo de nomes para horários
    const getHorarioDisplayName = (horario) => {
        const displayNameMap = {
            '1T 1°H': '1°H',
            '1T 2°H': '2°H',
            '1T 3°H': '3°H',
            '1T 4°H': '4°H',
            '1T 5°H': '5°H',
            '1T 6°H': '6°H',
            '1T 7°H': '7°H',
            '1T 8°H': '8°H',
            '1T 9°H': '9°H',
            '1T 10°H': '10°H',
            '2T 1°H': '1°H',
            '2T 2°H': '2°H',
            '2T 3°H': '3°H',
            '2T 4°H': '4°H',
            '2T 5°H': '5°H',
            '2T 6°H': '6°H',
            '2T 7°H': '7°H',
            '2T 8°H': '8°H',
            '2T 9°H': '9°H',
            '3T 1°H': '1°H',
            '3T 2°H': '2°H',
            '3T 3°H': '3°H',
            '3T 4°H': '4°H',
            '3T 5°H': '5°H'
        };
        
        return displayNameMap[horario] || horario;
    };

    // Filtrar dados por linha
    const getFilteredData = () => {
        return selectedLinha 
            ? data.filter(item => item.linha === selectedLinha)
            : data;
    };

    // Filtrar dados por horário
    const getDataByHorario = (horario) => {
        const filtered = getFilteredData();
        return filtered.filter(item => item.Horario === horario);
    };

    const openModal = (text) => {
        setModalText(text);
        setShowModal(true);
    };

    // Renderizar tabela genérica
    const renderTable = (tableData) => {
        if (tableData.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                    Nenhum dado encontrado
                </div>
            );
        }

        return (
            <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '4px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#405cc4', color: '#fff', fontWeight: 'bold', fontSize: '12px' }}>
                            <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '70px', fontSize: '11px' }}>Data</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '70px', fontSize: '11px' }}>Linha</th>
                            <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #ddd', minWidth: '130px', fontSize: '11px' }}>Modelo</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '60px', fontSize: '11px' }}>Horário</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '50px', fontSize: '11px' }}>Target</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '50px', fontSize: '11px' }}>Atingido</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '50px', fontSize: '11px' }}>Dif.</th>
                            <th style={{ padding: '8px 6px', textAlign: 'center', borderBottom: '1px solid #ddd', minWidth: '70px', fontSize: '11px' }}>Perda (min)</th>
                            <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #ddd', minWidth: '200px', fontSize: '11px' }}>Comentário Produção</th>
                            <th style={{ padding: '8px 6px', textAlign: 'left', borderBottom: '1px solid #ddd', minWidth: '200px', fontSize: '11px' }}>Comentário Manutenção</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tableData.map((row, index) => (
                            <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9', borderBottom: '1px solid #e0e0e0' }}>
                                <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: '11px' }}>{row.data}</td>
                                <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: '11px', fontWeight: '500' }}>{row.linha}</td>
                                <td style={{ padding: '7px 6px', textAlign: 'left', fontSize: '11px' }}>{row.modelo}</td>
                                <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: '11px', fontWeight: '500' }}>{getHorarioDisplayName(row.Horario)}</td>
                                <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: '11px', fontWeight: '500' }}>{row.target}</td>
                                <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: '11px', fontWeight: '500' }}>{row.actual}</td>
                                <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: '11px', color: row.difference > 0 ? '#d32f2f' : '#388e3c', fontWeight: '600' }}>{Math.abs(row.difference)}</td>
                                <td style={{ padding: '7px 6px', textAlign: 'center', fontSize: '11px', color: row.loss_minutes > 0 ? '#d32f2f' : '#388e3c', fontWeight: '600' }}>{row.loss_minutes ? Math.abs(row.loss_minutes).toFixed(2) : '-'}</td>
                                <td style={{ padding: '7px 6px', textAlign: 'left', fontSize: '11px', cursor: row.comentario ? 'pointer' : 'default', color: row.comentario ? '#1976d2' : '#999' }} onClick={() => row.comentario && openModal(row.comentario)}>
                                    {row.comentario ? '📝 ' + (row.comentario.length > 50 ? row.comentario.substring(0, 50) + '...' : row.comentario) : '-'}
                                </td>
                                <td style={{ padding: '7px 6px', textAlign: 'left', fontSize: '11px', cursor: row.comentario_manutencao ? 'pointer' : 'default', color: row.comentario_manutencao ? '#1976d2' : '#999' }} onClick={() => row.comentario_manutencao && openModal(row.comentario_manutencao)}>
                                    {row.comentario_manutencao ? '📝 ' + (row.comentario_manutencao.length > 50 ? row.comentario_manutencao.substring(0, 50) + '...' : row.comentario_manutencao) : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };


    // Dados filtrados
    const filteredData = getFilteredData();
    const horariosPorTurno = getHorariosByTurno();

    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            {/* Título */}
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a1a2e', marginBottom: '20px', letterSpacing: '-0.3px', marginTop: '0' }}>
                Histórico de Registros
            </h2>

            {/* Toolbar */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fff',
                padding: '12px 16px',
                borderRadius: '8px',
                marginBottom: '20px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        border: '1px solid #e0e0e0'
                    }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" style={{ marginRight: '4px', color: '#666', flexShrink: 0 }}>
                            <path fill="currentColor" d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2m0 16H5V10h14z"/>
                        </svg>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            style={{
                                border: 'none',
                                outline: 'none',
                                fontSize: '13px',
                                fontWeight: '500',
                                backgroundColor: 'transparent',
                                color: '#333',
                                width: '130px',
                                padding: '2px 0'
                            }}
                        />
                    </div>

                    <select
                        value={selectedLinha}
                        onChange={(e) => setSelectedLinha(e.target.value)}
                        style={{
                            backgroundColor: '#f5f5f5',
                            border: '1px solid #e0e0e0',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            color: '#333'
                        }}
                    >
                        <option value="">Todas as Linhas</option>
                        {linhas.map(linha => (
                            <option key={linha} value={linha}>{linha}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => {
                        const fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";
                        const fileExtension = ".xlsx";
                        const ws = XLSX.utils.json_to_sheet(filteredData);
                        const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
                        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
                        const data = new Blob([excelBuffer], { type: fileType });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(data);
                        link.href = url;
                        link.download = `Hora_Mounter_Historico_${date}${fileExtension}`;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        setTimeout(() => URL.revokeObjectURL(url), 100);
                    }}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        backgroundColor: '#f0f4f8',
                        border: '1px solid #c8ccd0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        color: '#333',
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#d6e4f0';
                        e.currentTarget.style.borderColor = '#90b0d0';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f4f8';
                        e.currentTarget.style.borderColor = '#c8ccd0';
                    }}
                    title="Exportar para Excel"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" fill="#1D6F42" opacity="0.15"/>
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="#1D6F42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                        <path d="M14 2v6h6" stroke="#1D6F42" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Exportar Excel
                </button>
            </div>

            {/* Abas de Turno */}
            <div style={{ backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                {/* Abas */}
                <div style={{ display: 'flex', borderBottom: '2px solid #e0e0e0', backgroundColor: '#fafafa' }}>
                    {['all', '1T', '2T', '3T'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                flex: 1,
                                padding: '10px 12px',
                                fontSize: '12px',
                                fontWeight: activeTab === tab ? '700' : '500',
                                border: 'none',
                                backgroundColor: activeTab === tab ? '#fff' : 'transparent',
                                color: activeTab === tab ? '#393D7E' : '#666',
                                borderBottom: activeTab === tab ? '2px solid #393D7E' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                marginBottom: activeTab === tab ? '-2px' : '0'
                            }}
                        >
                            {tab === 'all'
                                ? 'Todos os Registros'
                                : `${tab} (${horariosPorTurno[tab]?.length || 0})`
                            }
                        </button>
                    ))}
                </div>

                {/* Conteúdo das Abas */}
                <div style={{ padding: '16px' }}>
                    {activeTab === 'all' && renderTable(filteredData)}

                    {activeTab !== 'all' && (
                        <div>
                            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                {horariosPorTurno[activeTab]?.map(horario => (
                                    <button
                                        key={horario}
                                        onClick={() => setSelectedHorario(selectedHorario === horario ? null : horario)}
                                        style={{
                                            padding: '6px 12px',
                                            fontSize: '11px',
                                            fontWeight: '500',
                                            border: '1px solid',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            backgroundColor: selectedHorario === horario ? '#393D7E' : '#f5f5f5',
                                            color: selectedHorario === horario ? '#fff' : '#333',
                                            borderColor: selectedHorario === horario ? '#393D7E' : '#e0e0e0',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {getHorarioDisplayName(horario)} ({getDataByHorario(horario).length})
                                    </button>
                                ))}
                            </div>

                            {selectedHorario
                                ? renderTable(getDataByHorario(selectedHorario))
                                : (
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                                        gap: '10px'
                                    }}>
                                        {horariosPorTurno[activeTab]?.map(horario => (
                                            <div
                                                key={horario}
                                                style={{
                                                    backgroundColor: '#f9f9f9',
                                                    padding: '10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid #e0e0e0',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    fontSize: '12px'
                                                }}
                                                onClick={() => setSelectedHorario(horario)}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                                            >
                                                <div style={{ fontWeight: '600', color: '#393D7E', marginBottom: '3px', fontSize: '12px' }}>
                                                    {getHorarioDisplayName(horario)}
                                                </div>
                                                <div style={{ color: '#666', fontSize: '11px' }}>
                                                    {getDataByHorario(horario).length} registro{getDataByHorario(horario).length !== 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Comentários */}
            {showModal && (
                <div
                    onClick={() => setShowModal(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2000,
                        backdropFilter: 'blur(2px)'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'auto',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                        }}
                    >
                        <div style={{
                            backgroundColor: '#393D7E',
                            color: '#fff',
                            padding: '12px 16px',
                            fontSize: '14px',
                            fontWeight: '600',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            Descrição Completa
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    padding: '0',
                                    lineHeight: '1'
                                }}
                            >
                                ×
                            </button>
                        </div>
                        <div style={{
                            padding: '16px',
                            whiteSpace: 'pre-wrap',
                            wordWrap: 'break-word',
                            color: '#333',
                            fontSize: '12px',
                            lineHeight: '1.5'
                        }}>
                            {modalText}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HoraProdLista;
