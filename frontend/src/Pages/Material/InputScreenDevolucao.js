import React from 'react';
import InputDevolucao from '../../components/Material/InputDevolucao'
import { Box, Container } from '@mui/system';
import Devolucao from '../../components/Material/Devolucao'
import { Form, Row, TabContainer } from 'react-bootstrap';


function Stockk () {
    return (
        <>
<Box>
      <InputDevolucao />
        </Box>
        <Box  style={{marginRight: 10}}>
      <Devolucao />
      </Box>
        </>
)}

export default Stockk;
