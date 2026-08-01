import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import Devolucao from '../../components/Material/Devolucao'
import Descarte from '../../components/Material/Descarte'
import { Box } from '@mui/system';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

function Devolucaoo () {
    return (
        <>

      <NavbarComp />
      <Tabs
      defaultActiveKey="profile"
      id="uncontrolled-tab-example"
      className="mb-3"
    >
      <Tab eventKey="home" title="Devolução de Material">
        <Devolucao />
      </Tab>
      <Tab eventKey="profile" title="Devolução de Material">
        <Descarte />
      </Tab>

    </Tabs>

        </>
)}

export default Devolucaoo;
