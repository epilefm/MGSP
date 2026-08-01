import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import Scrap from '../../components/Production/Scrap'
import { Box } from '@mui/system';
import Placa_saida from '../../components/Production/Placa_saida'
import Placa_receb from '../../components/Production/Placa_receb'

function Devolucaoo () {
  return (
    <>

  <NavbarComp />
  <Tabs
  defaultActiveKey="input"
  id="Placas"
  className="mb-3"
>

<Tab eventKey="input" title=" Input de Placas ">
    <Scrap />
  </Tab>

  <Tab eventKey="aceite" title=" Recebimento das Placas  ">
    <Placa_receb />
  </Tab>

  <Tab eventKey="saida" title=" Saida das Placas  ">
    <Placa_saida />
  </Tab>

</Tabs>

    </>
)}

export default Devolucaoo;
