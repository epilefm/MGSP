import React, { useState, useEffect } from 'react';
import { Box } from '@mui/system';
import NavbarComp from '../Layout/NavbarComp';

const ClockWithAlarm = () => {
  const [time, setTime] = useState(new Date());
  const [message, setMessage] = useState('');
  const [image, setImage] = useState('');

  useEffect(() => {
    const timerID = setInterval(() => tick(), 1000);
    return () => clearInterval(timerID);
  }, []);

  const tick = () => {
    const currentTime = new Date();
    setTime(currentTime);
    updateMessage(currentTime);
  };

  const updateMessage = (currentTime) => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const day = currentTime.getDay(); // 0: Domingo, 1: Segunda-feira, ..., 6: Sábado

    if (day >= 1 && day <= 5) { // Segunda a Sexta
      //-----------Entrada 1T---------------
      if (hours === 6 && minutes >= 40 && minutes <= 55) {
        setMessage('Registrar entrada do 1T');
        setImage('/images/RegPontoGood1T.png');
        document.body.style.backgroundColor = "green";
      } else if (hours === 14 && minutes >= 55 && minutes <= 15) {
        setMessage('Registrar saída do 1T');
        setImage('/images/RegPontoGood1TCom.png.png');
        document.body.style.backgroundColor = "green";

      } else if (hours === 16 && minutes >= 33 && minutes <= 58) {
        setMessage('Registrar entrada do 2T - Comercial');
        setImage('/images/RegPontoGood2TCom.png');
        document.body.style.backgroundColor = "green";
      } else if (hours === 22 && minutes >= 55 && minutes <= 10) {
        setMessage('Registrar saída do 2T');
        setImage('/images/RegPontoGood2T.png');
        document.body.style.backgroundColor = "green";
      } else if (hours === 2 && minutes >= 12 && minutes <= 27) {
        setMessage('Registrar entrada do 2T - Comercial');
        setImage('/images/RegPontoGood2TCom.png');
        document.body.style.backgroundColor = "green";
      } else if (hours === 22 && minutes >= 40 && minutes <= 55) {
        setMessage('Registrar entrada do 3T');
        setImage('/images/RegPontoGood3T.png');
        document.body.style.backgroundColor = "green";
      } else if (hours === 6 && minutes >= 55 && minutes <= 10) {
        setMessage('Registrar saída do 3T');
        setImage('/images/RegPontoGood3T.png');
        document.body.style.backgroundColor = "green";
      } else {
        setMessage('Não é hora de registrar o ponto.');
        setImage('/images/RegPontoNG.png');
        document.body.style.backgroundColor = "red";
      }
    } else if (day === 6) { // Sábado
      if (hours === 8 && minutes >= 0 && minutes <= 15) {
        setMessage('Registrar entrada do 1T');
        setImage('/images/RegPontoGood1T.png');
        document.body.style.backgroundColor = "green";
      } else if (hours === 16 && minutes >= 0 && minutes <= 15) {
        setMessage('Registrar saída do 1T');
        setImage('/images/RegPontoGood1T.png');
        document.body.style.backgroundColor = "green";
      } else if (hours === 0 && minutes >= 0 && minutes <= 15) {
        setMessage('Registrar saída do 2T - Sábado para Domingo');
        setImage('/images/RegPontoGood2T.png');
        document.body.style.backgroundColor = "green";
      } else {
        setMessage('Não é hora de registrar o ponto.');
        setImage('/images/RegPontoNG.png');
        document.body.style.backgroundColor = "red";
      }
    } else if (day === 0) { // Domingo
      if (hours === 0 && minutes >= 0 && minutes <= 55) {
        setMessage('Registrar saída do 3T - Domingo para Segunda');
        setImage('/images/RegPontoGood3T.png');
        document.body.style.backgroundColor = "red";
      } else {
        setMessage('Não é hora de registrar o ponto.');
        setImage('/images/RegPontoNG.png');
        document.body.style.backgroundColor = "red";
      }
    }
  };

  const daysOfWeek = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const day = daysOfWeek[time.getDay()];
  const date = `${time.getDate()}/${time.getMonth() + 1}/${time.getFullYear()}`;
  const timeString = time.toLocaleTimeString();

  return (
    <>
      <NavbarComp />
      <div style={{ marginLeft: '17.5%' }}>
        <Box style={{ marginTop: 10, background: 'transparent', width: '80%', height: '80vh', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '35px', color:'white' }}>{`${day}, ${date}`}</div>
            <div style={{ fontSize: '40px', color:'white' }}>{`${timeString}`}</div>
            <img style={{height: '80vh'}} src={image} alt="Ponto" />
          </div>
        </Box>
      </div>
    </>
  );
};

export default ClockWithAlarm;
