import React from 'react';
import InputSaida from '../../components/Material/InputSaida'
import { Box } from '@mui/system';
import Saida from '../../components/Material/Saida'

function Stockk () {
    return (
        <>

<Box>
      <InputSaida />
        </Box>
        <Box  style={{marginRight: 10, marginTop:150}}>
      <Saida />
</Box>
        </>
)}

export default Stockk;
