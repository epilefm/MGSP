import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import { Box } from '@mui/system';
import Splicing_Defect from '../../components/Production/Splicing/Splicing_Defect';
import Splicing_NoCheck from '../../components/Production/Splicing/Splicing_NoCheck';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';


function Devolucaoo () {
  return (
    <>

  <NavbarComp />
  <Tabs
  defaultActiveKey="Splicing_NoCheck"
  id="Splicing_NoCheck"
  className="mb-3"
>

  <Tab eventKey="Splicing_NoCheck" title="Falta de splicing">
    <Splicing_NoCheck />
  </Tab>
  <Tab eventKey="splicing_Defect" title="Defeitos de Splicing">
    <Splicing_Defect />
  </Tab>

</Tabs>

    </>
)}

export default Devolucaoo;
