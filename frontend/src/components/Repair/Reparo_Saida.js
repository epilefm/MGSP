import { API_URL } from '../../config/api';
import React, { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Axios from "axios";
import { Box } from "@mui/material";
import { ListGroup } from "react-bootstrap";
import { Button } from "@mui/material";
import { ListItem, ListItemText } from "@mui/material";
import Calendar from "react-calendar";
import { DatePicker } from "antd";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ExportToExcel } from "../Excel/Excel_Export";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import NavbarComp from "../Layout/NavbarComp";

export default function App() {

  const [formData, setFormData] = useState({ itens: [] });
  const [listCard, setListCard] = useState([App]);
  const [values, setValues] = useState();
  const [lista, setLista] = useState([]);
  const [count, setCount] = useState(1);
  const [rows, setRows] = React.useState(formData.itens);
  const [rowModesModel, setRowModesModel] = React.useState({});

  console.log(listCard);

  // dias conforme o filtro do gmes

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  function limpaCampos() {
    const element1 = document.getElementsByName("CN_saida"); // Limpa o campo
    element1.forEach((element) => {
      console.log(element);
      element.value = "";
      element.focus();
      setCount(count + 1);
    });
  }

  const handleAddItem = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
      itens: [
        ...formData.itens,
        {
          id: count,
          Saida: formData.Saida,
          Linha_saida: formData.Linha_saida,
          CN_saida: formData.CN_saida,
          Resp_saida: formData.Resp_saida,
          Receb_saida: formData.Receb_saida,
          Saida_Processo: formData.Saida_Processo,
        }]
    });
    limpaCampos()
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const array = formData.itens.map((item) => ({

      id: item.id,
      Saida: item.Saida,
      Linha_saida: item.Linha_saida,
      CN_saida: item.CN_saida,
      Resp_saida: item.Resp_saida,
      Receb_saida: item.Receb_saida,
      Saida_Processo: item.Saida_Processo,
    }))

    Axios.post(`${API_URL}/ReparoSaida`, array)
    .then((response) => {
      if (response.data.success) {
        alert('Input da CN ' + formData.CN_saida + ' salvo com sucesso na Saida do Reparo');
        window.location.reload();
      } else {
        alert('Falha de input: Não foi possivel encontrar CN ' + formData.CN_saida +
         ' cadastrada na tela de Analise do Técnico / Auxiliar de Reparo');
      }
    })
    .catch(error => {
      console.error(error);
      alert('Erro ao processar a solicitação. Por favor, tente novamente mais tarde.');
    });
}; 

  useEffect(() => {
    Axios.get(`${API_URL}/getReparoSaida`)
      .then((response) => {
        setLista(response.data);
      })
      .catch((error) => {
        console.error("Erro ao buscar dados no Reparo Inventario:", error);
      });
  }, []);

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleSaveClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.View } });
  };

  const handleDeleteClick = (id) => () => {
    const updatedItems = formData.itens.filter((item) => item.id !== id);
    const updatedFormData = { ...formData, itens: updatedItems };
    setFormData(updatedFormData);
    console.log("delete: ", id);
  };

  const handleCancelClick = (id) => () => {
    setRowModesModel({
      ...rowModesModel,
      [id]: { mode: GridRowModes.View, ignoreModifications: true },
    });

    const editedRow = formData.find((row) => row.id === id);
    if (editedRow.isNew) {
      setFormData(formData.itens.filter((row) => row.id !== id));
    }
  };

  const processRowUpdate = (newRow) => {
    const updatedRow = { ...newRow, isNew: false };
    setFormData(
      formData.itens.map((row) => (row.id === newRow.id ? updatedRow : row))
    );
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };
  const toInputUppercase = (e) => {
    e.target.value = ("" + e.target.value).toUpperCase();
  };

  const contagem = (count) => {
    setCount(count + 1);
  };

  const fileName = "Controle de  Placa no Reparo"; // here enter filename for your excel file

  const handleReset = (event) => {
    event.preventDefault();
    Array.from(document.querySelectorAll("input")).forEach(
      (input) => (input.value = "")
    );
    this.setState({
      itemvalues: [{}],
    });
  };

  return (
    <>
<NavbarComp />
      <div style={{justifyContent:'center'}} class="row col-12">
      <Box style={{marginLeft:20, marginTop:10, background: 'White', boxShadow: '2px 2px 5px gray', 
      borderRadius:8, width:'95%'}}> 

          <h2 style={{ textAlign: "center" }}> Reparo - Saída de Placas </h2>

          <Form
           onSubmit={handleAddItem}>

            <div style={{ marginLeft: 20 }}>
              <Row style={{ justifyContent: "center", width: "100%" }}>
                <Col>
                  <Form.Group
                    style={{
                      width: "100%",
                      marginTop: 10,
                      marginLeft: 0,
                      marginBottom: 10,
                    }}
                  >
                    <Form.Label>Saída</Form.Label>
                    <Form.Select
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      defaultValue=""
                      maxLength={25}
                      id="Saida"
                      Placeholder="Inserir a CN"
                      onChange={handleChange}
                      name="Saida"
                      required
                    >
                      <option></option>
                      <option>Feedback</option>
                      <option>Reparo</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group
                    style={{
                      width: "100%",
                      marginTop: 10,
                      marginLeft: 0,
                      marginBottom: 10,}}>
                    <Form.Label>Linha</Form.Label>
                    <Form.Select
                      defaultValue=""
                      maxLength={25}
                      id="Linha_saida"
                      Placeholder="Inserir a CN"
                      onChange={handleChange}
                      name="Linha_saida"
                      required>
                      <option></option>
                      <option>Feedback</option>
                      <option>DL</option>
                      <option>BT</option>
                      <option>FT</option>
                      <option>SMD-02</option>
                      <option>SMD-03</option>
                      <option>SMD-04</option>
                      <option>SMD-05</option>
                      <option>SMD-06</option>
                      <option>SMD-07</option>
                      <option>SMD-08</option>
                      <option>SMD-09</option>
                      <option>SMD-10</option>
                      <option>SMD-11</option>
                      <option>SMD-12</option>
                      <option>SMD-13</option>
                      <option>SMD-14</option>
                      <option>SMD-15</option>
                      <option>SMD-16</option>
                      <option>SMD-17</option>
                      <option>SMD-18</option>
                      <option>SMD-19</option>
                      <option>SMD-20</option>
                      <option>SMD-37</option>
                      <option>SMD-38</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                <Form.Group
                    style={{
                      width: "100%",
                      marginTop: 10,
                      marginLeft: 0,
                      marginBottom: 10,}}>
                    <Form.Label>Responsável</Form.Label>
                    <Form.Select
                      defaultValue=""
                      maxLength={25}
                      id="Resp_saida"
                      Placeholder="Inserir a CN"
                      onChange={handleChange}
                      name="Resp_saida"
                      required>
                      <option></option>
                      <option>Nathan</option>
                      <option>Arlison Oliveira</option>

                      <option>Adelane</option>
                      <option>Amarildo</option>
                      <option>Andreza R</option>
                      <option>Donald</option>
                      <option>Janderson</option>
                      <option>Kaline</option>
                      <option>Marcos</option>
                      <option>Maria</option>
                      <option>Mirian</option>
                      <option>Monica</option>
                      <option>Nelciane</option>
                      <option>Orilene</option>
                      <option>Paula</option>
                      <option>Ronan</option>
                      <option>Tarcilia</option>
                      <option>Thiago</option>
                      <option disabled></option>

                      <option>Andreza M</option>
                      <option>Francisco</option>
                      <option>Hudson</option>
                      <option>Juliana F.</option>
                      <option>Nubia</option>
                      <option>Suellem</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group
                    style={{
                      width: "100%",
                      marginTop: 10,
                      marginLeft: 0,
                      marginBottom: 10,
                    }}
                  >
                    <Form.Label>Recebedor</Form.Label>
                    <Form.Control
                      defaultValue=""
                      maxLength={20}
                      id="Receb_saida"
                      Placeholder="Inserir o nome"
                      onChange={handleChange}
                      name="Receb_saida"
                      required
                    />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group
                    style={{
                      width: "100%",
                      marginTop: 10,
                      marginLeft: 0,
                      marginBottom: 10,
                    }}
                  >
                    <Form.Label>Saida para:</Form.Label>
                    <Form.Select
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      defaultValue=""
                      id="Saida_Processo"
                      Placeholder="Inserir a CN"
                      onChange={handleChange}
                      name="Saida_Processo"
                      required
                    >
                      <option></option>
                      <option>Análise de Qualidade</option>
                      <option>Análise Técnica</option>
                      <option>Baking</option>
                      <option>BT</option>
                      <option>Devolução</option>
                      <option>DL</option>
                      <option>Dry Port</option>
                      <option>FT</option>
                      <option>HC21</option>
                      <option>HC26</option>
                      <option>HC29</option>
                      <option>Lavagem</option>
                      <option>Offline</option>
                      <option>Para o Pré - Magazine</option>
                      <option>Para o Processo</option>
                      <option>Para Resultado</option>
                      <option>Qualidade</option>
                      <option>Reparo</option>
                      <option>Resultado / Input Realizado</option>
                      <option>Retrabalho / Excesso de Retrabalho</option>
                      <option>Scrap</option>
                      <option>Scrap - WIP</option>
                      <option>Scrap - Feedback</option>
                      <option>Scrap - Processo</option>
                      <option>Scrap - Retrabalho</option>
                      <option>Service Stock</option>
                      <option>Warehouse</option>
                      <option>WIP</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group
                    style={{
                      width: "100%",
                      marginTop: 10,
                      marginLeft: 0,
                      marginBottom: 10,
                    }}
                  >
                    <Form.Label>CN</Form.Label>
                    <Form.Control
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      minLength={10}
                      maxLength={13}
                      onInput={(e) =>
                        (e.target.value = ("" + e.target.value).toUpperCase())
                      }
                      id="CN_saida"
                      Placeholder="Inserir a CN"
                      onChange={handleChange}
                      name="CN_saida"
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row style={{ justifyContent: "center" }}>
              <Button variant="contained" style={{ width: '20%', marginBottom: 10, height: 40 }} type="submit" 
                  onSubmit={handleAddItem}>Adicionar</Button>
                  
                  <Button variant="contained" style={{ width: '20%', marginBottom: 10, height: 40, marginLeft: 10 }}
                    type="reset" onSubmit={handleReset}>Resetar</Button>

              </Row>
            </div>
          </Form>
        </Box>
      </div>

      <Button variant="contained" color="success" style={{width:'18%', height:40, marginTop:10, marginBottom:-30,
marginLeft:20 ,borderColor:'transparent', fontSize:16}} type="submit"
onClick={handleSubmit}>Registrar</Button>

      <h2 style={{ marginTop: -10 }} className="h2">
        {" "}
        Lista dos dados a serem inputados
      </h2>

      <div
        style={{
          height: 300,
          width: "100%",
          padding: "2px",
          marginTop: -30,
          justifyContent: "center",
        }}
      >
        <ExportToExcel apiData={lista} fileName={fileName} />

        <DataGrid
          hover={true}
          className=""
          columns={[
            {
              field: "id",
              hideable: false,
              minWidth: 10,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Saida",
              flex: 2,
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Linha_saida",
              flex: 2,
              minWidth: 120,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Resp_saida",
              flex: 2,
              headerName: "Responsavel saida",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Receb_saida",
              flex: 2,
              headerName: "Recebedor saida",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Saida_Processo",
              flex: 2,
              headerName: "Saida do processo",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "CN_saida",
              flex: 2,
              headerName: "CN saida",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: 'actions',
              type: 'actions',
              headerName: 'Actions', headerClassName:'MUIhAction',
              width: 100,
              cellClassName: 'actions',
          
              getActions: ({ id }) => {
                const isInEditMode = rowModesModel[formData.itens.id]?.mode === GridRowModes.Edit;
          
                    return [
          
                      <GridActionsCellItem
                        icon={<DeleteIcon />}
                        label="Delete"
                        onClick={handleDeleteClick(id)}
                        color="inherit"
                  />,
                ];
              },
            }

          ]}
          rows={formData.itens}
          slots={{}}
          initialState={{
            sorting: {
              sortModel: [{ field: "id", sort: "desc" }],
            },
          }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
              quickFilterProps: { debounceMs: 500 },
            },
          }}
        />
      </div>

      <Box style={{ marginLeft: 0, marginTop: 60 }}>
        <h2 style={{ marginTop: 5, marginBottom: 10 }} className="h2">
          {" "}
          Lista dos Inputs
        </h2>
        <br></br>
        <div
          style={{
            height: 300,
            width: "100%",
            padding: "2px",
            marginTop: "-30px",
          }}
        >
          <DataGrid
            hover={true}
            columns={[
              {
                field: "id",
                hideable: false,
                minWidth: 10,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Data_saida",
                flex: 2,
                headerName: "Data de Input",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Saida",
                flex: 2,
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Linha_saida",
                flex: 2,
                minWidth: 120,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Resp_saida",
                flex: 2,
                headerName: "Responsavel saida",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Receb_saida",
                flex: 2,
                headerName: "Recebedor saida",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Saida_Processo",
                flex: 2,
                headerName: "Saida do processo",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "CN_saida",
                flex: 2,
                headerName: "CN saida",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
            ]}
            rows={lista}
            slots={{}}
            initialState={{
              sorting: {
                sortModel: [{ field: "id", sort: "desc" }],
              },
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { debounceMs: 500 },
              },
            }}
          />
        </div>
      </Box>

    </>
  );
}
