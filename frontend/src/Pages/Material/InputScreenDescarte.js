import React from 'react';
import NavbarComp from '../../components/Layout/NavbarComp'
import InputDescarte from '../../components/Material/InputDescarte'
import { Box, Container } from '@mui/system';
import Descarte from '../../components/Material/Descarte'
import { Form, Row, TabContainer } from 'react-bootstrap';

function Stockk () {
    return (
        <>
      <NavbarComp />

      <Box>
      <InputDescarte/>
        </Box>
        <Box style={{marginRight: 10}}>
      <Descarte />
</Box>

        </>
)}

export default Stockk;
