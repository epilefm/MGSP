import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import Baking from '../../components/Quality/MSL/Baking'
import { Box } from '@mui/system';
import SubMgtm from '../../components/Quality/SubMgtm'
import SaidaSub from '../../components/Quality/SaidaSub'

import Button from '@mui/material/Button'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

function Devolucaoo () {
  return (
    <>

  <NavbarComp />
  <Tabs
    defaultActiveKey="Subsidiary"
    id="Subsidiary"
    className="mb-3"
  >

<Tab eventKey="Subsidiary" title="Subsidiary ">
    <SubMgtm/>
    </Tab>

    <Tab eventKey="Saida" title="Saida ">
    <SaidaSub/>
    </Tab>

  </Tabs>
  
    </>
)}
export default Devolucaoo;
