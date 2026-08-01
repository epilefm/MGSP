import { API_URL } from '../../config/api';
import React, { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Axios from "axios";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import { ListItem, ListItemText } from "@mui/material";
import Calendar from "react-calendar";
import { DatePicker } from "antd";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { ExportToExcel } from "../Excel/Excel_Export";
import NavbarComp from "../Layout/NavbarComp";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";

export default function App() {
  const [formData, setFormData] = useState({ itens: [] });
  const [listCard, setListCard] = useState([App]);
  const [values, setValues] = useState();
  const [listhalb, setListHalb] = useState([]);
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
    const element1 = document.getElementsByName("CN_auxiliar"); // Limpa o campo
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
          Auxiliar: formData.Auxiliar,
          Bancada_auxiliar: formData.Bancada_auxiliar,
          CN_auxiliar: formData.CN_auxiliar,
          Status_auxiliar: formData.Status_auxiliar,
          Detalhe_auxiliar: formData.Detalhe_auxiliar,
          Defeito_auxiliar: formData.Defeito_auxiliar,
          Location_auxiliar: formData.Location_auxiliar,
          Troca_componente: formData.Troca_componente,
        },
      ],
    });
    limpaCampos();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const array = formData.itens.map((item) => ({
      id: item.id,
      Auxiliar: item.Auxiliar,
      Bancada_auxiliar: item.Bancada_auxiliar,
      CN_auxiliar: item.CN_auxiliar,
      Status_auxiliar: item.Status_auxiliar,
      Detalhe_auxiliar: item.Detalhe_auxiliar,
      Defeito_auxiliar: item.Defeito_auxiliar,
      Location_auxiliar: item.Location_auxiliar,
      Troca_componente: item.Troca_componente,
    }))
    
    Axios.post(`${API_URL}/RepAuxiliar`, array)
    .then((response) => {
      if (response.data.success) {
        alert('Input da CN ' + formData.CN_auxiliar + ' salvo com sucesso na Análise do Técnico de Reparo');
        window.location.reload();
      } else {
        alert('Falha de input: Não foi possivel encontrar CN ' + formData.CN_auxiliar +
         ' cadastrada na tela de Recebimento do Reparo');
      }
    })
    .catch(error => {
      console.error(error);
      alert('Erro ao processar a solicitação. Por favor, tente novamente mais tarde.');
    });
}; 

  useEffect(() => {
    Axios.get(`${API_URL}/getReparoAuxiliar`)
      .then(response => {
        setLista(response.data);
      })
      .catch(error => {
        console.error('Erro ao buscar dados no Reparo Inventario:', error);
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
      <div class="row col-12">
        <Box
          style={{ background: "transparent", borderRadius: 8, width: "100%" }}
        >
          <h2 style={{ textAlign: "center" }}>
            {" "}
            Reparo MX - Diagnóstico de Placas - Auxiliar Técnico
          </h2>

          <Form
            style={{
              border: "solid 0.1rem",
              borderColor: "#84aac6",
              borderRadius: 10,
              marginLeft: 20,
              marginBottom: 30,
            }}
            onSubmit={handleAddItem}
          >
            <div style={{ marginLeft: 20 }}>
              <Row style={{ justifyContent: "center", width: "80%" }}>
                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Auxiliar Técnico</Form.Label>
                    <Form.Select
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      id="Auxiliar"
                      onChange={handleChange}
                      name="Auxiliar"
                    >
                      <option></option>
                      <option>Andreza</option>
                      <option>Evelyn</option>
                      <option>Francisco</option>
                      <option>Juliana F.</option>
                      <option>Nelciane</option>
                      <option>Nubia</option>
                      <option>Suellem</option>
                      </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                  <Form.Label>Bancada</Form.Label>
                    <Form.Select rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue="" maxLength={25} id="Bancada_auxiliar" onChange={handleChange} name='Bancada_auxiliar' required>
                       <option></option>
                       <option></option>
          <option>Bancada Reparo 01</option>
          <option>Bancada Reparo 02</option>
          <option>Bancada Reparo 03</option>
          <option>Bancada Reparo 04</option>
          <option>Bancada Reparo 05</option>
          <option>Bancada SMD-06</option>
          <option>Bancada SMD-08</option>
          <option>Bancada SMD-10</option>
          <option>Bancada SMD-19</option>
          <option>Bancada Feedback</option>
        </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Trocou de Componente?</Form.Label>
                    <Form.Select
                      defaultValue="Choose..."
                      id="Troca_componente"
                      name="Troca_componente"
                      onChange={handleChange}
                      required
                    >
                      <option></option>
                      <option>Sim</option>
                      <option>Não</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Defeito</Form.Label>
                    <Form.Select
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      defaultValue=""
                      maxLength={25}
                      id="Defeito_auxiliar"
                      onChange={handleChange}
                      name="Defeito_auxiliar"
                      required
                    >
                       <option></option>
                      <option>Alimentação Errada</option>     <option>AFC</option>      <option>Batida</option> <option>Check Board</option>
                      <option>CN Divergente</option>     <option>CN Duplicada</option>           <option>Cobre Exposto</option>          <option>Comp. Alterado</option>
                       <option>Comp. Alto</option>       <option>Comp. Contaminado</option>
                      <option>Comp. Danificado</option>       <option>Comp. Deslocado</option>        <option>Comp. Errado</option> <option>Comp. Extra</option>  
                      <option>Comp. Faltando</option>  <option>Comp. Jogado</option>
                      <option>Comp. Invertido</option>
                      <option>Curto de Solda</option>         <option>Curto BGA</option>           <option>Danificado</option>    <option>Defeito Visual</option>
                      <option>Delaminado</option>             <option>Delete History</option>         <option>Excesso de Solder Ball</option>  <option>Excesso de Globtop</option>
                      <option>Excesso de Pasta Tim</option>   <option>Excesso de Pasta de Solda</option>     <option>Excesso de Underfill</option>
                      <option>Falha Falsa</option>            <option>Faltando QRCODE</option>     <option>Filete de Solda</option>
                      <option>Furo de Fresa</option>          <option>Gravação Errada</option>     <option>Impureza</option> <option>Input Errado</option> <option>Insuficiencia de solda</option>
                      <option>Lavagem</option>                <option>Montagem Errada</option>     <option>Não Liga</option> <option>Não Scanea</option>
                      <option>Placa Duplicada</option>        <option>QrCode Divergente</option>     <option>QrCode Duplicado</option> <option>Rebarba</option>
                      <option>Reflow</option>                <option>Resina</option>                     <option>Retorno</option> <option>Retrabalho</option>
                      <option>Rotacionado</option>           <option>Router</option>                     <option>Scrap</option> <option>Secundaria Alta</option>
                      <option>Sem coating</option>           <option>Sem Historico de Teste</option>     <option>Sem QrCode</option> <option>Sem Solda</option>
                      <option>Skip</option>                <option>Soldabilidade</option>                 <option>Solder Ball</option> <option>Tape Azul</option>
                      <option>Tape Errada</option>         <option>Tombstone</option>                    <option>Trilha alta</option> <option>Trilha Rompida</option>
                      <option>Tricado</option>             <option>Vários deslocados</option>     <option>Versão Desatualizada</option> <option>Virado</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

              </Row>

              <Row>
              <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Posição Mecânica</Form.Label>
                    <Form.Control
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      onInput={(e) =>
                        (e.target.value = ("" + e.target.value).toUpperCase())
                      }
                      id="Location_auxiliar"
                      onChange={handleChange}
                      placeholder="Insira a Location"
                      name="Location_auxiliar"
                    />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      defaultValue="Choose..."
                      id="Status_auxiliar"
                      name="Status_auxiliar"
                      onChange={handleChange}
                      required
                    >
                      <option></option>
                      <option>Good</option>
                      <option>Scrap</option>
                      <option>NG</option>
                    </Form.Select>
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group
                    style={{ width: "100%", marginTop: 10, marginBottom: 10 }}
                  >
                    <Form.Label>Detalhes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rules={[
                        {
                          required: true,
                          message: "Insira o motivo do controle de MSL",
                        },
                      ]}
                      defaultValue=""
                      maxLength={200}
                      id="Detalhe_auxiliar"
                      onChange={handleChange}
                      name="Detalhe_auxiliar"
                    />
                  </Form.Group>
                </Col>

                <Col>
                  <Form.Group style={{ width: "100%", marginTop: 10 }}>
                    <Form.Label>CN (SN) Input</Form.Label>
                    <Form.Control
                      rules={[
                        { required: true, message: "Insira a Quantidade!" },
                      ]}
                      minLength={10}
                      maxLength={13}
                      onInput={(e) =>
                        (e.target.value = ("" + e.target.value).toUpperCase())
                      }
                      id="CN_auxiliar"
                      onChange={handleChange}
                      placeholder="Input da CN"
                      name="CN_auxiliar"
                     
                    />
                  </Form.Group>
                </Col>

                <Col style={{ marginTop: -30 }}>
                  <Row style={{ justifyContent: "center" }}>
                    <Button
                      style={{ width: "85%", marginBottom: 10, height: 40 }}
                      type="submit"
                      onSubmit={handleAddItem}
                    >
                      Adicionar
                    </Button>

                    <Button
                      style={{
                        width: "85%",
                        marginBottom: 10,
                        height: 40,
                        marginLeft: 1,
                      }}
                      type="reset"
                      onSubmit={handleReset}
                    >
                      Resetar
                    </Button>
                  </Row>
                </Col>
              </Row>

              {/* //--------------------------------------------- */}

              <Row style={{ justifyContent: "center", width: "100%" }}></Row>
            </div>
          </Form>
        </Box>
      </div>

      <Button
        style={{
          width: "18%",
          height: 40,
          marginTop: -30,
          marginBottom: 0,
          backgroundColor: "#128d09",
          marginLeft: 20,
          borderColor: "transparent",
          fontSize: 18,
        }}
        type="submit"
        onClick={handleSubmit}
      >
        Registrar
      </Button>

      <h2 style={{ marginTop: -10 }} className="h2">
        {" "}
        Lista dos dados a serem inputados{" "}
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
          columns={[
            {
              field: "id",
              flex: 2,
              minWidth: 120,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Auxiliar",
              flex: 2,
              headerName: "Tecnico Auxiliar",
              minWidth: 120,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Bancada_auxiliar",
              flex: 2,
              headerName: "Bancada do Auxiliar",
              minWidth: 120,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Defeito_auxiliar",
              flex: 2,
              headerName: "Defeito",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Detalhe_auxiliar",
              flex: 2,
              headerName: "Observação",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Troca_componente",
              flex: 2,
              headerName: "Trocou de Componente?",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Location_auxiliar",
              flex: 2,
              headerName: "Location",
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "Status_auxiliar",
              flex: 1,
              headerName: "Status",
              minWidth: 75,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "CN_auxiliar",
              flex: 2,
              headerName: "CN",
              minWidth: 50,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "actions",
              type: "actions",
              headerName: "Actions", headerClassName:'MUIhAction',
              width: 100,
              cellClassName: "actions",

              getActions: ({ id }) => {
                const isInEditMode =
                  rowModesModel[formData.itens.id]?.mode === GridRowModes.Edit;

                return [
                  <GridActionsCellItem
                    icon={<DeleteIcon />}
                    label="Delete"
                    onClick={handleDeleteClick(id)}
                    color="inherit"
                  />,
                ];
              },
            },
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
                flex: 2,
                minWidth: 120,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Data_auxiliar",
                flex: 2,
                headerName: "Data de Input",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Auxiliar",
                flex: 2,
                headerName: "Tecnico Auxiliar",
                minWidth: 120,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Bancada_auxiliar",
                flex: 2,
                headerName: "Bancada do Auxiliar",
                minWidth: 120,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Defeito_auxiliar",
                flex: 2,
                headerName: "Defeito",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Detalhe_auxiliar",
                flex: 2,
                headerName: "Observação",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Troca_componente",
                flex: 2,
                headerName: "Trocou de Componente?",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Location_auxiliar",
                flex: 2,
                headerName: "Location",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Status_auxiliar",
                flex: 1,
                headerName: "Status",
                minWidth: 75,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "CN_auxiliar",
                flex: 2,
                headerName: "CN",
                minWidth: 50,
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
