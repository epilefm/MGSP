import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import Table from 'react-bootstrap/Table'
//import tdetalhado from 'C:/Users/f.miguel/boots/src/components/Repair/detalhado.css' // arquivo de estilos CSS

export default function App() {

  const fileName = "Repair Register"; // here enter filename for your excel file

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState([]);
  const [dataFilter, setdataFilter] = useState (new Date())


  const handleChangeResponsavel = (event, codbarra) => {
    const responsavelValue = event.target.value;
    setValues({ ...values, responsavel: responsavelValue, codbarra });
  };

  useEffect(() => {
    Axios
      .get(`http://105.103.39.102:8080/getSubSaida?Data=${values.Data}`)
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  const updateStatus = (codbarra, newStatus) => {
    Axios.put(`http://105.103.39.102:8080/updateSub`, {
      responsavel: values.responsavel,
      status: newStatus,
      codbarra: codbarra
    })
    .then(response => {
      window.location.reload();
      console.log(response.data.MSG);
      // Atualiza o estado local ou realiza outras ações necessárias
    })
    .catch(error => {
      console.error(error);
    });
  };

  return (
    <>

      <div  style={{width:'100%'}}>

        <Box style={{ background: 'transparent', width: '100%' }}>
          <h2 style={{ textAlign: 'center' }}> Pagamento de Produtos Químicos </h2>

          <div style={{ border: 'solid 0.1px', borderRadius: 8, borderColor: '#EAECEC', paddingLeft: 15,
        paddingRight:15, paddingTop: '-0.75px', paddingBottom: 0 }}>

            <Table stripped bordered hover responsive size="sm" class='table-container'>

            <thead class='tdetalhado' >
              <tr style={{ height: 5, textAlign: 'center'}}>
                <th style={{width: '10%',fontSize: '15px'}}>Data de Entrada</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Turno</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Tipo</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Código</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Linha</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Código de Barras</th>
                <th style={{width: '10%', fontSize: '15px' }}>Fase</th>
                <th style={{width: '10%', fontSize: '15px' }}>Responsável <br /> (Wip)</th>
                <th style={{width: '10%', fontSize: '15px' }}>Status</th>

              </tr>
              </thead>

              <tbody>
                {data.map(item =>
                  <tr key={item.id} style={{ textAlign: 'center' }}>
                    <td style={{ fontSize: '13px' }}>{item.entrada}</td>
                    <td style={{ fontSize: '13px' }}>{item.turno}</td>
                    <td style={{ fontSize: '13px' }}>{item.type}</td>
                    <td style={{ fontSize: '13px' }}>{item.code}</td>
                    <td style={{ fontSize: '13px' }}>{item.line}</td>
                    <td style={{ fontSize: '13px' }}>{item.codbarra}</td>
                    <td>
                    <select required
    style={{border: 'none', marginTop: 1.5, color: 'red',fontSize: '13px', width:'100%'}}
    onChange={(event) => {const newStatus = event.target.value; 
      // Aqui, você pode chamar a função de atualização diretamente
      updateStatus(item.codbarra, newStatus);}}>
                        <option value="" style={{ textAlign: 'center' }}></option>
                        <option value="Bottom" style={{ textAlign: 'center' }}>Bottom</option>
                        <option value="Top" style={{ textAlign: 'center',
                         color:'blue', fontWeight: 'bold'}}> Top </option>
                      </select>
                    </td>

                    <td>
                      <select
                        required
                        style={{
                          border: 'none', marginTop: 1.5, color: 'red',
                          fontSize: '13px', width: '100%'
                        }}
                        onChange={(event) => handleChangeResponsavel(event, item.codbarra)}
          >
                          <option value="" style={{ textAlign: 'center' }}></option>
                        <option value="Andreia" style={{ textAlign: 'center' }}>Andreia</option>
                        <option value="Flavia" style={{ textAlign: 'center' }}>Flavia</option>
                        <option value="Jackson" style={{ textAlign: 'center' }}>Jackson</option>
                        <option value="Marcelo" style={{ textAlign: 'center' }}>Marcelo</option>
                        <option value="Patricia" style={{ textAlign: 'center' }}>Patricia</option>
                      </select>
                    </td>

                    <td>
                    <select
                        required
                        style={{
                          border: 'none', marginTop: 1.5, color: 'red',
                          fontSize: '13px', width:'100%'
                        }}
                          onChange={(event) => {
                            const newStatus = event.target.value; 
                            // Aqui, você pode chamar a função de atualização diretamente
                            updateStatus(item.codbarra, newStatus);
                          }}
                        >
                        <option value="Pendente" style={{ textAlign: 'center' }}>Pendente</option>
                        <option value="Pagamento Concluido" style={{ textAlign: 'center',
                         color:'blue', fontWeight: 'bold'}}> PAGO </option>
                      </select>
                    </td>




                  </tr>
                )}
              </tbody>

              
            </Table>
          </div>

        </Box>
      </div>
    </>
  )
}


