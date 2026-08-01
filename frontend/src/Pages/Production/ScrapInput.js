import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import SmdKitting from '../../components/Production/SmdKitting'
import ProdPlan from '../../components/Production/ProdPlan'
import Entrada from '../../components/Material/Entrada'
import Saida from '../../components/Material/Saida'
import Devolucao from '../../components/Material/Devolucao'
import Descarte from '../../components/Material/Descarte'
import Resumo from '../../components/Material_analysis/Resume_Control'
import ClassA from '../../components/Material/ClassA'

import { Box } from '@mui/system';
import styles from '../../styles.css'
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

<Tab eventKey="Entrada" title=" Material Receipt ">
      <Entrada />
    </Tab>

    <Tab eventKey="Saida" title="Outgoing Material ">
      <Saida />
    </Tab>

    <Tab eventKey="Devolucao" title=" Return Material ">
      <Devolucao />
    </Tab>

    <Tab eventKey="Descarte" title=" Material Disposal ">
      <Descarte />
    </Tab>

        <Tab eventKey="ClassA" title=" Class A Control ">
      <ClassA />
    </Tab>

    <Tab eventKey="Resumo" title=" Material Analysis ">
      <Resumo />
    </Tab>

        {/* <Tab eventKey="Kit" title="SMD Kitting Plan">
      <SmdKitting />
    </Tab> */}

        <Tab eventKey="Prod" title=" Plan vs Result">
      <ProdPlan />
    </Tab>


  </Tabs>

      </>
)}

export default Devolucaoo;
