import React, { useEffect, useState } from "react";
import Axios from 'axios';
import Splicing_Defect from './Splicing_Defect';
import Splicing_history from './Splicing_history';
import NavbarComp from '../../Layout/NavbarComp';

import axios from "axios";

export default function Tabela() {
  const [currentScreen, setCurrentScreen] = useState('Splicing_Defect'); // Iniciando com a primeira tela

  useEffect(() => {
    let index = 0; // Variável de controle
    const interval = setInterval(() => {
      setCurrentScreen((screen) => {
        const nextIndex = index + 1;
        index = nextIndex > 2 ? 0 : nextIndex; // Rotacionando entre as três telas
        return screen === 'SplicingNoCheck' ? 'Splicing_Defect' : (screen === 'Splicing_history' ? 'SplicingNoCheck' : 'Splicing_history');
      });
    }, 20000); // 10 segundos em milissegundos
    return () => clearInterval(interval);
  }, []);

return (
    <>
      <NavbarComp />
      <div>
        {currentScreen === 'Splicing_history' && <Splicing_history />}
        {currentScreen === 'Splicing_Defect' && <Splicing_Defect />}
      </div>
    </>
  );
}
