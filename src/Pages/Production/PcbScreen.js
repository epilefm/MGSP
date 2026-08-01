import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import Scrap from '../../components/Production/Scrap'
import { Box } from '@mui/system';
import Placa_saida from '../../components/Repair/Reparo_Saida'
import Placa_receb from '../../components/Production/Placa_receb'
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';


function Devolucaoo () {
  return (
    <>

  <NavbarComp />
  <Tabs
  defaultActiveKey="Receb"
  id="Placas"
  className="mb-3"
>

  <Tab eventKey="Receb" title=" Recebimento das Placas  ">
    <Placa_receb />
  </Tab>

  <Tab eventKey="saida" title=" Saida das Placas  ">
    <Placa_saida />
  </Tab>

</Tabs>

    </>
)}

export default Devolucaoo;
