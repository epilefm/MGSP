import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import Wrong_Plant from '../../components/Quality/Wrong_Plant'
import Wrong_PlantHistory from '../../components/Quality/Wrong_PlantHistory'

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
    defaultActiveKey="WPlant"
    id="WPlant"
    className="mb-3"
  >

<Tab eventKey="WPlant" title=" WPlant ">
      <Wrong_Plant />
    </Tab>

    <Tab eventKey="WPlantHistory" title="WPlantHistory ">
      <Wrong_PlantHistory />
    </Tab>




  </Tabs>

      </>
)}

export default Devolucaoo;