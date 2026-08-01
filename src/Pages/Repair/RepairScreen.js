import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import { Box } from '@mui/system';
import Reparo_Ent from '../../components/Repair/Reparo_Ent'
import Reparo_Ent_2 from '../../components/Repair/Reparo_Ent_2'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

function Devolucaoo () {
  return (
      <>

    <NavbarComp />

    <Tabs
      defaultActiveKey="entrada"
      id="repair-tabs"
      className="mb-3"
    >
      <Tab eventKey="entrada" title="Entrada de Placas">
        <Reparo_Ent />
      </Tab>
      <Tab eventKey="entrada2" title="Entrada de Placas 2.0">
        <Reparo_Ent_2 />
      </Tab>
    </Tabs>
  



      </>
)}

export default Devolucaoo;
