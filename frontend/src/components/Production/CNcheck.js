import React, { useEffect, useState, useRef } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import { Box } from "@mui/material";
import { Button } from "react-bootstrap";
import Table from "react-bootstrap/Table";

export default function CNcheck() {
  const [lista, setLista] = useState([]); //-- listagem na tabela - CN
  const [slip, setSlip] = useState("");
  const [cn, setCN] = useState("");
  const [cnListToCompare, setCnListToCompare] = useState([]);
  const [count, setCount] = useState(1);
  const count1 = cnListToCompare.length; //----> Contador da qty de CN's na tabela
  const [okCount, setOkCount] = useState(0);
  const [testHistory, setTestHistory] = useState({}); // Armazena o histórico de testes para cada CN
  const cnInputRef = useRef(null);
  const tableContainerRef = useRef(null);

  const handleSlipValueChange = (value) => {
    setSlip(value);
  };

const handleCnValueChange = (value) => {
    setCN(value);
  };

  const handleCnKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleOnClick_CnCheck(e);
    }
  };

const handleOnClick = (event) => {
    event.preventDefault();
    setLista(slip);
    
    // Focar no campo de CN após pesquisar a SLIP
    setTimeout(() => {
      const cnInput = document.getElementsByName("cn")[0];
      if (cnInput) {
        cnInput.focus();
      }
    }, 100);
  };

const handleReset = () => {
    setSlip("");
    setCN("");
    setLista([]);
    setCnListToCompare([]);
    setOkCount(0);
    setCount(1);
    setTestHistory({});
    document.body.style.backgroundColor = "white";
    
    // Focar no campo de slip
    const slipInput = document.getElementsByName("slip")[0];
    if (slipInput) {
      slipInput.value = "";
      slipInput.focus();
    }
  };

  //----------Pesquisa da SLIP, listando as CN's na tabela + Condição de Erro para operador----------------
const handleOnClick_CnCheck = async (event) => {
    event.preventDefault();
    let cnListToCompare_copy = [...cnListToCompare];
    let found = false;
    let updatedIndex = -1;
    
    for (let i = 0; i < cnListToCompare_copy.length; i++) {
      if (cn === cnListToCompare_copy[i].cn) {
        console.log(`CN read ${cn} , CN in the list ${cnListToCompare_copy[i].cn}`);
        found = true;
        updatedIndex = i;
        document.body.style.backgroundColor = "white";
        
        // Buscar histórico de testes da API
        try {
          const response = await fetch(`http://105.103.2.25/json/smd-material-tracking/?context=defect&cn=${cn}`);
          const historyData = await response.json();
          
          // Encontrar o teste mais recente
          if (historyData && historyData.length > 0) {
            // Ordenar por data de término (INSP_FIN_DT) em ordem decrescente
            const sortedHistory = historyData.sort((a, b) => 
              b.INSP_FIN_DT.localeCompare(a.INSP_FIN_DT)
            );
            
            const latestTest = sortedHistory[0];
            console.log("Latest test:", latestTest);
            
            // Atualizar o estado do teste
            cnListToCompare_copy[i].checkStatus = latestTest.PASS_YN === "Y" ? "OK" : "NG";
            cnListToCompare_copy[i].defectName = latestTest.DEFT_NM || null;
            
            // Armazenar o histórico de testes
            setTestHistory(prev => ({
              ...prev,
              [cn]: latestTest
            }));
          } else {
            // Se não houver histórico, marcar como OK
            cnListToCompare_copy[i].checkStatus = "OK";
            cnListToCompare_copy[i].defectName = null;
          }
          
          setCnListToCompare(cnListToCompare_copy);
          updateOkCount();
        } catch (error) {
          console.error("Erro ao buscar histórico de testes:", error);
          // Em caso de erro, marcar como OK
          cnListToCompare_copy[i].checkStatus = "OK";
          cnListToCompare_copy[i].defectName = null;
          setCnListToCompare(cnListToCompare_copy);
          updateOkCount();
        }
      }
    }
    
// Scroll para o item atualizado
    if (found && updatedIndex >= 0) {
      setTimeout(() => {
        const tableContainer = tableContainerRef.current;
        
        if (tableContainer) {
          const rows = tableContainer.querySelectorAll('tbody tr');
          if (rows[updatedIndex]) {
            const row = rows[updatedIndex];
            
            // Calcular a posição do scroll para centralizar o item
            const containerHeight = tableContainer.clientHeight;
            const rowHeight = row.offsetHeight;
            const rowTop = row.offsetTop;
            
            // Posicionar o item no centro do container
            const scrollTop = rowTop - (containerHeight / 2) + (rowHeight / 2);
            tableContainer.scrollTo({
              top: Math.max(0, scrollTop),
              behavior: 'smooth'
            });
            
            // Adicionar destaque temporário
            row.style.backgroundColor = '#fff3cd';
            row.style.transition = 'background-color 0.5s ease';
            setTimeout(() => {
              row.style.backgroundColor = updatedIndex % 2 === 0 ? "#f8f9fa" : "white";
            }, 2000);
          }
        }
      }, 150);
    }
    
    if (!found) {
      document.body.style.backgroundColor = "red";
      // alert( " → " + cn + " " + "NÃO PERTENCE A ESSE BOX!" );
    }
    
    limpaCampos();
    console.log(cnListToCompare); 
  };

