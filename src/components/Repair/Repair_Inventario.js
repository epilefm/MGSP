import React, { useEffect, useState } from "react";
import { Modal, Button } from 'react-bootstrap';
import Axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import { Box } from "@mui/material";
import Table from 'react-bootstrap/Table';
import Rinventario from './inventario.css' // arquivo de estilos CSS
import ReparoModalInv from './Modal_Inventario';
import { ExportToExcel } from '../Excel/Excel_Export';
import NavbarComp from "../Layout/NavbarComp";

export default function Tabela() {

  const [listCard, setListCard] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState(null);

  const handleStatusClick = (status, row) => {
    Axios.get(`http://105.103.39.102:8080/getModalRepInventario`, {
      params: {
        modelo: row.Modelo,
        linha: row.Linha,
        status: status
      }
    })
      .then(response => {
        setShowModal(true);
        setModalData({ process: response.data });
      })
      .catch(error => {
        console.error('Error fetching process data:', error);
      });
  };

  useEffect(() => {
    Axios.get('http://105.103.39.102:8080/getReparoInventarioTotal')
      .then(response => {
        setListCard(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar dados no Reparo Inventario:', error);
      });
  }, []);

  const fileName = "Inventário - Reparo"; // here enter filename for your excel file

  return (
    <>
<NavbarComp />
      {showModal && (
        <ReparoModalInv 
          show={showModal}
          handleClose={() => setShowModal(false)}
          modalData={modalData}
        />
      )}

      <div className='row justify-content-center col-12'>    
        <div style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>    
          <Box 
            style={{ border: 'solid thin', borderColor: '#Eaeaea', borderRadius: 10, boxShadow: '-10px -5px 5px #Eaeaea', padding: 25 }}>
            <h2 className='h2' style={{ height: 0, marginTop: 0, marginBottom: 45, textAlign: 'center' }}> Inventário de Placas no Reparo</h2> 
            <ExportToExcel apiData={listCard} fileName={fileName}/>
            <Table stripped bordered hover size="sm" className='Rinventario'>
              
                <tr style={{ height: 5, border: 'thin', textAlign: 'center' }}>
                  <th style={{ width: '16%', fontSize: '15px' }}>Modelo</th>
                  <th style={{ width: '16%', borderRight: 'solid 1px', fontSize: '15px', borderRightColor: '#000' }}>Linha</th>
                  <th style={{ width: '16%', borderRight: 'solid thin', fontSize: '15px', borderRightColor: '#B0C0E8' }}>Good</th>
                  <th style={{ width: '16%', borderRight: 'solid thin', fontSize: '15px', borderRightColor: '#B0C0E8' }}>Scrap</th>
                  <th style={{ width: '16%', borderRight: 'solid thin', fontSize: '15px', borderRightColor: '#B0C0E8' }}>NG</th>
                  <th style={{ width: '16%', borderRight: 'solid thin', fontSize: '15px' }}>Total</th>
                </tr>
              
              <tbody className='RInventario-body'>
                {listCard.map(item => 
                  <tr key={item.id} style={{ textAlign: 'center' }}>
                    <td style={{ fontSize: '15px', color: 'black' }}>{item.Modelo}</td>
                    <td style={{ fontSize: '15px', color: 'black' }}>{item.Linha}</td>
                    <td>
                      <Button variant='contained' style={{ fontSize: '15px', color: 'black', fontWeight: 'bold', width: '100%' }} onClick={() => handleStatusClick('Good', item)}>
                        {item.Good}
                      </Button>
                    </td>
                    <td>
                      <Button variant='contained' style={{ fontSize: '15px', color: 'black', fontWeight: 'bold', width: '100%' }} onClick={() => handleStatusClick('Scrap', item)}>
                        {item.Scrap}
                      </Button>
                    </td>
                    <td>
                      <Button variant='contained' style={{ fontSize: '15px', color: 'black', fontWeight: 'bold', width: '100%' }} onClick={() => handleStatusClick('NG', item)}>
                        {item.NG}
                      </Button>
                    </td>
                    <td>
                      <Button disabled style={{ fontSize: '15px', color: 'red', backgroundColor:'white', fontWeight: 'bold', width: '100%', border:'none' }}>
                        {item.Total}
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Box>
        </div>
      </div>
    </>
  );
}
