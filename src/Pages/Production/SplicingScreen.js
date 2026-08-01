import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import { Box } from '@mui/system';
import Splicing_history from '../../components/Production/Splicing/Splicing_history'
import Splicing_ops from '../../components/Production/Splicing/Splicing_ops'
import Splicing_comp from '../../components/Production/Splicing/Splicing_comp'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';

function Devolucaoo () {
  return (
    <>
    <Splicing_history />
  <Tabs
  defaultActiveKey="splicing"
  id="splicing"
  className="mb-3"
>

  {/* <Tab eventKey="splicing" title="Splicing por turno"> */}

  {/* </Tab> */}


{/* 
  <Tab eventKey="splicing_comparison" title="Histórico de splicing">
    <Splicing_comp />
  </Tab>  */}

</Tabs>

    </>
)}

export default Devolucaoo;
