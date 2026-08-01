import React from 'react';
import Header from '../../components/Layout/MGSPHead/Header'
import { Box } from '@mui/system';
import CNcheck from '../../components/Production/CNcheck'
import CN_List from '../../components/Production/CN_List'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';


function Devolucaoo () {
  return (
    <>

  <Header />
  <Tabs
  defaultActiveKey="CNcheck"
  id="Placas"
  className="mb-3"
>

  <Tab eventKey="CNcheck" title="Duplo Check de CN's">
    <CNcheck />
  </Tab>

  <Tab eventKey="CN_List" title="Histórico de CN's">
    <CN_List />
  </Tab>

</Tabs>

    </>
)}

export default Devolucaoo;
