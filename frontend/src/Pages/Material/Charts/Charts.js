import React from 'react';
import NavbarComp from '../../../components/Layout/NavbarComp'
import ChartDescarte from '../../../components/Dashboards/Material/descarte/ChartDescarte'
import Button from '@mui/material/Button'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';


function Devolucaoo () {
  return (
      <>

    <NavbarComp />
    <Tabs
    defaultActiveKey="Entrada"
    id="Materiais"
    className="mb-3"
  >

<Tab eventKey="Entrada" title="Dashboard Descarte ">
      <ChartDescarte />
    </Tab>

  </Tabs>
      </>
)}

export default Devolucaoo;
