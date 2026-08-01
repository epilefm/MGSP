import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import { Box } from '@mui/system';
import CompareReel from '../../components/Production/CompareReel'
import CompareReel_list from '../../components/Production/CompareReel_list'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';


function Devolucaoo () {
  return (
    <>

  <NavbarComp />
  <Tabs
  defaultActiveKey="Compare_reel"
  id="Compare_reel"
  className="mb-3"
>

  <Tab eventKey="Compare_reel" title="Splicing Offline">
    <CompareReel />
  </Tab>
  <Tab eventKey="CompareReel_list" title="Lista de splicing offline">
    <CompareReel_list />
  </Tab>

</Tabs>

    </>
)}

export default Devolucaoo;