useEffect(() => {
    if (slip) {
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
        .catch(error => {
          console.error(error);
          alert('Dados nao salvos')
        });
    }
  }, [slip]);

  //---------Função de limpar o campo de CN Scan-----------
function limpaCampos() {
    const element1 = document.getElementsByName("cn"); // Limpa o campo
    element1.forEach((element) => {
      console.log(element);
      element.value = "";
      // Usar setTimeout para garantir que o foco seja definido corretamente
      setTimeout(() => {
        element.focus();
      }, 10);
    });
    setCount(count + 1);
  }

  //------------------------Salvar-------------------------------
  
  // const handleSaveButtonClick = async () => {
  //   // Collect all the data from the table.
  //   const array = cnListToCompare.map((item) => ({
  //     slip,
  //     cn: item.cn,
  //     resultado: item.checkStatus,
  //   })); alert( okCount + " CN's Salvas" );
  
  //   // Make a POST request to the database endpoint.
  //   const response = await axios.post('http://105.103.39.102:8080/slip', {
  //     dados : array
  //   });
  
  //   // Update the table state to reflect the saved data.
  //   setCnListToCompare(cnListToCompare.map((item) => ({
  //     ...item,
  //     saved: true,
  //   })));
  // };
  
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
<div style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center", marginBottom: "30px", color: "#333", fontSize: "32px" }}>CN Double Check Scan</h1>
        <div style={{ display: "flex", gap: "30px" }}>
          {/* Painel esquerdo - Formulários e indicadores */}
          <div style={{ flex: "1", maxWidth: "500px" }}>
            <div style={{
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              border: "1px solid #ddd"
            }}>
              <Form method="post" type='submit' onSubmit={handleOnClick}
                style={{
                  marginBottom: "20px"
                }}
              >
                <Form.Label style={{ fontWeight: "bold", fontSize: "18px" }}>Pesquisar SLIP</Form.Label>
                <Form.Control
                  onChange={(e) => handleSlipValueChange(e.target.value)}
                  placeholder="Scanear a SLIP"
                  type="text"
                  name='slip'
                  style={{
                    height: "50px",
                    fontSize: "16px",
                    marginTop: "5px"
                  }}
                />
                <Button
                  onSubmit={() => handleOnClick()}
                  type="submit"
                  style={{
                    backgroundColor: "#28a745",
                    border: "none",
                    marginTop: "15px",
                    width: "100%",
                    padding: "10px",
                    fontSize: "18px",
                    height: "50px"
                  }}
                >
                  Pesquisar
                </Button>
              </Form>

              <Form method="post" type='submit' onSubmit={handleOnClick_CnCheck}
                style={{
                  marginBottom: "20px"
                }}
              >
                <Form.Label style={{ fontWeight: "bold", fontSize: "18px" }}>CN Scan</Form.Label>
                <Form.Control
                  onChange={(e) => handleCnValueChange(e.target.value)}
                  onKeyDown={handleCnKeyDown}
                  placeholder="Scanear a CN - tecle ENTER"
                  name="cn"
                  id="cn"
                  style={{
                    height: "50px",
                    fontSize: "16px",
                    marginTop: "5px"
                  }}
                />
              </Form>

              {/* Indicadores */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "20px", gap: "15px" }}>
                <div style={{ 
                  backgroundColor: "#e9ecef", 
                  padding: "15px", 
                  borderRadius: "8px", 
                  flex: "1",
                  textAlign: "center"
                }}>
                  <p style={{ fontSize: "16px", margin: "0", color: "#495057", fontWeight: "bold" }}>Total de Cn's</p>
                  <p style={{ fontSize: "28px", margin: "5px 0 0", fontWeight: "bold", color: "#007bff" }}>{count1}</p>
                </div>
                <div style={{ 
                  backgroundColor: "#e9ecef", 
                  padding: "15px", 
                  borderRadius: "8px", 
                  flex: "1",
                  textAlign: "center"
                }}>
                  <p style={{ fontSize: "16px", margin: "0", color: "#495057", fontWeight: "bold" }}>PBA Scan - Ok</p>
                  <p style={{ fontSize: "28px", margin: "5px 0 0", fontWeight: "bold", color: "#28a745" }}>{okCount}</p>
                </div>
              </div>

              <Button
                onClick={handleReset}
                style={{
                  backgroundColor: "#dc3545",
                  border: "none",
                  marginTop: "25px",
                  width: "100%",
                  padding: "12px",
                  fontSize: "18px",
                  height: "50px"
                }}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Painel direito - Tabela de resultados */}
          <div style={{ flex: "2", minWidth: "0" }}>
            <div style={{ 
              backgroundColor: "white",
              borderRadius: "10px",
              padding: "20px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              border: "1px solid #ddd",
              height: "100%"
            }}>
