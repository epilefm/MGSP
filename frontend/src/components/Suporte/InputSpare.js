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
          spare: formData.spare,
          solicitante: formData.solicitante,
          codMaterial: formData.codMaterial,
          qty: formData.qty,
        }]
    });
    limpaCampos()
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const array = formData.itens.map((item) => ({

      id: item.id,
      spare: item.spare,
      solicitante: item.solicitante,
      codMaterial: item.codMaterial,
      qty: item.qty,
    }))

    Axios.post(`${API_URL}/Spare`, array)
    .then((response) => {
      if (response.data.success) {
        alert(formData.spare + 'registrou a saida do' + formData.codMaterial + 'no spare parts') ;
       
      } else {
        alert('Falha ao dar saida do material ' + formData.CodMaterial);
      }
    })
    .catch(error => {
      console.error(error);
      alert('Erro ao processar a solicitação. Por favor, tente novamente mais tarde.');
    });  window.location.reload();
}; 

  useEffect(() => {
    Axios.get(`${API_URL}/getSpare`)
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

  const fileName = "Saída de placa no reparo"; // here enter filename for your excel file

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

          <h2 style={{ textAlign: "center" }}> Spare Parts - Registro de saída de material </h2>

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
                    <Form.Label>Spare Parts</Form.Label>
                    <Form.Select
                      
                      defaultValue=""
                      maxLength={25}
                      id="spare"
                      onChange={handleChange}
                      name="spare"
                      required
                    >
                      <option></option>
                      <option>Yamille Pantoja</option>
                      <option>Marcia Natividade</option>
                      <option>João Lobato</option>
                      <option>Jessica Carvalho</option>
                      <option>Francisco Carmenio</option>

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
                    <Form.Label>Solicitante</Form.Label>
                    <Form.Control
                        minLength={10}
                      maxLength={13}
                      onInput={(e) =>
                        (e.target.value = ("" + e.target.value).toUpperCase())
                      }
                      id="solicitante"
                      Placeholder="Scan crachá do solicitante"
                      onChange={handleChange}
                      name="solicitante"
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
                    <Form.Label>QrCode Material</Form.Label>
                    <Form.Control
                      defaultValue=""
                      id="codMaterial"
                      Placeholder="Scan Qrcode do material"
                      onChange={handleChange}
                      name="codMaterial"
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
                    <Form.Label>Qty</Form.Label>
                    <Form.Control
                      
                      id="qty"
                      Placeholder="Inserir a Qty"
                      onChange={handleChange}
                      name="qty"
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
        Lista dos dados a serem inputados{" "}
      </h2>
      <div
        style={{
          height: 300,
          width: "100%",
          padding: "2px",
          marginTop: 10,
          justifyContent: "center",
        }}
      >

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
              field: "spare",
              headerName: 'Spare Parts',
              flex: 2,
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "solicitante",
              headerName: 'Solicitante',
              flex: 2,
              minWidth: 120,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "codMaterial",
              headerName: 'Código do material',
              flex: 2,
              minWidth: 150,
              align: "center",
              headerAlign: "center",
              headerClassName: "MUIheader",
            },
            {
              field: "qty",
              flex: 2,
              headerName: "Recebedor saida",
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
                  
          <ExportToExcel apiData={lista} fileName={fileName} />
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
                field: "spare",
                headerName: 'Spare Parts',
                flex: 2,
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "solicitante",
                headerName: 'Solicitante',
                flex: 2,
                minWidth: 120,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Funcionários",
                headerName: 'Funcionários',
                flex: 2,
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "codMaterial",
                flex: 2,
                headerName: "Código do Material",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Qty",
                flex: 2,
                headerName: "Qty",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "material",
                flex: 2,
                headerName: "Material",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Valor",
                flex: 2,
                headerName: "Valor Unitário",
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "MUIheader",
              },
              {
                field: "Valor_Total",
                flex: 2,
                headerName: "Valor Total",
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
