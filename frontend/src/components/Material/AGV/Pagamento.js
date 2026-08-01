import { API_URL } from '../../../config/api';
import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import Table from 'react-bootstrap/Table'
import NavbarComp from '../../Layout/NavbarComp'

export default function App() {

  const fileName = "Repair Register"; // here enter filename for your excel file

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [values, setValues] = useState([]);
  const [dataFilter, setdataFilter] = useState (new Date())

  const handleChange = (event) => {
    setValues({ ...values, [event.target.name]: event.target.value });
  };

  useEffect(() => {
    Axios
      .get(`${API_URL}/getScrapReceb?Data=${values.Data}`)
      .then((response) => {
        setData(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);


  //--------------checar-----------------------

  
  const [user1, setUser1] = useState("");
  const [user2, setUser2] = useState("");

  const handleUpdate = (CN, STATUS) => {
    Axios.put(`${API_URL}/updatescrap`, {
      cn : CN,
      status : STATUS,
      user1 : user1,
      user2 : user2
    })
      .then((response) => {
        alert(response.data.MSG)
        window.location.reload();
      })
      // if (STATUS === "ok" && user1 !== "ok" && user2 !== "ok") {
      //   return (handleUpdate);
      //   }
  };

  
  // --------------------------------------------

  return (
    <>
      <NavbarComp />

      <div  style={{width:'100%'}}>

        <Box style={{ background: 'transparent', width: '100%' }}>
          <h2 style={{ textAlign: 'center' }}> Reposição de Scrap </h2>

          <div style={{ border: 'solid 0.1px', borderRadius: 8, borderColor: '#EAECEC', paddingLeft: 15,
        paddingRight:15, paddingTop: '-0.75px', paddingBottom: 0 }}>

        <input type="date" value={dataFilter} onChange={(event) => setdataFilter(event.target.value)} />
        <button onClick={() => {
          const newData = data.filter((item) => item.data === dataFilter);
          setData(newData);
        }}>Filtrar</button>

            <Table stripped bordered hover responsive size="sm">

              <tr style={{ height: 5, textAlign: 'center' }}>
                <th style={{width: '10%',fontSize: '15px' }}>Data</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Linha</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Halb</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Modelo</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Fase</th>
                <th style={{ width: '10%', fontSize: '15px' }}>Processo</th>
                <th style={{width: '10%', fontSize: '15px' }}>CN</th>
                <th style={{width: '10%', fontSize: '15px' }}>Responsável <br /> (Wip)</th>
                <th style={{width: '10%', fontSize: '15px' }}>Solicitante</th>
                <th style={{width: '10%', fontSize: '15px' }}>Status</th>

              </tr>
              <tbody>
                {data.map(item =>
                  <tr key={item.id} style={{ textAlign: 'center' }}>
                    <td style={{ fontSize: '13px' }}>{item.Data}</td>
                    <td style={{ fontSize: '13px' }}>{item.Linha}</td>
                    <td style={{ fontSize: '13px' }}>{item.Halb}</td>
                    <td style={{ fontSize: '13px' }}>{item.Modelo}</td>
                    <td style={{ fontSize: '13px' }}>{item.Fase}</td>
                    <td style={{ fontSize: '13px' }}>{item.Recebimento}</td>
                    <td style={{ fontSize: '13px' }}>{item.CN_receb}</td>

                    <td>
                      <select required style={{
                        border: 'none', marginTop: 1.5, color: 'black',
                        fontSize: '13px', width: '100%', height:'100%'
                      }} 
                        onChange={(e)=>{setUser1(e.target.value)}}>
                          <option value="" style={{ textAlign: 'center' }}></option>
                        <option value="Haide" style={{ textAlign: 'center' }}>Haide</option>
                        <option value="Maikon" style={{ textAlign: 'center' }}>Maikon</option>
                        <option value="Rose Vieira" style={{ textAlign: 'center' }}>Rose Vieira</option>
                        <option value="Tathiane" style={{ textAlign: 'center' }}>Tathiane</option>
                        <option value="Wagner" style={{ textAlign: 'center' }}>Wagner</option>
                      </select>
                    </td>

                    <td>
                      <select required style={{
                        border: 'none', marginTop: 1.5, color: 'black',
                        fontSize: '13px', width: '100%',
                      }}
                        onChange={(e)=>{setUser2(e.target.value)}}>
                        <option value="" style={{ textAlign: 'center' }}></option>  
                        <option value="Altiana" style={{ textAlign: 'center' }}>Altiana</option>
                        <option value="Ana Alice" style={{ textAlign: 'center' }}>Ana Alice</option>
                        <option value="Arquimedes" style={{ textAlign: 'center' }}>Arquimedes</option>
                        <option value="Adria" style={{ textAlign: 'center' }}>Adria</option>
                        <option value="Jocy" style={{ textAlign: 'center' }}>Jocy</option>
                        <option value="Maiane" style={{ textAlign: 'center' }}>Maiane</option>
                      </select>
                    </td>

                    <td>
                      <select required style={{
                        border: 'none', marginTop: 1.5, color: 'red',
                         fontSize: '13px', width:'100%'
                      }}
                        onChange={(e) => 
                        handleUpdate(item.CN_receb, e.target.value)
                        
                        }>
                        <option value="pendente" style={{ textAlign: 'center' }}>Pendente</option>
                        <option value="Pago" style={{ textAlign: 'center',
                         color:'blue', fontWeight: 'bold'}}> Pago </option>
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


