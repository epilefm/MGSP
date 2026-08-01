import React, { useEffect, useState } from "react";
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Axios from "axios";
import { Box } from "@mui/material";
import { Button, ListGroup } from "react-bootstrap";
import { ListItem, ListItemText } from "@mui/material";
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { ExportToExcel } from '../Excel/Excel_Export'
import { randomNumberBetween } from "@mui/x-data-grid/utils/utils";
import NavbarComp from '../Layout/NavbarComp'

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/DeleteOutlined';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import {
  GridRowModes,
  GridActionsCellItem,
  GridRowEditStopReasons,
} from '@mui/x-data-grid';

export default function App() {

  const [formData, setFormData] = useState({ itens: [], });
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
    const element1  = document.getElementsByName("CN_recebrep"); // Limpa o campo
    element1.forEach(element => {
      console.log(element);
      element.value = '';
      element.focus();
      setCount(count+1);
    })
  }

  const handleAddItem = (event) => {
    event.preventDefault();
    setFormData({
      ...formData,
        itens: [...formData.itens, {
          id:count,
        Entrada: formData.Entrada,
        Tecnico: formData.Tecnico,
        CN_recebrep: formData.CN_recebrep,
          }]
      });
      limpaCampos()
    };
  

    const handleSubmit = (event) => {
      event.preventDefault();
    
      const array = formData.itens.map(item => ({
        Entrada: item.Entrada,
        Tecnico: item.Tecnico,
        CN_recebrep: item.CN_recebrep,
      }));
    
      Axios.post('http://105.103.39.102:8080/ReparoReceb', array)
        .then((response) => {
          if (response.data.success) {
            alert('Input da CN ' + formData.CN_recebrep + ' salvo com sucesso no Recebimento do Reparo');
            window.location.reload();
          } else {
            alert('Falha de input: Não foi possivel encontrar CN ' + formData.CN_recebrep +
             ' cadastrada na tela de Reparo Entrada');
          }
        })
        .catch(error => {
          console.error(error);
          alert('Erro ao processar a solicitação. Por favor, tente novamente mais tarde.');
        });
    }; 


  useEffect(() => {
    Axios.get('http://105.103.39.102:8080/getReparoReceb')
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
    setFormData(formData.itens.map((row) => (row.id === newRow.id ? updatedRow : row)));
    return updatedRow;
  };

  const handleRowModesModelChange = (newRowModesModel) => {
    setRowModesModel(newRowModesModel);
  };
  const toInputUppercase = e => {
    e.target.value = ("" + e.target.value).toUpperCase();
  };

  const fileName = "Repair Register"; // here enter filename for your excel file

  const handleReset = (event) => {
    event.preventDefault();
    Array.from(document.querySelectorAll("input")).forEach(
      input => (input.value = "")
    );
    this.setState({
      itemvalues: [{}]
    });
  };

  const contagem = (count) => {
     setCount(count + 1);
  }

  return (
    <>
<NavbarComp/>
      <div className='row col-12'>
        <Box style={{ background: 'transparent', borderRadius: 8, width: '100%' }}>

          <h2 style={{ textAlign: 'center' }}> Recebimento de Placas </h2>

          <Form style={{ border: 'solid 0.1rem', borderColor: '#84aac6', borderRadius: 10, marginLeft: 20, 
          marginBottom: 30 }} onSubmit={handleAddItem}>

            <div style={{ marginLeft: 20 }}>
              <Row style={{ justifyContent: 'center', width: '100%' }} >
                      
              <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0,  marginBottom:10 }}>
                    <Form.Label>Responsável</Form.Label>
                    <Form.Control rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                       maxLength={8} id="Tecnico" Placeholder='Inserir a Matrícula' onChange={handleChange} name='Tecnico' required />
                  </Form.Group>
                </Col>

              <Col>
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0, marginBottom:10 }}>
                    <Form.Label>Recebimento</Form.Label>
                    <Form.Select rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      defaultValue="" maxLength={25} id="Entrada" onChange={handleChange} name='Entrada' required>
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
                  <Form.Group style={{ width: '100%', marginTop: 10, marginLeft: 0, marginBottom:10 }}>
                    <Form.Label>CN</Form.Label>
                    <Form.Control rules={[{ required: true, message: 'Insira a Quantidade!', },]}
                      minLength={10} maxLength={13} onInput={(e) => e.target.value = ("" + e.target.value).toUpperCase()}
                       id="CN_recebrep" placeholder='Inserir a CN' onChange={handleChange} name='CN_recebrep' required />
                  </Form.Group>
                </Col>

              </Row>

              <Row style={{ justifyContent: 'center' }}>
                <Button style={{ width: '20%', marginTop: 20, marginBottom: 10, height: 40 }} type="submit" 
                onSubmit={handleAddItem}>Adicionar</Button>

                <Button style={{ width: '20%', marginTop: 20, marginBottom: 10, height: 40, marginLeft: 20 }}
                 type="reset" onSubmit={handleReset}>Resetar</Button>
              </Row>

            </div>
          </Form>
        </Box>
      </div>

      <Box style={{marginLeft:20}}>

<Button style={{width:'18%', height:40, marginTop:10, marginBottom:-30, backgroundColor:'#128d09',
borderColor:'transparent', fontSize:18}} type="submit"
onClick={handleSubmit}>Registrar</Button>

  <h2 style={{marginTop:5, marginBottom:10}} className='h2'> Lista de Itens a serem inputados</h2><br></br>
<div style={{ height:300 , width:'99%', padding:'2px', marginTop:'-30px'}}>

<DataGrid  hover={true} 
columns={[
  {
    field: 'id', hideable: false,
    minWidth: 10, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  },
  {
    field: 'Tecnico', flex: 2, headerName:'Recebimento',
    minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  },
  {
    field: 'Entrada', flex: 2, 
    minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  },
  {
    field: 'CN_recebrep', flex: 2, headerName: 'CN',
    minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  },
  {
    field: 'actions',
    type: 'actions',
    headerName: 'Actions', headerClassName: 'MUIhAction',
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

rows = {formData.itens}
slots={{
}}
initialState={{
  sorting: {
    sortModel: [{ field: 'id', sort: 'desc' }],
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

  <Box style={{marginLeft:20, marginTop:30}}>

  <h2 style={{marginTop:5, marginBottom:10}} className='h2'> Lista dos Inputs</h2><br></br>
<div style={{ height:300 , width:'99%', padding:'2px', marginTop:'-30px'}}>

<DataGrid  hover={true} 
columns={[
  {
    field: 'id', hideable: false,
    minWidth: 10, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  },
  {
    field: 'Tecnico', flex: 2, headerName:'Recebimento',
    minWidth: 120, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  },
  {
    field: 'Entrada', flex: 2, 
    minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  },
  {
    field: 'CN_recebrep', flex: 2, headerName: 'CN',
    minWidth: 150, align: 'center', headerAlign: 'center', headerClassName: 'MUIheader'
  },
]}

rows = {lista}
slots={{
}}
initialState={{
  sorting: {
    sortModel: [{ field: 'id', sort: 'desc' }],
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
  )
}
