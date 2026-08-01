// ReparoModal.js
import React from "react";
import { Modal, Button, Spinner } from 'react-bootstrap';
import Table from 'react-bootstrap/Table';
import './RepairDetalhadoModal.css'

const ReparoModal = ({ show, handleClose, modalData }) => {
  // Verificar se os dados estão carregando
  const isLoading = !modalData || (modalData.process === undefined && modalData.auxiliar === undefined);

  return (
    <Modal show={show} onHide={handleClose} className='repair-detalhado-modal'
     aria-labelledby="contained-modal-title-vcenter" centered >
      <Modal.Header closeButton>
        <Modal.Title>Detalhes de Reparo</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div style={{ display: 'd-flex', flexDirection: 'column' }}>
          {isLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Carregando...</span>
              </Spinner>
              <span className="ms-2">Carregando dados...</span>
            </div>
          ) : (
            <>
              {/* Section for Reparo Process */}
              <div className="table-responsive">
                <Table className="repair-detalhado-table" style={{ cursor: 'pointer' }}>
                  <tbody>
                    {modalData.process && modalData.process.length > 0 ? (
                      <>
                        <tr >
                          {Object.keys(modalData.process[0]).map(column => (
                            <th key={column} style={{ fontSize: '16px', fontFamily: 'malgun Gothic', 
                            backgroundColor:'#4a90e2', color: 'white'}}>
                              {column}
                            </th>
                          ))}
                        </tr>
                        {modalData.process.map((item, index) => (
                          <tr key={index}>
                            {Object.values(item).map((value, valueIndex) => (
                              <td key={valueIndex} style={{ fontSize: '15px', fontFamily: 'malgun Gothic' }}>
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
                         className="no-data-message">
                        Não foram inseridos dados da análise do Técnico de reparo
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              
              {/* Section for Auxiliary Data (if exists) */}
              {modalData.auxiliar && modalData.auxiliar.length > 0 && (
                <div className="table-responsive mt-4">
                  <h5>Dados Auxiliares</h5>
                  <Table className="repair-detalhado-table" style={{ cursor: 'pointer' }}>
                    <tbody>
                      <tr >
                        {Object.keys(modalData.auxiliar[0]).map(column => (
                          <th key={column} style={{ fontSize: '16px', fontFamily: 'malgun Gothic', 
                          backgroundColor:'#4a90e2', color: 'white'}}>
                            {column}
                          </th>
                        ))}
                      </tr>
                      {modalData.auxiliar.map((item, index) => (
                        <tr key={index}>
                          {Object.values(item).map((value, valueIndex) => (
                            <td key={valueIndex} style={{ fontSize: '15px', fontFamily: 'malgun Gothic' }}>
                              {value !== undefined ? value : 'N/A'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
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
