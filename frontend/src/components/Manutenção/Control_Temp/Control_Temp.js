import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Box, Grid, CircularProgress, RadioGroup, Radio, FormControlLabel, FormLabel } from '@mui/material';
import { white, black, red, green, pink, purple } from '@mui/material/colors';
import { FaThermometerHalf, FaTint } from 'react-icons/fa';
import { Helmet } from 'react-helmet';
import NavbarComp from '../../Layout/NavbarComp';


const App = () => {
  const [data, setData] = useState([]);
  const [newData, setNewData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('ALL'); // Estado para armazenar o filtro atual

  useEffect(() => {
    fetchData();
    fetchNewData();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(fetchData, 10 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://105.103.39.102:8080/Temperatura');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNewData = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://105.103.39.102:8080/TempAmbiente');
      setNewData(response.data);
    } catch (error) {
      console.error('Error fetching new data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const groupByLine = data.reduce((acc, item) => {
    const { linha, equip, temp, umidade } = item;
    if (!acc[linha]) {
      acc[linha] = [];
    }
    acc[linha].push({ equip, temp, umidade });
    return acc;
  }, {});

  const ranges = {
    FUNCTION: { temp: [18, 28], umidade: [40, 60] },
    DRYPORT: { temp: [18, 28], umidade: [0, 10] },
    AMBIENTE: { temp: [18, 28], umidade: [40, 60] }
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

return (
    <>
      <NavbarComp />
      <Helmet>
        <title>Temp Control</title>
      </Helmet>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', backgroundColor: '#121212' }}>
        <Box sx={{ color: '#ffffff', padding: '20px', width: '100%', textAlign: 'center' }}>
          <Typography variant="h4">Temperatura e Umidade por Linha</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
          <RadioGroup
            row
            value={filter}
            onChange={handleFilterChange}
            sx={{ color: 'snow', Weight:'bold' }}
          >
            {/* <FormControlLabel value="ALL" control={<Radio />} label="Todos" /> */}
            {[...new Set(data.map(item => item.equip))].filter(equip => equip !== 'AMBIENTE').map(equip => (
              <FormControlLabel key={equip} value={equip} control=
              {<Radio sx={{
                color: 'white',
                '&.Mui-checked': {
                  color: '#f39c12 ',
                },
              }}  />} label={equip}  />
            ))}
          </RadioGroup>
        </Box>
        <Grid container spacing={3} sx={{ width: '100%', maxWidth: '1450px', marginTop: '5px' }}>
          {Object.entries(groupByLine).map(([linha, equipamentos]) => (
            <Grid item xs={12} sm={6} md={2} key={linha}>
            
              {equipamentos.filter(equipamento => filter === 'ALL' || equipamento.equip === filter).length > 0 && (
                <Box sx={{ backgroundColor: '#333333', borderRadius: '8px', padding: '5px', margin: '5px', boxShadow: 1 }}>
                  <Typography variant="h5" sx={{ textAlign: 'center', backgroundColor: '#444444', color: '#ffffff', borderRadius: '4px' }}>{linha}</Typography>
                  {equipamentos.filter(equipamento => filter === 'ALL' || equipamento.equip === filter).map((equipamento, index) => {
                    const { equip, temp, umidade } = equipamento;
                    const tempRange = ranges[equip]?.temp;
                    const umidadeRange = ranges[equip]?.umidade;
                    const isTempOk = tempRange ? tempRange[0] <= temp && temp <= tempRange[1] : true;
                    const isUmidadeOk = umidadeRange ? umidadeRange[0] <= umidade && umidade <= umidadeRange[1] : true;

                    return (
                      <Card key={index} sx={{ marginBottom: '10px', backgroundColor: '#333333' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ textAlign: 'center', color: '#ffffff' }}>{equip}</Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: isTempOk ? 'rgb(45, 223, 68)' : 'rgb(235, 99, 89)', padding: '5px', borderRadius: '5px' }}>
                              <FaThermometerHalf color="rgb(33, 87, 131)" style={{ height: '15px', width: '15px' }} />
                              <Typography sx={{ marginLeft: '10px', color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}> {temp} °C</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', backgroundColor: isUmidadeOk ? 'rgb(45, 223, 68)' : 'rgb(235, 99, 89)', padding: '5px', borderRadius: '5px' }}>
                              <FaTint color="rgb(33, 87, 131)" />
                              <Typography sx={{ marginLeft: '10px', color: '#ffffff', fontWeight: 'bold', fontSize: 14 }}>{umidade} %</Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Grid>
          ))}
          {isLoading && (
            <Box sx={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000 }}>
              <CircularProgress color="primary" />
            </Box>
          )}
        </Grid>
      </Box>
    </>
  );
};

export default App;
