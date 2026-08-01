import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import EntMaterial from '../../components/Material/EntMaterial2'
import InputSaida from '../../components/Material/InputSaida'
import InputDevolucao from '../../components/Material/InputDevolucao'
import InputDescarte from '../../components/Material/InputDescarte'
import Entrada from '../../components/Material/Entrada'

import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Box, Container } from '@mui/system';
import { Form, Row, TabContainer } from 'react-bootstrap';

function Stockk () {
    return (
        <>
    <NavbarComp />
<Box>
      <EntMaterial />
        </Box>
        <Box  style={{marginRight: 10, marginTop:100}}>
      <Entrada />
      </Box>
        </>
)}

export default Stockk;
