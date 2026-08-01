import React, { useEffect, useState } from "react";
import axios from 'axios';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import ATR_SlotsCSS from './ATR_SlotsCSS.css';
import Header from '../../Layout/MGSPHead/Header';
import { Row, Col } from "react-bootstrap";
import { Select, MenuItem, Modal } from "@mui/material";
import { Helmet } from 'react-helmet';


const App = () => {
    const [slotsData, setSlotsData] = useState([]); // Dados de slip por slot
    const [magazineData, setMagazineData] = useState({}); // Dados da URL externa (indexed by MAG_NO)
    const [filledSlotsCount, setFilledSlotsCount] = useState(0); // Contagem de slots preenchidos
    const [emptySlotsCount, setEmptySlotsCount] = useState(0);   // Contagem de slots vazios
    const [models, setModels] = useState([]); // Lista de modelos únicos
    const [selectedModel, setSelectedModel] = useState(''); // Modelo selecionado
    const [searchResult, setSearchResult] = useState(null); // Resultado da pesquisa do modelo

    useEffect(() => {
        const fetchData = async () => {
            const slotData = await getMagNoAndSlotFromDB(); // Buscar dados do banco

            if (slotData) {
                setSlotsData(slotData); // Atualizar o estado com os dados do banco
                calculateSlotCounts(slotData); // Calcular a quantidade de slots preenchidos e vazios

                const uniqueSlips = [...new Set(slotData.map(slot => slot.slip).filter(slip => slip))];
                const magazineData = await fetchMagazineData(uniqueSlips); // Buscar dados da URL externa
                setMagazineData(magazineData); // Atualizar estado com dados da URL externa

                const uniqueModels = extractUniqueModels(magazineData);
                setModels(uniqueModels); // Atualizar o estado com os modelos unicos
            }
        };
        fetchData();
    }, []);

    const getMagNoAndSlotFromDB = async () => {
        try {
            const result = await axios.get('http://105.103.39.102:8080/getATRSlots');
            return result.data;  // Retorna os dados do banco de dados
        } catch (error) {
            console.error("Erro ao buscar dados do banco de dados", error);
            return null;
        }
    };

    document.body.style.backgroundColor = '#515151';

    const fetchMagazineData = async (slips) => {
        const results = {};
        try {
            for (const slip of slips) {
                const result = await axios.get(`http://105.103.2.25/json/smd-material-tracking/?context=getMagazineQtyModelByCN&cn=${slip}`);
                if (result.data.length > 0) {
                    results[slip] = result.data[0]; // Armazena a primeira correspondencia para cada slip
                }
            }
        } catch (error) {
            console.error("Erro ao buscar dados da URL externa", error);
        }
        return results; // Retorna um objeto com os dados da URL externa indexados pelos slips
    };

    const calculateSlotCounts = (data) => {
        const filledSlots = data.filter(slot => slot.slip && slot.slip.trim() !== "").length;
        const emptySlots = data.length - filledSlots;
        setFilledSlotsCount(filledSlots); // Atualizar contagem de preenchidos
        setEmptySlotsCount(emptySlots);   // Atualizar contagem de vazios
    };

    const getSlipForSlot = (slotNumber) => {
        const slotInfo = slotsData.find((s) => s.slot === slotNumber);
        if (!slotInfo) return "-";
        
        const slip = slotInfo.slip ? slotInfo.slip.trim().toUpperCase() : null;
        const magazineInfo = magazineData[slip];
        
        if (magazineInfo) {
            const dateString = magazineInfo.FNL_UPD_DT.substring(0, 8); // Extract the date part
            const timeString = magazineInfo.FNL_UPD_DT.substring(8); // Extract the time part
            const formattedDate = `${dateString.substring(0, 4)}/${dateString.substring(4, 6)}/${dateString.substring(6, 8)}
             ${timeString.substring(0, 2)}:${timeString.substring(2, 4)}:${timeString.substring(4, 6)}`;
            
            // Remove 'BSM-' prefix from the model
            const modelWithoutPrefix = magazineInfo.BASIC_MODEL_CODE.replace(/^BSM-/, '');
            
            return `
                ${modelWithoutPrefix} | ${magazineInfo.MAG_NO} |
                ${magazineInfo.LINE_NM} | ${formattedDate} | ${magazineInfo.QTY}
            `;
        }
        
        return slip || ""; // Se não encontrou correspondência ou slip for null
    };

    const calculateTotalQuantity = () => {
        let total = 0;

        for (const slip in magazineData) {
            if (magazineData[slip] && magazineData[slip].QTY) {
                total += Number(magazineData[slip].QTY);
            }
        }

        return total;
    };

    const extractUniqueModels = (magazineData) => {
        const modelsSet = new Set();
        Object.keys(magazineData).forEach(slip => {
            const magazineInfo = magazineData[slip];
            if (magazineInfo && magazineInfo.BASIC_MODEL_CODE) {
                modelsSet.add(magazineInfo.BASIC_MODEL_CODE.toUpperCase());
            }
        });
        return Array.from(modelsSet);
    };

    const handleSearch = (model) => {
        let totalQty = 0;

        Object.keys(magazineData).forEach(slip => {
            const magazineInfo = magazineData[slip];
            if (magazineInfo && magazineInfo.BASIC_MODEL_CODE.toUpperCase() === model.toUpperCase()) {
                totalQty += parseInt(magazineInfo.QTY, 10);
            }
        });

        setSearchResult(totalQty);
    };

    const handleModelChange = (e) => {
        const selected = e.target.value;
        setSelectedModel(selected);
        handleSearch(selected); // Chama a pesquisa automaticamente
    };

    // setTimeout(function() {
    //     window.location.reload(1);
    //   }, 60000); // 1 minuto


    return (
        
        <>
        <Header/>
<Helmet>
        <title>Smart Rack</title>
      </Helmet>
            <div style={{ backgroundColor: '#3d3d3d', display: 'flex',  justifyContent:'space-around'}}>         
                <Box className='boxSlotEmpty'>
                    Slots Vazios: {emptySlotsCount} </Box>

                <div style={{display: 'flex', flexWrap: 'wrap'}}>
                <Box className='boxSlotStock'>Estoque Preenchido: { filledSlotsCount} </Box>
                <Box className='boxSlotTotal'> Total de PCB's: {calculateTotalQuantity()} </Box>
                </div>

                <div style={{textAlign: 'center', display: 'flex', flexWrap: 'wrap'}}>
                    <Select className='boxModelSlot'
                        MenuProps={{
                            sx: {
                                "&& .Mui-selected": {
                                    color: "rgb(0, 102, 26)",
                                    background: "rgb(85, 255, 127)",
                                },
                            },
                        }}
                        sx={{
                            "& [aria-expanded=true]":{
                                background: "transparent",
                            },
                        }}
                        value={selectedModel}
                        onChange={handleModelChange} // Pesquisa ao mudar o valor do Select
                        displayEmpty
                        style={{marginLeft: '10px', marginRight: '10px', borderColor:'white',
                        height: 20, color: 'black', backgroundColor: 'snow', marginTop: 5 }}
                    >
                        <MenuItem value="" disabled>Selecione um Modelo</MenuItem>
                        {models.map((model) => (
                            <MenuItem key={model} value={model}>{model}</MenuItem>
                        ))}
                    </Select>
                

                {searchResult !== null && (
                    <Typography variant="h6" style={{textAlign: 'center', color: 'white', position:'initial' ,
                    fontSize: 12, marginTop:7}}>
                        Total: {searchResult}
                    </Typography>
                )}
                </div>
            </div>
           
{/* -------------------------------------------------------------------------------------------------------------------------- */}

 <div className='slot-container'
 style={{ backgroundColor: '#3d3d3d', border:'solid 2px white', margin:'1px', borderRadius:'10px' }}>
                <div style={{ display: 'flex', width: '100%' }}>
                    <div className='' style={{ display: 'flex',  width: '100%', flexDirection: 'column'}}>
        
        
<div style={{ display: 'flex',  justifyContent:'space-between', flex: 1}}>
{Array.from({ length: 7 }, (_, index) => {
    const slotNumber = 84 - index; // Numerar os slots de 84 até 78
    const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
    const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido

    return (
        <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
            <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
            <div style={{zIndex: 10}}>
                <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                    {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                </Typography>
            </div>
        </Box>
    );
})}
</div>


<div style={{ display: 'flex',  justifyContent:'space-between', flex: 1 }}>
                        {Array.from({ length: 7 }, (_, index) => {
            const slotNumber = 77 - index; // Numerar os slots de 75 até 69
            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
            const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido
        
            return (
                <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                    <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                    <div style={{zIndex: 10}}>
                        <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                            {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                        </Typography>
                    </div>
                </Box>
            );
        })}
        </div>


        <div style={{ display: 'flex',  justifyContent:'space-between' }}>
        {Array.from({ length: 7 }, (_, index) => {
        const slotNumber = 70 - index; //
        const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
        const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido

        return (
            <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                <div style={{zIndex: 10}}>
                    <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                        {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                    </Typography>
                </div>
            </Box>
    );
})}
</div>


<div style={{ display: 'flex',  justifyContent:'space-between' }}>
        {Array.from({ length: 7 }, (_, index) => {
        const slotNumber = 63 - index; //
        const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
        const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido

        return (
            <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                <div style={{zIndex: 10}}>
                    <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                        {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                    </Typography>
                </div>
            </Box>
    );
})}
</div>

<div style={{ display: 'flex',  justifyContent:'space-between' }}>

                        {Array.from({ length: 7 }, (_, index) => {
                            const slotNumber = 55 - index; // Numerar os slots de 61 até 48
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
        const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido

        return (
            <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                <div style={{zIndex: 10}}>
                    <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                        {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                    </Typography>
                </div>
            </Box>
    );
})}

</div>

<div style={{ display: 'flex',  justifyContent:'space-between' }}>
                        {Array.from({ length: 5 }, (_, index) => {
                            const slotNumber = 48 - index; // Numerar os slots de 47 até 41
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
        const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido

        return (
            <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                <div style={{zIndex: 10}}>
                    <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                        {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                    </Typography>
                </div>
            </Box>
    );
})}

                        {Array.from({ length: 2 }, (_, index) => {
                            const slotNumber = 42 - index; // Numerar os slots de 47 até 41
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
        const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido

        return (
            <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                <div style={{zIndex: 10}}>
                    <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                        {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                    </Typography>
                </div>
            </Box>
    );
})}

</div>



<div style={{ display: 'flex',  justifyContent:'space-between' }}>
                        {Array.from({ length: 7 }, (_, index) => {
                            const slotNumber = 40 - index; // Numerar os slots de 40 até 34
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
                            const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido
                    
                            return (
                                <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                                    <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                                    <div style={{zIndex: 10}}>
                                        <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                                            {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                                        </Typography>
                                    </div>
                                </Box>
                        );
                    })}
                    </div>


<div style={{ display: 'flex',  justifyContent:'space-between' }}>
                        {Array.from({ length: 7 }, (_, index) => {
                            const slotNumber = 33 - index; // Numerar os slots de 33 até 33
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
                            const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido
                    
                            return (
                                <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                                    <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                                    <div style={{zIndex: 10}}>
                                        <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                                            {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                                        </Typography>
                                    </div>
                                </Box>
                        );
                    })}
                    </div>


<div style={{ display: 'flex',  justifyContent:'space-between' }}>
                        {Array.from({ length: 7 }, (_, index) => {
                            const slotNumber = 26 - index; // Numerar os slots de 26 até 20
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
                            const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido
                    
                            return (
                                <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                                    <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                                    <div style={{zIndex: 10}}>
                                        <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                                            {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                                        </Typography>
                                    </div>
                                </Box>
                        );
                    })}
                    </div>

<div style={{ display: 'flex',  justifyContent:'space-between' }}>
                        {Array.from({ length: 7 }, (_, index) => {
                            const slotNumber = 19 - index; // Numerar os slots de 19 até 13
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
                            const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido
                    
                            return (
                                <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                                    <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                                    <div style={{zIndex: 10}}>
                                        <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                                            {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                                        </Typography>
                                    </div>
                                </Box> 
                        );
                    })}
                    </div>


<div style={{ display: 'flex',  justifyContent:'space-between' }}>
                        {Array.from({ length: 7 }, (_, index) => {
                            const slotNumber = 12 - index; // Numerar os slots de 12 até 6
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
                            const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido
                    
                            return (
                                <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                                    <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                                    <div style={{zIndex: 10}}>
                                        <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                                            {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                                        </Typography>
                                    </div>
                                </Box>
                        );
                    })}
                    </div>



<div style={{ display: 'flex',  justifyContent:'space-between' }}>

<Box className='boxSlot'>
                            <div className='TypographySlot'>
                            
                            <Typography style={{fontSize: 14, marginTop: 10 }}>
                                  OUTPUT                              </Typography>
                            </div>
                        </Box>



                        {Array.from({ length: 5 }, (_, index) => {
                            const slotNumber = 5 - index; // Numerar os slots de 12 até 6
                            const slotData = getSlipForSlot(slotNumber); // Agora apenas retorna o dado ou "-"
                            const filled = slotData !== "" && slotData !== "-"; // Verificar se o slot está preenchido
                    
                            return (
                                <Box key={slotNumber} className={`boxSlot ${filled ? 'filled' : ''}`} sx={{flex: 1, position: 'relative'}}>
                                    <span style={{position: 'absolute', top: 0, left: 2, fontSize:10}}> TRAY {slotNumber}</span>
                                    <div style={{zIndex: 10}}>
                                        <Typography className='TypographySlot' style={{ fontSize: 9.5, fontWeight: 'normal', marginTop: 13 }}>
                                            {slotData} {/* Exibe o valor da slip, modelo e quantidade */}
                                        </Typography>
                                    </div>
                                </Box>
                        );
                    })}
                   <Box className='boxSlot'>
                            <div className='TypographySlot'>
                            
                            <Typography style={{ fontSize: 14, marginTop: 10 }}>
                                   INPUT                             </Typography>
                            </div>
                        </Box>
                        </div>
                    
                    </div>
                </div>
            </div>
        </>
    );
};

export default App;