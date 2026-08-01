import { API_URL } from '../../config/api';
import React, { useEffect, useState } from "react";
import Col from "react-bootstrap/Col";
import Form from "react-bootstrap/Form";
import Row from "react-bootstrap/Row";
import Axios from "axios";
import Entrada from "./Entrada.js";
import lista2 from "../../styles.css";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";

import Calendar from "react-calendar";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/DeleteOutlined";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Close";
import {
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from "@mui/x-data-grid";
import NavbarComp from '../Layout/NavbarComp';

export default function App() {
  const [formData, setFormData] = useState({ itens: [] });
  const [values, setValues] = useState();
  const [listCard, setListCard] = useState([App]);
  const [lista, setLista] = useState([]);
  const [date, setDate] = useState(new Date());
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [ocultarCalendario, setOcultarCalendario] = useState(false);
  const [lista2, setLista2] = useState([]);
  const [count, setCount] = useState(1);
  const [rows, setRows] = React.useState(formData.itens);
  const [rowModesModel, setRowModesModel] = React.useState({});

  console.log(listCard);

  let current = new Date();
  let mes = current.getMonth();
  if (current.getMonth() + 1 < 10) {
    mes = "0" + (current.getMonth() + 1);
  } else {
    mes = current.getMonth() + 1;
  }

  let hora = current.getHours();
  if (current.getHours() < 10) {
    hora = "0" + current.getHours();
  } else {
    hora = current.getHours();
  }

  let min = current.getMinutes();
  if (current.getMinutes() < 10) {
    min = "0" + current.getMinutes();
  } else {
    min = current.getMinutes();
  }

  let sec = current.getSeconds();
  if (current.getSeconds() < 10) {
    sec = "0" + current.getSeconds();
  } else {
    sec = current.getSeconds();
  }

  let cDate = current.getFullYear() + "-" + mes + "-" + current.getDate();
  let cTime = hora + ":" + min + ":" + sec;
  let dateTime = cDate + " " + cTime;
  let data = dateTime;
  let turno = "";
  let horario = new Date();
  let horas = horario.getHours();
  let minutos = horario.getMinutes();

  if (horas < 14 && minutos < 55) {
    turno = "1T";
  } else if (horas < 6 && minutos < 55) {
    turno = "3T";
  } else {
    turno = "2T";
  }

  // dias conforme o filtro do gmes
  let dias = current.getDate();
  if (current.getDate() < 10) {
    dias = "0" + current.getDate();
  } else {
    dias = current.getDate();
  }
  let curDate1 = current.getFullYear() + "" + mes + "" + dias;
  let curDate2 = current.getFullYear() + "" + mes + "" + dias - 1;
  let curDate3 = current.getFullYear() + "" + mes + "" + dias - 2;
  let curDate4 = current.getFullYear() + "" + mes + "" + dias - 3;
  let curDate5 = current.getFullYear() + "" + mes + "" + dias - 4;
  let curDate6 = current.getFullYear() + "" + mes + "" + dias - 5;

  const handleChange = (event) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  function limpaCampos() {
    const element1 = document.getElementsByName("Barcode"); // Limpa o campo
    element1.forEach((element) => {
      console.log(element);
      element.value = "";
    });

    const element2 = document.getElementsByName("Reel_ID"); // Limpa o campo
    element2.forEach((element) => {
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
          Line: formData.PO.substring(0, 6),
          Basic_Model: formData.Basic_Model.substring(13, 25),
          Shift: turno,
          Reel_ID: formData.Reel_ID,
          Barcode: formData.Barcode,
          Part_Number: formData.Barcode.slice(0, 11),
          Qty_Output: formData.Barcode.slice(
            formData.Barcode.length - 6,
            formData.Barcode.length
          ),
          User: formData.User,
          Recebedor: formData.Recebedor,
          Registry_ID: formData.Registry_ID.substring(0, 9),
          Halb: formData.Basic_Model.slice(0, 11),
          Plant: formData.PO.substring(15, 20),
        },
      ],
    });
    limpaCampos();
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const array = formData.itens.map((item) => ({
      Line: item.Line,
      Basic_Model: item.Basic_Model,
      Shift: item.Shift,
      Reel_ID: item.Reel_ID,
      Barcode: item.Barcode,
      Part_Number: item.Part_Number,
      Qty_Output: item.Qty_Output,
      User: item.User,
      Registry_ID: item.Registry_ID,
      Halb: item.Halb,
      Recebedor: item.Recebedor,
    }));

    Axios.post(`${API_URL}/registersaida`, array)
      .then((response) => {
        if (response.data.success) {
          alert(response.data.msg);
          window.location.reload();
        } else {
          console.error(response.data.msg);
        alert("Erro - Reel Id duplicado");
        alert("Confira se seu input ja tem registro com mesmo Reel id!");
        }
      })
      .catch((error) => {
        console.error(error);
        alert("Ocorreu um erro ao enviar a mensagem.");
        alert("Dados Não salvos!");
      });
  };

  const handleCalendar = () => {
    setMostrarCalendario(!mostrarCalendario);
  };

  useEffect(() => {
    let mess = date.getMonth();
    if (date.getMonth() + 1 < 10) {
      mess = "0" + (date.getMonth() + 1);
    } else {
      mess = date.getMonth() + 1;
    }
    let diass = date.getDate();
    if (date.getDate() < 10) {
      diass = "0" + date.getDate();
    } else {
      diass = date.getDate();
    }
    Axios.get(
      `http://105.103.2.25/json/smd-material-tracking/?context=getsmdkitting&date=${
        date.getFullYear() + "" + mess + "" + diass
      }`
    ).then((response) => {
      setLista(response.data);
      setMostrarCalendario(false);
      console.log(date);
    });
  }, [date]);

  useEffect(() => {
    Axios.get(`${API_URL}/getModelo`).then((response) => {
      setLista2(response.data);
    });
  }, []);

  const handleRowEditStop = (params, event) => {
    if (params.reason === GridRowEditStopReasons.rowFocusOut) {
      event.defaultMuiPrevented = true;
    }
  };

  const handleEditClick = (id) => () => {
    setRowModesModel({ ...rowModesModel, [id]: { mode: GridRowModes.Edit } });
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

return (
    <>
      <NavbarComp />
      <Box
        className="lista2"
        style={{ marginLeft: 10, background: "#eeeef3", borderRadius: 8 }}
      >
        <Form
          className="EntranceInput1"
          method="post"
          type="submit"
          onSubmit={handleAddItem}
        >
          <h2 style={{ textAlign: "center" }}> Saida de Material</h2>

          <Form.Group className="calendar-container">
            <Form.Group className="calendar-container">
              <Form.Label>Data</Form.Label>

              <Button
                style={{
                  backgroundColor: "white",
                  width: "100%",
                  height: 30,
                  color: "black",
                  borderColor: "#DCDCDC",
                  fontSize: 14,
                  marginBottom: 15,
                }}
                onClick={handleCalendar}
              >
                {" "}
                {date.toDateString()}{" "}
              </Button>

              {mostrarCalendario && (
                <Calendar
                  onChange={setDate}
                  value={date}
                  selectRange={false}
                  onClickDay={setOcultarCalendario}
                  hide={true}
                />
              )}
            </Form.Group>
          </Form.Group>

          <Form.Group className="mb-3" style={{ marginBottom: 15 }}>
            <Form.Label>Matrícula - WIP</Form.Label>
            <Form.Control
              rules={[{ required: true, message: "Please input Gen Id!" }]}
              defaultValue=""
              placeholder="Scan ou digite a Matrícula"
              maxLength={8}
              id="Barcode"
              onChange={handleChange}
              name="Registry_ID"
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3" style={{ marginBottom: 15 }}>
            <Form.Label>Matrícula - Produção</Form.Label>
            <Form.Control
              defaultValue=""
              placeholder="Scan ou digite a Matrícula"
              maxLength={8}
              id="Recebedor"
              onChange={handleChange}
              name="Recebedor"
              required
            />
          </Form.Group>

          <Form.Group as={Col} style={{ marginBottom: 15 }}>
            <Form.Label>Halb | Modelo</Form.Label>
            <Form.Select
              defaultValue="Choose..."
              id="Basic_Model"
              name="Basic_Model"
              onChange={handleChange}
              placeholder="choose a line"
              required
            >
              <option></option>
              {lista2.map((val, index) => (
                <option key={index}>
                  {val.Halb + " | " + val.Basic_Model}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group as={Col} style={{ marginBottom: 15 }}>
            <Form.Label>Linha</Form.Label>
            <Form.Select
              defaultValue=" "
              id="PO"
              name="PO"
              onChange={handleChange}
              placeholder="Insert PO"
              required
            >
              <option></option>
              <option>SMD-01</option>
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
          

          <Form.Group className="mb-3" style={{ marginBottom: 15 }}>
            <Form.Label>Reel ID</Form.Label>
            <Form.Control
              defaultValue=""
              type="text"
              maxLength={18}
              id="Reel_ID"
              name="Reel_ID"
              onChange={handleChange}
              placeholder="Scan Reel ID code"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3" style={{ marginBottom: 15 }}>
            <Form.Label>Barcode</Form.Label>
            <Form.Control
              defaultValue=""
              placeholder="Scan Reel Label"
              minLength={25}
              maxLength={45}
              id="Barcode"
              onChange={handleChange}
              name="Barcode"
              required
            />
          </Form.Group>

          <Button
            style={{
              backgroundColor: "#0e87e2",
              color: "white",
              borderColor: "transparent",
              borderRadius: 5,
              paddingInline: 5,
              height: 40,
              marginBottom: 10,
              MarginTop: 10,
            }}
            type="submit"
            onKeyDown={handleAddItem}
          >
            Adicionar itens
          </Button>
          <br></br>
        </Form>
      </Box>

      <Box style={{ marginLeft: 330 }}>
        <Button
          style={{
            width: "18%",
            height: 40,
            marginTop: 10,
            marginBottom: -30,
            backgroundColor: "#0e87e2",
            borderColor: "transparent",
            fontSize: 18,
          }}
          type="submit"
          onClick={handleSubmit}
        >
          Registrar
        </Button>

        <h2 style={{ marginTop: 5, marginBottom: 10 }} className="h2">
          {" "}
          Lista de Itens a serem inputados
        </h2>
        <br></br>
        <div
          style={{
            height: 520,
            width: "99.9%",
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
                minWidth: 50,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
                headerName: "ID",
              },
              {
                field: "Shift",
                flex: 1,
                minWidth: 50,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              // { field: 'Nome', flex: 2,
              // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
              {
                field: "Registry_ID",
                flex: 2,
                minWidth: 100,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              {
                field: "Halb",
                flex: 2,
                minWidth: 120,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              {
                field: "Basic_Model",
                flex: 2,
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              {
                field: "Line",
                flex: 2,
                minWidth: 100,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              // { field: 'Plant', flex: 2,
              // minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
              {
                field: "Reel_ID",
                flex: 2,
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              {
                field: "Barcode",
                flex: 2,
                minWidth: 300,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              {
                field: "Part_Number",
                flex: 2,
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              // { field: 'Date_Entrance', flex: 2,
              // minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
              // { field: 'Date_Output', flex: 2,
              // minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
              {
                field: "Qty_Entrance",
                flex: 1,
                minWidth: 150,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              {
                field: "Qty_Output",
                flex: 1,
                minWidth: 100,
                align: "center",
                headerAlign: "center",
                headerClassName: "headerr",
              },
              {
                field: "actions",
                type: "actions",
                headerName: "Actions",
                width: 100,
                cellClassName: "actions",
                getActions: ({ id }) => {
                  const isInEditMode =
                    rowModesModel[formData.itens.id]?.mode ===
                    GridRowModes.Edit;

                  if (isInEditMode) {
                    return [
                      <GridActionsCellItem
                        icon={<SaveIcon />}
                        label="Save"
                        sx={{
                          color: "primary.main",
                        }}
                        onClick={handleSaveClick(id)}
                      />,
                      <GridActionsCellItem
                        icon={<CancelIcon />}
                        label="Cancel"
                        className="textPrimary"
                        onClick={handleCancelClick(id)}
                        color="inherit"
                      />,
                    ];
                  }

                  return [
                    <GridActionsCellItem
                      icon={<EditIcon />}
                      label="Edit"
                      className="textPrimary"
                      onClick={handleEditClick(id)}
                      color="inherit"
                    />,
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
      </Box>
    </>
  );
}