<h3 style={{ textAlign: "center", marginBottom: "20px", color: "#333", fontSize: "24px" }}>Resultados</h3>
              <div ref={tableContainerRef} style={{ maxHeight: "75vh", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ 
                        backgroundColor: "#007bff", 
                        color: "white", 
                        padding: "15px", 
                        textAlign: "center", 
                        fontSize: "18px",
                        borderTopLeftRadius: "5px"
                      }}>CN</th>
                      <th style={{ 
                        backgroundColor: "#007bff", 
                        color: "white", 
                        padding: "15px", 
                        textAlign: "center", 
                        fontSize: "18px"
                      }}>Status</th>
                      <th style={{ 
                        backgroundColor: "#007bff", 
                        color: "white", 
                        padding: "15px", 
                        textAlign: "center", 
                        fontSize: "18px",
                        borderTopRightRadius: "5px"
                      }}>Defeito</th>
                    </tr>
                  </thead>
<tbody>
                    {cnListToCompare.map((item, index) => (
                      <tr 
                        key={index}
                        style={{
                          backgroundColor: index % 2 === 0 ? "#f8f9fa" : "white",
                          transition: "background-color 0.3s ease"
                        }}
                        onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = "#e9ecef"}
                        onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = index % 2 === 0 ? "#f8f9fa" : "white"}
                      >
                        <td style={{ 
                          padding: "12px", 
                          fontSize: "16px", 
                          border: "1px solid #dee2e6",
                          textAlign: "center"
                        }}>
                          {item.cn}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          fontSize: "16px", 
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                          backgroundColor: item.checkStatus === "OK" ? "#28a745" : item.checkStatus === "NG" ? "#dc3545" : "#6c757d",
                          color: "white",
                          fontWeight: "bold"
                        }}>
                          {item.checkStatus || "-"}
                        </td>
                        <td style={{ 
                          padding: "12px", 
                          fontSize: "16px", 
                          border: "1px solid #dee2e6",
                          textAlign: "center",
                          backgroundColor: item.checkStatus === "NG" && item.defectName ? "#dc3545" : "transparent",
                          color: item.checkStatus === "NG" && item.defectName ? "white" : "inherit",
                          fontWeight: item.checkStatus === "NG" && item.defectName ? "bold" : "normal"
                        }}>
                          {item.checkStatus === "NG" && item.defectName ? item.defectName : item.checkStatus === "OK" ? "OK" : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
