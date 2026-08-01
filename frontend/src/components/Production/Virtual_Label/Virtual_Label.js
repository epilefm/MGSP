import { API_URL } from '../../../config/api';
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Table, Modal } from 'antd';
import { ConfigProvider } from 'antd';
import { ExportToExcel } from '../../Excel/Excel_Export';
import NavbarComp from '../../Layout/NavbarComp';
import { Col, Row } from 'react-bootstrap';
import styled from 'styled-components'; 
import { calc } from 'antd/es/theme/internal';
import './VirtualL_Modal.css'; // Importe o arquivo CSS aqui
import VirtualL_Modal from './VirtualL_Modal'; // Ajuste o caminho conforme necessário

const Container = styled.div`
  height: 100vh;
  overflow: auto;
  font-size: 25px;
  width: 80%;
  margin: 0 auto;
  justify-content: center; /* Adicione esta linha */

`;

const InputDate = styled.input`
  font-size: 12px;
  margin-left: 15px;
  margin-top: -35px;
`;

const StyledTable = styled(Table)`
  .ant-table-thead > tr > th {
    height: 30px; 
    padding: 5px; 
  }
`;

const CustomModal = styled(Modal)`
  &.customModalStyles {
    width: 800px; // Ajuste a largura aqui
  }
`;

const TestDataTable = () => {
  const [testData, setTestData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPO, setSelectedPO] = useState(null);
  const [magData, setMagData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [totalPO, setTotalPO] = useState(0);
  const [selectedMagNo, setSelectedMagNo] = useState(null);
  const [labelData, setLabelData] = useState(null);
  const [labelModalVisible, setLabelModalVisible] = useState(false);

  const fileName = "ESD Data";

  useEffect(() => {
    axios.get(`${API_URL}/getLabel`)
      .then(response => setTestData(response.data))
      .catch(error => console.error("Erro ao recuperar dados da API:", error));
  }, []);

  useEffect(() => {
    if (magData.length > 0) {
      const sum = magData.reduce((acc, item) => acc + parseFloat(item.Total_PO), 0);
      setTotalPO(sum);
    }
  }, [magData]);

  const columns = [
    {
      title: 'Modelo',
      dataIndex: 'Modelo',
      width: calc('100%/8'),
      align: 'center',
      render: text => <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'black', height:10 }}>{text}</div>,
    },
    {
      title: 'PO',
      dataIndex: 'PO',
      width: calc('100%/8'),
      align: 'center',
      render: (text) => <a onClick={() => handlePOClick(text)} 
      style={{color:'blue', cursor: 'pointer'}}
      >{text}</a>,
    },
    {
      title: 'Linha_SMD',
      dataIndex: 'Linha_SMD',
      width: calc('100%/8'),
      align: 'center',
      render: text => <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'black', height:10 }}>{text}</div>,
    },
    {
      title: 'Linha_MAIN',
      dataIndex: 'Linha_MAIN',
      width: calc('100%/8'),
      align: 'center',
      render: text => <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'black', height:10 }}>{text}</div>,
    },
    {
      title: 'Resultado_SMD',
      dataIndex: 'Resultado_SMD',
      width: calc('100%/8'),
      align: 'center',
      render: text => <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'black', height:10 }}>{text}</div>,
    },
  
    {
      title: 'Pagamento_Main',
      dataIndex: 'Pagamento_Main',
      width: calc('100%/8'),
      align: 'center',
      render: text => <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'black', height:10 }}>{text}</div>,
    },
  
    {
      title: 'Qty_Boxes',
      dataIndex: 'Qty_Boxes',
      width: calc('100%/8'),
      height: 5,
      align: 'center',
      render: text => <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'black', height:10 }}>{text}</div>,
    },

    {
      title: 'Total_PO',
      dataIndex: 'Total_PO',
      width: calc('100%/8'),
      height: 5,
      align: 'center',
      render: text => <div style={{ fontSize: '14px', fontFamily: 'Arial', color: 'black', height:10 }}>{text}</div>,
    },
  
  ];

  const rowClassName = record => record.Status_final === 'Pendente' ? 'pending-row' : '';

  const handlePOClick = (po) => {
    setSelectedPO(po);
    fetchMagData(po);
    setModalVisible(true);
  };

  const fetchMagData = (po) => {
    axios.get(`${API_URL}/getMagNo?po=${po}`)
      .then(response => setMagData(response.data))
      .catch(error => console.error("Erro ao recuperar dados da API:", error));
  };

  const fetchLabelData = (magNo) => {
    axios.get(`${API_URL}/getLabelModal?MAG_NO=${magNo}`)
      .then(response => {
        setLabelData(response.data[0]);
        setLabelModalVisible(true);
      })
      .catch(error => console.error("Erro ao recuperar dados da API:", error));
  };

  const handleMagNoClick = (magNo) => {
    setSelectedMagNo(magNo);
    fetchLabelData(magNo);
  };


  const magColumns = [
    { 
      title: 'MAG No', 
      dataIndex: 'MAG_NO', 
      key: 'MAG_NO',
      render: (text) => <a onClick={() => handleMagNoClick(text)}
      style={{color:'blue', cursor: 'pointer'}}
      >{text}</a>,
    },
    { title: 'PO', dataIndex: 'PO', key: 'PO' },
    { title: 'Linha_SMD', dataIndex: 'Linha_SMD', key: 'Linha_SMD' },
    { title: 'Linha_MAIN', dataIndex: 'Linha_MAIN', key: 'Linha_MAIN' },
    { title: 'Total_PO', dataIndex: 'Total_PO', key: 'Total_PO' },
  ];

  return (
    <>
      <NavbarComp />
      <Container style={{ height: '100%'}} className= ''>
      <div style={{textAlign:'center', fontWeight:'bold'}}>Virtual Transfer GR / GI - SMD FINAL</div>
        <Row style={{ width: '95%'}}>
          <Col  style={{marginTop:-35}}>
            <InputDate
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </Col>
              
          <Col style={{marginTop:-35}}>
            <ExportToExcel apiData={testData} fileName={fileName} />
          </Col>
        </Row>
        
        <ConfigProvider
          theme={{
            components: {
              Table: {
                headerBg: "#9DB2BF ",
                colorBgContainer: "DDE6ED",
                borderColor: "#F1EFEC",
                cellFontSize: 16,
                colorIcon: "black",
                headerBorderRadius: 8
              },
            },
          }}
        >
          <StyledTable
            dataSource={testData}
            columns={columns}
            rowClassName={rowClassName}
            pagination={false}
            style={{overflowY:'scroll', backgroundColor: '#fafafa'}}
          />
        </ConfigProvider>

        {/* Modal da PO */}
        <CustomModal
          title={`PO${': ' + selectedPO + ' - ' + totalPO + 'ea'}`}
          visible={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          className="customModalStyles"
          centered={true}
          style={{ top: 20, marginLeft: '-27%' }} 
        >
          <StyledTable
            className="customTableStyles"
            columns={magColumns}  
            dataSource={magData}
            pagination={false}
          />
        </CustomModal>

        {/* Modal do MAG_NO - independente do modal da PO */}
        <Modal
          title={`MAG No: ${'' + selectedMagNo}`}
          visible={labelModalVisible}
          onCancel={() => setLabelModalVisible(false)}
          footer={null}
          width={1000}
          centered
          className='customModalStylesMag'
        //  style={{ top: 20, height:'200px' }} 
        //  bodyStyle={{ maxHeight: '50vh'}}
        >
          {labelData && <VirtualL_Modal labelData={labelData} />}
        </Modal>
      </Container>
    </>
  );
};

export default TestDataTable;