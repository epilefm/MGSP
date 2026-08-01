import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, notification, Pagination } from 'antd';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import { Typography } from '@mui/material';

import './BadHead.css';
import { Helmet } from 'react-helmet';
import { ExportToExcel } from '../../Excel/Excel_Export';
import BadHead_graf1 from './BadHead_graf1';

const BadHeadTable = () => {
    const [data, setData] = useState([]);
    const [api, contextHolder] = notification.useNotification();

    useEffect(() => {
        axios.get('http://105.103.112.18:8080/Bad_headComm')
            .then(response => setData(response.data))
            .catch(error => console.error(error));
    }, []);

    const showNotification = (description) => {
        api.open({
            message: 'Descrição Completa do Defeito',
            description: (
                <div style={{
                    textAlign: 'left',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '10px',
                    whiteSpace: 'pre-wrap'
                }}>
                    {description}
                </div>
            ),
            duration: 4.5,
            placement: 'topRight',
            showProgress: true,
            style: { width: 600 },
        });
    };

    function handleClick(event) {
        console.info('You clicked a breadcrumb.');
    }

    const columns = [
        {
            title: 'Registro',
            dataIndex: 'Periodo',
            key: 'Linha',
            align: 'center',
            width: '170px',
        },
        {
            title: 'Linha',
            dataIndex: 'Linha',
            key: 'Linha',
            align: 'center',
            width: '100px',
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
        },
        {
            title: 'Data do Defeito',
            dataIndex: 'Data',
            key: 'Data',
            align: 'center',
        },
        {
            title: 'Horário do Defeito',
            dataIndex: 'Hora',
            key: 'Hora',
            align: 'center',
        },
        {
            title: 'Periodo',
            dataIndex: 'Tempo',
            key: 'Tempo',
            align: 'center',
        },
        {
            title: 'Descrição do defeito',
            dataIndex: 'Observacao',
            key: 'Tempo',
            align: 'center',
            render: (text) => (
                <div
                    style={{
                        overflow: 'scrollX',
                        textAlign: 'left',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        color: '#000000',
                        textDecoration: 'underline'
                    }}
                    onClick={() => showNotification(text)}
                >
                    {text}
                </div>
            ),
        },
    ];

    const calculateHours = (time) => {
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours + minutes / 60 + seconds / 3600;
    };

    const totalRows = data.length;

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
        <div className="badhead-table-container">
            {contextHolder}
            <Helmet>
                <title>Nozzle Skip</title>
            </Helmet>

            <Breadcrumbs aria-label="breadcrumb" style={{ marginTop: 5 }}>
                <Link underline="hover" color="inherit" href="BadHead" onClick={handleClick}>
                    Bad Head Status
                </Link>
                <Typography sx={{ color: 'text.primary' }}>Histórico de BadHead</Typography>
            </Breadcrumbs>

            <h1 style={{ textAlign: 'center', marginBottom: '-20px' }}>Monitoramento de Nozzle Skips</h1>

            <span style={{ marginLeft: '-85%' }}>
                <ExportToExcel apiData={data} fileName={fileName} />
            </span>

            <span className="total-box">Total de Nozzle Skip: {totalRows}</span>

            <Table
                columns={columns}
                dataSource={alarmData}
                pagination={{
                    total: totalRows,
                    defaultPageSize: 10,
                    pageSizeOptions: ['10', '20', '50', '100'],
                    showSizeChanger: true,
                    onChange: (page, pageSize) => console.log(page, pageSize),
                    onShowSizeChange: (current, size) => console.log(current, size),
                    showTotal: (total, range) => `${range[0]}-${range[1]} de ${total} itens`,
                    itemRender: (page, type, originalElement) => (
                        <span>
                            {type === "prev" && <span>Anterior</span>}
                            {type === "next" && <span>Próximo</span>}
                            {type !== "prev" && type !== "next" && originalElement}
                        </span>
                    )
                }}
                className="badhead-table"
                scroll={{ x: 'max-content' }}
                rowKey="key"
            />
        </div>
    );
};

export default BadHeadTable;