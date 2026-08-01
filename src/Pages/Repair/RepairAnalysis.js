import React from 'react';
import { Box } from '@mui/system';
import Repair_Detalhado from '../../components/Repair/Repair_Detalhado'
import Repair_Inventario from '../../components/Repair/Repair_Inventario'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import Header from '../../components/Layout/MGSPHead/Header';


function Devolucaoo () {
  return (
      <>

    <Header />
    <Tabs
    defaultActiveKey="Detalhado"
    id="Reparo"
    className="mb-3"
  >
{/* 
<Tab eventKey="Resumao" title="Resumo">
      <Repair_Resumao/>
    </Tab> */}

    <Tab eventKey="Detalhado" title="Detalhado">
      <Repair_Detalhado/>
    </Tab>

    <Tab eventKey="Inventario" title="Inventario">
      <Repair_Inventario/>
    </Tab>




  </Tabs>

      </>
)}

export default Devolucaoo;
