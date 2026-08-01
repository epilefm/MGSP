import { API_URL } from '../../../config/api';
import React, { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Axios from "axios";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import axios from "axios";
import Table from "react-bootstrap/Table";


export default function App() {
  const [lista, setLista] = useState([]); //-- listagem na tabela - CN
  const [slip, setSlip] = useState([]);
  const [result, setResult] = useState([]);
  const [cn, setCN] = useState([]);
  const [cnListToCompare, setCnListToCompare] = useState([]);
  const [count, setCount] = useState(1);
  const count1 = cnListToCompare.length; //----> Contador da qty de CN's na tabela
  const [okCount, setOkCount] = useState(0);

  const handleSlipValueChange = (value) => {
    setSlip(value);
  };
  
  const handleCnValueChange = (value) => {
    setCN(value);
  };
  
  const handleResultValueChange = (value) => {
    setResult(value);
  };

  const handleOnClick = (event) => {
    event.preventDefault();
    setLista(slip);
    
    const element1 = document.getElementsByName("cn"); // Limpa o campo
    element1.forEach((element) => {
      console.log(element);
      element.value = "";
      element.focus();
    });
  };

  //----------Pesquisa da SLIP, listando as CN's na tabela + Condição de Erro para operador----------------
  const handleOnClick_CnCheck = (event) => {
    event.preventDefault();
    let cnListToCompare_copy = [...cnListToCompare];
    let found = false;
    for (let i = 0; i < cnListToCompare_copy.length; i++) {
      if (cn === cnListToCompare_copy[i].cn) {
        console.log(
          `CN read ${cn} , CN in the list ${cnListToCompare_copy[i].cn}`
        );
        cnListToCompare_copy[i].checkStatus = "OK";
        setCnListToCompare(cnListToCompare_copy);
        found = true;
        document.body.style.backgroundColor = "white";
        // Atualiza a lista
      }
      limpaCampos();
    } updateOkCount();
    if (!found) {
      document.body.style.backgroundColor = "red";
      // alert( " → " + cn + " " + "NÃO PERTENCE A ESSE BOX!" );
      
    }
    console.log(cnListToCompare); 
  };

  useEffect(() => {
    fetch(
      `http://105.103.2.25/json/smd-material-tracking/?context=getCNListOfMagazine&magazine=${slip}`
    )
      .then((response) => response.json())
      .then((data) => {
        // Constroi JSON para checking
        let cnListToCompare = [];
        data.map((item) => {
          cnListToCompare.push({ cn: item.PRODC_MAGT_NO, checkStatus: "" });
        });
        console.log(`List to Compare Generated 1st : ${cnListToCompare}`);
        setCnListToCompare(cnListToCompare);
      })
      fetch('http://105.103.2.25/json/smd-material-tracking/?context=getCNInfo&cn=')

        .then((response) => response.json())
        .then((data) => {
          // Constroi JSON para checking
          let cnListToCompare = [];
          data.map((item) => {
            cnListToCompare.push({ cn: item.PRODC_MAGT_NO, checkStatus: "" });
          });
          console.log(`List to Compare Generated 1st : ${cnListToCompare}`);
          setCnListToCompare(cnListToCompare);
        })
        .catch(error => {
          console.error(error);
          alert('Dados nao salvos')
        })
        
      .catch(error => {
        console.error(error);
        alert('Dados nao salvos')
      })
      ;
  }, [lista]);

  //---------Função de limpar o campo de CN Scan-----------
  function limpaCampos() {
    const element1 = document.getElementsByName("cn"); // Limpa o campo
    element1.forEach((element) => {
      console.log(element);
      element.value = "";
      element.focus();
      setCount(count + 1);
    });
  }

  function limpaCampos() {
    const element1 = document.getElementsByName("cn"); // Limpa o campo
    element1.forEach((element) => {
      console.log(element);
      element.value = "";
      element.focus();
      setCount(count + 1);
    });
  }

  //------------------------Salvar-------------------------------
  
  const handleSaveButtonClick = async () => {
    // Collect all the data from the table.
    const array = cnListToCompare.map((item) => ({
      slip,
      cn: item.cn,
      resultado: item.checkStatus,
    })); alert( okCount + " CN's Salvas" );
  
    // Make a POST request to the database endpoint.
    const response = await axios.post(`${API_URL}/slip`, {
      dados : array
    });
  
    // Update the table state to reflect the saved data.
    setCnListToCompare(cnListToCompare.map((item) => ({
      ...item,
      saved: true,
    })));
  };
  
//------------------------Contagem de OK-----------------------------
const updateOkCount = () => {
  let newOkCount = 0;
  cnListToCompare.forEach((item) => {
    if (item.checkStatus === "OK") {
      newOkCount++;
    }
  });
  setOkCount(newOkCount);
};

  return (
    <>
      <Box style={{ marginLeft: 20 }}>
        <div className="row col-sm-12" style={{ width: "100%" }}>
          <h1>CN Double Check (in progress ...)</h1>
          <Row>
            <Col className="row justify-content-center">
              <div style={{ width: "80%", marginTop: 10 }}>
                {/* //------------------------- */}

                <Form method="post" type='submit' onSubmit={handleOnClick}
                  style={{
                    border: "solid 1px",
                    borderRadius: 10,
                    padding: 10,
                    width: "100%",
                    height: 150,
                    marginTop: "10%",
                  }}
                >
                  <Form.Label>Pesquisar SLIP</Form.Label>
                  <Form.Control
                    onChange={(e) => handleSlipValueChange(e.target.value)}
                    placeholder="Scanear a SLIP"
                    type="text"
                    name='slip'
                  />
                  <Button
                    onSubmit={() => handleOnClick()}
                    type="submit"
                    style={{
                      backgroundColor: "green",
                      border: "none",
                      marginTop: 20,
                      width: "100%"
                    }}
                  >
                    Pesquisar
                  </Button>
                </Form>

                <Form method="post" type='submit' onSubmit={handleOnClick_CnCheck}
                  style={{
                    border: "solid 1px",
                    borderRadius: 10,
                    padding: 10,
                    width: "100%",
                    height: 100,
                    marginTop: "10%",
                  }}
                >
                  <Form.Label>CN Scan</Form.Label>
                  <Form.Control
                    onChange={(e) => handleCnValueChange(e.target.value)}
                    placeholder="Scanear a CN - tecle ENTER"
                    name="cn"
                    id="cn"
                  />
                  {/* <Button
                    onClick={() => handleOnClick_CnCheck()}
                    type="submit"
                    style={{
                      backgroundColor: "green",
                      border: "none",
                      marginTop: 20,
                      width: "100%",
                    }}

                  >
                    Pesquisar
                  </Button> */}
                </Form>
                <p style={{marginLeft:40, fontSize:30, marginTop:20}}>Total de Cn's: {count1}</p>
                <p style={{marginLeft:40, fontSize:30}}>Placas Escaneadas - Ok: {okCount}</p>
              </div>
            </Col>


            <Col style={{ marginRight: 200, marginTop: -20 }}>
            <Button onClick={handleSaveButtonClick} style={{width:150, height:40, marginBottom:10}}
            >Registrar</Button>
              <Table stripped bordered hover size="sm" >
                  <div style={{overflowY:'scroll', height:'80vh'}}>
                <thead style={{borderBottom:'solid 2px', borderTop:'solid 2px'}}>
                <tr style={{ height: 5, border: "thin", textAlign: "center"}}>
                  <th style={{fontSize:22, width:320}}> CN </th>
                  <th style={{fontSize:22, width:320}}>Result</th>
                </tr>
                  </thead>
                <tbody >
                  {cnListToCompare.map((item) => (
                    <tr>
                      <td style={{ fontSize: 20 }}>{item.cn}</td>
                      <td style={{ fontSize: 20 }}>{item.checkStatus}</td>
                    </tr>
                  ))}
                </tbody>
                  </div>
              </Table>
            </Col>
          </Row>
        </div>
      </Box>
    </>
  );
}
