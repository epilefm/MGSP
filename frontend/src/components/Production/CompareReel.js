import React, { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import axios from "axios";
import { Box } from "@mui/material";
import { Button } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import moment from "moment";  // Biblioteca para formatar a data e hora

export default function App() {
  const [operator, setOperator] = useState("");
  const [model, setModel] = useState("");
  const [line, setLine] = useState("");
  const [reelId, setReelId] = useState("");
  const [barcode, setBarcode] = useState("");
  const [codigo, setCodigo] = useState("");
  const [totalQtySplicing, setTotalQtySplicing] = useState(0);
  const [cnListToCompare, setCnListToCompare] = useState([]);
  const [listhalb, setListHalb] = useState([]);

  function limpaCampos() {
    setReelId("");
    setBarcode("");
    setCodigo("");
  }

  function handleEnterPress(e) {
    if (e.key === "Enter") {
      if (e.target.name === "reelId") {
        document.getElementById("barcode").focus();
      } else if (e.target.name === "barcode") {
        const codigoAtual = barcode.slice(0, 11);
        const ultimos6 = parseInt(barcode.slice(-6), 10);

        let barcodeStatus = "Correto";
        let codigoStatus = "Correto";

        if (cnListToCompare.length > 0) {
          const prevItem = cnListToCompare[cnListToCompare.length - 1];
          if (prevItem.barcode === barcode) {
            barcodeStatus = "Incorreto";
          }
          if (prevItem.codigo !== codigoAtual) {
            codigoStatus = "Incorreto";
          }
        }

        const newItem = {
          operator,
          model,
          line,
          reelId,
          barcode,
          codigo: codigoAtual,
          qtySplicing: ultimos6,
          barcodeStatus,
          codigoStatus,
        };

        setCnListToCompare([...cnListToCompare, newItem]);
        setTotalQtySplicing(totalQtySplicing + ultimos6);

        limpaCampos();
        document.getElementsByName("reelId")[0].focus();
      }
    }
  }

  function handleDelete(index) {
    const removedItem = cnListToCompare[index];
    const newList = cnListToCompare.filter((_, i) => i !== index);
    setCnListToCompare(newList);
    setTotalQtySplicing(totalQtySplicing - removedItem.qtySplicing);
  }

  // Função para gerar o código ZPL
  function generateZPL(reelId) {
    const currentDateTime = moment().format("DD/MM/YYYY HH:mm:ss");

    const zpl = `
      ^XA
      ^FO50,50^BY3
      ^BCN,100,Y,N,N
      ^FD${reelId}^FS
      ^FO50,200^A0N,30,30^FD${currentDateTime}^FS
      ^XZ
    `;
    return zpl;
  }

  // Função para enviar o ZPL para a impressora Zebra
  function printLabel(reelId) {
    const zpl = generateZPL(reelId);

    axios.post("http://your-printer-ip-or-api", zpl, {
      headers: {
        "Content-Type": "text/plain", // ZPL é um arquivo de texto
      },
    })
    .then((response) => {
      console.log("Etiqueta enviada com sucesso", response.data);
      window.alert("Etiqueta impressa com sucesso!");
    })
    .catch((error) => {
      console.error("Erro ao enviar a etiqueta", error);
      window.alert("Erro ao imprimir etiqueta.");
    });
  }

  function handleSaveButtonClick() {
    const hasErrors = cnListToCompare.some(
      (item) => item.barcodeStatus === "Incorreto" || item.codigoStatus === "Incorreto"
    );

    if (hasErrors) {
      window.alert("Existem itens com status incorreto. Corrija-os antes de salvar.");
      return;
    }

    const dataToSave = cnListToCompare.map((item) => ({
      operator: item.operator,
      model: item.model,
      line: item.line,
      reelId: item.reelId,
      barcode: item.barcode,
      codigo: item.codigo,
      qtySplicing: item.qtySplicing,
      barcodeStatus: item.barcodeStatus,
      codigoStatus: item.codigoStatus,
      totalQtySplicing: totalQtySplicing,
    }));

    axios
      .post("http://105.103.39.102:8080/SplicingOffline", dataToSave)
      .then((response) => {
        console.log("Data saved successfully", response.data);
        window.alert("Splicing - offline, salvo com sucesso!");
        
        // Chamar a função de impressão logo após o salvamento bem-sucedido
        printLabel(reelId); // Aqui passa o Reel ID para a impressão
        window.location.reload();
      })
      .catch((error) => {
        console.error("There was an error saving the data!", error);
        window.alert("Erro - Tente Novamente");
      });
  }

  useEffect(() => {
    axios.get("http://105.103.39.102:8080/getModelo").then((response) => {
      const listHalb = response.data;
      listHalb.sort((a, b) => a.Basic_Model.localeCompare(b.Basic_Model));
      setListHalb(listHalb);
    });
  }, []);

  return (
    <>
      <div className="flex justify-content-center">
        <Row>
          <div className="row col-12" style={{ justifyContent: "center" }}>
            <Box
              style={{
                marginLeft: 20,
                marginTop: 10,
                background: "White",
                boxShadow: "2px 2px 5px gray",
                borderRadius: 8,
                width: "85%",
              }}
            >
              <h2 style={{ textAlign: "center" }}> Input de Splicing </h2>
              <Form style={{ marginLeft: 20, marginBottom: 10 }}>
                <div style={{ marginLeft: 20 }}>
                  <Row style={{ justifyContent: "center", width: "100%" }}>
                    <Col>
                      <Form.Group controlId="formOperator">
                        <Form.Label>Operador</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Digite o nome ou código do operador"
                          value={operator}
                          onChange={(e) => setOperator(e.target.value)}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="formModel">
                        <Form.Label>Model</Form.Label>
                        <Form.Select
                          as="select"
                          value={model}
                          onChange={(e) => setModel(e.target.value)}
                        >
                          <option></option>
                          {listhalb.map((val, index) => (
                            <option key={index}>{val.Basic_Model}</option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="formLine">
                        <Form.Label>Line</Form.Label>
                        <Form.Select as="select" value={line} onChange={(e) => setLine(e.target.value)}>
                          <option></option>
                          {/* Adicione suas opções de linha aqui */}
                          <option value="SMD-01">SMD-01</option>
                          <option value="SMD-02">SMD-02</option>
                          <option value="SMD-03">SMD-03</option>
                          <option value="SMD-04">SMD-04</option>
                          <option value="SMD-05">SMD-05</option>
                          <option value="SMD-06">SMD-06</option>
                          <option value="SMD-07">SMD-07</option>
                          <option value="SMD-08">SMD-08</option>
                          <option value="SMD-09">SMD-09</option>
                          <option value="SMD-10">SMD-10</option>
                          <option value="SMD-11">SMD-11</option>
                          <option value="SMD-12">SMD-12</option>
                          <option value="SMD-13">SMD-13</option>
                          <option value="SMD-14">SMD-14</option>
                          <option value="SMD-15">SMD-15</option>
                          <option value="SMD-16">SMD-16</option>
                          <option value="SMD-17">SMD-17</option>
                          <option value="SMD-18">SMD-18</option>
                          <option value="SMD-19">SMD-19</option>
                          <option value="SMD-20">SMD-20</option>
                          <option value="SMD-37">SMD-37</option>
                          <option value="SMD-38">SMD-38</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row style={{ justifyContent: "center", width: "100%" }}>
                    <Col>
                      <Form.Group controlId="formReelId" style={{ marginTop: 10 }}>
                        <Form.Label>Reel ID</Form.Label>
                        <Form.Control
                          type="text"
                          id="reelId"
                          name="reelId"
                          value={reelId}
                          onChange={(e) => setReelId(e.target.value)}
                          onKeyPress={handleEnterPress}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="formBarcode" style={{ marginTop: 10 }}>
                        <Form.Label>Barcode</Form.Label>
                        <Form.Control
                          type="text"
                          id="barcode"
                          name="barcode"
                          value={barcode}
                          onChange={(e) => setBarcode(e.target.value)}
                          onKeyPress={handleEnterPress}
                        />
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group controlId="formCodigo" style={{ marginTop: 10 }}>
                        <Form.Label>Codigo</Form.Label>
                        <Form.Control type="text" id="codigo" name="codigo" value={codigo} disabled />
                      </Form.Group>
                    </Col>
                  </Row>
                </div>
                <Row style={{ justifyContent: "center", width: "100%", marginTop: 10 }}>
                  <Button onClick={handleSaveButtonClick}>Salvar</Button>
                </Row>
              </Form>
              <div style={{ marginLeft: 20, marginRight: 20, marginTop: 10, marginBottom: 20 }}>
                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Operador</th>
                      <th>Modelo</th>
                      <th>Linha</th>
                      <th>Reel ID</th>
                      <th>Barcode</th>
                      <th>Código</th>
                      <th>Qtd Splicing</th>
                      <th>Status Barcode</th>
                      <th>Status Código</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  
                  <tbody>
                    {cnListToCompare.map((item, index) => (
                      <tr key={index}>
                        <td style={{fontSize:'16px'}}>{item.operator}</td>
                        <td style={{fontSize:'16px'}}>{item.model}</td>
                        <td style={{fontSize:'16px'}}>{item.line}</td>
                        <td style={{fontSize:'16px'}}>{item.reelId}</td>
                        <td style={{fontSize:'16px'}}>{item.barcode}</td>
                        <td style={{fontSize:'16px'}}>{item.codigo}</td>
                        <td style={{fontSize:'16px'}}>{item.qtySplicing}</td>
                        <td style={{ color: item.barcodeStatus === "Correto" ? "green" : "red", fontWeight:'bold', fontSize:'18px' }}>
                          {item.barcodeStatus}
                        </td>
                        <td style={{ color: item.codigoStatus === "Correto" ? "green" : "red", fontWeight:'bold', fontSize:'18px'  }}>
                          {item.codigoStatus}
                        </td>
                        <td>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(index)}>
                            Excluir
                          </Button>
                        </td>
                      </tr>
                    ))}
                                <tr>
              <td colSpan="6" style={{ textAlign: "right", fontWeight: "bold", fontSize:'15px', backgroundColor:'white' }}>
                Total Qty Splicing:
              </td>
              <td
                colSpan="1"
                style={{ textAlign: "center", backgroundColor: "yellow", fontWeight: "bold", fontSize:'15px' }}
              >
                {totalQtySplicing}
              </td>

              <td
                colSpan="3"
                style={{ textAlign: "center", backgroundColor: "yellow", fontWeight: "bold", fontSize:'15px' }}
              >
                </td>

            </tr>
                  </tbody>
                </Table>
              </div>
            </Box>
          </div>
        </Row>
      </div>
    </>
  );
}