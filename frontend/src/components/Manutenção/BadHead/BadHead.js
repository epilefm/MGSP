import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { Table, Modal, Form, Input, Button } from 'antd';
import './BadHead.css';
import { Helmet } from 'react-helmet';
import { ExportToExcel } from '../../Excel/Excel_Export';
import BadHead_graf1 from './BadHead_graf1';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { Typography } from '@mui/material';
import Header from '../../Layout/MGSPHead/Header';

const BadHeadTable = () => {
    const [data, setData] = useState([]);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState(null);
    const [comentario, setComentario] = useState('');
    const [allComments, setAllComments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Função unificada para carregar dados
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // Carrega dados principais
            const mainResponse = await axios.get('http://105.103.112.18/BadHead');
            setData(mainResponse.data);
            
            // Carrega comentários
            const commentsResponse = await axios.get('http://105.103.112.18/Bad_headComm');
            setAllComments(commentsResponse.data);
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // Carrega dados inicialmente
        fetchData();

        // Configura intervalo para atualizar a cada 5 minutos
        const intervalId = setInterval(fetchData, 300000);

        // Limpa intervalo ao desmontar
        return () => clearInterval(intervalId);
    }, [fetchData]);

    const handleOpenModal = (record) => {
        setCurrentRecord(record);
        setIsModalVisible(true);
        
        // Encontra comentário mais recente
        const commentForRecord = allComments.find(comment => 
            comment.Linha === record.Linha &&
            comment.Equipamento === record.Equipamento &&
            comment.TBL === record.TBL &&
            comment.Head === record.Head
        );
        
        setComentario(commentForRecord ? commentForRecord.Observacao : '');
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setComentario('');
    };

    const handleSubmit = async () => {
        try {
            // Salva novo comentário
            await axios.post('http://105.103.112.18/Bad_headCom', {
                linha: currentRecord.Linha,
                equipamento: currentRecord.Equipamento,
                tbl: currentRecord.TBL,
                head: currentRecord.Head,
                status: currentRecord.Status,
                data: currentRecord.Data,
                hora: currentRecord.Hora,
                tempo: currentRecord.Tempo,
                observacao: comentario,
            });
            
            // Atualiza comentários
            const response = await axios.get('http://105.103.112.18/Bad_headComm');
            setAllComments(response.data);
            
            // Atualiza dados principais
            const mainResponse = await axios.get('http://105.103.112.18/BadHead');
            setData(mainResponse.data);
            
            setIsModalVisible(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
        }
    };

    const saveComentario = async (record) => {
        try {
            await axios.post('http://105.103.112.18/Bad_headCom', {
                linha: record.Linha,
                equipamento: record.Equipamento,
                tbl: record.TBL,
                head: record.Head,
                status: record.Status,
                data: record.Data,
                hora: record.Hora,
                tempo: record.Tempo,
                observacao: comentario,
            });
            setData(await axios.get('http://105.103.112.18/BadHead').then(res => res.data));
        } catch (error) {
            console.error('Erro ao salvar:', error);
        }
    };

    function handleClick(event) {
        console.info('You clicked a breadcrumb.');
    }

    const columns = [
        {
            title: 'Linha',
            dataIndex: 'Linha',
            key: 'Linha',
            align: 'center',
        },
        {
            title: 'Equipamento',
            dataIndex: 'Equipamento',
            key: 'Equipamento',
            align: 'center',
        },
        {
            title: 'TBL',
            dataIndex: 'TBL',
            key: 'TBL',
            align: 'center',
        },
        {
            title: 'Nozzle',
            dataIndex: 'Head',
            key: 'Head',
            align: 'center',
        },
        {
            title: 'Status',
            dataIndex: 'Status',
            key: 'Status',
            align: 'center',
            render: (status, record) => {
                const hasComment = allComments.some(comment => 
                    comment.Linha === record.Linha &&
                    comment.Equipamento === record.Equipamento &&
                    comment.TBL === record.TBL &&
                    comment.Head === record.Head
                );
                
                return (
                    <div className="status-cell">
                        {status === 'Set' ? (
                            <Button 
                                className={`set ${hasComment ? 'has-comment' : ''}`} 
                                onClick={() => handleOpenModal(record)}
                            >
                                {status} {hasComment && '- Registrado'}
                            </Button>
                        ) : (
                            <Button 
                                className={`ocorrido ${hasComment ? 'has-comment' : ''}`} 
                                onClick={() => handleOpenModal(record)}
                            >
                                {status} {hasComment && '- Registrado'}
                            </Button>
                        )}
                    </div>
                );
            },
        },
        {
            title: 'Data',
            dataIndex: 'Data',
            key: 'Data',
            align: 'center',
        },
        {
            title: 'Hora',
            dataIndex: 'Hora',
            key: 'Hora',
            align: 'center',
        },
        {
            title: 'Tempo',
            dataIndex: 'Tempo',
            key: 'Tempo',
            align: 'center',
        },
        {
            title: 'Alarme',
            dataIndex: 'Alarme',
            key: 'Alarme',
            align: 'center',
            render: (alarme) => <div className="alarm-cell">{alarme}</div>,
        },
    ];

    const calculateHours = (time) => {
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours + minutes / 60 + seconds / 3600;
    };

    const alarmData = data.map(item => {
        const hours = calculateHours(item.Tempo);
        let alarme = null;
        if (item.Status === 'Set' && hours > 168) {
            alarme = <span className="alarm-box">Delay</span>;
        } else if (item.Status === 'Ocorrido' && hours > 8) {
            alarme = <span className="alarm-box">Delay</span>;
        }
        return { ...item, Alarme: alarme };
    });

    const fileName = "BadHead audit";

    return (
        <>
            <Header />
            <div className="badhead-table-container">
                <Helmet>
                    <title>Nozzle Skip</title>
                </Helmet>
                <div role="presentation" onClick={handleClick}>
                    <Breadcrumbs aria-label="breadcrumb" style={{ marginTop: 5 }}>
                        <Typography sx={{ color: 'text.primary' }}>Bad Head Status</Typography>
                        <Link underline="hover" color="inherit" href="BadHead_Lista" onClick={handleClick}>
                            Histórico de BadHead
                        </Link>
                    </Breadcrumbs>
                </div>
                <h1 style={{ textAlign: 'center', marginBottom: '-20px' }}>Monitoramento de Nozzle Skips</h1>
                <span style={{ marginLeft: '-85%' }}>
                    <ExportToExcel apiData={data} fileName={fileName} />
                </span>
                <span className="total-box">Total de Nozzle Skip: {data.length}</span>
                <BadHead_graf1 />
                <Modal
                    title="Registrar Defeito"
                    visible={isModalVisible}
                    onCancel={handleCloseModal}
                    footer={[
                        <Button key="back" onClick={handleCloseModal}>Fechar</Button>,
                        <Button key="submit" type="primary" onClick={handleSubmit}>Salvar</Button>,
                    ]}
                >
                    <Form>
                        <Form.Item label="Comentário">
                            <Input.TextArea
                                value={comentario}
                                onChange={(e) => setComentario(e.target.value)}
                                maxLength={1000}
                            />
                        </Form.Item>
                    </Form>
                </Modal>
                <Table
                    columns={columns}
                    dataSource={alarmData}
                    pagination={false}
                    className="badhead-table"
                />
            </div>
        </>
    );
};

export default BadHeadTable;
