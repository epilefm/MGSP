import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Axios from "axios";
import { textAlign } from "@mui/system";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useEffect, useState } from "react";
import {ExportToExcel} from '../Excel/Excel_Export'
import { Row, Col, Form } from 'react-bootstrap';
import { TextField } from '@mui/material';
import NavbarComp from '../Layout/NavbarComp';

export default function Tabela() {
  const [allCards, setAllCards] = useState([]);
  const [filteredCards, setFilteredCards] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterModel, setFilterModel] = useState("");
  const [filterLine, setFilterLine] = useState("");
  
  useEffect(() => {
    Axios.get("http://105.103.39.102:8080/getCardssaida")
      .then(response => {
        setAllCards(response.data);
        setFilteredCards(response.data);  // Inicialmente, mostrar todos os dados
      })
      .catch(error => console.error("Error fetching data:", error));
  }, []);

  useEffect(() => {
    let filtered = allCards;

    if (filterDate) {
      filtered = filtered.filter(card => {
        if (!card.Date_Output) return false;  // Adiciona verificação para `null` ou `undefined`

        // Supondo que a data esteja no formato 'dd/MM/yyyy'
        const cardDate = card.Date_Output.split('/').reverse().join('-');  // Converte para 'yyyy-MM-dd'
        return cardDate === filterDate;
      });
    }

    if (filterModel) {
      filtered = filtered.filter(card => card.Basic_Model && card.Basic_Model.includes(filterModel));
    }

    if (filterLine) {
      filtered = filtered.filter(card => card.Line && card.Line.includes(filterLine));
    }

    setFilteredCards(filtered);
  }, [filterDate, filterModel, filterLine, allCards]);

  const handleModelInputChange = (event) => {
    const target = event.target;
    const value = target.value;
  
    if (value !== '') {
      setFilterModel(value.toUpperCase());
    } else {
      setFilterModel('');
    }
  };
  
  const handleLineInputChange = (event) => {
    const target = event.target;
    const value = target.value;
  
    if (value !== '') {
      setFilterLine(value.toUpperCase());
    } else {
      setFilterLine('');
    }
  };

    const fileName = "OutGoing Data"; // here enter filename for your excel file

return (
    <>
    <NavbarComp />
    <h2 className='h2' style={{height:0}}> OutGoing Material - (WIP To Process)     </h2>

      <div style={{height:'82vh' , width: '100%', padding:'5px'}}>
     
      <div class='d-flex'>
        <Row >
  <Col>
      <div style={{ marginBottom:10, marginLeft:10 }}>
        <label htmlFor="filter-date">Date: </label>
        <input
          type="date" style={{width:120, height:30, marginTop:5}}
          id="filter-date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>
      </Col>
      <Col>
      <div style={{ marginBottom:10, marginLeft:10 }}>
        <Form.Label htmlFor="filter-model">Model: </Form.Label>
        <Form.Control
          type="text" style={{width:120}}
          id="filter-model"
          value={filterModel}
          onChange={handleModelInputChange}
        />
      </div>
      </Col>
      <Col>
      <div style={{ marginBottom:10, marginLeft:10 }}>
        <Form.Label htmlFor="filter-line">Line: </Form.Label>
        <Form.Control
          type="text" style={{width:120}}
          id="filter-line"
          value={filterLine}
          onChange={handleLineInputChange}
        />
      </div>
      </Col>
      <Col>
      <div style={{ marginTop:28, marginLeft:10 }}>
      <ExportToExcel apiData={filteredCards} fileName={fileName}/>
      </div>
      </Col>
      </Row>
      </div>

      <DataGrid hover={true} className='tabelass'

        columns={[
          { field: 'id', hideable: false,
          minWidth: 10, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Shift', flex: 1,
          minWidth: 50, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'Nome', flex: 2,
          // minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Registry_ID', flex: 2, headerName:'Registry ID',
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Halb', flex: 2,
          minWidth: 120, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Basic_Model', flex: 2, headerName:'Basic Model',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Line', flex: 2,
          minWidth: 100, align:'center', headerAlign:'center', headerClassName:'headerr'},
          // { field: 'Plant', flex: 2,
          // minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Reel_ID', flex: 2, headerName:'Reel ID',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Barcode', flex: 2,
          minWidth: 300, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Part_Number', flex: 2, headerName:'Part Number',
          minWidth: 150, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Date_Output', flex: 2, headerName:'Date Output',
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Hour_Output', flex: 2, headerName:'Hour',
          minWidth: 200, align:'center', headerAlign:'center', headerClassName:'headerr'},
          { field: 'Qty_Output', flex: 1, headerName:'Qty Output',
          minWidth: 100, align: 'center', headerAlign:'center', headerClassName:'headerr'},
        ]}

        rows = {filteredCards}
        slots={{
        toolbar: GridToolbar,
        }}
      
        slotProps={{
          toolbar: {
            showQuickFilter: true,
            quickFilterProps: { debounceMs: 500 },
          },
        }}

      />
    </div>
    </>
  );
}
