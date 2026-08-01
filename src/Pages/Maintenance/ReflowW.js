import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import { Box } from '@mui/system';
import Input_Reflow from '../../components/Manutenção/Reflow/Input_Reflow'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';


function Devolucaoo () {
  return (
    <>

  <NavbarComp />
  <Tabs
  defaultActiveKey="Input_Reflow"
  id="Input_Reflow"
  className="mb-3"
>

  <Tab eventKey="Input_Reflow" title="Input de Profiles">
    <Input_Reflow />
  </Tab>

</Tabs>

    </>
)}

export default Devolucaoo;
