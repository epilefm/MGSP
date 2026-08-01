import { API_URL } from '../../../config/api';
// ReparoModal.js
import React, { useEffect, useState } from "react";
import { Modal, Button } from 'react-bootstrap';
import Axios from 'axios';
import Table from 'react-bootstrap/Table';
//import reparo from 'C:/Users/f.miguel/boots/src/components/Repair/ReparoModal.css'

const ReparoModal = ({ show, handleClose, modalData }) => {
  const [lista2, setLista2] = useState([]);
  const [lista3, setLista3] = useState([]);

  useEffect(() => {
    Axios.get(`${API_URL}/getModalOffSplicing`)
      .then(response => {
        setLista2(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar dados no Reparo Inventario:', error);
      });
  }, []);


  return (
    <Modal show={show} onHide={handleClose} className='modalRep'
     aria-labelledby="contained-modal-title-vcenter" centered >
      <Modal.Header closeButton>
        <Modal.Title>Detalhes de Reparo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: 'd-flex', flexDirection: 'column' }}>
  
          {/* Section for Reparo Process */}
          <div className="table-responsive">
            <Table className="reparo-table" style={{ cursor: 'pointer' }}>
              <tbody>
                {modalData.process && modalData.process.length > 0 ? (
                  <>
                    <tr >
                      {Object.keys(modalData.process[0]).map(column => (
                        <th key={column} style={{ fontSize: '16px', fontFamily: 'malgun Gothic', 
                        backgroundColor:'#8eff8e'}}>
                          {column}
                        </th>
                      ))}
                    </tr>
                    {modalData.process.map(item => (
                      <tr key={item.id}>
                        {Object.values(item).map(value => (
                          <td key={value} style={{ fontSize: '15px', fontFamily: 'malgun Gothic' }}>
                            {value !== undefined ? value : 'N/A'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ) : (
                  <tr>
                    <td 
                    colSpan={modalData.process && modalData.process[0] ? Object.keys(modalData.process[0]).length : 1}
                     style={{ textAlign: 'center', color:'red', fontSize:'14px' }}>
                    Não foram inseridos dados da análise do Técnico de reparo
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
  };

export default ReparoModal;